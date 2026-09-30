import os
from pydantic_settings import BaseSettings
from typing import List

from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "NudgeMe"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./nudgeme.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    DEFAULT_RADIUS_METERS: int = 200
    CORS_ORIGINS: List[str] = ["*"]
    
    model_config = ConfigDict(env_file=".env", extra="allow")

settings = Settings()
