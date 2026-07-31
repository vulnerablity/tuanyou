import Avatar from '../Avatar'
import Button from '../Button'
import './index.less'

const DetailInfo=({props}:{props:any})=>{
    const {noteDetail} = props
    const {title, content, type,avatar,author,publishTime,isFollowed,tags} = noteDetail || {}
    
    return (
        <div className="detail-info">
            {/* 标题 */}
            <p className="info-title">
                {title}
            </p>
            {/* 头像+昵称+时间+关注 */}
            <div className="info-header">
                
                <div className="info-header-left">
                    {/* 头像 */}
                    <Avatar url={avatar} size="small"  />
                <div className="info-header-left-content">
                    {/* 昵称 */}
                    <span className="nickname">{author?.nickname || ''}</span>
                    {/* 时间 */}
                    <span className="publish-time">{publishTime?.split('T')[0] || ''}</span>
                </div>
                </div>
                {/* 关注 */}
                <Button content={isFollowed ? '已关注' : '+ 关注'} onClick={()=>{}} isFollowed={isFollowed}></Button>
            </div>
            {/* 内容 */}
            <p className="info-content">
                {content}
            </p>
            {/* 标签 */}
            <div className="info-tags">
                {tags?.map((tag:string)=>(
                    <span key={tag} className="tag" onClick={()=>{}}><span className="tag-icon">#</span>{tag}</span>
                ))}
            </div>
        </div>
    )
}

export default DetailInfo