import { UseFetchOptions } from 'nuxt/app'

export const useHttp = () => {
    const defaults= {
        credentials:'include',
        headers:{
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    }

    const get = (url, options) => {
        return $fetch(url,{ ...defaults,...options })
    }
    const post = (url, body ,options) => {
        return $fetch(url,{
            ...defaults,
            ...options ,
            method: 'POST',
            body: JSON.stringify(body),
        }
        )
    }
    return {
        get,
        post
    }
}