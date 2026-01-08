import { Request, Response, NextFunction } from 'express'
import { z, ZodObject, ZodError } from 'zod'

export const validate =
    (schema: { body?: ZodObject<any>; query?: ZodObject<any>; params?: ZodObject<any> }) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 校验并自动转换数据，然后写回 req
            if (schema.body) req.body = await schema.body.parseAsync(req.body)
            if (schema.query) req.query = (await schema.query.parseAsync(req.query)) as any
            if (schema.params) req.params = (await schema.params.parseAsync(req.params)) as any

            return next()
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(200).json({
                    code: 500,
                    message: error.issues.map((e) => `${e.path.join('.')} - ${e.message}`).join('; ')
                })
            }
            return next(error)
        }
    }
