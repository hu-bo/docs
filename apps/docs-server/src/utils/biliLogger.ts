const logger = require('@bilibili/bunyan-log-agent')

export type ILogs = { msg: unknown } & Record<string, unknown>

export interface ILogHandler {
    info(source: string, logs: ILogs): void
    warn(source: string, logs: ILogs): void
    error(source: string, logs: ILogs): void
}

export class OpsLogger implements ILogHandler {
    private _logger

    constructor({ appId }: { appId: string }) {
        this._logger = logger.createLogger({ app: appId, version: '1.0.0', depth: 3 })
        console.log('[Log] Console Log Module Init!')
    }

    private static _stringifyObject(obj: any): string {
        const objType = typeof obj
        if (objType === 'string') {
            return obj
        }
        try {
            return JSON.stringify(obj) || ''
        } catch (e) {
            return obj.stack || obj.message || obj.toString()
        }
    }

    private static _stringifyLogContent(argsArray: any[]): string {
        return argsArray.map(OpsLogger._stringifyObject).join(' ')
    }

    public info(source: string, logs: ILogs) {
        try {
            const { path, username, msg, documentId, ...extraLogs } = logs || {}

            this._logger.info({
                msg: msg,
                log: {
                    extra: OpsLogger._stringifyLogContent([extraLogs]),
                    source,
                    path,
                    username,
                    documentId
                }
            })
        } catch (error) {
            this.error('OpsLogger', { msg: 'OpsLogger', error })
        }
    }

    public warn(source: string, logs: ILogs) {
        try {
            const { path, username, msg, documentId, ...extraLogs } = logs || {}

            this._logger.warn({
                msg: msg,
                log: {
                    extra: OpsLogger._stringifyLogContent([extraLogs]),
                    source,
                    path,
                    username,
                    documentId
                }
            })
        } catch (error) {
            this.error('OpsLogger', { msg: 'OpsLogger', error })
        }
    }

    public error(source: string, logs: ILogs) {
        try {
            const { path, username, msg, documentId, ...extraLogs } = logs || {}

            this._logger.error({
                msg: msg,
                log: {
                    extra: OpsLogger._stringifyLogContent([extraLogs]),
                    source,
                    path,
                    username,
                    documentId
                }
            })
        } catch (error) {
            this.error('OpsLogger', { msg: 'OpsLogger', error })
        }
    }
}

export const opsLogger = new OpsLogger({ appId: 'live.ant.ai-studio-api' })
