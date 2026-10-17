#+ Pydantic 模型基类：统一 DTO 命名契约
#+ Python 内部 snake_case，序列化输出 camelCase（对齐前端 types/api.ts）
#+ 注意：分页 total_page 是特例（前端 PageResult 读的是 total_page 下划线形式），
#+       分页模型不继承本基类，见 core/pagination.py
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        #+ 入参接受 camelCase 别名（targetType/replyToId），也接受字段本名（snake_case）
        alias_generator=to_camel,
        populate_by_name=True,
        #+ 支持 from_attributes=True：ORM 对象直接转 DTO
        from_attributes=True,
    )
