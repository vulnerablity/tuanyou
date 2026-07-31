# API 文档

本文档按前台原型整理接口清单。所有路径默认带 `/api/v1` 前缀。

## 通用说明

**认证方式：**

```
Authorization: Bearer <JWT>
```

除健康检查、注册、登录外，业务接口需要认证。

**统一响应格式：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {}
}
```

**统一分页响应格式：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "size": 10,
    "total_page": 10
  }
}
```

**分页请求参数：**

| 参数   | 类型  | 必填 | 说明         |
| ---- | --- | -- | ---------- |
| page | int | 是  | 页码，从1开始    |
| size | int | 是  | 每页条数，最大100 |

***

## 健康检查

| 方法  | 路径      | 说明     |
| --- | ------- | ------ |
| GET | /health | 服务存活检查 |

**响应：**

```json
{
  "code": 0,
  "message": "成功"
}
```

***

## 认证

### 验证码规则

| 规则         | 说明                             |
| ------------ | -------------------------------- |
| 格式         | 6位数字                          |
| 有效期       | 5分钟                            |
| 同号重发间隔 | 60秒                             |
| 同号每日上限 | 10条                             |
| 校验成功后   | 立即标记为"已验证"，防止重复使用 |

---

### 1. 发送验证码

```
POST /auth/send-code
```

统一的验证码发送接口，通过 `scene` 参数区分使用场景。

| 参数  | 类型   | 必填 | 说明                                                                    |
| ----- | ------ | ---- | ----------------------------------------------------------------------- |
| phone | string | 是   | 手机号，11位                                                            |
| scene | string | 是   | 场景：`register`（注册）/ `login`（登录）/ `reset-password`（重置密码） |

**数据请求示例：**

```json
{
  "phone": "13800138000",
  "scene": "register"
}
```

**响应示例（200）：**

```json
{
    "code": 0,
    "message": "成功",
    "data": {
        "message": "验证码已发送"
    }
}
```

**错误响应：**

- `400` — 手机号格式无效或 scene 参数不合法
- `429` — 发送频率超限（60秒内重复发送 或 超过每日10条上限）--

### 2. 用户注册

```
POST /auth/register
```

原有接口新增 `code` 必填参数。客户端需先调用 `/auth/send-code`（scene=register）获取验证码。

| 参数            | 类型       | 必填           | 说明                    |
| --------------- | ---------- | -------------- | ----------------------- |
| phone           | string     | 是             | 手机号，11位            |
| **code**        | **string** | **是（新增）** | **短信验证码，6位数字** |
| nickname        | string     | 是             | 昵称，最大20字          |
| password        | string     | 是             | 密码，至少6位           |
| confirmPassword | string     | 是             | 确认密码，须与密码一致  |

**请求示例：**

```json
{
    "phone": "07822172701",
    "code": "075343",
    "nickname": "汤姆",
    "password": "76mH3MJjXIoPZ9F",
    "confirmPassword": "76mH3MJjXIoPZ9F"
}
```

**响应示例（201）：**

```json
{
    "code": 0,
    "message": "成功",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMCwidXNlcm5hbWUiOiLmsaTlp4YiLCJpc3MiOiJ0dXlvdSIsImV4cCI6NTIyNTUxODQzNCwibmJmIjoxNzg1MzAwOTIzLCJpYXQiOjE3ODUzMDA5MjN9.65A7bL7z_zLe2IEKMmBifHFHipbH8EKnDWdKlgod-yA",
        "member": {
            "id": "10",
            "nickname": "汤姆",
            "phone": "07822172701",
            "avatar": ""
        }
    }
}
```

**业务逻辑：** 先校验验证码，通过后标记为"已验证"，再创建用户。注册成功直接返回 JWT Token，用户注册后自动登录。

---

### 3. 用户登录

```
POST /auth/login
```

原有密码登录不变，新增 `type: "code"` 验证码登录方式。

**方式一：密码登录（不变）**

| 参数     | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| phone    | string | 是   | 手机号 |
| password | string | 是   | 密码   |

**方式二：验证码登录（新增）**

| 参数  | 类型   | 必填 | 说明            |
| ----- | ------ | ---- | --------------- |
| phone | string | 是   | 手机号          |
| code  | string | 是   | 短信验证码，6位 |
| type  | string | 是   | 固定值 `"code"` |

