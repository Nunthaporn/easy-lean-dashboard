from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "VVIC"
    db_user: str = "postgres"
    db_password: str = "123456"

    cors_origins: str = (
        "http://localhost:5174,"
        "http://127.0.0.1:5174,"
        "http://172.16.88.141:5174"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            x.strip()
            for x in self.cors_origins.split(",")
            if x.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()