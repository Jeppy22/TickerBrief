from datetime import datetime
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    sec_user_agent: str = ""
    cache_dir: Path = Path(".cache")
    cors_origins: str = "http://localhost:8081,http://127.0.0.1:8081"
    ai_enabled: bool = False
    gemini_api_key: SecretStr = SecretStr("")
    gemini_model: str = ""
    ai_free_tier_verified: bool = False
    ai_billing_disabled_verified: bool = False
    ai_verified_until: datetime | None = None
    ai_daily_cap: int = Field(default=10, ge=1, le=100)
    ai_total_cap: int = Field(default=100, ge=1, le=1000)
    ai_rpm: int = Field(default=1, ge=1, le=5)
    ai_budget_path: str = ""

    @property
    def sec_configured(self) -> bool:
        import re

        return bool(re.search(r"\b[^\s@]+@[^\s@]+\.[^\s@]+", self.sec_user_agent)) and not any(
            value in self.sec_user_agent.lower() for value in ("example.com", "your-email", "placeholder")
        )
