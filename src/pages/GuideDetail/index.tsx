//+ 攻略详情占位页（非本人负责模块，仅预留 isOwner+more 删除入口框架）
//+ 后续接入攻略详情时，复用 NoteDetail 的模式：
//+   1. useSelector 取 guide 模块详情（state.guide.guideDetail）
//+   2. more={!!detail?.isOwner} onMoreClick={弹出删除ActionSheet}
//+   3. 调用 guide store 的 deleteGuide thunk（已有 apis/guide.ts 的 deleteGuideAPI）
import HeaderNavBar from '@/components/HeaderNavBar'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { Dialog } from '@nutui/nutui-react'
import { deleteGuideAPI } from '@/apis/guide'

const GuideDetail = () => {
  const router = useRouter()
  const id = router.params.id || ''

  //+ 预留：攻略详情数据（后续接 store/modules/guide.ts）
  //+ 占位时 isOwner 默认 true 便于预览删除入口效果
  const [isOwner] = useState<boolean>(true)

  //+ 删除确认弹窗控制
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  //+ 头部 more 点击：弹出 ActionSheet
  const handleMoreClick = useCallback(() => {
    Taro.showActionSheet({
      itemList: ['删除攻略'],
      success: (res) => {
        if (res.tapIndex === 0) setDeleteVisible(true)
      }
    })
  }, [])

  //+ 确认删除攻略（占位：直接调用 deleteGuideAPI，后续改走 store thunk）
  const handleDeleteConfirm = useCallback(async () => {
    if (!id || deleteLoading) return
    setDeleteLoading(true)
    try {
      const res: any = await deleteGuideAPI(id)
      if (res.code === 0 || res.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        setDeleteVisible(false)
        setTimeout(() => {
          Taro.navigateBack({ delta: 1 }).catch(() => {
            Taro.switchTab({ url: '/pages/Home/index' })
          })
        }, 500)
      } else {
        Taro.showToast({ title: res.message || '删除失败', icon: 'none' })
      }
    } catch (err: any) {
      Taro.showToast({ title: err?.message || '删除失败', icon: 'none' })
    } finally {
      setDeleteLoading(false)
    }
  }, [id, deleteLoading])

  return (
    <div>
      <HeaderNavBar
        title='攻略详情'
        backPageNum={1}
        fixed={false}
        more={isOwner}
        onMoreClick={handleMoreClick}
      />
      <h1 style={{ padding: '1rem', textAlign: 'center' }}>攻略详情（开发中）</h1>

      <Dialog
        visible={deleteVisible}
        title='确认删除攻略？'
        content='删除后无法恢复，确定删除该攻略吗？'
        confirmText='删除'
        cancelText='取消'
        confirmLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteVisible(false)}
      />
    </div>
  )
}
export default GuideDetail