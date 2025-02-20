// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000/a/api/', // Fallback URL
    },
  },
  modules: ['@nuxt/ui','nuxt-headlessui','@pinia/nuxt'],
  colorMode: {
    preference: 'light'
  },
  headlessui: {
    prefix: 'Headless'
  }
})
