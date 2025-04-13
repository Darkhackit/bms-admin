import NProgress from 'nprogress'
import 'nprogress/nprogress.css' // Import the styles

export default defineNuxtPlugin((nuxtApp) => {
    // Start the loading bar before navigating to a route
    nuxtApp.hook('page:start', () => {
        NProgress.start()
    })

    // Stop the loading bar when navigation finishes
    nuxtApp.hook('page:finish', () => {
        NProgress.done()
    })
})