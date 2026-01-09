import http from 'http'
import moment from 'moment'
import { WebSocketServer } from 'ws'
import { createCollabServer, destroyCollabServer } from './index'

let wss: WebSocketServer | null = null

/**
 * 创建并配置 WebSocket 服务
 * @param httpServer HTTP 服务器实例
 */
export function setupWebSocket(httpServer: http.Server): WebSocketServer {
    // Create WebSocket server (noServer: true, 手动处理upgrade)
    wss = new WebSocketServer({ noServer: true })

    // Create Hocuspocus collab server
    const collabServer = createCollabServer()

    // Handle WebSocket upgrade for /collab path
    httpServer.on('upgrade', (request, socket, head) => {
        try {
            const baseUrl = 'http://' + request.headers.host
            const { pathname } = new URL(request.url ?? '', baseUrl)

            // 只处理 /collab 路径的WebSocket升级
            if (pathname !== '/collab') {
                socket.destroy()
                return
            }

            wss!.handleUpgrade(request, socket, head, (ws) => {
                wss!.emit('connection', ws, request)
            })
        } catch (err) {
            console.error(`[${moment().format('HH:mm:ss')}][ws]: WebSocket upgrade error:`, err)
            socket.destroy()
        }
    })

    // WebSocket connection handler - 交给Hocuspocus处理
    wss.on('connection', (ws, request) => {
        collabServer.handleConnection(ws, request)
    })

    return wss
}

/**
 * 关闭 WebSocket 服务
 */
export async function closeWebSocket(): Promise<void> {
    if (wss) {
        return new Promise((resolve) => {
            wss!.close(() => {
                console.log(`[${moment().format('HH:mm:ss')}][ws]: WebSocket server closed`)
                wss = null
                resolve()
            })
        })
    }
    // Destroy collab server
    await destroyCollabServer()
}

/**
 * 获取 WebSocket 服务实例
 */
export function getWebSocketServer(): WebSocketServer | null {
    return wss
}
