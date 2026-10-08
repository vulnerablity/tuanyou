# CLAUDE.md — tuyou-web (途友)

Multi-end social app for outdoor hiking enthusiasts (notes waterfall feed, guides,
activities, comments, likes/follows, messages). One codebase → H5 + WeChat Mini Program.

Stack: **Taro 4.2.1 · React 18 · TypeScript 5.4 · Redux Toolkit 2.12 · NutUI React 4.0.0-beta.5 · Less 4**.
Package manager: **pnpm**. Windows PowerShell environment.

The authoritative in-repo contract is `docs/代码规范.md` (13 sections). When in doubt about
naming / layering / request / store conventions, follow it.

## Commands

```powershell
# Install
pnpm install

# Dev
pnpm dev:h5          # H5 dev server, http://localhost:10086, hot reload
pnpm dev:weapp       # watch build for WeChat DevTools

# Build
pnpm build:h5:dev    # H5 development build (unminified)
pnpm build:h5:test    # H5 test build
pnpm build:h5:prod   # H5 production build  (alias: pnpm build:h5)
pnpm build:weapp:dev / :test / :prod   (alias: pnpm build:weapp → prod)

# Quality gates (must pass before considering work done)
pnpm exec tsc --noEmit                              # type check, expect 0 errors
pnpm exec eslint "src/**/*.ts" "src/**/*.tsx"       # note the quoted globs on PowerShell
```

Commits follow **Conventional Commits** (Husky + commitlint + lint-staged installed):
`feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:` … non-conforming messages are rejected.

## Architecture

Dependency direction (top depends on bottom; never reverse):

```
pages / components → store (optional) → apis → utils/request → (Mock | real backend)
```

- **Pages/components must NOT import `request`/`get`/`post` from `@/utils/request`, nor call
  `Taro.request` / `Taro.uploadFile`.** Data access goes only through `@/apis`.
- **Pages/components must NOT call `Taro.navigateTo/redirectTo/switchTab/reLaunch` directly.**
  Navigation goes only through the wrapper functions in `@/router`.

### Routing (two-layer, must stay in sync)

- `src/app.config.ts` — page registry (the real route table, esp. for Mini Program).
- `config/index.ts` → `h5.router.customRoutes` — H5 URL aliases, e.g.
  `'/pages/Login/index': '/login'` (key = real page path, value = alias URL).
- `src/router/index.ts` exports `ROUTE_PATHS` (all page keys, SCREAMING_SNAKE) and `ROUTE_ALIAS`
  (H5 aliases), which must mirror `customRoutes` key-by-key.
- Wrappers (use these everywhere): `routerNavigateTo(key, params?)`, `routerRedirectTo(key, params?)`,
  `routerSwitchTab(key)`, `routerReLaunch(key, params?)`, `routerNavigateBack(delta?)`,
  `goAfterLogin()`, `goToLogin(redirect?)`, `requireAuth(action)`.
  The optional second `params` arg (`Record<string, string | number>`) is `encodeURIComponent`-encoded
  into the query string; on H5 the alias path is used, on Mini Program the raw page path.
- Auth: `src/components/AuthRoute.tsx` exposes `withAuth`, `useAuthGuard`, `useAuthCheck`,
  `requireAuth`. Public (no-login) pages: LOGIN / REGISTER / FORGOT_PASSWORD / LOGOUT.
- When adding a new page: create `src/pages/<Name>/index.tsx` + `index.less`, register in
  `app.config.ts`, add key to `ROUTE_PATHS`; if it needs an H5 alias, add it to both `ROUTE_ALIAS`
  and `customRoutes`.

### State management — Redux Toolkit, 10 slice modules

| Module | Responsibility |
|---|---|
| `user` | auth state, user info, login/register/logout, token write |
| `home` | home slides, notes waterfall feed (pagination/category/refresh/scroll memory) |
| `note` | notes list/detail, like/favorite optimistic updates |
| `guide` | guides list pagination |
| `activity` | activities list, banners, signup, category filter |
| `profile` | profile info, own notes/activities works |
| `comment` | comment tree, target switching, comment likes |
| `message` | interaction/system message lists, unread count, polling |
| `tag` | tag list |
| `upload` | single/batch image upload state machine |

Thunks are one-liners over the already-unwrapped apis (no `if (res.code === 0)` boilerplate):

```ts
export const fetchNotes = createAsyncThunk('note/fetchNotes', async (params: NoteQueryParams) => {
  return await getNotes(params)   // failures auto-reject with ApiError.message
})
```

Like/favorite/follow use optimistic updates: pending flips the UI, rejected rolls back
(except `AbortError`, which is silently ignored), fulfilled recalibrates with the server value.

### Request layer (`src/utils/request.ts`)

- Unified envelope: `ApiResponse<T> = { code: number; message: string; data: T }`,
  success codes `code ∈ {0, 200}`.
- `unwrap(res)` returns `data` on success, else throws `ApiError { code, message }` (message
  is user-safe, Toast-ready).
- Business code uses the 5 shortcuts which return the unwrapped `Promise<T>`:
  `apiGet / apiPost / apiPut / apiDelete / apiPatch` (each takes `(url, data?, signal?)`).
