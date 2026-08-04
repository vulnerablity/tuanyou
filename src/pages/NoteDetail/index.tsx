import HeaderNavBar from '@/components/HeaderNavBar'
import DetailBanner from '@/components/DetailBanner'
import DetailInfo from '@/components/DetailInfo'
import CommentInput from '@/components/CommentInput'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { fetchNoteDetail } from '@/store/modules/note'
const NoteDetail = () => {

    const dispatch: AppDispatch = useDispatch()

    //获取笔记详情
    const {noteDetail} = useSelector((state: RootState) => state.note)
    
    const isVideo=noteDetail?.videoUrl? true:false

    useEffect(() => {
      // 从路由参数获取笔记ID和类型
      const router = Taro.getCurrentInstance().router
      const id = router?.params?.id || ''
      const type = router?.params?.type || 'note'
      if (id) {
        dispatch(fetchNoteDetail({id, type}))
      }
    }, [dispatch])

  return (
    <div className='note-detail-container'>
      {/* 顶部标题和返回箭头 */}
      <HeaderNavBar title='详情' backPageNum={1} more={true}/>

      {/* 轮播图 */}
      {isVideo? <DetailBanner type={noteDetail?.type || 'note'} videoUrl={noteDetail?.videoUrl} />: <DetailBanner type={noteDetail?.type || 'note'} images={noteDetail?.images} />      }
      {/* 笔记详情 */}
      <DetailInfo props={{noteDetail}} />
      {/* 评论 */}
      <CommentInput />
    </div>
  )
}

export default NoteDetail
