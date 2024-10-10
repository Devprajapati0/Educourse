 import {z} from "zod"


export const loginSchema = z.object({
    email: z.string()
    .email({ message: "Invalid email format" }),   
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .max(50, { message: 'Password must be at most 50 characters long' })
        .trim(),
    
    role: z
        .enum(['student', 'instructor'], { 
            errorMap: () => ({ message: 'Role must be either student or instructor' }) 
        })
})