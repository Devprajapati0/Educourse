import {z} from "zod"

export const updateSchema = z.object({
    username:z.string().optional(),
    password:z.string().optional(),
    description: z.string().optional()
})