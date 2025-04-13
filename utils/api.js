import axios from "axios";
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

const api = axios.create({
    baseURL: 'http://localhost:8000/a/api',
    withCredentials: true
})

const requestHandler = request => {
    NProgress.start()
    return request
}

const responseHandler = response => {
    NProgress.done()
    return response
}

const errorHandler = error => {
    NProgress.done()
    return Promise.reject(error)
}

api.interceptors.request.use(
    request => requestHandler(request),
    error => errorHandler(error)
)
api.interceptors.response.use(
    response => responseHandler(response),
    error => errorHandler(error)
)

export default api;


