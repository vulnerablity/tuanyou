import { request, get, post, put, del, apiGet, apiPost, apiPut, apiDelete, apiPatch, ApiError, unwrap } from './request'
import { setToken, getToken, clearToken } from './token'

export {
    request,
    get,
    post,
    put,
    del,
    setToken,
    getToken,
    clearToken,
    //+ 解包封装：成功返回 data，业务错误抛 ApiError
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    apiPatch,
    ApiError,
    unwrap
}
