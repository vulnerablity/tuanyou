# 途友 - 户外徒步社交 APP

> 探索自然，结伴前行

## 项目介绍

途友是一款面向户外徒步爱好者的社交应用，提供笔记瀑布流、攻略、活动报名、组队互动、评论点赞关注、消息通知等功能。本项目基于 Taro 框架开发，一套代码支持 H5 与微信小程序双端运行。

目前后端尚未就绪，项目内置了**可插拔的 Mock 数据系统**：前端开发全程无需真实后端，切换一个环境变量即可无缝切到真实接口。

## 技术栈

| 分类 | 技术 | 版本 |
|---|---|---|
| 跨端框架 | Taro | 4.2.1 |
| UI 库 | NutUI React / NutUI Biz | 4.0.0-beta.5 / 1.0.0-beta.2 |
| 视图层 | React | 18.x |
| 语言 | TypeScript | 5.4.x |
| 状态管理 | Redux Toolkit + react-redux | 2.12.x / 9.x |
| 样式 | Less | 4.x |
| 富文本 | WangEditor 5 / 自研 markdown 渲染 | - |
| 包管理 | pnpm | ≥ 8 |
| 工程化 | ESLint 8 + Husky 9 + commitlint + lint-staged | - |

## 环境要求

- **Node.js**: ≥ 18.0.0
- **pnpm**: ≥ 8.0.0
- **Taro CLI**: 4.2.1（已内置在项目依赖中，无需全局安装）
- 微信小程序开发需另装「微信开发者工具」

## 快速开始

### 1. 安装依赖

```powershell
pnpm install
```

### 2. 启动开发环境

**H5 开发（推荐，改代码即热更新）**

```powershell
pnpm dev:h5
```

启动后浏览器访问：`http://localhost:10086`

**微信小程序开发**

```powershell
pnpm dev:weapp
```

然后用微信开发者工具打开项目根目录预览。

> 当前 `.env.development` 已设置 `TARO_APP_USE_MOCK=true`，启动后全部数据来自本地 Mock，无需后端。

### 3. 构建命令

| 命令 | 说明 |
|---|---|
| `pnpm dev:h5` | H5 开发模式（端口 10086，热更新） |
| `pnpm dev:weapp` | 微信小程序 watch 构建 |
| `pnpm build:h5:dev` | H5 开发版构建（不压缩，带 source map） |
| `pnpm build:h5:test` | H5 测试版构建 |
| `pnpm build:h5:prod` | H5 生产版构建（压缩） |
| `pnpm build:h5` | 等同 `build:h5:prod` |
| `pnpm build:weapp:dev` | 微信小程序开发版构建 |
| `pnpm build:weapp:test` | 微信小程序测试版构建 |
| `pnpm build:weapp:prod` | 微信小程序生产版构建 |
| `pnpm build:weapp` | 等同 `build:weapp:prod` |

### 4. 质量检查命令

```powershell
pnpm exec tsc --noEmit          # 全仓类型检查，必须 0 错误
pnpm exec eslint "src/**/*.ts" "src/**/*.tsx"   # ESLint 检查
```

## 项目结构

