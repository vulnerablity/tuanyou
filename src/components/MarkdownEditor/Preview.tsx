import Taro from '@tarojs/taro'
import { RichText } from '@tarojs/components'
import { useMarkdownRender } from '@/hooks/useMarkdownRender'

export interface PreviewViewProps {
  value: string
  minHeight?: string | number
}

const isWeb = Taro.getEnv() === Taro.ENV_TYPE.WEB

function PreviewView({ value, minHeight }: PreviewViewProps) {
  const html = useMarkdownRender(value)
  const h = (() => {
    if (typeof minHeight === 'number') return `${minHeight}px`
    if (typeof minHeight === 'string' && minHeight) return minHeight
    return '320px'
  })()

  if (isWeb) {
    return (
      <div
        className='md-preview'
        style={{ minHeight: h, padding: '12px 16px' }}
        // eslint-disable-next-line react/no-danger -- html 经 useMarkdownRender 渲染并消毒，markdown 预览必须注入 HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  // 小程序端用 Taro RichText（内部即 <rich-text nodes={html}>）
  return (
    <div className='md-preview' style={{ minHeight: h, padding: '12px 16px' }}>
      <RichText nodes={html} />
    </div>
  )
}

export default PreviewView
