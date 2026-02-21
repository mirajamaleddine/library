from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENV: str = "dev"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173"
    DATABASE_URL: str = "postgresql+psycopg://user:pass@localhost:5432/library"

    # Clerk JWT verification
    CLERK_JWKS_URL: str = ""
    CLERK_ISSUER: str = ""
    CLERK_AUDIENCE: str = ""

    # Admin role claim — checked on every write operation.
    # Set ADMIN_ROLE_CLAIM_KEY to the JWT claim that carries the role value (e.g. "role").
    # Set ADMIN_ROLE_VALUE to the value that identifies an admin (e.g. "admin").
    ADMIN_ROLE_CLAIM_KEY: str = "role"
    ADMIN_ROLE_VALUE: str = "admin"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
