import asyncio
import re
import time
from collections import deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings
from .interpretation import interpret
from .models import Company, Report
from .research import UnsupportedCompany, build_report
from .sec import DataUnavailable, SecClient


def create_app(settings: Settings | None = None, sec: SecClient | None = None) -> FastAPI:
    settings = settings or Settings()
    sec = sec or SecClient(settings)

    @asynccontextmanager
    async def lifespan(app):
        yield
        await sec.close()

    app = FastAPI(title="TickerBrief API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_methods=["GET"],
        allow_headers=["Content-Type"],
    )
    requests = deque()
    report_lock = asyncio.Lock()
    reports: dict[str, tuple[float, Report]] = {}

    @app.middleware("http")
    async def limits(request: Request, call_next):
        if request.url.path.startswith("/v1/"):
            now = time.monotonic()
            while requests and requests[0] < now - 60:
                requests.popleft()
            # A global ceiling prevents per-IP spoofing from multiplying provider load.
            if len(requests) >= 120:
                return JSONResponse(
                    {"detail": "The research service is busy. Please retry in a minute."},
                    status_code=429,
                    headers={"Retry-After": "60"},
                )
            requests.append(now)
        return await call_next(request)

    @app.exception_handler(DataUnavailable)
    async def unavailable(request, exc):
        return JSONResponse({"detail": str(exc)}, status_code=503)

    @app.exception_handler(UnsupportedCompany)
    async def unsupported(request, exc):
        return JSONResponse({"detail": str(exc)}, status_code=422)

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "service": "TickerBrief",
            "sec_configured": settings.sec_configured,
            "ai_enabled": settings.ai_enabled,
        }

    async def catalog():
        result = await sec.companies()
        companies = [
            Company(ticker=c["ticker"], name=c["title"], cik=f"{int(c['cik_str']):010d}")
            for c in result["data"].values()
        ]
        return companies, result

    @app.get("/v1/companies")
    async def search(q: str = Query(min_length=1, max_length=80)):
        companies, result = await catalog()
        query = q.strip().casefold()
        matches = [
            c for c in companies if query and (query in c.ticker.casefold() or query in c.name.casefold())
        ]
        matches.sort(
            key=lambda c: (c.ticker.casefold() != query, not c.ticker.casefold().startswith(query), c.name)
        )
        return {
            "companies": matches[:25],
            "stale": result["stale"],
            "retrieved_at": result["retrieved_at"],
            "coverage": "SEC-listed tickers. Research supports US-GAAP 10-K filers with USD facts; some matches may be unsupported.",
        }

    @app.get("/v1/reports/{ticker}", response_model=Report)
    async def report(ticker: str):
        ticker = ticker.strip().upper()
        if not re.fullmatch(r"[A-Z0-9][A-Z0-9.-]{0,14}", ticker):
            return JSONResponse({"detail": "Enter a valid US stock ticker."}, status_code=422)
        companies, _ = await catalog()
        company = next((c for c in companies if c.ticker == ticker), None)
        if not company:
            return JSONResponse(
                {"detail": "This ticker is not in the SEC company directory."}, status_code=404
            )
        async with report_lock:
            cached = reports.get(ticker)
            if cached and time.monotonic() - cached[0] < 900:
                return cached[1]
            result = await build_report(company, sec)
            result.interpretation = await interpret(result, settings)
            if len(reports) >= 50:
                del reports[next(iter(reports))]
            reports[ticker] = (time.monotonic(), result)
            return result

    return app


app = create_app()
