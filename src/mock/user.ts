//+ 用户模块Mock数据和路由
import { randomInt, randomItem, successResponse, errorResponse } from './utils'

//+ 昵称前缀和后缀
const nicknamePrefixes = ['山林', '徒步', '露营', '骑行', '登山', '跑步', '攀岩', '溯溪', '自驾', '背包']
const nicknameSuffixes = ['旅人', '达人', '爱好者', '行者', '游侠', '发烧友', '玩家', '探索者', '冒险家', '挑战者']

//+ 用户签名
const userBios = [
  '热爱户外，享受自然',
  '每周一山，挑战自我',
  '用脚步丈量世界',
  '户外摄影爱好者',
  '徒步是一种生活方式',
  '露营达人，走遍全国',
  '骑行环游中国',
  '登山爱好者，挑战高峰',
  '跑步是我的日常',
  '攀岩让我更坚强'
]

//+ 生成50个用户
export const mockUsers = Array.from({ length: 50 }, (_, i) => {
  const id = i + 1
  const prefix = randomItem(nicknamePrefixes)
  const suffix = randomItem(nicknameSuffixes)
  const noteCount = randomInt(1, 10)
  const guideCount = randomInt(1, 10)

  return {
    id: String(id),
    phone: `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999))}`,
    nickname: `${prefix}${suffix}`,
    avatar: `https://picsum.photos/seed/avatar${id}/100/100`,
    bio: randomItem(userBios),
    bgImg: '',
    memberType: randomInt(1, 3),
    publishCount: noteCount + guideCount,
    followCount: randomInt(10, 500),
    fansCount: randomInt(10, 1000)
  }
})

//+ 存储已发送的验证码，key=phone，value={code, scene, expires, verified}
const codeStore: Record<string, { code: string; scene: string; expires: number; verified: boolean }> = {}

//+ 生成6位数字验证码
function generateCode(): string {
  return String(randomInt(100000, 999999))
}

//+ Mock路由映射：用户模块
export const userMockRoutes: Record<string, (data?: any, url?: string) => any> = {
  //+ 健康检查
  'GET /api/v1/health': () => successResponse({}),

  //+ ========== 认证模块 ==========

  //+ 发送验证码
  'POST /api/v1/auth/send-code': (data) => {
    const { phone, scene } = data || {}
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return errorResponse('手机号格式无效', 400)
    }
    if (!['register', 'login', 'reset-password'].includes(scene)) {
      return errorResponse('scene 参数不合法', 400)
    }

    //+ 检查频率限制：60秒内不可重复发送
    const existing = codeStore[phone]
    if (existing && Date.now() - existing.expires < 4 * 60 * 1000) {
      //+ 5分钟有效期 - 1分钟 = 剩余4分钟内不可重发
      return errorResponse('发送频率超限，请60秒后重试', 429)
    }

    const code = generateCode()
    codeStore[phone] = {
      code,
      scene,
      expires: Date.now() + 5 * 60 * 1000, //+ 5分钟有效期
      verified: false
    }

    console.log(`[Mock] 验证码已发送 → phone: ${phone}, code: ${code}, scene: ${scene}`)
    return successResponse({ message: '验证码已发送' })
  },

  //+ 用户登录（密码登录 + 验证码登录）
  'POST /api/v1/auth/login': (data) => {
    const { phone, password, code, type } = data || {}
    const user = mockUsers.find(u => u.phone === phone)

    //+ 验证码登录
    if (type === 'code') {
      if (!phone || !code) {
        return errorResponse('请填写手机号和验证码')
      }
      const stored = codeStore[phone]
      if (!stored || stored.code !== code) {
        return errorResponse('验证码错误')
      }
      if (Date.now() > stored.expires) {
        return errorResponse('验证码已过期')
      }
      if (stored.scene !== 'login') {
        return errorResponse('验证码场景不匹配')
      }
      //+ 验证成功后标记已使用
      stored.verified = true
      if (!user) {
        return errorResponse('手机号未注册，请先前往注册', 400)
      }
      return successResponse({
        token: 'mock-jwt-token-' + Date.now(),
        member: {
          id: user.id,
          nickname: user.nickname,
          phone: user.phone,
          avatar: user.avatar
        }
      })
    }

    //+ 密码登录（默认）
    if (user && data?.password) {
      return successResponse({
        token: 'mock-jwt-token-' + Date.now(),
        member: {
          id: user.id,
          nickname: user.nickname,
          phone: user.phone,
          avatar: user.avatar
        }
      })
    }
    return errorResponse('手机号或密码错误')
  },

  //+ 用户注册
  'POST /api/v1/auth/register': (data) => {
    const { phone, code, nickname, password, confirmPassword } = data || {}

    if (!phone || !code || !nickname || !password || !confirmPassword) {
      return errorResponse('注册信息不完整')
    }
    if (password !== confirmPassword) {
      return errorResponse('两次输入的密码不一致')
    }

    //+ 验证码校验
    const stored = codeStore[phone]
    if (!stored || stored.code !== code) {
      return errorResponse('验证码错误')
    }
    if (Date.now() > stored.expires) {
      return errorResponse('验证码已过期')
    }
    if (stored.scene !== 'register') {
      return errorResponse('验证码场景不匹配')
    }
    stored.verified = true

    //+ 检查手机号是否已注册
    if (mockUsers.find(u => u.phone === phone)) {
      return errorResponse('该手机号已注册')
    }

    const newUser = {
      id: String(mockUsers.length + 1),
      phone,
      nickname,
      avatar: '',
      bio: '',
      bgImg: '',
      memberType: 2,
      publishCount: 0,
      followCount: 0,
      fansCount: 0
    }
    mockUsers.push(newUser)
    return successResponse({
      token: 'mock-jwt-token-' + Date.now(),
      member: {
        id: newUser.id,
        nickname: newUser.nickname,
        phone: newUser.phone,
        avatar: newUser.avatar
      }
    })
  },

  //+ 重置密码
  'POST /api/v1/auth/reset-password': (data) => {
    const { phone, code, newPassword, confirmPassword } = data || {}

    if (!phone || !code || !newPassword || !confirmPassword) {
      return errorResponse('请填写完整信息')
    }
    if (newPassword !== confirmPassword) {
      return errorResponse('两次输入的密码不一致')
    }

    const user = mockUsers.find(u => u.phone === phone)
    if (!user) {
      return errorResponse('该手机号未注册')
    }

    //+ 验证码校验
    const stored = codeStore[phone]
    if (!stored || stored.code !== code) {
      return errorResponse('验证码错误')
    }
    if (Date.now() > stored.expires) {
      return errorResponse('验证码已过期')
    }
    if (stored.scene !== 'reset-password') {
      return errorResponse('验证码场景不匹配')
    }
    stored.verified = true

    return successResponse({ message: '密码重置成功' })
  },

  //+ ========== 用户模块 ==========

  //+ 获取当前用户信息
  'GET /api/v1/user/profile': () => successResponse(mockUsers[0]),

  //+ 更新用户资料
  'PUT /api/v1/user/profile': (data) => ({
    code: 0,
    message: '成功',
    data: {
      ...mockUsers[0],
      ...data
    }
  }),

  //+ 更新用户设置
  'PUT /api/v1/user/settings': () => successResponse({}),

  //+ 获取指定用户公开资料
  'GET /api/v1/users/:userId': (_, url) => {
    const userId = (url as string).split('/').pop() || '1'
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      return successResponse({
        ...user,
        isFollowed: false
      })
    }
    return errorResponse('用户不存在')
  }
}