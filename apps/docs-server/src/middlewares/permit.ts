import { NextFunction, Request, Response } from "express";
import { createHash } from "crypto";
import axios from "axios";
import type { AuthenticatedRequest, UserInfo } from '../types/index'
import { unauthorized } from "../utils/response";

interface IVerifyResponse {
    code: number;
    username: string;
}

// Dashboard config
const DASHBOARD_CONFIG = {
    caller: "mlive",
    apikey: "70f1b6f09cddadb6e97b1b8967712ca5",
};
export default async function (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    const { caller, apikey } = DASHBOARD_CONFIG;
    const sessionId = req.cookies?._AJSESSIONID;

    // 开发/测试环境 Mock 用户模式
    // 前端通过设置 cookie: mock_user=<username> 来启用 mock 模式
    if (process.env.NODE_ENV === 'local') {
        const mockUsername = req.cookies?.mock_user;
        if (mockUsername) {
            req.user = {
                username: mockUsername,
                department: '技术中心',
                deptId: 1001,
            };
            return next();
        }
        // local 环境但没有 mock_user cookie，继续走正常流程或使用默认用户
        if (!sessionId) {
            req.user = {
                username: 'dev_user',
                department: '技术中心',
                deptId: 1001,
            };
            return next();
        }
    }
    if (!sessionId) {
        return unauthorized(res, "请先登录");
    }

    const ts = Date.now();
    const sign = createHash("md5")
        .update(`caller=${caller}&session_id=${sessionId}&ts=${ts}${apikey}`)
        .digest("hex");

    const url = `http://dashboard-mng.bilibili.co/api/session/verify?ts=${ts}&caller=${caller}&session_id=${sessionId}&sign=${sign}`;

    const { data, status } = await axios.get<IVerifyResponse>(url, {
        timeout: 5000,
    });

    const username = req.cookies["username"];
    if (status === 200 && data.code === 0 && data.username === username) {
        req.user = {
            username: data.username,
        };;
        next();
    } else {
        return unauthorized(res, "登录已过期，请重新登录");
    }
}
