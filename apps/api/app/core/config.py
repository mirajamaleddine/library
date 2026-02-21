from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENV: str = "dev"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173"
    DATABASE_URL: str = "postgresql://postgres:qTUZXEZlKeGmQpVo@db.oltnufekaodccovvdglo.supabase.co:5432/postgres"

    # Clerk JWT verification
    CLERK_JWKS_URL: str = "https://legible-horse-99.clerk.accounts.dev/.well-known/jwks.json"
    CLERK_ISSUER: str = "https://legible-horse-99.clerk.accounts.dev"
    CLERK_AUDIENCE: str = ""  # usually empty for Clerk; set if required

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
