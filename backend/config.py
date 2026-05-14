from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    YOUTUBE_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DISCORD_BOT_TOKEN: str = ""
    DISCORD_CHANNEL_ID: str = ""
    NOTION_API_KEY: str = ""
    NOTION_DATABASE_ID: str = ""
    DATABASE_URL: str = "sqlite:///./youtube_director.db"
    CORS_ORIGINS: str = "http://localhost:3000"
    JWT_SECRET_KEY: str = "change-me-in-production"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
