// import { ref } from 'vue'
//
// const socket = ref(null)
// const messages = ref([])
//
// export const useWebSocket = () => {
//     // Connect function
//     const connect = () => {
//         if (socket.value) return // already connected
//
//         socket.value = new WebSocket('ws://localhost:8000/a/api/ws') // <-- your WebSocket server URL
//
//         socket.value.onopen = () => {
//             console.log('WebSocket connected!')
//         }
//
//         socket.value.onmessage = (event) => {
//             console.log('Received:', event.data)
//             messages.value.push(event.data)
//         }
//
//         socket.value.onclose = () => {
//             console.log('WebSocket disconnected.')
//             socket.value = null
//         }
//
//         socket.value.onerror = (error) => {
//             console.error('WebSocket error:', error)
//         }
//     }
//
//     const send = (message) => {
//         if (socket.value && socket.value.readyState === WebSocket.OPEN) {
//             socket.value.send(message)
//         }
//     }
//
//     const disconnect = () => {
//         if (socket.value) {
//             socket.value.close()
//             socket.value = null
//         }
//     }
//
//     return {
//         connect,
//         send,
//         disconnect,
//         socket,
//         messages,
//     }
// }
