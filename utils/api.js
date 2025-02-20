import axios from "axios";


const api = axios.create({
    baseURL: 'http://localhost:8000/a/api',
    withCredentials: true
})

const requestHandler = request => {
    return request
}

const responseHandler = response => {
    return response
}

const errorHandler = error => {

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


