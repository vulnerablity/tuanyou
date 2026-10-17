//+ 消息时间格式化（统一入口，避免在各组件写分散逻辑）
//+ 展示规则：
//+   同一天内：HH:mm，如 19:56
//+   同一年不同天：MM-DD H:mm，如 8-11 7:45
//+   不同年：YYYY-MM-DD H:mm，如 2025-08-07 8:02
//+ 输入兼容："YYYY-MM-DD HH:mm:ss" 字符串、10 位秒、13 位毫秒时间戳
//+ 时区说明：不补 Z、不强制 UTC，按本地时区解析（后端返回的本地时间）

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

const isInvalidTs = (ts: number) => typeof ts !== 'number' || !Number.isFinite(ts) || Number.isNaN(ts)

export function formatMessageTime(raw: string | number): string {
  // ========== 解析 ==========
  let timestamp: number
  if (typeof raw === 'number') {
    timestamp = raw < 10000000000 ? raw * 1000 : raw
  } else {
    //+ 兼容后端返回 "YYYY-MM-DD HH:mm:ss" 格式，按本地时间解析
    const dateStr = raw.replace(/-/g, '/')
    timestamp = new Date(dateStr).getTime()
    if (isInvalidTs(timestamp)) {
      const isoTs = new Date(raw).getTime()
      timestamp = !isInvalidTs(isoTs) ? isoTs : Date.now()
    }
  }
  if (isInvalidTs(timestamp)) return ''

  const target = new Date(timestamp)
  const now = new Date()

  const tarY = target.getFullYear()
  const tarM = target.getMonth()
  const tarD = target.getDate()
  const tarHH = pad2(target.getHours())
  const tarMM = pad2(target.getMinutes())
  const tarHShort = String(target.getHours())

  const nowY = now.getFullYear()
  const nowM = now.getMonth()
  const nowD = now.getDate()

  //+ 同一天内：HH:mm
  if (tarY === nowY && tarM === nowM && tarD === nowD) {
    return `${tarHH}:${tarMM}`
  }

  //+ 不同年：YYYY-MM-DD H:mm
  if (tarY !== nowY) {
    return `${tarY}-${pad2(tarM + 1)}-${pad2(tarD)} ${tarHShort}:${tarMM}`
  }

  //+ 同年不同天：M-D H:mm（去掉前导零）
  return `${tarM + 1}-${tarD} ${tarHShort}:${tarMM}`
}
