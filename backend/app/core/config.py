from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "BuildLoop API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    # This default is deliberately allowed only for local development. Set a long,
    # random value in SECRET_KEY before deploying.
    SECRET_KEY: str = "local-development-key-do-not-use-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # SQLite is convenient locally. Production must use PostgreSQL.
    DATABASE_URL: str = "sqlite:///./buildloop.db"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Disabling automatic JSON decoding lets CORS_ORIGINS use the easier
    # comma-separated syntax shown in .env.example.
    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, extra="ignore", enable_decoding=False
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.ENVIRONMENT == "production":
            if self.SECRET_KEY == "local-development-key-do-not-use-in-production" or len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must be a unique value of at least 32 characters in production")
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("DATABASE_URL must point to PostgreSQL in production")
            if not self.CORS_ORIGINS or "*" in self.CORS_ORIGINS:
                raise ValueError("CORS_ORIGINS must list explicit frontend origins in production")
        return self

settings = Settings()
