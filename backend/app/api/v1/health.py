#+ 健康检查：GET /api/v1/health
#+ 契约：docs/前台API文档_v1.md —— 响应 {code:0, message:'成功'}，data 可为空
from fastapi import APIRouter

from app.core.response import ok

router = APIRouter(tags=['健康检查'])


@router.get('/health')
async def health() -> dict:
    return ok(None)
