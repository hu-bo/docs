import { PaladinService } from '@bilibili/config-sdk'
import { PaladinServiceInput } from '@bilibili/config-sdk/src/types/index'
import { env } from '../config/env'
import _ from 'lodash'
// import logger from './logger'

let biliConfig: BiliConfig

class BiliConfig {
    service: PaladinService
    private _conf: Record<string, any>
    private count = 0

    constructor(confCenter: Partial<PaladinServiceInput>) {
        this._conf = {}

        try {
            this.service = new PaladinService(confCenter)

            this.service.connect()
            this.service.on('update', (result) => {
                const { content } = result
                if (content) {
                    for (const [key, value] of Object.entries(content)) {
                        const camelKey = _.camelCase(key.split('.')[0])
                        this.conf[camelKey] = (value as any).content
                        // env写入环境变量
                        if (camelKey === 'env' && process.env.NODE_ENV !== 'local') {
                            for (const [envKey, envValue] of Object.entries(value.content as Record<string, any>)) {
                                process.env[envKey] = envValue
                            }
                        }
                    }
                }
            })

            // logger.info('远程配置获取成功')
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(err.toString())
            } else {
                // 处理其他类型的错误
                throw new Error('配置中心拉取错误')
            }
        }
    }

    get conf() {
        return this._conf
    }

    set conf(conf) {
        this._conf = conf
    }

    async getConf(): Promise<Record<string, any>> {
        if (JSON.stringify(this.conf) === '{}' && this.count <= 10) {
            await this.sleep(1000)
            this.count++
            return await this.getConf()
        } else {
            this.count = 0
            return this.conf
        }
    }

    private sleep(sleepTime = 1000) {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve()
            }, sleepTime)
        })
    }
}

export function createBiliConfig() {
    // 连接配置中心
    if (biliConfig === undefined) {
        biliConfig = new BiliConfig(env.confCenter)
    }
    return biliConfig
}
