from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://eunoia_user:eunoia_pass@postgres:5432/eunoia"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    OPENROUTER_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@eunoia.app"

    class Config:
        env_file = ".env"

settings = Settings()