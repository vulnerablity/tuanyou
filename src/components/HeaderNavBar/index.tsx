//taro
import {NavBar} from '@nutui/nutui-react'
import {ArrowLeft,More} from '@nutui/icons-react'
import Taro from '@tarojs/taro'
//样式
import './index.less'



const HeaderNavBar = ({title='详情',backPageNum=1,more=false,fallbackUrl='/pages/Home/index'}: {title?: string,backPageNum?: number,more?: boolean,fallbackUrl?: string}) => {

  // 健壮的返回逻辑：navigateBack 失败时降级到浏览器 history，再失败则跳转首页
  const handleBack = () => {
    // 1. 优先使用 Taro navigateBack（依赖 Taro 页面栈，刷新后会失效）
    try {
      const currentPages = Taro.getCurrentPages()
      if (currentPages.length > backPageNum) {
        Taro.navigateBack({ delta: backPageNum })
        return
      }
    } catch (e) {
      console.warn('Taro.navigateBack 失败，尝试浏览器 history', e)
    }

    // 2. 降级：浏览器 history（刷新后仍保留，只要不是直接通过 URL 打开）
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
      return
    }

    // 3. 兜底：没有任何历史记录（直接通过 URL 打开），跳转到首页
    Taro.redirectTo({ url: fallbackUrl })
  }

  return (
    <NavBar
      className='header-nav-bar'
      back={<ArrowLeft className='arrow-left' />}
      right={more ? <More onClick={()=>{}}/> : null}
      fixed={true}
      onBackClick={handleBack}
      title={title}

    />
  )
}

export default HeaderNavBar