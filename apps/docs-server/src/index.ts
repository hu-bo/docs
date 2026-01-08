import http from 'http'
import moment from 'moment'
import { env } from './config/env.js'
import { App, createServer } from './server.js'

declare global {
    namespace Express {
        namespace Multer {
            interface File {
                bucket: string
                key: string
                acl: string
                contentType: string
                contentDisposition: null
                storageClass: string
                serverSideEncryption: null
                metadata: any
                location: string
                etag: string
            }
        }
    }
}

let app: App
let httpServer: http.Server

async function start() {
    try {
        app = createServer()

        // Initialize database first
        await app.initDatabase()

        // Configure middleware and routes
        await app.config()

        // Create HTTP server
        httpServer = http.createServer(app.app)

        // Start listening
        httpServer.listen(env.port, () => {
            console.log(`[${moment().format('HH:mm:ss')}][server]: Server is listening on port ${env.port}`)
        })

        // Handle server errors
        httpServer.on('error', (error: NodeJS.ErrnoException) => {
            if (error.syscall !== 'listen') {
                throw error
            }

            const bind = typeof env.port === 'string' ? 'Pipe ' + env.port : 'Port ' + env.port

            switch (error.code) {
                case 'EACCES':
                    console.error(`[${moment().format('HH:mm:ss')}][server]: ${bind} requires elevated privileges`)
                    process.exit(1)
                    break
                case 'EADDRINUSE':
                    console.error(`[${moment().format('HH:mm:ss')}][server]: ${bind} is already in use`)
                    process.exit(1)
                    break
                default:
                    throw error
            }
        })
    } catch (error) {
        console.error(`[${moment().format('HH:mm:ss')}][server]: Failed to start server:`, error)
        process.exit(1)
    }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
    console.log(`\n[${moment().format('HH:mm:ss')}][server]: ${signal} received, shutting down gracefully...`)

    // Stop accepting new connections
    if (httpServer) {
        httpServer.close(() => {
            console.log(`[${moment().format('HH:mm:ss')}][server]: HTTP server closed`)
        })
    }

    // Clean up application resources
    if (app?.stopApp) {
        await app.stopApp()
    }

    console.log(`[${moment().format('HH:mm:ss')}][server]: Graceful shutdown completed`)
    process.exit(0)
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(`[${moment().format('HH:mm:ss')}][server]: Uncaught Exception:`, error)
    gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${moment().format('HH:mm:ss')}][server]: Unhandled Rejection at:`, promise, 'reason:', reason)
    // Don't exit on unhandled rejection, just log it
    // gracefulShutdown('unhandledRejection')
})

// Start the server
start()
