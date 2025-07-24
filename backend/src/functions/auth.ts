import { APIGatewayProxyHandler, APIGatewayProxyEvent, Context } from 'aws-lambda'
import { cognitoService } from '../services/cognito'
import { successResponse, handleError, validationErrorResponse } from '../utils/response'
import { RegisterRequest, LoginRequest, ConfirmSignUpRequest } from '../types'

/**
 * Lambda: Registro de usuario
 * POST /auth/register
 */
export const register: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Register event:', JSON.stringify(event, null, 2))

    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    const userData: RegisterRequest = JSON.parse(event.body)

    // Validaciones básicas
    if (!userData.email || !userData.password) {
      return validationErrorResponse('Email and password are required', [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ])
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userData.email)) {
      return validationErrorResponse('Invalid email format', [
        { field: 'email', message: 'Please enter a valid email address' }
      ])
    }

    // Validar longitud de contraseña
    if (userData.password.length < 8) {
      return validationErrorResponse('Password too short', [
        { field: 'password', message: 'Password must be at least 8 characters long' }
      ])
    }

    const result = await cognitoService.register(userData)
    
    return successResponse(result, 201, 'User registered successfully')
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Login de usuario
 * POST /auth/login
 */
export const login: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Login event:', JSON.stringify(event, null, 2))

    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    const credentials: LoginRequest = JSON.parse(event.body)

    // Validaciones básicas
    if (!credentials.email || !credentials.password) {
      return validationErrorResponse('Email and password are required', [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ])
    }

    const result = await cognitoService.login(credentials)
    
    return successResponse(result, 200, 'Login successful')
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Logout de usuario
 * POST /auth/logout
 */
export const logout: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Logout event:', JSON.stringify(event, null, 2))

    // Extraer token del header Authorization
    const authHeader = event.headers.Authorization || event.headers.authorization
    if (!authHeader) {
      return validationErrorResponse('Authorization header is required')
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return validationErrorResponse('Invalid authorization format')
    }

    const result = await cognitoService.globalSignOut(token)
    
    return successResponse(result, 200, 'Logout successful')
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Confirmar registro con código
 * POST /auth/confirm
 */
export const confirmSignUp: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Confirm signup event:', JSON.stringify(event, null, 2))

    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    const confirmData: ConfirmSignUpRequest = JSON.parse(event.body)

    // Validaciones básicas
    if (!confirmData.email || !confirmData.confirmationCode) {
      return validationErrorResponse('Email and confirmation code are required', [
        { field: 'email', message: 'Email is required' },
        { field: 'confirmationCode', message: 'Confirmation code is required' }
      ])
    }

    // Validar longitud del código
    if (confirmData.confirmationCode.length !== 6) {
      return validationErrorResponse('Invalid confirmation code format', [
        { field: 'confirmationCode', message: 'Confirmation code must be 6 digits' }
      ])
    }

    const result = await cognitoService.confirmSignUp(confirmData)
    
    return successResponse(result, 200, 'Account confirmed successfully')
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Obtener información del usuario autenticado
 * GET /auth/me
 */
export const me: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Me event:', JSON.stringify(event, null, 2))

    // Extraer token del header Authorization
    const authHeader = event.headers.Authorization || event.headers.authorization
    if (!authHeader) {
      return validationErrorResponse('Authorization header is required')
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return validationErrorResponse('Invalid authorization format')
    }

    const userInfo = await cognitoService.getUserInfo(token)
    
    // Formatear respuesta para que coincida con el frontend
    const userData = {
      id: userInfo.sub,
      email: userInfo.email,
      emailVerified: userInfo.email_verified,
      username: userInfo.username,
      createdAt: userInfo.createdAt || new Date().toISOString()
    }
    
    return successResponse(userData, 200, 'User info retrieved successfully')
  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Refresh tokens
 * POST /auth/refresh
 */
export const refreshToken: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Refresh token event:', JSON.stringify(event, null, 2))

    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    const { refreshToken } = JSON.parse(event.body)

    if (!refreshToken) {
      return validationErrorResponse('Refresh token is required', [
        { field: 'refreshToken', message: 'Refresh token is required' }
      ])
    }

    const result = await cognitoService.refreshTokens(refreshToken)
    
    return successResponse(result, 200, 'Tokens refreshed successfully')
  } catch (error) {
    return handleError(error)
  }
} 