#+ 业务异常 + 全局异常处理器
#+ 最关键契约：业务错误一律返回 HTTP 200 + {code != 0, message}
#+ 原因：前端 request.ts 只在 statusCode === 200 时解析 code；
#+       非 200 会被当作"网络错误"，开发环境将静默降级 Mock 数据，掩盖真实业务失败
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.response import fail


class BizError(Exception):
    #+ code 语义：401=未登录/令牌无效（前端自动登出）；400=参数校验；404=资源不存在；500=服务器内部错误
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(BizError)
    async def biz_error_handler(_: Request, exc: BizError) -> JSONResponse:
        return JSONResponse(status_code=200, content=fail(exc.code, exc.message))

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        #+ 框架层 HTTPException（如路由 404）也归一为信封：HTTP 200 + code
        return JSONResponse(status_code=200, content=fail(exc.status_code, str(exc.detail)))

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        #+ 参数校验失败必须是 HTTP 200 + code 400，否则前端会误判为网络错误
        first = exc.errors()[0] if exc.errors() else {}
        loc = '.'.join(str(x) for x in first.get('loc', []) if x != 'body')
        msg = first.get('msg', '参数校验失败')
        message = f'{loc}: {msg}' if loc else msg
        return JSONResponse(status_code=200, content=fail(400, message))

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
        #+ 兜底：未预期异常统一 500 信封，不向前端泄露堆栈
        import logging

        logging.getLogger('app').exception('未处理异常: %s', exc)
        return JSONResponse(status_code=200, content=fail(500, '服务器内部错误'))