```
src/
├── app.tsx / app.config.ts / app.less   # 应用壳（入口/页面注册/全局样式）
├── assets/                              # 静态资源（图片/字体）
├── types/                               # 共享类型
│   ├── entity.ts                        #   业务实体（Post/User/Comment...）
│   ├── api.ts                           #   协议域（ApiResponse/PageResult/枚举/DTO）
│   ├── upload.ts                        #   上传专项类型
│   └── index.ts                         #   barrel 统一导出
├── utils/                               # 基础工具（不写业务）
│   ├── request.ts                       #   ★ 请求层：Taro.request 封装 + Mock 切换 + ApiError/unwrap/apiGet...
│   ├── token.ts                         #   token 读写（TOKEN_KEY 唯一定义处）
│   ├── sse.ts / useSSE 配套             #   SSE 流式通知
│   ├── markdown.ts / html.ts             #   markdown 渲染与消毒
│   ├── postAdapter.ts                   #   笔记数据适配
│   ├── formatMessageTime.ts             #   消息时间格式化
│   ├── diffCommentLikes.ts             #   评论点赞 diff
│   └── index.ts                         #   通用工具导出
├── router/
│   └── index.ts                         # ★ 路由常量 + 导航包装（全仓唯一允许直调 Taro 导航的地方）
├── apis/                                # 领域 API 薄封装（业务层唯一取数入口，共 11 个领域）
│   ├── user.ts                          #   登录/注册/验证码/改密/换绑/注销
│   ├── note.ts                          #   笔记列表/详情/发布/删除/点赞收藏
│   ├── guide.ts                         #   攻略
│   ├── activity.ts                      #   活动列表/详情/报名/Banner
│   ├── home.ts                          #   首页轮播/feed
│   ├── profile.ts                        #   个人主页资料与作品
│   ├── tag.ts                           #   标签
│   ├── upload.ts                        #   上传
│   ├── message.ts                       #   消息（互动/系统/未读数）
│   ├── comment.ts                       #   评论树
│   └── search.ts                        #   搜索
├── mock/                                # Mock 路由与数据（共 14 个文件，仅 Mock 模式生效）
│   ├── index.ts                         #   聚合各领域 Mock 路由
│   ├── utils.ts                         #   successResponse/createPageResponse/randomInt...
│   ├── config.ts / home.ts / user.ts / note.ts / guide.ts / activity.ts
│   ├── comment.ts / message.ts / profile.ts / search.ts / tag.ts / upload.ts
├── store/
│   ├── index.ts                         # Redux store 组装
│   └── modules/                         # 10 个领域 slice（user/home/note/guide/activity/profile/comment/message/tag/upload）
├── hooks/                               # 共享 Hooks（9 个）
│   ├── usePagedList.ts / useToggleAction.ts / useCaptcha.ts / useSendCode.ts
│   ├── useSSE.ts / useCommentPolling.ts / useMarkdownRender.ts / useMarkdownInsert.ts / useTextareaCursor.ts
├── components/                          # 通用组件（目录式：<Name>/index.tsx + index.less，共 28 个单元）
│   ├── AuthRoute.tsx                   #   鉴权守卫（withAuth/useAuthGuard/useAuthCheck/requireAuth）
│   ├── PostWaterfall/                   #   首页瀑布流
│   ├── CommentSection/ CommentInput/    #   评论区
│   ├── ActivityCard/ DetailBanner/ DetailInfo/ Banner/ HeaderNavBar/
│   ├── MarkdownEditor/ RichEditor/ SearchBar/ SearchHistory/ Tag/
│   └── ...（Avatar/Button/CaptchaInput/CodeInput/DateScroller/MessageToast/
             ParticipantsModal/SharePoster/StatusBadge/SwipeAction/TabList/
             UserCardModal/UserListItem/CalendarPopup）
└── pages/                               # 页面（26 个目录，pages/<Page>/index.tsx + index.less）
    ├── Home/ Activity/ Message/ Profile/        # 4 个 tabBar 页
    ├── Login/ Register/ ForgotPassword/ Logout/   # 认证流程
    ├── NoteDetail/ GuideDetail/ ActivityDetail/  # 详情页
    ├── PublishNote/ PublishGuide/ PublishActivity/
    ├── Search/ Content/ Favorite/ Like/ MyActivity/
    ├── EditProfile/ FollowList/ FollowerList/
    ├── Settings/ ChangePassword/ ChangePhone/ CancelAccount/
    └── Message/components/                        # 消息页 6 个局部子组件
docs/
└── 代码规范.md                           # ★ 全仓重构契约（13 节），规范描述以它为准
```

## 路由说明

> ⚠️ 本项目使用 Taro 内置路由系统，**不支持 `react-router-dom`**。

### 1. 两层路由配置，必须双同步

