//+ 首页模块Redux状态管理
//+ 管理轮播（slides）和Feed流（feed）数据
//+ Feed流采用单向滑动窗口：pageCache 按页缓存，最多保留50页，超过淘汰头部旧页
//+ feed 通过 selector 扁平化派生，不复写冗余 state
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit'
import { getSlides, getFeed } from '@/apis/home'
import type { SlideItem, FeedItem, PageResult } from '@/types'
import type { RootState } from '@/store'

//+ Feed查询参数接口
export interface FeedQueryParams {
  category?: number
  sort?: string
  page: number
  size: number
}

//+ 滑动窗口最大缓存页数（超过则淘汰头部最旧页）
const MAX_CACHED_PAGES = 50

//+ 首页状态接口
export interface HomeState {
  //+ 轮播数据
  slides: SlideItem[]
  slidesLoading: boolean
  slidesError: string | null

  //+ Feed流数据（滑动窗口结构）
  //+ pageCache: 按页码缓存分页数据 { [page]: FeedItem[] }
  //+ cachedPages: 内存中存在的页码集合（有序），用于快速判断与淘汰
  //+ feed 不再作为 state 存储，改为 selector 派生（见 selectFeed）
  pageCache: Record<number, FeedItem[]>
  cachedPages: number[]
  feedTotal: number
  feedPage: number
  feedSize: number
  feedTotalPage: number
  feedLoading: boolean
  feedHasMore: boolean
  feedError: string | null
}

//+ 初始状态
const initialState: HomeState = {
  slides: [],
  slidesLoading: false,
  slidesError: null,

  pageCache: {},
  cachedPages: [],
  feedTotal: 0,
  feedPage: 1,
  feedSize: 10,
  feedTotalPage: 0,
  feedLoading: false,
  feedHasMore: true,
  feedError: null
}

//+ 获取轮播数据异步Action
export const fetchSlides = createAsyncThunk(
  'home/fetchSlides',
  async () => {
    return await getSlides()
  }
)

//+ 获取Feed流数据异步Action
//+ 防重由页面层 handleScroll 的 !feedLoading 判断保证（与 Activity 列表一致）
//+ 注：勿在 thunk 内读 state.feedLoading 判断 — createAsyncThunk 会先 dispatch pending
//+     （reducer 置 loading=true），再执行 thunk 体，导致 page>1 时永远命中拦截，触底加载失效
export const fetchFeed = createAsyncThunk(
  'home/fetchFeed',
  async (params: FeedQueryParams) => {
    return await getFeed(params)
  }
)

//+ 软同步首页 feed（从详情返回时使用）
//+ 规则（按最终方案）：仅对当前内存 pageCache 中已存在的条目做局部 patch（点赞/收藏/计数同步）
//+ 已被滑动窗口淘汰的页面直接跳过；不做头部新增笔记软同步
export const softSyncFeed = createAsyncThunk(
  'home/softSyncFeed',
  async (params: FeedQueryParams, { dispatch, getState }) => {
    const state = getState() as RootState
    if (state.home.feedLoading) return
    const page1 = await getFeed({ ...params, page: 1 })
    const page1List = page1.list || []

    //+ 仅对当前 pageCache 中存在的条目逐项 patch；不在内存的跳过（已被淘汰）
    //+ page1 的条目一定在 pageCache[1] 中（除非 1 已被淘汰，此时跳过即可）
    for (const item of page1List) {
      dispatch(updateFeedItem({ id: item.id, patch: item }))
    }

    //+ 更新 total/hasMore 元信息，避免 hasMore 误判
    const syncSize = page1.size || 10
    const syncTotalPage = page1.total_page ?? Math.ceil(page1.total / syncSize)
    dispatch(setFeedMeta({
      total: page1.total,
      totalPage: syncTotalPage,
      hasMore: page1.page < syncTotalPage
    }))

    return page1
  }
)

