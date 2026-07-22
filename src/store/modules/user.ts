//+ 用户状态管理Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { setToken, clearToken } from '@/utils/token'

//+ 用户信息接口
export interface UserInfo {
  id: string
  nickname: string
  avatar: string
  phone: string
  role: 'member' | 'leader'
  tags: string[]
}

//+ 用户状态接口
export interface UserState {
  userInfo: UserInfo | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

//+ 初始状态
const initialState: UserState = {
  userInfo: null,
  isLoggedIn: false,
  loading: false,
  error: null
}

//+ 用户Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    //+ 退出登录
    logout: (state) => {
      state.userInfo = null
      state.isLoggedIn = false
      clearToken()
    },
    //+ 更新用户信息
    updateUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload
    },
    //+ 设置登录状态
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggedIn = action.payload
    }
  },
  // extraReducers 用于处理 createAsyncThunk 生成的异步 action
  // 它接收一个 builder 对象，可以通过 addCase 方法为不同的 action 状态（pending/fulfilled/rejected）添加对应的 reducer 处理逻辑
  // 作用：将异步操作的状态变化（加载中、成功、失败）映射到 Redux state 的更新
  // pending: 异步操作进行中/加载中状态
  // fulfilled: 异步操作成功完成状态
  // rejected: 异步操作失败/被拒绝状态
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        state.userInfo = action.payload.userInfo || null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(getUserInfo.pending, (state) => {
        state.loading = true
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
        state.isLoggedIn = true
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

//+ 登录异步Action
export const login = createAsyncThunk(
  'user/login',
  async (params: { phone: string; password?: string; smsCode?: string; captcha?: string }, { rejectWithValue }) => {
    try {
      //+ 调用登录接口
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      const data = await response.json()
      
      if (data.code === 0 || data.code === 200) {
        //+ 存储token
        if (data.data.token) {
          setToken(data.data.token)
        }
        return data.data
      } else {
        return rejectWithValue(data.message || '登录失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 获取用户信息异步Action
export const getUserInfo = createAsyncThunk(
  'user/getUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/user/info')
      const data = await response.json()
      
      if (data.code === 0 || data.code === 200) {
        return data.data
      } else {
        return rejectWithValue(data.message || '获取用户信息失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 导出Action
export const { logout, updateUserInfo, setLoggedIn } = userSlice.actions

//+ 导出Reducer
export default userSlice.reducer