| 位置 | 作用 |
|---|---|
| `src/app.config.ts` | 注册页面（小程序端真实路由表） |
| `config/index.ts` 的 `h5.router.customRoutes` | H5 端别名（如 `/home` → `/pages/Home/index`） |
| `src/router/index.ts` 的 `ROUTE_PATHS` | 全仓页面路径常量（SCREAMING_SNAKE 键） |
| `src/router/index.ts` 的 `ROUTE_ALIAS` | H5 别名映射，与 `customRoutes` **键值逐一对齐** |

### 2. 必须使用 router 包装函数跳转

全仓禁止在页面/组件里直调 `Taro.navigateTo` 等 API，一律从 `@/router` 引入：

```ts
import {
  routerNavigateTo, routerRedirectTo, routerSwitchTab, routerReLaunch,
  routerNavigateBack, goAfterLogin, goToLogin, requireAuth
} from '@/router'

routerNavigateTo('NOTE_DETAIL', { id: 123 })   // 第二参 params 自动 encode 拼 query
routerRedirectTo('REGISTER')                   // 关闭当前页跳转
routerSwitchTab('HOME')                         // tabBar 页必须用 switchTab
routerReLaunch('HOME')                          // 清空页面栈
routerNavigateBack(1)                           // 返回上一页
goAfterLogin()                                  // 登录成功后：优先回跳来源页，否则首页
goToLogin(getCurrentPageFullPath())             // 跳登录并记住回跳地址
requireAuth('报名')                              // 操作级鉴权：未登录 Toast + 跳登录，返回 boolean
```

| 函数 | 说明 |
|---|---|
| `routerNavigateTo(key, params?)` | 保留当前页跳转（对应 Taro.navigateTo） |
| `routerRedirectTo(key, params?)` | 关闭当前页跳转（对应 Taro.redirectTo） |
| `routerSwitchTab(key)` | 跳转 tabBar 页（对应 Taro.switchTab） |
| `routerReLaunch(key, params?)` | 关闭所有页后打开（对应 Taro.reLaunch） |
| `routerNavigateBack(delta?)` | 返回上一页，默认返回 1 层 |
| `goAfterLogin()` | 登录成功后跳转：优先回跳 `login_redirect` 记录的来源页，其次首页 |
| `goToLogin(redirect?)` | 跳登录页；传入当前页路径可实现登录后自动回跳 |
| `requireAuth(action?)` | 操作前鉴权：已登录返回 `true`；未登录 Toast「请先登录后XX」并跳登录页 |

> H5 端跳 `ROUTE_ALIAS` 中配置了别名的路径（如 `/login?id=1`），小程序端跳原始页面路径；`params` 会自动 `encodeURIComponent` 拼到 query。

### 3. 路由键表（ROUTE_PATHS 真实键）

| 路由键 | 页面 | H5 别名 |
|---|---|---|
| `LOGIN` | 登录 | `/login` |
| `REGISTER` | 注册 | `/register` |
| `FORGOT_PASSWORD` | 忘记密码 | `/forgot-password` |
| `HOME` | 首页 | `/home` |
| `ACTIVITY_LIST` | 活动列表（tab） | （customRoutes 已配 `/activity`） |
| `MESSAGE` | 消息（tab） | （customRoutes 已配 `/message`） |
| `PROFILE` | 个人中心（tab） | （customRoutes 已配 `/profile`） |
| `SEARCH` | 搜索 | `/search` |
| `LOGOUT` | 登出 | `/logout` |
| `NOTE_DETAIL` / `GUIDE_DETAIL` / `ACTIVITY_DETAIL` | 三类详情页 | - |
| `PUBLISH_NOTE` / `PUBLISH_GUIDE` / `PUBLISH_ACTIVITY` | 三类发布页 | （customRoutes 已配 `/publish/*`） |
| `EDIT_PROFILE` / `MY_ACTIVITY` / `CONTENT` / `FOLLOW_LIST` / `FOLLOWER_LIST` / `FAVORITE` / `LIKE` / `SETTINGS` | 个人中心子页 | - |
| `CHANGE_PASSWORD` / `CHANGE_PHONE` / `CANCEL_ACCOUNT` | 账号管理子页（仅页面内跳转，无 H5 别名） | - |

