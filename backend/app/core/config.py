"""Application configuration, loaded from environment / .env with safe dev defaults."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "DETECTOMA"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Security
    secret_key: str = "dev-insecure-change-me-please-use-32plus-byte-key"
    storage_encryption_key: str = ""  # Fernet key; auto-derived from secret_key if blank
    access_token_expire_minutes: int = 60 * 24
    jwt_algorithm: str = "HS256"

    # Database
    database_url: str = "sqlite:///./detectoma.db"

    # Storage
    storage_dir: str = "./storage"
    max_upload_mb: int = 15

    # OCR
    ocr_provider: str = "auto"  # auto | mock | google | azure
    google_vision_credentials_json: str = ""
    azure_vision_endpoint: str = ""
    azure_vision_key: str = ""

    # Email
    email_provider: str = "auto"  # auto | console | smtp
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "no-reply@detectoma.app"

    # Chatbot (assistant). Provider auto-selects mock when no key is present.
    chat_provider: str = "auto"  # auto | mock | openai | anthropic
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-haiku-latest"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
