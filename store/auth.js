// stores/auth.ts
import { defineStore } from 'pinia';
import api from "~/utils/api.js";
import { useNuxtApp } from "#app";
import { defineAbilitiesFor } from '~/utils/ability'; // Import CASL function

export const useAuthStore = defineStore('auth', () => {
    const isAuthenticated = useState('isAuthenticated', () => false);
    const user = useState('user', () => null);
    const isLoading = useState('isLoading', () => true);
    const isAuthChecked = useState('isAuthChecked', () => false);

    const checkAuth = async () => {
        if (process.server) return
        if (isAuthenticated.value) return; // Skip if already checked

        isLoading.value = true;
        try {
            const response = await api.get('/me');
            isAuthenticated.value = true;
            user.value = response.data;

            updateAbility(user.value?.permissions || []);
        } catch (e) {
            console.error(e);
            isAuthenticated.value = false;
            user.value = null;
        } finally {
            isLoading.value = false;
            isAuthChecked.value = true;
        }
    };
    // ✅ Function to update CASL ability
    const updateAbility = (permissions) => {
        const { $ability } = useNuxtApp(); // Get CASL instance
        const newAbility = defineAbilitiesFor(permissions);
        $ability.update(newAbility.rules); // Update rules dynamically
    };

    return { user, isAuthenticated, isLoading, checkAuth, isAuthChecked,updateAbility };
});