### 4. 新增页面流程

1. 在 `src/pages/<Name>/` 建 `index.tsx` + `index.less`；
2. 在 `src/app.config.ts` 的 `pages` 数组注册；
3. 在 `src/router/index.ts` 的 `ROUTE_PATHS` 加键（如需 H5 地址则同时加 `ROUTE_ALIAS`，并在 `config/index.ts` 的 `customRoutes` 同步加一行 `'/pages/Name/index': '/别名'`）；
4. 如需登录访问，在页面内用 `useAuthGuard` / `requireAuth`（白名单见 `PUBLIC_ROUTES`）。

## 状态管理（Redux Toolkit）

每领域一个 slice，共 **10 个模块**：

| 模块 | 职责 |
|---|---|
| `user` | 登录态、用户信息、登录/注册/登出、token 写入 |
| `home` | 首页轮播 slides、笔记瀑布流 feed（分页/分类/下拉刷新/滚动位置记忆） |
| `note` | 笔记列表与详情、点赞/收藏乐观更新 |
| `guide` | 攻略列表分页 |
| `activity` | 活动列表、Banner、报名、分类筛选 |
| `profile` | 个人主页资料、本人笔记/活动作品 |
| `comment` | 评论树列表、目标切换、点赞 |
| `message` | 互动消息/系统消息列表、未读数、轮询 |
| `tag` | 标签列表 |
| `upload` | 单图/多图上传任务状态机（idle/loading/success/error） |

约定：thunk 取数一行化（apis 已解包，不再手写 `if (res.code===0)`）；点赞/收藏/关注走乐观更新（pending 翻转 → rejected 回滚 → fulfilled 以后端值校准）；`AbortError` 直接忽略不回滚。

```tsx
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotes, toggleLike } from '@/store/modules/note'

const dispatch = useDispatch()
const { notes, loading, hasMore } = useSelector((state) => state.note)
useEffect(() => { dispatch(fetchNotes({ page: 1 })) }, [dispatch])
```

## 请求层（src/utils/request.ts）

- **统一响应信封**：`ApiResponse<T> = { code: number; message: string; data: T }`，成功码 `code ∈ {0, 200}`。
- **解包**：`unwrap(res)` 在成功时直接返回 `data`，失败 `throw new ApiError(code, message)`（`message` 可直接 Toast 展示）。
- **5 个快捷函数**（业务默认用这几个，返回解包后的 `Promise<T>`）：
  `apiGet<T>(url, params?, signal?)` / `apiPost` / `apiPut` / `apiDelete` / `apiPatch`
- **底层** `request/get/post/put/del` 仍导出（上传、需要信封的场景使用）。
- **token**：自动注入 `Authorization: Bearer <token>`。
- **401**（HTTP 或业务码）：统一清 token + Toast + 跳登录页——只在 request.ts 内处理一次，业务层无需重复写。
- **取消请求**：传 `AbortSignal`，防止重复请求/过期响应回写。

apis 层写法示例（薄封装，只描述路径与类型）：

```ts
/** GET /notes - 笔记列表（瀑布流） */
export function getNotes(params: NoteQueryParams): Promise<PageResult<Post>> {
  return apiGet('/notes', params)
}
```

## Mock 数据系统

