import { DataSourceOptions } from 'typeorm'

const dbConfig: DataSourceOptions = {
    username: process.env.DATABASE_USERNAME || 'uat_ant_plan',
    password: process.env.DATABASE_PASSWORD || 'QS7u9LWitLm8yNcD2qLGlTJpgJcX3fCo',
    database: process.env.DATABASE_NAME || 'uat_ant_plan',
    host: process.env.DATABASE_HOST || '10.150.21.9',
    port: Number(process.env.DATABASE_PORT) || 5009,
    type: 'mysql',
    logging: false,
    connectTimeout: 30000,
    dateStrings: true,
    entities: ['**/entities/*.js'],
    extra: {
        typeCast: function (field: any, next: any) {
            // for reading from database
            if (field.type === 'DATETIME') {
                return field.string()
            }
            return next()
        }
    },
    timezone: '+08:00',
    charset: 'utf8mb4_unicode_ci',
    bigNumberStrings: false
}

export default dbConfig
