//taro
import { Swiper } from '@nutui/nutui-react'

import './index.less'
interface DetailBannerProps {
    loop?: boolean
    indicator?: boolean
    autoplay?: number
    touchable?: boolean
    type?: string
    videoUrl?: string
    images?: string[]
}
const DetailBanner = (props: DetailBannerProps) => {
  let {loop=true,indicator=true,autoplay=3000,touchable=true,type,videoUrl,images}=props
  if(type==='视频'||images?.length===1){
    indicator=false
  }
  return (
    <Swiper
        loop={loop}
        indicator={indicator}
        autoplay={autoplay}
        touchable={touchable}
    >
     
    </Swiper>
  )
}
export default DetailBanner