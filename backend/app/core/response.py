#+ 统一响应信封：{code, message, data}
#+ 契约来源：docs/前台API文档_v1.md + 前端 src/utils/request.ts responseInterceptor
#+ 关键约束：code === 0 或 200 视为成功；code === 401 触发前端清 token + 跳登录
from typing import Any

from pydantic import BaseModel


class Envelope(BaseModel):
    code: int = 0
    message: str = '成功'
    data: Any = None


def ok(data: Any = None, message: str = '成功') -> dict[str, Any]:
    return {'code': 0, 'message': message, 'data': data}


def fail(code: int, message: str) -> dict[str, Any]:
    return {'code': code, 'message': message, 'data': None}
