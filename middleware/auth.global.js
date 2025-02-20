// middleware/auth.global.ts
import { useAuthStore } from "~/store/auth.js";

export default defineNuxtRouteMiddleware(async (to, from) => {
    const authStore = useAuthStore();

    // Ensure authentication check is completed before making decisions
    if (process.server) return

    if (!authStore.isAuthChecked) {
        await authStore.checkAuth();
    }
    const publicRoutes = ['auth-login', 'auth-set_new_password','auth-verify','auth-forget_password'];
    // Redirect to login if user is not authenticated
    if (!authStore.isAuthenticated && !publicRoutes.includes(to.name)) {
        return navigateTo('/auth/login');
    }

    // Redirect to home if user is authenticated and visiting login page
    if (authStore.isAuthenticated && publicRoutes.includes(to.name)) {
        return navigateTo('/');
    }
});