当 `type` 不传或为 `"password"` 时，走密码登录流程。

**请求示例（验证码登录）：**

```json
{
    "phone": "07822172701",
    "password": "76mH3MJjXIoPZ9F",
    "code": "",
    "type": "password"
}
```

**请求示例（密码登录）：**

```json
{
  "phone": "13800138000",
  "password": "123456",
  "code": "",
  "type": "password",
}
```

**响应示例（200，两种方式返回一致）：**

```json
{
    "code": 0,
    "message": "成功",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMCwidXNlcm5hbWUiOiLmsaTlp4YiLCJpc3MiOiJ0dXlvdSIsImV4cCI6NTIyNTUxODUwNywibmJmIjoxNzg1MzAwOTk2LCJpYXQiOjE3ODUzMDA5OTZ9.j7zfuPbTapOkl2Rf1-8LHo_HTUfl5X4ZnN2XUOrc5CM",
        "member": {
            "id": "10",
            "nickname": "汤姆",
            "phone": "07822172701",
            "avatar": ""
        }
    }
}
```

**错误响应：**

- `400` — 手机号未注册（验证码登录时，提示用户先前往注册）

---

### 4. 重置密码

```
POST /auth/reset-password
```

通过验证码重置密码。客户端需先调用 `/auth/send-code`（scene=reset-password）获取验证码，手机号必须已注册。

| 参数            | 类型   | 必填 | 说明                       |
| --------------- | ------ | ---- | -------------------------- |
| phone           | string | 是   | 已注册手机号               |
| code            | string | 是   | 短信验证码，6位            |
| newPassword     | string | 是   | 新密码，至少6位            |
| confirmPassword | string | 是   | 确认新密码，须与新密码一致 |

**请求示例：**

```json
{
  "phone": "13800138000",
  "code": "483901",
  "newPassword": "xyz789",
  "confirmPassword": "xyz789"
}
```

**响应示例（200）：**

```json
{
    "code": 0,
    "message": "成功",
    "data": {
        "message": "密码重置成功"
    }
}
```

**业务逻辑：** 校验验证码并标记为已验证，更新密码。重置成功后不返回 Token，用户需使用新密码重新登录。

---

### 汇总

| #   | 接口                        | 变更类型 | 说明                               |
| --- | --------------------------- | -------- | ---------------------------------- |
| 1   | `POST /auth/send-code`      | 新增     | 统一发送验证码，scene 区分场景     |
| 2   | `POST /auth/register`       | 修改     | 新增 `code` 必填参数               |
| 3   | `POST /auth/login`          | 扩展     | 新增 `type: "code"` 验证码登录方式 |
| 4   | `POST /auth/reset-password` | 新增     | 验证码重置密码                     |

### 业务流程

```
注册：     发送验证码(register) → 注册(phone+code+password) → 返回 Token+User
验证码登录：发送验证码(login)    → 登录(phone+code, type:code) → 返回 Token+User
密码登录：  登录(phone+password)（不变）
重置密码：  发送验证码(reset)    → 重置密码(phone+code+newPassword) → 成功提示 → 重新登录
```

***

## 文件上传

| 方法   | 路径             | 说明          |
| ---- | -------------- | ----------- |
| POST | /upload/image  | 上传单张图片      |
| POST | /upload/images | 批量上传图片，最多5张 |

***

### POST /upload/image 上传单张图片

**请求参数：**

| 参数   | 类型     | 必填 | 说明                            |
| ---- | ------ | -- | ----------------------------- |
| file | file   | 是  | 图片文件，最大5MB                    |
| type | string | 否  | 用途：avatar/cover/note/activity |

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "url": "https://cdn.tubu.com/images/xxx.jpg"
  }
}
```

***

### POST /upload/images 批量上传

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "urls": [
      "https://cdn.tubu.com/images/xxx1.jpg",
      "https://cdn.tubu.com/images/xxx2.jpg"
    ]
  }
}
```

***

## 社区首页

| 方法  | 路径      | 说明              |
| --- | ------- | --------------- |
| GET | /feed   | 内容瀑布流列表（笔记/攻略）  |
| GET | /slides | 首页轮播项（后台设置的幻灯片） |

***

### GET /feed 获取内容列表

**请求参数：**

