import { APIGatewayProxyResult } from 'aws-lambda'
import { ApiResponse } from '../types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
  'Content-Type': 'application/json'
}

/**
 * Crea una respuesta HTTP exitosa
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  message?: string
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    statusCode
  }

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response)
  }
}

/**
 * Crea una respuesta HTTP de error
 */
export function errorResponse(
  error: string,
  statusCode: number = 400,
  details?: any
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error,
    statusCode,
    ...(details && { details })
  }

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response)
  }
}

/**
 * Crea una respuesta HTTP para errores de validación
 */
export function validationErrorResponse(
  message: string,
  fields?: Array<{ field: string; message: string }>
): APIGatewayProxyResult {
  return errorResponse(message, 400, { fields })
}

/**
 * Crea una respuesta HTTP para errores de autenticación
 */
export function authErrorResponse(
  message: string = 'Authentication failed'
): APIGatewayProxyResult {
  return errorResponse(message, 401)
}

/**
 * Crea una respuesta HTTP para recursos no encontrados
 */
export function notFoundResponse(
  message: string = 'Resource not found'
): APIGatewayProxyResult {
  return errorResponse(message, 404)
}

/**
 * Crea una respuesta HTTP para errores del servidor
 */
export function serverErrorResponse(
  message: string = 'Internal server error'
): APIGatewayProxyResult {
  return errorResponse(message, 500)
}

/**
 * Maneja errores automáticamente basado en el tipo
 */
export function handleError(error: any): APIGatewayProxyResult {
  console.error('Error:', error)

  // Error de validación
  if (error.name === 'ValidationError') {
    return validationErrorResponse(error.message, error.fields)
  }

  // Error de autenticación
  if (error.name === 'AuthenticationError' || error.statusCode === 401) {
    return authErrorResponse(error.message)
  }

  // Error de no encontrado
  if (error.name === 'NotFoundError' || error.statusCode === 404) {
    return notFoundResponse(error.message)
  }

  // Error de Cognito
  if (error.name === 'UserNotFoundException') {
    return authErrorResponse('User not found')
  }

  if (error.name === 'NotAuthorizedException') {
    return authErrorResponse('Invalid credentials')
  }

  if (error.name === 'UserNotConfirmedException') {
    return authErrorResponse('User not confirmed. Please check your email.')
  }

  if (error.name === 'UsernameExistsException') {
    return validationErrorResponse('Email is already registered')
  }

  if (error.name === 'InvalidParameterException') {
    return validationErrorResponse('Invalid parameters', [{ field: 'general', message: error.message }])
  }

  if (error.name === 'CodeMismatchException') {
    return validationErrorResponse('Invalid confirmation code')
  }

  if (error.name === 'ExpiredCodeException') {
    return validationErrorResponse('Confirmation code expired')
  }

  // Error genérico del servidor
  return serverErrorResponse(
    process.env.STAGE === 'dev' ? error.message : 'Internal server error'
  )
} 