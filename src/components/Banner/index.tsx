//+ Banner轮播组件
//+ 使用home store的slides数据：混合展示笔记/攻略/活动三种类型
//+ 根据 type 字段差异化渲染：
//+   - note/guide：标签 + 标题
//+   - activity：标签 + 标题 + 报名时间 + 参与人数
import { useEffect, useState } from 'react'
import { Swiper, SwiperItem, Indicator, Cell, ConfigProvider } from '@nutui/nutui-react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store'
import { fetchSlides } from '@/store/modules/home'
import { routerNavigateTo } from '@/router'
import type { RouteKey } from '@/router'
import Tag from '@/components/Tag'
import type { SlideItem } from '@/types'
import dayjs from 'dayjs'
import logo from '@/assets/logo.png'
import './index.less'

//+ 指示器样式
const indicatorTheme = {
  nutuiIndicatorDotSize: '7px',
  nutuiIndicatorDotActiveSize: '7px',
}

//+ 兜底占位图（后端 cover 域名不可访问时回退，避免控制台刷屏）
const FALLBACK_COVER = logo

//+ 轮播 type → 详情页路由键
const TYPE_ROUTE_MAP: Record<SlideItem['type'], RouteKey> = {
  note: 'NOTE_DETAIL',
  guide: 'GUIDE_DETAIL',
  activity: 'ACTIVITY_DETAIL',
}

//+ 格式化报名时间
function formatSignUpTime(dateStr: string): string {
  if (!dateStr) return ''
  //+ 输入格式: "MM月DD日 HH:mm"，截取日期部分
  return dayjs(dateStr).format('M月D日 HH:mm')
}

//+ 根据type渲染底部信息
function BottomInfo({ item }: { item: SlideItem }) {
  //+ 仅活动类型显示报名时间和参与人数
  if (item.type !== 'activity') {
    return (
      <div className='placeholder-box'>站位</div>
    )
  }

  return (
    <div className='bottom-info'>
      {item.signUpStart && (
        <p className='banner-signup'>
          {formatSignUpTime(item.signUpStart)} 开始报名
        </p>
      )}
      {item.currentPeople !== undefined && item.maxPeople !== undefined && item.maxPeople > 0 && (
        <p className='banner-people'>
          已报名{item.currentPeople}/{item.maxPeople}人
        </p>
      )}
    </div>
  )
}

const Banner = () => {
  const dispatch: AppDispatch = useDispatch()

  //+ 从home store获取slides数据
  const { slides, slidesLoading } = useSelector(
    (state: RootState) => state.home
  )

  //+ 轮播图当前指示器索引
  const [currentIndicatorIndex, setCurrentIndicatorIndex] = useState(0)

  //+ 首次加载slides数据
  useEffect(() => {
    if (slides.length === 0) {
      dispatch(fetchSlides())
    }
  }, [dispatch, slides.length])

  //+ 点击轮播项跳转对应详情页（note→笔记详情，guide→攻略详情，activity→活动详情）
  const handleItemClick = (item: SlideItem) => {
    const routeKey = TYPE_ROUTE_MAP[item.type]
    routerNavigateTo(routeKey, { id: item.id, type: item.type })
  }

  if (slidesLoading) {
    return (
      <div className='banner-container'>
        <div className='banner-loading'>加载中...</div>
      </div>
    )
  }

  if (!slides.length) {
    return null
  }

  return (
    <div className='banner-container'>
      <Swiper
        className='banner-swiper'
        autoPlay={3000}
        loop
        indicator={
          <Cell className='banner-indicator'>
            <ConfigProvider theme={indicatorTheme}>
              <Indicator total={slides.length} current={currentIndicatorIndex} />
            </ConfigProvider>
          </Cell>
        }
        onChange={(index) => {
          setCurrentIndicatorIndex(index)
        }}
      >
        {slides.map((item, index) => (
          <SwiperItem key={`${item.id}-${index}`} className='banner-item' onClick={() => handleItemClick(item)}>
            <div className='banner-content'>
              <div className='banner-bg'>
                <img
                  src={item.cover || FALLBACK_COVER}
                  alt={item.title}
                  className='banner-img'
                  onError={(e) => {
                    //+ 后端返回的 cover 域名不可访问时，回退到本地占位图，避免控制台刷屏 ERR_NAME_NOT_RESOLVED
                    const target = e.currentTarget as HTMLImageElement
                    if (target.src !== FALLBACK_COVER) target.src = FALLBACK_COVER
                  }}
                />
              </div>
              <div className='banner-overlay'></div>
              <div className='banner-info'>
                <div className='top-info'>
                  <Tag tagName={item.tag || ''} className='banner-tag' />
                  <h3 className='banner-title'>{item.title}</h3>
                </div>
                <BottomInfo item={item} />
              </div>
            </div>
          </SwiperItem>
        ))}
      </Swiper>
    </div>
  )
}

export default Banner