| 参数       | 类型     | 必填 | 默认 | 说明                         |
| -------- | ------ | -- | -- | -------------------------- |
| category | string | 否  | 全部 | 全部/徒步/露营/骑行/登山/跑步/摄影/攀岩/装备 |
| sort     | string | 否  | 推荐 | 推荐/最新/最热                   |
| page     | int    | 是  | -  | 页码                         |
| size     | int    | 是  | -  | 每页条数                       |

**筛选逻辑：**

- `category` 参数通过数据库 `category` 字段精确匹配
- 分类与数据库值的映射关系：

| 分类 | 数据库值           |
| :- | :------------- |
| 全部 | 不筛选            |
| 徒步 | `category = 1` |
| 露营 | `category = 2` |
| 骑行 | `category = 3` |
| 登山 | `category = 4` |
| 跑步 | `category = 5` |
| 攀岩 | `category = 6` |
| 溯溪 | `category = 7` |

**响应：** 统一分页格式，list 为 Post结构数组
feed 列表中每一项只包含卡片展示所需字段：

| 字段        | 类型        | 说明                         |
| --------- | --------- | -------------------------- |
| id        | string    | 内容ID                       |
| title     | string    | 标题                         |
| images    | string\[] | 图片URL数组（第一张做封面）            |
| tags      | string\[] | 标签列表（note类型取 tags\[0] 做角标） |
| member      | object    | 发布人 `{ nickname, avatar }` |
| likeCount | int       | 点赞数                        |
| type      | string    | 内容类型：note / guide          |
| isLiked   | bool      | 判断是否点赞                     |

响应示例：

```json


{
  "code": 0,
  "message": "成功",
  "data": {
    "list": [
      {
        "id": "1",
        "title": "周末骑行千岛湖环线",
        "images": ["https://..."],
        "tags": ["骑行", "千岛湖"],
        "member": {
          "nickname": "山林旅人",
          "avatar": "https://..."
        },
        "likeCount": 234,
        "type": "note",
        "isLiked":true
      },
      {
        "id": "2",
        "title": "川藏线自驾终极攻略",
        "images": ["https://..."],
        "tags": ["自驾", "西藏"],
        "member": {
          "nickname": "自驾达人",
          "avatar": "https://..."
        },
        "likeCount": 320,
        "type": "guide",
        "isLiked":false
      },
    ],
    "total": 100,
    "page": 1,
    "size": 10,
    "total_page": 10
  }
}
```

<br />

***

### GET /slides获取首页Banner

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": "1",
      "type": "note",
      "title": "四姑娘山大峰登顶记：三天两夜的雪山之旅",
      "cover": "https://picsum.photos/seed/camp/800/400",
      "tag": "登山"
    },
    {
      "id": "2",
      "type": "guide",
      "title": "川藏线自驾终极攻略：318国道15天全记录",
      "cover": "https://picsum.photos/seed/tibet/800/400",
      "tag": "自驾"
    },
    {
      "id": "1",
      "type": "activity",
      "title": "武功山云海露营 · 周末两日",
      "cover": "https://picsum.photos/seed/activity/800/400",
      "tag": "露营",
      "signUpStart": "2026-04-20 00:00",
      "currentPeople": 5,
      "maxPeople": 20
    }
  ]
}
```

***

## 笔记

| 方法   | 路径                  | 说明      |
| ---- | ------------------- | ------- |
| GET  | /notes/:id          | 获取笔记详情  |
| POST | /notes              | 发布笔记    |
| POST | /notes/:id/like     | 点赞/取消点赞 |
| POST | /notes/:id/favorite | 收藏/取消收藏 |

***

### GET /notes/:id 获取笔记详情

**响应：** data 为 Post结构

***

### POST /notes 发布笔记

**请求参数：**

| 参数       | 类型        | 必填 | 说明                  |
| -------- | --------- | -- | ------------------- |
| title    | string    | 是  | 标题，最大50字            |
| content  | string    | 是  | 正文，最大2000字          |
| images   | string\[] | 否  | 图片URL数组（先上传），第一张为封面 |
| videoUrl | string    | 否  | 视频地址                |
| category | string    | 否  | 分类                  |
| tags     | string\[] | 否  | 标签列表                |

**响应：** data 为 Post结构

***

### POST /notes/:id/like 点赞/取消点赞

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "isLiked": true,
    "likeCount": 236
  }
}
```

***

