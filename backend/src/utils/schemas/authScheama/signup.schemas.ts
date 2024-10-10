import { z } from 'zod';

export const signupSchema = z.object({
    username: z
        .string()
        .min(3, { message: 'Name must be at least 3 characters long' })
        .max(50, { message: 'Name must be at most 50 characters long' })
        .trim(),
        
    email: z
        .string()
        .email({ message: 'Invalid email' })
        .min(3, { message: 'Email must be at least 3 characters long' })
        .max(50, { message: 'Email must be at most 50 characters long' })
        .trim(),
        
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' })
        .max(50, { message: 'Password must be at most 50 characters long' })
        .trim(),
    
        role: z
        .enum(['student', 'instructor'], { 
            errorMap: () => ({ message: 'Role must be either student or instructor' }) 
        }),
    description: z.string()
        .min(10, { message: 'description must be at least 10 characters long' })
        .max(50, { message: 'description must be at most 50 characters long' })  
                    
});
