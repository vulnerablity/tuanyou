//+ 用户状态管理Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { setToken, clearToken } from '@/utils/token'
import { loginAPI, getUserInfoAPI } from '@/apis/user'

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        state.userInfo = action.payload.userInfo || null
      })
      .addCase(fetchLogin.rejected, (state, action) => {
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
      .addCase(fetchRegister.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRegister.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        state.userInfo = action.payload.userInfo || null
      })
      .addCase(fetchRegister.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

//+ 登录异步Action
export const fetchLogin = createAsyncThunk(
  'user/fetchLogin',
  async (params: { phone: string; password: string; smsCode?: string; captcha?: string }, { rejectWithValue }) => {
    try {
      //+ 调用登录接口，request.ts已返回解析后的ResponseData
      const res = await loginAPI(params)

      if (res.code === 0 || res.code === 200) {
        //+ 存储token到本地存储
        if (res.data.token) {
          setToken(res.data.token)
        }
        return res.data
      } else {
        return rejectWithValue(res.message || '登录失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 注册异步Action
export const fetchRegister = createAsyncThunk(
  'user/fetchRegister',
  async (params: { phone: string; password: string; nickname: string }, { rejectWithValue }) => {
    try {
      //+ 导入registerAPI
      const { registerAPI } = await import('@/apis/user')
      const res = await registerAPI(params)

      if (res.code === 0 || res.code === 200) {
        //+ 存储token到本地存储
        if (res.data.token) {
          setToken(res.data.token)
        }
        return res.data
      } else {
        return rejectWithValue(res.message || '注册失败')
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
      //+ 使用封装的API，自动带上token
      const res = await getUserInfoAPI()

      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取用户信息失败')
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
