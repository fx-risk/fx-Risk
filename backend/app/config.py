from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ECOS_API_KEY: str = ""
    FRED_API_KEY: str = ""
    CACHE_TTL_HOURS: int = 4
    CORS_ORIGINS: str = "http://localhost:5173"
    DB_PATH: str = "fx_risk.db"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
