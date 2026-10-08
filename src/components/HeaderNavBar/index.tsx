//+ 通用顶部导航栏：返回 / 标题 / 更多按钮，附"取消编辑"二次确认弹窗
//+ 返回策略（健壮降级）：
//+   1. 优先 Taro 页面栈 navigateBack（依赖页面栈，刷新后失效）
//+   2. 降级浏览器 history.back()（刷新后仍保留，只要不是直接通过 URL 打开）
//+   3. 兜底 routerRedirectTo(fallbackUrl)，避免白屏无路可退
import { NavBar, Dialog } from '@nutui/nutui-react'
import { ArrowLeft, More } from '@nutui/icons-react'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { routerNavigateBack, routerRedirectTo } from '@/router'
import type { RouteKey } from '@/router'
//+ 样式
import './index.less'

interface HeaderNavBarProps {
  //+ 标题文案
  title?: string
  //+ 返回时回退的页面栈层数
  backPageNum?: number
  //+ 是否展示右侧"更多"按钮
  more?: boolean
  //+ 无历史记录时兜底跳转的路由键（默认首页；历史调用点均使用默认值，保持 prop 名不变）
  fallbackUrl?: RouteKey
  //+ NavBar 是否 fixed 定位
  fixed?: boolean
  //+ 是否为"取消编辑"场景：返回前弹确认框
  cancel?: boolean
  //+ 点击"更多"回调；不传时默认 Toast"更多功能开发中"
  onMoreClick?: () => void
}

const HeaderNavBar = ({
  title = '详情',
  backPageNum = 1,
  more = false,
  fallbackUrl = 'HOME',
  fixed = true,
  cancel = false,
  onMoreClick,
}: HeaderNavBarProps) => {
  //+ 取消按钮的确认弹窗
  const [dialogVisible, setDialogVisible] = useState(false)

  //+ 健壮的返回逻辑：navigateBack 失败时降级到浏览器 history，再失败则跳转首页
  const handleBack = () => {
    //+ 1. 优先 Taro navigateBack（依赖 Taro 页面栈，刷新后会失效）
    try {
      const currentPages = Taro.getCurrentPages()
      if (currentPages.length > backPageNum) {
        void routerNavigateBack(backPageNum)
        return
      }
    } catch (e) {
      console.warn('Taro.navigateBack 失败，尝试浏览器 history', e)
    }

    //+ 2. 降级：浏览器 history（刷新后仍保留，只要不是直接通过 URL 打开）
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
      return
    }

    //+ 3. 兜底：没有任何历史记录（直接通过 URL 打开），跳转到默认兜底页
    void routerRedirectTo(fallbackUrl)
  }

  //+ 右侧"更多"按钮：自定义回调优先，否则 Toast 占位
  const handleMoreClick = () => {
    if (onMoreClick) {
      onMoreClick()
    } else {
      Taro.showToast({ title: '更多功能开发中', icon: 'none' })
    }
  }

  return (
    <>
      <NavBar
        className='header-nav-bar'
        back={
          <div
            onClick={() => setDialogVisible(true)}
            className='back-btn'
          >
            <ArrowLeft className='arrow-left' />
            {cancel ? '取消' : ''}
          </div>
        }
        right={more ? <More onClick={handleMoreClick} /> : null}
        fixed={fixed}
        onBackClick={cancel ? () => undefined : handleBack}
        title={title}
      />
      {cancel && (
        <Dialog
          visible={dialogVisible}
          title='确认取消编辑吗？'
          confirmText='确认'
          cancelText='取消'
          onCancel={() => setDialogVisible(false)}
          onConfirm={handleBack}
        />
      )}
    </>
  )
}

export default HeaderNavBar
