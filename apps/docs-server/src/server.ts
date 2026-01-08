import express from 'express'
import cors from 'cors'
import { DataSource } from 'typeorm'
import { getDataSource, init as initDataSource } from './config/dataSource.js'
import v1Router from './routes/index.js'
import moment from 'moment'
import { opsLogger } from './utils/biliLogger.js'

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

        // Body parsers with size limits
        this.app.use(express.json({ limit: '5mb' }))
        this.app.use(express.urlencoded({ extended: true, limit: '5mb' }))

        // Disable x-powered-by header for security
        this.app.disable('x-powered-by')

        // Health check endpoint
        this.app.get('/ping', (_req, res) => {
            res.json({ status: 'ok', database: this.AppDataSource?.isInitialized ? 'connected' : 'disconnected' })
        })

        // API routes
        this.app.use('/api/v1', v1Router)
        this.app.use('/ping', (_req, res) => {
            res.json({ status: 'ok' })
        })

        // Global error handler
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error(`[${moment().format('HH:mm:ss')}][server]: Unhandled error: `, err)
            opsLogger.error('UnhandledError', {
                msg: err.message,
                path: req.path,
                method: req.method,
                params: req.params,
                query: req.query,
                username: req.cookies['username'],
                stack: err.stack
            })
            res.status(500).json({
                message: '发生错误! ' + err.message
            })
        })
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
