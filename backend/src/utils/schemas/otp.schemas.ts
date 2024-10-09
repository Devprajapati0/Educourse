import {z} from "zod"

export const otpSchema = z.object({
    email: z.string(),
    otp:z.string().length(6,{message:"verification code must be 6 digit"}),
    newpassword: z.string() .min(8, { message: 'Password must be at least 8 characters long' })
    .max(50, { message: 'Password must be at most 50 characters long' })
    .trim(),
})

export const emailSchema = z.object({
    email: z.string(),
})