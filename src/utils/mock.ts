// src/utils/mock.ts
export const mockUsers = [
  { id: 1, phone: '13800138000', nickname: '山林旅人', avatar: '', bio: '热爱徒步', memberType: 2 }
]

export const mockNotes = [
  { id: 1, type: 'note', title: '周末骑行千岛湖环线', coverImg: '', content: '正文...', viewCount: 1024 }
]
// src/utils/mock.ts
export const mockRoutes: Record<string, () => any> = {
  '/api/v1/auth/login': () => ({
    code: 0,
    message: '成功',
    data: { token: 'mock-token', user: mockUsers[0] }
  }),
  '/api/v1/user/profile': () => ({
    code: 0,
    message: '成功',
    data: mockUsers[0]
  })
}