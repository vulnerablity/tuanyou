//+ 路由鉴权钩子
//+ 用法：在需要登录的页面组件顶部调用 useAuthGuard() 即可
//+ 登录 / 注册 / 忘记密码 等页面不调用此钩子，自然不受保护
import { useDidShow } from '@tarojs/taro'
import { isAuthenticated, getCurrentPageFullPath, goToLogin } from '@/router'

//+ 页面级鉴权钩子
//+ 每次 useDidShow（页面显示）时检查 token：
//+   - 已登录 → 放行
//+   - 未登录 → 保存当前路径并 redirectTo 登录页，登录后 goAfterLogin 自动回跳
export function useAuthGuard(): void {
  useDidShow(() => {
    if (!isAuthenticated()) {
      const fullPath = getCurrentPageFullPath()
      goToLogin(fullPath)
    }
  })
}
