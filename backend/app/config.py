"""
Application configuration settings.

All settings can be overridden via environment variables or a .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application settings
    app_name: str = "Call Me Reminder API"
    debug: bool = False
    database_url: str = "sqlite:///./call_me_reminder.db"
    
    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # Vapi API settings
    vapi_api_key: str = ""
    vapi_api_url: str = "https://api.vapi.ai"
    vapi_assistant_id: str = ""
    vapi_phone_number_id: str = ""
    
    # Scheduler settings
    scheduler_interval_seconds: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
