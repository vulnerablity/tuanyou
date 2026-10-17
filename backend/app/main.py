#+ 应用入口：uvicorn app.main:app --reload --port 8000
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_v1_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers

logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title='途友 API',
        version='1.0.0',
        #+ 生产环境关闭文档页，开发环境保留 /docs 与 /redoc
        docs_url=None if settings.is_production else '/docs',
        redoc_url=None if settings.is_production else '/redoc',
    )

    #+ 跨域：前端 H5 与后端不同域时必需；Authorization 头必须放行（JWT）
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,  #+ JWT 走 Authorization 头，不依赖 Cookie
        allow_methods=['*'],
        allow_headers=['Authorization', 'Content-Type'],
    )

    register_exception_handlers(app)
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_app()