### POST /notes/:id/favorite 收藏/取消收藏

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "isFavorited": true
  }
}
```

***

## 攻略

| 方法   | 路径          | 说明     |
| ---- | ----------- | ------ |
| GET  | /guides/:id | 获取攻略详情 |
| POST | /guides     | 发布攻略   |

***

### GET /guides/:id 获取攻略详情

**响应：** data 为 Post结构（含 routeInfo）

***

### POST /guides 发布攻略

**请求参数：**

| 参数         | 类型        | 必填 | 说明         |
| ---------- | --------- | -- | ---------- |
| title      | string    | 是  | 标题         |
| content    | string    | 是  | 正文，最大5000字 |
| images     | string\[] | 否  | 图片URL数组    |
| videoUrl   | string    | 否  | 视频地址       |
| category   | string    | 否  | 分类         |
| tags       | string\[] | 否  | 标签列表       |
| distance   | string    | 否  | 距离         |
| duration   | string    | 否  | 总时长        |
| difficulty | int       | 否  | 难度等级       |
| transport  | int       | 否  | 交通方式       |

**响应：** data 为 Post结构（含 routeInfo）

***

## 评论

| 方法   | 路径                   | 说明        |
| ---- | -------------------- | --------- |
| GET  | /notes/:id/comments  | 获取笔记评论列表  |
| GET  | /guides/:id/comments | 获取攻略评论列表  |
| POST | /notes/:id/comments  | 发表笔记评论    |
| POST | /guides/:id/comments | 发表攻略评论    |
| POST | /comments/:id/like   | 点赞/取消点赞评论 |

***

### GET /notes/:id/comments 获取评论列表

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": "1",
      "member": {
        "id": "5",
        "nickname": "跑步酱",
        "avatar": "https://..."
      },
      "content": "千岛湖环线太美了！",
      "likeCount": 12,
      "isLiked": false,
      "replyToId": null,
      "createdAt": "2026-04-18T12:00:00",
      "replies": [
        {
          "id": "2",
          "member": { "id": "1", "nickname": "山林旅人", "avatar": "..." },
          "content": "镇上租车很方便",
          "likeCount": 5,
          "isLiked": false,
          "replyToId": "1",
          "createdAt": "2026-04-18T14:30:00"
        }
      ]
    }
  ]
}
```

***

### POST /notes/:id/comments 发表评论

**请求参数：**

| 参数        | 类型     | 必填 | 说明              |
| --------- | ------ | -- | --------------- |
| content   | string | 是  | 评论内容            |
| replyToId | string | 否  | 回复目标评论ID，空=一级评论 |

**响应：** data 为 Comment结构

***

### POST /comments/:id/like 点赞评论

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "isLiked": true,
    "likeCount": 13
  }
}
```

***

## 活动

| 方法   | 路径                     | 说明        |
| ---- | ---------------------- | --------- |
| GET  | /activities            | 获取活动列表    |
| GET  | /activities/:id        | 获取活动详情    |
| POST | /activities            | 创建活动（仅领队） |
| POST | /activities/:id/signup | 报名/取消报名   |
| GET  | /user/activities       | 获取我的活动    |

***

### GET /activities 活动列表

**请求参数：**

| 参数   | 类型     | 必填 | 默认 | 说明                   |
| ---- | ------ | -- | -- | -------------------- |
| type | string | 否  | 全部 | 徒步/露营/骑行/登山/跑步/攀岩/溯溪 |
| time | string | 否  | -  | 本周/本月                |
| page | int    | 是  | -  | 页码                   |
| size | int    | 是  | -  | 每页条数                 |

**响应：** 统一分页格式，list 为 Activity结构数组

***

### GET /activities/:id 活动详情

**响应：** data 为 Activity结构

***

### POST /activities 创建活动

**请求参数：**

| 参数              | 类型      | 必填 | 说明                      |
| --------------- | ------- | -- | ----------------------- |
| title           | string  | 是  | 标题，最大50字                |
| activityType    | string  | 是  | 活动类型                    |
| cover           | string  | 否  | 封面图片URL                 |
| startTime       | string  | 是  | 开始时间 "2026-05-01 09:00" |
| endTime         | string  | 是  | 结束时间                    |
| signUpStart     | string  | 是  | 报名开始时间                  |
| signUpEnd       | string  | 是  | 报名截止时间                  |
| address         | string  | 是  | 集合地点                    |
| price           | decimal | 否  | 费用，默认0=免费               |
| maxPeople       | int     | 否  | 人数上限，默认20               |
| difficulty      | string  | 是  | 难度等级                    |
| activityContent | string  | 否  | 活动介绍，最大3000字            |

**响应：** data 为 Activity结构

***

### POST /activities/:id/signup 报名/取消报名

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "isJoined": true,
    "currentPeople": 9
  }
}
```

