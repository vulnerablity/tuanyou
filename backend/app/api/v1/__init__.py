#+ v1 路由聚合：新模块在此挂载（auth/notes/comments/activities...）
from fastapi import APIRouter

from app.api.v1 import health

api_v1_router = APIRouter()
api_v1_router.include_router(health.router)
