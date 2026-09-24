from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

# The old fallback value. It is public, so anything signed with it can be forged.
_INSECURE_DEFAULT = "your-secret-key-change-in-production"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://eunoia_user:eunoia_pass@postgres:5432/eunoia"
    REDIS_URL: str = "redis://redis:6379/0"
    # No usable default: the app refuses to start until a real key is set.
    SECRET_KEY: str = Field(default="", validate_default=True)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    OPENROUTER_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@eunoia.app"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if not v or v == _INSECURE_DEFAULT or len(v) < 32:
            raise ValueError(
                "SECRET_KEY is missing, still the default, or shorter than 32 characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\" "
                "and put it in backend/.env"
            )
        return v

    class Config:
        env_file = ".env"


settings = Settings()