//+ 首页Slice
const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    //+ 重置Feed流（下拉刷新、分类切换时调用）：清空 pageCache 与分页元信息
    resetFeed: (state) => {
      state.pageCache = {}
      state.cachedPages = []
      state.feedPage = 1
      state.feedHasMore = true
      state.feedError = null
    },
    //+ Q8：局部更新Feed流中单个卡片（点赞/收藏后同步）
    //+ 遍历 pageCache 所有页查找目标项并 patch；不在内存的跳过
    updateFeedItem: (state, action: PayloadAction<{ id: string; patch: Partial<FeedItem> }>) => {
      const { id, patch } = action.payload
      for (const page of state.cachedPages) {
        const list = state.pageCache[page]
        if (!list) continue
        const item = list.find(f => f.id === id)
        if (item) {
          Object.assign(item, patch)
          break
        }
      }
    },
    //+ 软同步时更新 feed 元信息（total/totalPage/hasMore），不重置 page
    setFeedMeta: (state, action: PayloadAction<{ total: number; totalPage: number; hasMore: boolean }>) => {
      state.feedTotal = action.payload.total
      state.feedTotalPage = action.payload.totalPage
      state.feedHasMore = action.payload.hasMore
    }
  },
  extraReducers: (builder) => {
    builder
      //+ 轮播
      .addCase(fetchSlides.pending, (state) => {
        state.slidesLoading = true
        state.slidesError = null
      })
      .addCase(fetchSlides.fulfilled, (state, action: PayloadAction<SlideItem[]>) => {
        state.slidesLoading = false
        state.slides = action.payload
      })
      .addCase(fetchSlides.rejected, (state, action) => {
        state.slidesLoading = false
        state.slidesError = action.error.message ?? '网络错误'
      })
      //+ Feed流
      .addCase(fetchFeed.pending, (state) => {
        state.feedLoading = true
        state.feedError = null
      })
      .addCase(fetchFeed.fulfilled, (state, action: PayloadAction<PageResult<FeedItem>>) => {
        state.feedLoading = false
        const page = action.payload.page

        //+ page===1：重置窗口（首屏 / 下拉刷新 / 分类切换后首次加载）
        if (page === 1) {
          state.pageCache = { 1: action.payload.list }
          state.cachedPages = [1]
        } else {
          //+ page>1：追加到窗口尾部，超过 MAX_CACHED_PAGES 淘汰头部最旧页
          state.pageCache[page] = action.payload.list
          state.cachedPages.push(page)
          if (state.cachedPages.length > MAX_CACHED_PAGES) {
            const evicted = state.cachedPages.shift()
            if (evicted !== undefined) {
              delete state.pageCache[evicted]
            }
          }
        }

        state.feedTotal = action.payload.total
        state.feedPage = page
        //+ total_page 优先用后端返回；后端不返回时前端按 total/size 计算（兼容真实后端只返回 total+size 的情况）
        const size = action.payload.size || state.feedSize
        const totalPage = action.payload.total_page ?? Math.ceil(action.payload.total / size)
        state.feedTotalPage = totalPage
        state.feedHasMore = page < totalPage
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feedLoading = false
        state.feedError = action.error.message ?? '网络错误'
      })
  }
})

//+ Selector：扁平化派生 feed（按 cachedPages 顺序拼接各页数据）
//+ 使用 createSelector 做 memoize：仅当 pageCache 或 cachedPages 引用变化时才重新计算
//+ 否则返回上一次的结果引用，避免 useSelector 因新数组引用触发不必要的重渲染
const selectPageCache = (state: RootState) => state.home.pageCache
const selectCachedPages = (state: RootState) => state.home.cachedPages

export const selectFeed = createSelector(
  [selectPageCache, selectCachedPages],
  (pageCache, cachedPages): FeedItem[] => {
    const result: FeedItem[] = []
    for (const page of cachedPages) {
      const list = pageCache[page]
      if (list) {
        for (const item of list) {
          result.push(item)
        }
      }
    }
    return result
  }
)

//+ 导出Action
export const { resetFeed, updateFeedItem, setFeedMeta } = homeSlice.actions

//+ 导出Reducer
export default homeSlice.reducer