- Lower-level `request/get/post/put/del` remain exported (upload, envelope-needed cases).
- Bearer token auto-injected; **401 (HTTP or business code) clears token + Toast + redirects to
  login exactly once, inside this file only** — never duplicate it in business code.
- `AbortSignal` supported (request cancellation / stale-response drop).

### API layer (`src/apis/*.ts`, 11 domains)

One file per domain: `user / note / guide / activity / home / profile / tag / upload / message /
comment / search`. Each function is a thin typed wrapper returning the unwrapped `Promise<T>`,
with a JSDoc comment noting the backend path:

```ts
/** GET /notes - notes list (waterfall) */
export function getNotes(params: NoteQueryParams): Promise<PageResult<Post>> {
  return apiGet('/notes', params)
}
```

Function naming: `verb + domain noun`, **NO `API` suffix** (`getNotes`, not `getNotesAPI`).
Domain request-param types live in the apis file or `types/api.ts`. No business logic in this layer.

### Mock system (`src/mock/`, 14 files)

- Toggle: env `TARO_APP_USE_MOCK`. `.env.development` = `true`; `.env.test` / `.env.production`
  = `false`. Flipping dev to `false` switches to the real backend with **zero business-code change**.
- When `false`, real requests are made; failures fall back to Mock **only in dev/test** —
  never in production.
- Route keys: `"METHOD /api/v1/path"`, supports `:param` params. `src/mock/index.ts` aggregates
  all domain routes; `src/mock/utils.ts` provides `successResponse / errorResponse /
  createPageResponse / randomInt / randomItem / randomDate`.
- **Stateful Mock**: like/favorite/comment/follow/signup/publish mutate in-memory module data —
  after publishing, the list/detail shows it; after liking, the count flips and persists on
  re-request. Simulated latency 300–800ms so loading states are visible.

### Shared types (`src/types/`)

`entity.ts` (Post/User/Comment…), `api.ts` (ApiResponse / PageResult / enums / DTOs),
`upload.ts`, `index.ts` barrel. Import with `import type { … } from '@/types'`.
Goal: zero `any` (pre-refactor baseline was 242 occurrences); use `unknown` + narrowing or a
locally-commented minimal assertion where the library lacks types.

### Components (`src/components/`, 28 units)

Directory-per-component: `<Name>/index.tsx` + `index.less` (**no `.css` files** — only
`iconfont.css` remains for the font library). Components:
`AuthRoute.tsx` (guard), `ActivityCard`, `Avatar`, `Banner`, `Button`, `CalendarPopup`,
`CaptchaInput`, `CodeInput`, `CommentInput`, `CommentSection`, `DateScroller`, `DetailBanner`,
`DetailInfo`, `HeaderNavBar`, `MarkdownEditor`, `MessageToast`, `ParticipantsModal`,
`PostWaterfall` (renamed from NoteList; internally does optimistic like with dedupe by design),
`RichEditor`, `SearchBar`, `SearchHistory`, `SharePoster`, `StatusBadge`, `SwipeAction`,
`TabList`, `Tag`, `UserCardModal`, `UserListItem`.

Conventions: explicit `interface XxxProps`, no `React.FC`, callbacks named `onXxx`, handlers
`handleXxx`, list rendering with stable `key`, no `setState` in render, components do not fetch
their own data (except the documented `PostWaterfall` like exception), navigation via `@/router`.

Pages live in `src/pages/<Page>/` (27 page directories + 6 local subcomponents under
`pages/Message/components/`). Pages must render loading / empty / error states and respect
pagination.

### Hooks & utils

- `src/hooks/` (9): `usePagedList`, `useToggleAction`, `useCaptcha`, `useSendCode`, `useSSE`,
  `useCommentPolling`, `useMarkdownRender`, `useMarkdownInsert`, `useTextareaCursor`.
- `src/utils/`: `request.ts` (core), `token.ts` (sole definition of TOKEN_KEY), `sse.ts`,
  `markdown.ts`, `html.ts`, `postAdapter.ts`, `formatMessageTime.ts`, `diffCommentLikes.ts`, `index.ts`.

### Env variables

| Variable | Meaning |
|---|---|
| `TARO_APP_ENV` | development / test / production |
| `TARO_APP_API_BASE` | backend base URL, e.g. `http://192.168.10.7:84/api/v1` |
| `TARO_APP_USE_MOCK` | dev `true`, test/prod `false` |
| `TARO_APP_SITE_NAME` / `TARO_APP_LOG_LEVEL` / `TARO_APP_ASSET_BASE` | site tag / log level / asset CDN prefix |

### Path alias

`@/` maps to `src/` (tsconfig + webpack configured). Import cross-module code via `@/…`,
never relative `../../` chains deeper than needed.

## Guardrails

- Do NOT touch `src/` logic, `docs/代码规范.md`, `.claude/`, `config/` unless explicitly asked.
- Do NOT add new pages, change `app.config.ts` registrations, or desync `ROUTE_ALIAS` from
  `customRoutes`.
- Keep `pnpm exec tsc --noEmit` and eslint error-free; warnings (`react-hooks/exhaustive-deps`,
  currently ~16) are non-blocking but should not grow.
