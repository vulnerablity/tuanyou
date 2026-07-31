//taro
import {NavBar} from '@nutui/nutui-react'
import {ArrowLeft,More} from '@nutui/icons-react'
import Taro from '@tarojs/taro'
//样式
import './index.less'



const HeaderNavBar = ({title='详情',backPageNum=1,more=false}: {title?: string,backPageNum?: number,more?: boolean}) => {
  return (
    <NavBar 
      className='header-nav-bar'
      back={<ArrowLeft className='arrow-left' />}
      right={more ? <More onClick={()=>{}}/> : null}
      fixed={true}
      onBackClick={() => Taro.navigateBack({delta:backPageNum})}
      title={title}

    />
  )
}

export default HeaderNavBar