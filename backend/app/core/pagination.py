#+ 统一分页：请求参数依赖 + 响应模型
#+ 契约来源：docs/前台API文档_v1.md —— data 结构 {list, total, page, size, total_page}
#+ 注意：total_page 保持下划线命名（前端 PageResult 读取 total_page，非 camelCase totalPage）
import math
from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel

ItemT = TypeVar('ItemT')


class PageParams:
    #+ 作为 Depends 使用：page 从 1 开始；size 最大 100
    def __init__(
        self,
        page: int = Query(1, ge=1, description='页码，从1开始'),
        size: int = Query(10, ge=1, le=100, description='每页条数，最大100'),
    ):
        self.page = page
        self.size = size


class PageResult(BaseModel, Generic[ItemT]):
    list: list[ItemT]
    total: int
    page: int
    size: int
    total_page: int

    @classmethod
    def build(cls, items: list[ItemT], total: int, page: int, size: int) -> 'PageResult[ItemT]':
        return cls(
            list=items,
            total=total,
            page=page,
            size=size,
            total_page=math.ceil(total / size) if total > 0 else 0,
        )
