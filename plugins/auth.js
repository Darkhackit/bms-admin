import { useAuthStore } from "~/store/auth.js"
import { useState, defineNuxtPlugin } from 'nuxt/app'
import { useRouter } from 'vue-router'
import { Ability } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue' // ✅ Import CASL Vue plugin
import { defineAbilitiesFor } from '~/utils/ability'

export default defineNuxtPlugin(async (nuxtApp) => {
    const router = useRouter()
    const previousRoute = useState('previousRoute', () => null)
    const authStore = useAuthStore()

    // ✅ Create CASL ability instance
    const ability = new Ability()

    // ✅ Register abilitiesPlugin (fixes v-can issue)
    nuxtApp.vueApp.use(abilitiesPlugin, ability, {
        useGlobalProperties: true // Allows `v-can` globally
    })

    // ✅ Provide CASL ability globally
    nuxtApp.provide('ability', ability)

    // Fetch user data and permissions after app mounts
    nuxtApp.hook("app:mounted", async () => {
        await authStore.checkAuth()

        // Fetch permissions from auth store or API
        const permissions = authStore.user?.permissions || []

        // ✅ Update ability dynamically with fetched permissions
        const newAbility = defineAbilitiesFor(permissions)
        ability.update(newAbility.rules)
    })

    // Track previous route
    router.beforeEach((to, from) => {
        previousRoute.value = from.name
    })
})
