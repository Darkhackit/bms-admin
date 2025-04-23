import {defineStore} from "pinia";

export const usePermissionStore = defineStore("permissions", () => {
    const permissions = ref([])

    const addPermission = async (permission) => {
            await api.post("/permissions", permission)
    }

    return {addPermission, permissions};
})