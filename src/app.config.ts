export default defineAppConfig({
  pages: [
    //认证界面
    'pages/Login/index',
    'pages/Register/index',
    'pages/ForgotPassword/index',
    // 主界面
    'pages/Home/index',
    'pages/Activity/index',
    'pages/Message/index',
    'pages/Profile/index',
    //发布界面
    'pages/PublishNote/index',
    'pages/PublishGuide/index',
    'pages/PublishActivity/index',
    
    'pages/Logout/index',
    'pages/NoteDetail/index',
    'pages/GuideDetail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '途友',
    navigationBarTextStyle: 'black'
  }
  
})
