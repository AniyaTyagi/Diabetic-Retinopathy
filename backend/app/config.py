from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "NetraX API"
    app_env: str = "development"
    secret_key: str = "dev-netrax-secret-change-me"
    access_token_expire_minutes: int = 480
    database_url: str = "sqlite:///./netrax.db"
    cors_origins: str = "https://netrax-indol.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
    algorithm: str = "HS256"
    n8n_webhook_url: str = ""
    n8n_webhook_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def validate_production(self) -> None:
        """Log warnings for insecure production configuration."""
        import logging
        _log = logging.getLogger("netrax.config")
        if self.app_env == "production":
            _INSECURE_DEFAULTS = {
                "dev-netrax-secret-change-me",
                "change-me-in-production-netrax-secret",
                "secret",
                "",
            }
            if self.secret_key in _INSECURE_DEFAULTS or len(self.secret_key) < 32:
                _log.critical(
                    "SECURITY: SECRET_KEY is insecure or too short for production. "
                    "Set a strong random SECRET_KEY in your environment."
                )
            if not self.cors_origin_list:
                _log.warning(
                    "SECURITY: CORS_ORIGINS is empty — requests will be rejected or wildcard used. "
                    "Set CORS_ORIGINS to your frontend domain(s)."
                )
        else:
            if self.secret_key in {"dev-netrax-secret-change-me", "change-me-in-production-netrax-secret"}:
                _log.warning(
                    "Using default SECRET_KEY for development. Set SECRET_KEY before going to production."
                )


@lru_cache
def get_settings() -> Settings:
    return Settings()
