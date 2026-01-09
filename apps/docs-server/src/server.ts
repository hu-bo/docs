import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { DataSource } from 'typeorm'
import { getDataSource, init as initDataSource } from './config/dataSource'
import v1Router from './routes/index'
import moment from 'moment'
import { opsLogger } from './utils/biliLogger'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler'

export class App {
    app: express.Application
    AppDataSource: DataSource | null = null

    constructor() {
        this.app = express()
    }

    async initDatabase() {
        try {
            // Initialize database using the same pattern as server
            await initDataSource()
            this.AppDataSource = getDataSource()
            await this.AppDataSource.initialize()

            console.log(`[${moment().format('HH:mm:ss')}][server]: Data Source has been initialized!`)
        } catch (err) {
            console.error(`[${moment().format('HH:mm:ss')}][server]: Error during Data Source initialization:`, err)
            throw err
        }
    }

    async config() {
        // CORS configuration
        this.app.use(
            cors({
                origin: (origin, callback) => {
                    callback(null, true)
                },
                credentials: true
            })
        )

        // Cookie parser
        this.app.use(cookieParser())

        // Body parsers with size limits
        this.app.use(express.json({ limit: '5mb' }))
        this.app.use(express.urlencoded({ extended: true, limit: '5mb' }))

        // Disable x-powered-by header for security
        this.app.disable('x-powered-by')

        // Health check endpoint
        this.app.get('/health', (_req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() })
        })

        this.app.get('/ping', (_req, res) => {
            res.json({ status: 'ok', database: this.AppDataSource?.isInitialized ? 'connected' : 'disconnected' })
        })

        // API routes
        this.app.use('/api/v1', v1Router)

        // 404 handler
        this.app.use(notFoundHandler)

        // Fallback error handler
        this.app.use(errorHandler)
    }

    async stopApp() {
        try {
            console.log(`[${moment().format('HH:mm:ss')}][server]: Shutting down gracefully...`)
            if (this.AppDataSource?.isInitialized) {
                await this.AppDataSource.destroy()
                console.log(`[${moment().format('HH:mm:ss')}][server]: Database connection closed`)
            }
        } catch (e) {
            console.error(`[${moment().format('HH:mm:ss')}][server]: Error during shutdown: ${e}`)
        }
    }
}

export const createServer = () => {
    return new App()
}