***

### GET /user/activities 我的活动

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "organized": [
      {
        "id": "1",
        "title": "武功山云海露营",
        "coverImg": "https://...",
        "activityType": "露营",
        "address": "萍乡市武功山风景区",
        "startTime": "2026-05-01 09:00",
        "endTime": "2026-05-03 17:00",
        "maxPeople": 20,
        "currentPeople": 8,
        "price": 198,
        "difficulty": "中等",
        "activityStatus": 1,
        "joined": false
      }
    ],
    "joined": [
      {
        "id": "2",
        "title": "楠溪江溯溪",
        "coverImg": "https://...",
        "activityType": "溯溪",
        "address": "浙江温州·楠溪江",
        "startTime": "2026-06-10 08:00",
        "endTime": "2026-06-10 17:00",
        "maxPeople": 15,
        "currentPeople": 6,
        "price": 0,
        "difficulty": "中等",
        "activityStatus": 1,
        "joined": true
      }
    ]
  }
}
```

***

## 我的发布

| 方法  | 路径                   | 说明             |
| --- | -------------------- | -------------- |
| GET | /user/posts          | 获取当前用户发布的笔记+攻略 |
| GET | /users/:userId/posts | 获取指定用户发布的笔记+攻略 |

**响应：** 统一分页格式，list 为 Post结构数组

***

## 收藏

| 方法  | 路径              | 说明         |
| --- | --------------- | ---------- |
| GET | /user/favorites | 获取当前用户收藏列表 |

**响应：** 统一分页格式，list 为 Post结构数组

***

## 搜索

| 方法  | 路径      | 说明   |
| --- | ------- | ---- |
| GET | /search | 全局搜索 |

**请求参数：**

| 参数      | 类型     | 必填 | 说明                        |
| ------- | ------ | -- | ------------------------- |
| keyword | string | 是  | 搜索关键词                     |
| type    | string | 是  | note（笔记/攻略）或 activity（活动） |
| page    | int    | 是  | 页码                        |
| size    | int    | 是  | 每页条数                      |

**响应：** 统一分页格式，list 根据 type 为 Post结构或 Activity结构数组

***

## 消息通知

| 方法   | 路径                               | 说明         |
| ---- | -------------------------------- | ---------- |
| GET  | /messages/interactions           | 互动消息列表     |
| PUT  | /messages/interactions/:id/read  | 标记单条互动已读   |
| PUT  | /messages/interactions/read-all  | 标记全部互动已读   |
| POST | /messages/interactions/:id/reply | 消息列表回复评论   |
| GET  | /messages/system                 | 系统通知列表     |
| PUT  | /messages/system/:id/read        | 标记单条系统通知已读 |
| GET  | /messages/unread-count           | 未读消息数      |

***

### GET /messages/interactions 互动消息

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": "m1",
      "type": "like",
      "member": { "id": "3", "nickname": "...", "avatar": "..." },
      "content": "赞了你的笔记「周末骑行千岛湖环线」",
      "targetTitle": "周末骑行千岛湖环线",
      "createdAt": "2026-04-20T15:30:00",
      "read": false,
      "replyCount": 1
    }
  ]
}
```

***

### POST /messages/interactions/:id/reply 回复评论

**请求参数：**

| 参数      | 类型     | 必填 | 说明   |
| ------- | ------ | -- | ---- |
| content | string | 是  | 回复内容 |

**响应：**

```json
{
  "code": 0,
  "message": "成功"
}
```

***

### GET /messages/system 系统通知

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": "ms1",
      "type": "system",
      "content": "你报名的「武功山云海露营」活动将于本周六开始...",
      "createdAt": "2026-04-24T09:00:00",
      "read": false
    }
  ]
}
```

***

### GET /messages/unread-count 未读数

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "interactionCount": 2,
    "systemCount": 1,
    "total": 3
  }
}
```

***

## 关注

