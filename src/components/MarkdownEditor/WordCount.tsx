import type { CSSProperties } from 'react'

export interface WordCountProps {
  chars: number
  maxChars?: number
  lines: number
}

function WordCount({ chars, maxChars, lines }: WordCountProps) {
  const showMax = typeof maxChars === 'number' && maxChars > 0
  const ratio = showMax ? chars / (maxChars as number) : 0
  const color = ratio >= 1 ? '#c7254e' : ratio >= 0.9 ? '#d97706' : '#a3abc0'
  const colorStyle: CSSProperties = { color }
  return (
    <div className='md-wordcount' style={colorStyle}>
      {showMax ? `${chars} / ${maxChars} 字` : `${chars} 字`}
      <span style={{ marginLeft: '8px' }}>· {lines} 行</span>
    </div>
  )
}

export default WordCount
