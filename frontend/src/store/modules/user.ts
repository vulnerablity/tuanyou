//+ 用户状态管理Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { setToken, clearToken } from '@/utils/token'
import {
  login,
  getMemberInfo,
  register,
  sendCode,
  resetPassword,
  logout as logoutApi,
  toggleFollow as toggleFollowApi
} from '@/apis/user'
import type { User } from '@/types'

//+ 用户信息类型，与API文档一致
export type UserInfo = User

//+ 用户状态接口
export interface UserState {
  userInfo: UserInfo | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
  //+ 关注按钮 loading：按被关注用户 ID 存储；页面组件用此判断按钮置灰
  followLoadingMap: Record<string, boolean>
}

//+ 初始状态
const initialState: UserState = {
  userInfo: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  followLoadingMap: {}
}

//+ 发送验证码异步Action
//+ scene 支持：register/login/reset-pwd/change-phone/cancel-account
export const fetchSendCode = createAsyncThunk(
  'user/fetchSendCode',
  async (params: {
    phone: string
    scene: 'register' | 'login' | 'reset-pwd' | 'change-phone' | 'cancel-account'
  }) => {
    return await sendCode(params)
  }
)

//+ 登录异步Action（支持密码登录和验证码登录）
//+ 密码登录：需带 captcha_id + captcha（图形验证码）；验证码登录：仅带短信 code
//+ 成功后写入 token（业务错误由请求层抛 ApiError，action.error.message 携带提示）
export const fetchLogin = createAsyncThunk(
  'user/fetchLogin',
  async (params: {
    phone: string
    password?: string
    code?: string
    type?: 'password' | 'code'
    captcha_id?: string
    captcha?: string
  }) => {
    const data = await login(params)
    if (data.token) {
      setToken(data.token)
    }
    return data
  }
)

//+ 注册异步Action（新增 code + confirmPassword）
export const fetchRegister = createAsyncThunk(
  'user/fetchRegister',
  async (params: { phone: string; code: string; nickname: string; password: string; confirmPassword: string }) => {
    const data = await register(params)
    if (data.token) {
      setToken(data.token)
    }
    return data
  }
)

//+ 重置密码异步Action
export const fetchResetPassword = createAsyncThunk(
  'user/fetchResetPassword',
  async (params: { phone: string; code: string; newPassword: string; confirmPassword: string }) => {
    return await resetPassword(params)
  }
)

//+ 获取用户信息异步Action
export const getUserInfo = createAsyncThunk(
  'user/getUserInfo',
  async () => {
    //+ /user/profile 接口不存在，改用通用接口 /member/info 获取最新用户基础信息
    //+ /member/info 返回 { id, nickname, avatar, role }，用于刷新全局 userInfo 的头像/昵称
    return await getMemberInfo()
  }
)

//+ 退出登录异步Action
//+ 无论成功/失败都清理本地状态（Settings 页统一跳转登录）
export const fetchLogout = createAsyncThunk(
  'user/fetchLogout',
  async () => {
    return await logoutApi()
  }
)

//+ Q8：关注/取消关注（详情页作者关注按钮）
//+ Pending 置 loading 防重复点击，Rejected 清理，Fulfilled 返回 { userId, ...data } 给页面手动 patch
//+ （关注状态分散在各目标详情页/列表中）；data 为 ToggleFollowResult
export const toggleFollow = createAsyncThunk(
  'user/toggleFollow',
  async (userId: string, { signal }) => {
    const data = await toggleFollowApi(userId, signal)
    return { userId, ...data }
  }
)

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
      //+ 发送验证码
      .addCase(fetchSendCode.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSendCode.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(fetchSendCode.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '网络错误'
      })
      //+ 登录
      .addCase(fetchLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        //+ 响应中的 member 字段映射到 userInfo（补齐完整 User 类型缺失字段）
        //+ 登录返回的 member 为精简结构 {id, nickname, phone, avatar, role}，其余字段用默认值补齐
        //+ 保证 SearchBar 头像立即可用 member.avatar，无需等待 getUserInfo() 返回
        const member = action.payload.member
        state.userInfo = {
          id: member.id,
          phone: member.phone,
          nickname: member.nickname,
          avatar: member.avatar,
          bio: '',
          bgImg: '',
          memberType: 1,
          publishCount: 0,
          followCount: 0,
          fansCount: 0,
        }
      })
      .addCase(fetchLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '网络错误'
      })
      //+ 注册
      .addCase(fetchRegister.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRegister.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        //+ 响应中的 member 字段映射到 userInfo（补齐完整 User 类型缺失字段，与登录逻辑一致）
        //+ 注册返回的 member 为精简结构 {id, nickname, phone, avatar?, role}，其余字段用默认值补齐
        const member = action.payload.member
        state.userInfo = {
          id: member.id,
          phone: member.phone,
          nickname: member.nickname,
          avatar: member.avatar,
          bio: '',
          bgImg: '',
          memberType: 1,
          publishCount: 0,
          followCount: 0,
          fansCount: 0,
        }
      })
      .addCase(fetchRegister.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '网络错误'
      })
      //+ 重置密码
      .addCase(fetchResetPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchResetPassword.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(fetchResetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '网络错误'
      })
      //+ 获取用户信息
      .addCase(getUserInfo.pending, (state) => {
        state.loading = true
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.loading = false
        //+ /member/info 只返回 { id, nickname, avatar, role }，需 merge 到现有 userInfo
        //+ 保留已有字段（bio/bgImg/计数等），仅用最新 avatar/nickname 覆盖
        //+ role 映射到 memberType：领队=2，普通会员=1
        const member = action.payload
        const memberType = member.role === '领队' ? 2 : 1
        state.userInfo = {
          ...(state.userInfo || ({} as UserInfo)),
          id: member.id ?? state.userInfo?.id ?? '',
          phone: state.userInfo?.phone ?? '',
          nickname: member.nickname ?? state.userInfo?.nickname ?? '',
          avatar: member.avatar ?? state.userInfo?.avatar ?? '',
          bio: state.userInfo?.bio ?? '',
          bgImg: state.userInfo?.bgImg ?? '',
          memberType: state.userInfo?.memberType ?? memberType,
          publishCount: state.userInfo?.publishCount ?? 0,
          followCount: state.userInfo?.followCount ?? 0,
          fansCount: state.userInfo?.fansCount ?? 0,
        }
        state.isLoggedIn = true
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '网络错误'
      })
      //+ 退出登录：无论成功/失败都清理本地状态（token + userInfo）
      .addCase(fetchLogout.fulfilled, (state) => {
        state.userInfo = null
        state.isLoggedIn = false
        clearToken()
      })
      .addCase(fetchLogout.rejected, (state) => {
        state.userInfo = null
        state.isLoggedIn = false
        clearToken()
      })
      //+ 关注/取消关注：按 userId 粒度的 loading 控制（防狂点，供页面层按钮置灰读取）
      .addCase(toggleFollow.pending, (state, action) => {
        const userId = action.meta.arg
        state.followLoadingMap = { ...state.followLoadingMap, [userId]: true }
      })
      .addCase(toggleFollow.fulfilled, (state, action) => {
        const userId = action.payload.userId
        const m = { ...state.followLoadingMap }
        delete m[userId]
        state.followLoadingMap = m
      })
      .addCase(toggleFollow.rejected, (state, action) => {
        const userId = action.meta.arg
        const m = { ...state.followLoadingMap }
        delete m[userId]
        state.followLoadingMap = m
      })
  }
})

//+ 导出Action
export const { logout, updateUserInfo, setLoggedIn } = userSlice.actions

//+ 导出Reducer
export default userSlice.reducer