| 方法   | 路径                       | 说明      |
| ---- | ------------------------ | ------- |
| POST | /users/:userId/follow    | 关注/取消关注 |
| GET  | /users/:userId/following | 关注列表    |
| GET  | /users/:userId/followers | 粉丝列表    |

***

### POST /users/:userId/follow 关注/取消关注

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "isFollowing": true
  }
}
```

***

### GET /users/:userId/following 关注列表

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": "2",
      "nickname": "跑步酱",
      "avatar": "https://...",
      "bio": "每天5公里",
      "memberType": 2,
      "publishCount": 12,
      "followCount": 88,
      "fansCount": 45
    }
  ]
}
```

***

### GET /users/:userId/followers 粉丝列表

**响应：**

```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": "3",
      "nickname": "徒步达人",
      "avatar": "https://...",
      "bio": "走遍中国",
      "memberType": 1,
      "publishCount": 56,
      "followCount": 120,
      "fansCount": 500
    }
  ]
}
```

***

## 删除

| 方法     | 路径              | 说明   |
| ------ | --------------- | ---- |
| DELETE | /notes/:id      | 删除笔记 |
| DELETE | /guides/:id     | 删除攻略 |
| DELETE | /activities/:id | 删除活动 |
| DELETE | /comments/:id   | 删除评论 |

**响应：**

```json
{
  "code": 0,
  "message": "成功"
}
```

***

## 附录：公共数据结构

### User（用户信息）

对应 `member` 表。

```json
{
  "id": "1",
  "phone": "13800138000",
  "nickname": "山林旅人",
  "avatar": "https://...",
  "bio": "热爱徒步，每周一山",
  "bgImg": "https://...",
  "memberType": 2,
  "publishCount": 23,
  "followCount": 156,
  "fansCount": 328
}
```

### Post（笔记/攻略统一数据）

笔记和攻略共用此结构，通过 `type` 区分。攻略额外包含 `routeInfo`。

对应 `note` 表（type=note）和 `strategy` 表（type=guide）。

```json
{
  "id": "1",
  "type": "note",
  "author": {
    "id": "1",
    "nickname": "山林旅人",
    "avatar": "https://..."
  },
  "title": "周末骑行千岛湖环线",
  "coverImg": "https://...",
  "images": ["https://..."],
  "videoUrl": "https://...",
  "content": "正文内容...",
  "viewCount": 1024,
  "likeCount": 235,
  "collectCount": 88,
  "commentCount": 12,
  "isLiked": false,
  "isFavorited": false,
  "category": "骑行",
  "tags": ["千岛湖", "环湖"],
  "status": 1,
  "publishTime": "2026-04-18T12:00:00",
  "routeInfo": {
    "distance": "150km",
    "duration": "2天",
    "difficulty": "中等",
    "transport": "自行车"
  }
}
```

### Activity（活动）

对应 `activity` 表。

```json
{
  "id": "1",
  "leader": {
    "id": "1",
    "nickname": "...",
    "avatar": "..."
  },
  "title": "武功山云海露营",
  "coverImg": "https://...",
  "activityType": "露营",
  "address": "萍乡市武功山风景区",
  "activityContent": "活动介绍正文...",
  "startTime": "2026-05-01 09:00",
  "endTime": "2026-05-03 17:00",
  "signUpStart": "2026-04-20 00:00",
  "signUpEnd": "2026-04-28 23:59",
  "maxPeople": 20,
  "currentPeople": 8,
  "price": 198,
  "difficulty": "中等",
  "activityStatus": 1,
  "joined": false,
  "members": [
    { "id": "1", "nickname": "...", "avatar": "..." }
  ]
}
```

### Comment（评论）

对应 `comment` 表。

```json
{
  "id": "1",
  "member": {
    "id": "5",
    "nickname": "跑步酱",
    "avatar": "https://..."
  },
  "content": "千岛湖环线太美了！",
  "likeCount": 12,
  "isLiked": false,
  "replyToId": null,
  "createdAt": "2026-04-18T12:00:00",
  "replies": [
    {
      "id": "2",
      "member": { "id": "1", "nickname": "山林旅人", "avatar": "..." },
      "content": "镇上租车很方便",
      "likeCount": 5,
      "isLiked": false,
      "replyToId": "1",
      "createdAt": "2026-04-18T14:30:00"
    }
  ]
}
```

