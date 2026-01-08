import { customAlphabet } from 'nanoid'
const custom = customAlphabet('1234567890', 18)

// 创建nanoid
export function nanoid(size: number = 18) {
    return custom(size)
}
