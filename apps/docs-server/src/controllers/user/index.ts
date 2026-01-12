import type { Response } from 'express'
import { successResponse, errorResponse, forbidden, badRequest, notFound } from '../../utils/response'
import type { AuthenticatedRequest } from '../../types/index'
import { MOCK_USERS } from '../../constants/user'
import { oaService } from '../../services/oa'

/**
 * 获取当前登录用户信息
 * GET /api/user/current
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
        // 开发环境：从 mock_user cookie 读取用户名
        if (process.env.NODE_ENV === 'local') {
            const mockUsername = req.cookies?.mock_user
            if (mockUsername) {
                const mockUser = MOCK_USERS.find(u => u.name === mockUsername)
                if (mockUser) {
                    return successResponse(res, {
                        name: mockUser.name,
                        login_id: mockUser.login_id,
                        nick_name: mockUser.nick_name,
                        manager: mockUser.manager || '',
                        dept_id: mockUser.dept_id,
                        department_name: mockUser.department_name || '',
                        avatar: mockUser.avatar || '',
                        workcode: mockUser.workcode || '',
                        other_group: mockUser.other_group || 0
                    })
                }
            }
            // 没有 mock_user cookie，返回默认开发用户
            return successResponse(res, {
                name: 'dev_user',
                login_id: 'dev_user',
                nick_name: '开发用户',
                manager: '',
                dept_id: 1001,
                department_name: '技术中心',
                avatar: '',
                workcode: '',
                other_group: 0
            })
        }
        // 生产环境：从 OA 服务获取真实用户信息
        const user = await oaService.getUserInfo(req)
        return successResponse(res, user)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 获取 Mock 用户列表（仅开发环境）
 * GET /api/user/mock-users
 */
export async function getMockUsers(req: AuthenticatedRequest, res: Response) {
    try {
        return successResponse(res, MOCK_USERS)
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 清除 Mock 用户，使用真实账户（仅开发环境）
 * DELETE /api/user/mock
 */
export async function clearMockUser(req: AuthenticatedRequest, res: Response) {
    try {
        if (process.env.NODE_ENV !== 'local') {
            return forbidden(res, 'Only available in local environment')
        }

        // 清除 mock_user cookie
        res.clearCookie('mock_user', { path: '/' })

        // 尝试获取真实用户信息
        try {
            const user = await oaService.getUserInfo(req)
            return successResponse(res, user)
        } catch {
            // 如果没有真实登录，返回默认开发用户
            return successResponse(res, {
                name: 'dev_user',
                login_id: 'dev_user',
                nick_name: '开发用户',
                manager: '',
                dept_id: 1001,
                department_name: '技术中心',
                avatar: '',
                workcode: '',
                other_group: 0
            })
        }
    } catch (error) {
        return errorResponse(res, error)
    }
}

/**
 * 设置 Mock 用户（仅开发环境）
 * POST /api/user/mock
 * Body: { username: string }
 */
export async function setMockUser(req: AuthenticatedRequest, res: Response) {
    try {
        // 仅开发环境可用
        if (process.env.NODE_ENV !== 'local') {
            return forbidden(res, 'Mock user is only available in local environment')
        }

        const { username } = req.body

        if (!username) {
            return badRequest(res, 'username is required')
        }

        // 查找 mock 用户
        const mockUser = MOCK_USERS.find(u => u.name === username)

        if (!mockUser) {
            return notFound(res, `Mock user "${username}" not found`)
        }

        // 设置 mock_user cookie，用于后续请求的身份识别
        res.cookie('mock_user', mockUser.name, {
            httpOnly: false, // 允许前端 JS 读取（用于显示当前用户）
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
            path: '/',
            sameSite: 'lax'
        })

        // 返回用户信息
        return successResponse(res, {
            name: mockUser.name,
            login_id: mockUser.login_id,
            nick_name: mockUser.nick_name,
            manager: mockUser.manager,
            dept_id: mockUser.dept_id,
            department_name: mockUser.department_name,
            avatar: mockUser.avatar,
            workcode: mockUser.workcode,
            other_group: mockUser.other_group
        })
    } catch (error) {
        return errorResponse(res, error)
    }
}
