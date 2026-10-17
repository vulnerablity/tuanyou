#+ 应用配置：环境变量驱动（.env 优先级高于系统环境变量，便于本地开发）
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    #+ dev / test / production（对应前端 TARO_APP_ENV）
    APP_ENV: str = 'dev'

    #+ JWT 签发密钥（生产环境必须通过环境变量覆盖）
    SECRET_KEY: str = 'dev-secret-change-me'

    #+ API 路由前缀：前端 request.ts 以 TARO_APP_API_BASE=http://host:port/api/v1 拼接
    API_V1_PREFIX: str = '/api/v1'

    #+ MySQL 连接串（SQLAlchemy 2.0 async，接入数据库时启用）
    DATABASE_URL: str = ''

    #+ Redis（验证码 / 限流 / 未读数）
    REDIS_URL: str = 'redis://127.0.0.1:6379/0'

    #+ 跨域来源，逗号分隔；留空 = 允许所有来源（仅限开发环境）
    CORS_ORIGINS: str = ''

    @property
    def cors_origins(self) -> list[str]:
        if not self.CORS_ORIGINS.strip():
            return ['*']
        return [o.strip() for o in self.CORS_ORIGINS.split(',') if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == 'production'


@lru_cache
def get_settings() -> Settings:
    return Settings()