- **启用开关**：环境变量 `TARO_APP_USE_MOCK`。`.env.development` 已设 `true`（本地开发走 Mock）；`.env.test` / `.env.production` 为 `false`（走真实接口）。
- **切真接口**：后端就绪后把 `.env.development` 的 `TARO_APP_USE_MOCK` 改为 `false` 即可，**页面与组件代码零改动**。
- **降级策略**：`false` 时发真实请求，仅开发/测试环境请求失败会自动降级回 Mock；生产环境禁止降级。
- **路由键格式**：`"METHOD /api/v1/path"`，支持 `:param` 参数化，如 `"GET /api/v1/notes/:id"`。
- **有状态 Mock**：点赞/收藏/评论/关注/报名/发布都会真实修改模块级内存数据——发布后列表可见、点赞数字翻转、再次请求保持最新状态，不是每次返回写死的假数据。
- **模拟延迟**：300–800ms，让 loading 态可见。

## 环境变量

| 变量 | 说明 | 示例 |
|---|---|---|
| `TARO_APP_ENV` | 当前运行环境 | `development` / `test` / `production` |
| `TARO_APP_API_BASE` | 后端接口基础地址 | `http://192.168.10.7:84/api/v1` |
| `TARO_APP_USE_MOCK` | 是否启用 Mock | dev=`true`，test/prod=`false` |
| `TARO_APP_SITE_NAME` | 站点标识 | `tuyou-dev` |
| `TARO_APP_LOG_LEVEL` | 日志级别 | `debug` / `info` / `warn` |
| `TARO_APP_ASSET_BASE` | 静态资源 CDN 前缀 | 默认空 |

## 样式规范

- **NutUI 组件库**：只引入编译后 CSS（`@nutui/nutui-react/dist/style.css`），**不要引入 SCSS 源文件**（会变量冲突报错）。
- **页面/组件样式**：一律 `index.less`，通过 `import './index.less'` 引入；全仓不再存在 `index.css`（仅保留字体库 iconfont.css）。
- 内联 `style={{}}` 仅限动态值（进度条宽度、动态颜色）；CSS 类名 kebab-case 语义化。

## 常见问题

**Q: 为什么不能用 react-router-dom？**
A: Taro 是跨端框架，重写了路由系统，与 react-router-dom 不兼容。跳转一律走 `@/router` 包装函数。

**Q: 样式报错 `variable undefined`？**
A: 检查是否误引了 NutUI 的 `.scss` 源文件，只允许引编译后的 `.css`。

**Q: IDE 提示 `Taro.General.CallbackResult` 不存在？**
A: 正确全局命名空间是 `TaroGeneral.CallbackResult`，不是 `Taro.General`。

**Q: 接口 401 后没跳登录页？**
A: 401 统一在 `src/utils/request.ts` 处理；业务层不要自己再判断 code，也不要在别处重复跳登录。

**Q: 后端还没好，怎么联调页面交互？**
A: 保持 `TARO_APP_USE_MOCK=true`，Mock 是有状态的（点赞/发布/评论都会改内存），可直接验证交互闭环。

**Q: 改了代码 H5 不热更新？**
A: 确认用的是 `pnpm dev:h5` watch 模式，而不是 `build:h5:dev`。

## 开发规范

### 代码提交（Conventional Commits）

项目已配置 Husky + commitlint（conventional 规范）+ lint-staged，**提交信息有格式要求**，不符合会被拦截：

```
feat: 新增笔记发布功能
fix: 修复登录页验证码倒计时
refactor: 重构请求层 unwrap 解包
style: 调整首页瀑布流间距
chore: 升级依赖版本
```

常用 type：`feat` 新功能 / `fix` 修 bug / `refactor` 重构 / `style` 样式 / `docs` 文档 / `test` 测试 / `chore` 杂项。

### 其他约定（详见 docs/代码规范.md）

- 业务类型集中 `src/types`，消灭 `any`，类型导入用 `import type`；
- API 函数命名「动词+领域名词」，**不带 API 后缀**（`getNotes` 而非 `getNotesAPI`）；
- 页面/组件禁止直调 `Taro.request` / `Taro.uploadFile` / `Taro.navigate*`，取数走 `@/apis`、跳转走 `@/router`；
- 列表渲染必须带稳定 `key`；副作用进 `useEffect`，防抖/竞态用现成 hooks。
