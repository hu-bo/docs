import { NextFunction, Request, Response } from 'express'
import { createHash } from 'crypto'
import axios from 'axios'

interface IVerify {
    code: number
    username: string
}

export default async function (req: Request, res: Response, next: NextFunction) {
    const hash = createHash('md5')

    const caller = 'mlive'
    const apiKey = '70f1b6f09cddadb6e97b1b8967712ca5'
    const ts = new Date().getTime()
    const sessionId = req.cookies['_AJSESSIONID']
    const sign = hash.update(`caller=${caller}&session_id=${sessionId}&ts=${ts}${apiKey}`).digest('hex')
    const url = `http://dashboard-mng.bilibili.co/api/session/verify?ts=${ts}&caller=${caller}&session_id=${sessionId}&sign=${sign}`

    const { data, status } = await axios.get<IVerify>(url, {
        responseType: 'json'
    })

    const username = req.cookies['username']

    if (status === 200 && data.code === 0 && data.username === username) {
        next()
    } else {
        // 抛出Error给全局错误捕获
        return res.json({
            code: 301,
            message: '帐号未登录'
        })
    }
}
