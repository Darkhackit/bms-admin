import { ref } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
    const socket = ref(null)
    const listeners = {}
    let reconnectAttempts = 0
    let reconnectTimeout = null

    const connect = () => {
        if (socket.value) return

        socket.value = new WebSocket('ws://localhost:8000/a/api/ws')

        socket.value.onopen = () => {
            console.log('✅ WebSocket connected!')
            reconnectAttempts = 0
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout)
                reconnectTimeout = null
            }
        }

        socket.value.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                const eventName = message.event
                const eventData = message.data

                if (listeners[eventName]) {
                    listeners[eventName].forEach(callback => callback(eventData))
                }
            } catch (e) {
                console.error('❌ Failed to parse WebSocket message', e)
            }
        }

        socket.value.onclose = () => {
            console.warn('⚠️ WebSocket disconnected.')
            socket.value = null
            attemptReconnect()
        }

        socket.value.onerror = (error) => {
            console.error('❌ WebSocket error:', error)
            socket.value?.close()
        }
    }

    const attemptReconnect = () => {
        reconnectAttempts++

        if (reconnectAttempts > 10) {
            console.error('❌ Max reconnect attempts reached. Giving up.')
            return
        }

        const delay = Math.min(3000 * reconnectAttempts, 30000)
        console.log(`🔄 Trying to reconnect in ${delay / 1000} seconds...`)

        reconnectTimeout = setTimeout(() => {
            connect()
        }, delay)
    }

    const send = (eventName, data) => {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
            socket.value.send(JSON.stringify({ event: eventName, data }))
        }
    }

    const on = (eventName, callback) => {
        if (!listeners[eventName]) {
            listeners[eventName] = []
        }
        listeners[eventName].push(callback)
    }

    const off = (eventName, callback) => {
        if (listeners[eventName]) {
            listeners[eventName] = listeners[eventName].filter(cb => cb !== callback)
        }
    }

    const disconnect = () => {
        if (socket.value) {
            socket.value.close()
            socket.value = null
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
        }
    }

    connect()

    // 👉 Inject into Nuxt app
    nuxtApp.provide('ws', {
        connect,
        send,
        disconnect,
        on,
        off,
        socket
    })
})
