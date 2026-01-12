import type { Request } from 'express'

// User info from authentication
export interface UserInfo {
    username: string
    department?: string
    deptId: number
}

// Extended Request with user info
export interface AuthenticatedRequest extends Request {
    user?: {
        username: string
        department?: string
        deptId?: number
    }
}

// Standard API response
export interface ApiResponse<T = unknown> {
    code: number
    message: string
    data?: T
}

// Paginated response
export interface PaginatedData<T> {
    list: T[]
    total: number
    page: number
    pageSize: number
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

// Response codes
export enum ResponseCode {
    SUCCESS = 0,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_ERROR = 500
}

// Permission types for documents
export enum DocPermission {
    READ = 'READ',
    EDIT = 'EDIT'
}

// Space types
export enum SpaceType {
    COMMUNITY = 1,
    PERSONAL = 2
}

// Folder visibility
export enum FolderVisibility {
    ALL = 'ALL',
    DEPT_ONLY = 'DEPT_ONLY'
}

// Document access modes
export enum DocumentAccessMode {
    OPEN_EDIT = 'OPEN_EDIT',
    OPEN_READONLY = 'OPEN_READONLY',
    WHITELIST_ONLY = 'WHITELIST_ONLY'
}


export interface OAUserInfo {
    name: string
    login_id: string
    nick_name: string
    manager: string
    dept_id: number
    department_name: string
    avatar: string
    workcode: string
    other_group: number
}
