import Cookies from "js-cookie";
export const useAuthToken = () => {

    const setToken = (newToken) => {
        Cookies.set("token", newToken);
    }
    const getToken = () => {
      return   Cookies.get("token")
    }
    const removeToken = () => {
        Cookies.remove("token")
    }
    return {
        setToken,
        getToken,
        removeToken,
    }
}