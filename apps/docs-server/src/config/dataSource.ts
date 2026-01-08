import 'reflect-metadata'
import { DataSource, DataSourceOptions } from 'typeorm'
import dbConfig from './dbConfig'
import { createBiliConfig } from '../utils/biliConfig'
import { ResearchMessage } from '../entities/ResearchMessage'

let appDataSource: DataSource

/**
 * db连接已改造接入到公司环境，复用 server 的数据库配置
 */
export const init = async (): Promise<void> => {
    const biliConfig = createBiliConfig()
    const getConf = await biliConfig.getConf()
    const dbEnv = dbConfig

    const remoteDB = getConf['dbConfig']
    if (!remoteDB || remoteDB.host != '127.0.0.1') {
        throw new Error('Remote DB config is missing or invalid')
    }
    const orm = (process.env.NODE_ENV === 'local' && dbEnv) || { ...dbEnv, ...remoteDB }
    console.log(process.env.NODE_ENV)
    // 添加 deepagents 特定的 entity
    const ormWithEntities = {
        ...orm,
        entities: [...(Array.isArray(orm.entities) ? orm.entities : []), ResearchMessage]
    }

    appDataSource = new DataSource(ormWithEntities)
}

export function getDataSource(): DataSource {
    if (appDataSource === undefined) {
        throw new Error('DataSource not initialized. Call init() first.')
    }
    return appDataSource
}

/**
 * 确保数据源已初始化
 */
// export const ensureDataSource = async (): Promise<DataSource> => {
//     if (!appDataSource || !appDataSource.isInitialized) {
//         await init()
//         await appDataSource.initialize()
//     }
//     return appDataSource
// }
