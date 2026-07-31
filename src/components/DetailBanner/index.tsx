// taro
import { Swiper, Cell, ConfigProvider, Indicator, SwiperItem, Image, Video } from '@nutui/nutui-react'
// React
import { useState, useMemo } from 'react'
import './index.less'

interface DetailBannerProps {
    loop?: boolean
    touchable?: boolean
    type?: string  // '活动' | '笔记' | '攻略'
    videoUrl?: string
    images?: string[]
}

// 指示器样式
const indicatorTheme = {
  nutuiIndicatorDotSize: '7px',
  nutuiIndicatorDotActiveSize: '7px',
}

const DetailBanner = (props: DetailBannerProps) => {
  const { loop = false, touchable = true, type, videoUrl, images = [] } = props
  const [currentIndicatorIndex, setCurrentIndicatorIndex] = useState(0)

  // 构建轮播数据
  const contentItems = useMemo(() => {
    // 活动：一张图片
    if (type === '活动') {
      return images.length > 0 ? [{ type: 'image' as const, url: images[0] }] : []
    }

    // 笔记或攻略：视频优先，没有视频则显示图片
    if (type === '笔记' || type === '攻略') {
      if (videoUrl) {
        return [{ type: 'video' as const, url: videoUrl }]
      }
      return images.map(url => ({ type: 'image' as const, url }))
    }

    return []
  }, [type, videoUrl, images])

  // 是否显示指示器：只有多张图片时才显示
  const showIndicator = contentItems.length > 1 && contentItems[0]?.type === 'image'

  // 无内容
  if (contentItems.length === 0) {
    return <div className="banner-empty">暂无内容</div>
  }

  // 单个视频或单张图片：直接返回，不使用 Swiper
  if (contentItems.length === 1) {
    const item = contentItems[0]
    return item.type === 'video' ? (
      <Video src={item.url} autoPlay loop muted className="banner-video" />
    ) : (
      <Image src={item.url} className="banner-single-image" />
    )
  }

  // 多张图片：使用 Swiper 轮播
  return (
    <Swiper
      loop={loop}
      indicator={
        <Cell className="banner-indicator">
          <ConfigProvider theme={indicatorTheme}>
            <Indicator total={contentItems.length} current={currentIndicatorIndex} />
          </ConfigProvider>
        </Cell>
      }
      touchable={touchable}
      onChange={(index) => setCurrentIndicatorIndex(index)}
    >
      {contentItems.map((item, index) => (
        <SwiperItem key={`${item.url}-${index}`}>
          <Image src={item.url} className="banner-image" />
        </SwiperItem>
      ))}
    </Swiper>
  )
}

export default DetailBanner