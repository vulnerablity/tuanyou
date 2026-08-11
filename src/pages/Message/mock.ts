//+ 消息页面静态 Mock 数据
//+ 后期接入链路时，此文件可删除或迁移到 src/mock/message.ts
import type { InteractionMessage, SystemMessage } from '@/types/entity'

//+ 互动消息 Mock（含点赞/收藏/关注/评论四种类型）
export const interactionMockData: InteractionMessage[] = [
  {
    id: 'm1',
    type: 'like',
    member: { id: 'u1', nickname: '跑步酱', avatar: 'https://picsum.photos/seed/u1/80/80' },
    content: '攒了你的笔记',
    targetTitle: '千岛湖环线骑行攻略',
    createdAt: '2026-08-11 09:30:00',
    read: false,
    replyCount: 0
  },
  {
    id: 'm2',
    type: 'favorite',
    member: { id: 'u2', nickname: '山林旅人', avatar: 'https://picsum.photos/seed/u2/80/80' },
    content: '收藏了你的攻略',
    targetTitle: '青海湖自驾三日游详细路线',
    createdAt: '2026-08-11 08:15:00',
    read: false,
    replyCount: 0
  },
  {
    id: 'm3',
    type: 'follow',
    member: { id: 'u3', nickname: '露营达人Lisa', avatar: 'https://picsum.photos/seed/u3/80/80' },
    content: '关注了你',
    targetTitle: '',
    createdAt: '2026-08-10 22:00:00',
    read: true,
    replyCount: 0
  },
  {
    id: 'm4',
    type: 'comment',
    member: { id: 'u4', nickname: '骑行发烧友', avatar: 'https://picsum.photos/seed/u4/80/80' },
    content: '这个路线太棒了！请问路上有补给点吗？另外想问下住宿推荐哪里比较好，我们一行5人计划下周出发，有没有什么需要注意的事项？特别是关于车辆租赁和路线选择方面的问题，希望能得到详细解答，非常感谢！',
    targetTitle: '千岛湖环线骑行攻略',
    createdAt: '2026-08-10 18:30:00',
    read: false,
    replyCount: 3,
    replies: [
      { id: 'r1', author: 'me', content: '路上有两个补给点，分别在20km和45km处' },
      { id: 'r2', author: 'ta', content: '好的，谢谢！住宿方面呢？' },
      { id: 'r3', author: 'me', content: '推荐千岛湖镇的民宿，性价比很高' }
    ]
  },
  {
    id: 'm5',
    type: 'comment',
    member: { id: 'u5', nickname: '自驾游侠', avatar: 'https://picsum.photos/seed/u5/80/80' },
    content: '图片拍得真好看！',
    targetTitle: '青海湖日出',
    createdAt: '2026-08-10 14:00:00',
    read: true,
    replyCount: 0,
    replies: []
  },
  {
    id: 'm6',
    type: 'like',
    member: { id: 'u6', nickname: '攀岩玩家', avatar: 'https://picsum.photos/seed/u6/80/80' },
    content: '攒了你的攻略',
    targetTitle: '华山攀岩安全指南',
    createdAt: '2026-08-09 10:00:00',
    read: true,
    replyCount: 0
  }
]

//+ 系统通知 Mock
export const systemMockData: SystemMessage[] = [
  {
    id: 's1',
    type: 'system',
    content: '欢迎使用途游！在这里你可以记录旅途中的点点滴滴，分享你的旅行故事给更多热爱出行的人。如有任何问题，欢迎随时反馈。',
    createdAt: '2026-08-11 10:00:00',
    read: false
  },
  {
    id: 's2',
    type: 'system',
    content: '你的笔记《千岛湖环线骑行攻略》已通过审核，现在其他用户可以看到了。',
    createdAt: '2026-08-10 16:00:00',
    read: false
  },
  {
    id: 's3',
    type: 'system',
    content: '系统将于 2026-08-15 凌晨 2:00-4:00 进行维护升级，届时将无法访问，请提前做好安排。',
    createdAt: '2026-08-09 09:00:00',
    read: true
  },
  {
    id: 's4',
    type: 'system',
    content: '你的账号安全等级已提升。',
    createdAt: '2026-08-08 14:00:00',
    read: true
  }
]
