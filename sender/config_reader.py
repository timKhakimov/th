from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    backend_url: str
    proxy_url: str
    proxy_port: str
    proxy_login: str
    proxy_password: str
    database_uri: str
    gpt_url: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_nested_delimiter = "__"


config = Settings()
