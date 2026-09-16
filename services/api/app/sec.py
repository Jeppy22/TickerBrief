import asyncio
import hashlib
import json
import time
from datetime import UTC, datetime
from pathlib import Path

import httpx

from .config import Settings


class DataUnavailable(Exception):
    pass


class SecClient:
    """One worker/instance only. Shared lock caps all SEC traffic at 2 requests/s.

    Cache entries preserve retrieval timestamps; stale responses are never silently freshened.
    Do not bypass SEC 403/429 responses with alternate user agents or proxy hosts.
    """

    def __init__(self, settings: Settings, transport=None):
        self.settings = settings
        self.lock = asyncio.Lock()
        self.next_request = 0.0
        self.cooldown_until = 0.0
        self.client = httpx.AsyncClient(
            timeout=25,
            transport=transport,
            follow_redirects=False,
            headers={"User-Agent": settings.sec_user_agent, "Accept-Encoding": "gzip, deflate"},
        )

    async def close(self):
        await self.client.aclose()

    def _path(self, url: str) -> Path:
        return self.settings.cache_dir / (hashlib.sha256(url.encode()).hexdigest() + ".json")

    async def get(self, url: str, ttl: int = 21600, json_data: bool = True) -> dict:
        if not url.startswith(("https://www.sec.gov/", "https://data.sec.gov/")):
            raise ValueError("SEC URLs only")
        if not self.settings.sec_configured:
            raise DataUnavailable(
                "Research is not configured for this beta yet. Please contact the beta operator. Your saved reports remain available."
            )
        path = self._path(url)
        async with self.lock:
            cached = None
            try:
                cached = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                pass
            age = time.time() - cached["timestamp"] if cached else float("inf")
            if cached and age < ttl:
                return {**cached, "stale": False}
            try:
                if time.monotonic() < self.cooldown_until:
                    raise DataUnavailable("SEC access is cooling down after a rate-limit or access response.")
                await asyncio.sleep(max(0, self.next_request - time.monotonic()))
                self.next_request = time.monotonic() + 0.5
                response = await self.client.get(url)
                if response.status_code in (403, 429):
                    self.cooldown_until = time.monotonic() + 60
                response.raise_for_status()
                payload = response.json() if json_data else response.text
                record = {
                    "data": payload,
                    "timestamp": time.time(),
                    "retrieved_at": datetime.now(UTC).isoformat(),
                }
                path.parent.mkdir(parents=True, exist_ok=True)
                temporary = path.with_suffix(".tmp")
                temporary.write_text(json.dumps(record), encoding="utf-8")
                temporary.replace(path)
                return {**record, "stale": False}
            except (httpx.HTTPError, ValueError, DataUnavailable) as exc:
                # A bounded stale cache keeps offline reports honest and useful.
                if cached and age < 7 * 86400:
                    return {**cached, "stale": True}
                raise DataUnavailable(
                    "SEC data is unavailable. Please retry later; no substitute data was used."
                ) from exc

    async def companies(self) -> dict:
        return await self.get("https://www.sec.gov/files/company_tickers.json", ttl=86400)

    async def facts(self, cik: str) -> dict:
        return await self.get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{int(cik):010d}.json")

    async def submissions(self, cik: str) -> dict:
        return await self.get(f"https://data.sec.gov/submissions/CIK{int(cik):010d}.json")
