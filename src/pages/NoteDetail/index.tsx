import HeaderNavBar from '@/components/HeaderNavBar'
import DetailBanner from '@/components/DetailBanner'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { fetchNoteDetail } from '@/store/modules/note'
const NoteDetail = () => {

    const dispatch: AppDispatch = useDispatch()


    //获取笔记详情
    const {noteDetail} = useSelector((state: RootState) => state.note)
    //无笔记详情时，返回null
    // if (!noteDetail) {
    //   return null
    // }
    const isVideo=noteDetail?.videoUrl? true:false



    useEffect(() => {
      //获取笔记详情的id
      const id=Taro.getStorageSync('id')
      dispatch(fetchNoteDetail({id: id, type: '笔记'}))
    }, [dispatch])
    
    


  return (
    <div>
      {/* 顶部标题和返回箭头 */}
      <HeaderNavBar title='详情' backPageNum={1} more={true}/>
      {/* 笔记详情 */}

      {/* 轮播图 */}
      {isVideo? <DetailBanner type='笔记' videoUrl={noteDetail?.videoUrl} />: <DetailBanner type='笔记' images={noteDetail?.images} />      }
    </div>
  )
}

export default NoteDetail