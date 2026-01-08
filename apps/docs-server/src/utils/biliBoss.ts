import AWS from 'aws-sdk'
import fs from 'fs'
import { createBiliConfig } from './biliConfig.js'
import { nanoid } from './nanoid.js'
import path from 'path'
import { readFile } from 'node:fs/promises'
const chardet = require('chardet')
import { opsLogger } from './biliLogger.js'
import Jimp from 'jimp'

let biliBoss: BiliBoss

interface IUpload {
    filename: string
    extname: string
    mimeType: string
    content: string
}

class BiliBoss {
    private s3: AWS.S3

    constructor() {
        const biliConfig = createBiliConfig()
        const bossConf = biliConfig.conf?.config?.boss

        this.s3 = new AWS.S3({
            signatureVersion: 'v4', // 用v4签名
            s3ForcePathStyle: true,
            credentials: {
                accessKeyId: bossConf?.access_key_id,
                secretAccessKey: bossConf?.secret_access_key
            },
            endpoint: bossConf?.endpoint,
            region: process.env.DEPLOY_ENV === 'prod' ? 'prod' : 'uat'
        })
    }

    async uploadFile(file: Express.Multer.File) {
        const { path: filePath, mimetype } = file
        let { originalname } = file
        // 过滤文件名中的特殊字符
        originalname = originalname.replace('/', '').replace('\\', '')

        const extname = path.extname(originalname)
        const filename = path.basename(Buffer.from(file.originalname, 'latin1').toString('utf8'), extname)
        const myKey = `${nanoid(10)}_${filename}${extname}`

        // 读取文件并转换为Buffer
        let buffer: Buffer = Buffer.from(fs.readFileSync(filePath))

        if (extname === '.csv' || extname === '.txt') {
            const encoding = chardet.detect(buffer)
            if (encoding.toUpperCase() !== 'UTF-8') {
                throw new Error(`上传文件失败: 检测到 ${filename}${extname} 非utf8格式,请将文件另存为utf8格式后再试`)
            }
        }

        // 如果上传的是图片文件,则压缩图片大小
        if (mimetype.includes('image')) {
            try {
                // 使用 Jimp 读取 Buffer
                const image = await Jimp.read(buffer)

                // 调整大小
                if (image.getWidth() > 800) {
                    image.resize(800, Jimp.AUTO) // 只指定宽度为 800px，高度按比例调整
                }

                if (image.getHeight() > 600) {
                    image.resize(Jimp.AUTO, 600) // 调整高度为 600px，宽度按比例调整
                }

                image.quality(80)

                // 获取处理后的 Buffer
                buffer = await image.getBufferAsync(mimetype) // 或者使用适当的 MIME 类型
            } catch (err) {
                opsLogger.error(`JimpBuild`, { msg: err, filename: filename, extname: extname })
            }
        }

        const params = {
            Bucket: 'copilot', // boss-bucket
            Key: myKey,
            ContentType: `${mimetype}; charset=utf-8`,
            Body: buffer
        }

        try {
            const data = await this.s3.upload(params).promise()
            return (
                data && {
                    filename: filename,
                    extname: extname,
                    location: data.Location,
                    fileKey: data.Key
                }
            )
        } catch (err) {
            throw new Error(`BiliBoss upload error ${err}`)
        }
    }

    async upload({ filename, extname, content, mimeType }: IUpload) {
        filename = filename.replace('/', '').replace('\\', '')
        const myKey = `${nanoid(10)}_${filename}${extname}`
        const buffer = Buffer.from(content)

        const params = {
            Bucket: 'copilot', // boss-bucket
            Key: myKey,
            ContentType: mimeType,
            Body: buffer
        }

        try {
            const data = await this.s3.upload(params).promise()
            return (
                data && {
                    filename: filename,
                    extname: extname,
                    location: data.Location,
                    fileKey: data.Key
                }
            )
        } catch (err) {
            throw new Error(`BiliBoss upload error ${err}`)
        }
    }

    // 读取外部传入的buffer数据,并上传
    async uploadBuffer(buffer: Buffer, filename: string, extname: string, mimeType: string) {
        const myKey = `${nanoid(10)}_${filename}${extname}`
        const params = {
            Bucket: 'copilot', // boss-bucket
            Key: myKey,
            ContentType: mimeType,
            Body: buffer
        }

        try {
            const data = await this.s3.upload(params).promise()
            return (
                data && {
                    filename: filename,
                    extname: extname,
                    location: data.Location,
                    fileKey: data.Key
                }
            )
        } catch (err) {
            throw new Error(`BiliBoss upload error ${err}`)
        }
    }
}

export function createBiliBoss() {
    if (biliBoss === undefined) {
        biliBoss = new BiliBoss()
    }
    return biliBoss
}
