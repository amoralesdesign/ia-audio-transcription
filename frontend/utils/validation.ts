import { z } from 'zod'

export const passwordSchema = z
  .string()
  .trim()
  .min(8, 'Password must have at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*)')

export const emailSchema = z
  .string()
  .trim()
  .email('Email must be in a valid format')
  .min(1, 'Email is required')

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must have at least 3 characters')
  .max(20, 'Username cannot have more than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
  .optional()
  .or(z.literal(''))

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string().trim()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, 'Password is required')
})
