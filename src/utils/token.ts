import Taro from '@tarojs/taro'

//Token管理工具，封装本地存储操作
class TokenManager{
    private readonly TOKEN_KEY = 'tuyou-token'
    private readonly USER_INFO_KEY='tuyou-user-info'
    //获取Token
    getToken():string|null{
        try{
            return Taro.getStorageSync(this.TOKEN_KEY)
        }catch(error){
            console.error('获取token失败：',error)
            return null
        }
    }
    //设置token
    setToken(token:string):void{
        try{
            Taro.setStorageSync(this.TOKEN_KEY,token)
        }catch(error){
            console.error('设置token失败：',error)
        }
    }
    //清除token
    clearToken():void{
        try{
            Taro.removeStorageSync(this.TOKEN_KEY)
        }catch(error){
            console.error('清除Token失败：',error)
        }
    }
    //获取用户信息
    getUserInfo<T>():T|null{
        try{
            const userInfo=Taro.getStorageSync(this.USER_INFO_KEY)
            return userInfo ? JSON.parse(userInfo):null
        }catch(error){
            console.error('获取用户信息失败：',error)
            return null
        }
    }
    //设置用户信息
    setUserInfo<T>(userInfo:T):void{
        try{
            Taro.setStorageSync(this.USER_INFO_KEY,JSON.stringify(userInfo))
        }catch(error){
            console.error('设置用户信息失败：',error)
        }
    }
    //清除用户信息
    clearUserInfo():void{
        try{
            Taro.removeStorageSync(this.USER_INFO_KEY)
        }catch(error){
            console.error('清除用户信息失败：',error)
        }
    }
    //退出登录，清除所有信息
    logout():void{
        this.clearToken()
        this.clearUserInfo()
    }
    //判断是否一登录
    isLoggedIn():boolean{
        const token=this.getToken()
        return token !== null && token !== undefined && token !== ''
    }
}
export const tokenManager=new TokenManager()