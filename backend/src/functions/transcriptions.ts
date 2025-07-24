import { APIGatewayProxyHandler, APIGatewayProxyEvent, Context } from 'aws-lambda'
import { dynamodbService } from '../services/dynamodb'
import { s3Service } from '../services/s3'
import { speechmaticsService } from '../services/speechmatics'
import { successResponse, handleError, validationErrorResponse } from '../utils/response'
import { TranscriptionRequest } from '../types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Extract user info from JWT token
 */
const getUserFromToken = (event: APIGatewayProxyEvent): { userId: string; email: string } => {
  const authHeader = event.headers.Authorization || event.headers.authorization
  if (!authHeader) {
    throw new Error('Authorization header required')
  }

  const claims = (event.requestContext as any)?.authorizer?.claims
  if (!claims?.sub) {
    throw new Error('Invalid token')
  }

  return {
    userId: claims.sub,
    email: claims.email
  }
}

/**
 * Lambda: Generate presigned URL for upload
 * POST /transcriptions/upload-url
 */
export const getUploadUrl: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Upload URL request:', JSON.stringify(event, null, 2))

    const { userId } = getUserFromToken(event)

    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    const requestData: TranscriptionRequest = JSON.parse(event.body)

    if (!requestData.filename || !requestData.fileSize || !requestData.mimeType) {
      return validationErrorResponse('Filename, fileSize and mimeType are required')
    }

    if (requestData.fileSize > 20 * 1024 * 1024) {
      return validationErrorResponse('File size cannot exceed 20MB')
    }

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg']
    if (!allowedTypes.includes(requestData.mimeType)) {
      return validationErrorResponse('Unsupported audio format')
    }

    const transcriptionId = uuidv4()
    const fileKey = s3Service.generateFileKey(userId, transcriptionId, requestData.filename)

    const transcription = await dynamodbService.createTranscription(userId, {
      filename: requestData.filename,
      originalUrl: `s3://${process.env.S3_BUCKET}/${fileKey}`,
      status: 'pending',
      fileSize: requestData.fileSize,
      language: requestData.language || 'es',
      metadata: {
        originalName: requestData.filename,
        mimeType: requestData.mimeType
      }
    })

    const uploadUrl = await s3Service.generateUploadUrl({
      bucket: process.env.S3_BUCKET!,
      key: fileKey,
      contentType: requestData.mimeType,
      expires: 300
    })

    return successResponse({
      transcriptionId: transcription.transcriptionId,
      uploadUrl,
      expiresIn: 300
    }, 200, 'Upload URL generated successfully')

  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Confirm upload and start transcription
 * POST /transcriptions/{transcriptionId}/process
 */
export const processTranscription: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Process transcription:', JSON.stringify(event, null, 2))

    const { userId } = getUserFromToken(event)

    const transcriptionId = event.pathParameters?.transcriptionId
    if (!transcriptionId) {
      return validationErrorResponse('Transcription ID is required')
    }

    const transcription = await dynamodbService.getTranscription(userId, transcriptionId)
    if (!transcription) {
      return validationErrorResponse('Transcription not found')
    }

    if (transcription.status !== 'pending') {
      return validationErrorResponse('Transcription has already been processed')
    }

    await dynamodbService.updateTranscriptionStatus(userId, transcriptionId, {
      status: 'processing'
    })

    const s3Key = transcription.originalUrl.replace(`s3://${process.env.S3_BUCKET}/`, '')
    const publicUrl = s3Service.getPublicUrl(s3Key)

    try {
      const transcriptText = await speechmaticsService.transcribeAudio(
        publicUrl, 
        transcription.language || 'es'
      )

      const updatedTranscription = await dynamodbService.updateTranscriptionStatus(userId, transcriptionId, {
        status: 'completed',
        transcriptText,
        metadata: {
          ...transcription.metadata,
          processingTime: Date.now() - new Date(transcription.createdAt).getTime()
        }
      })

      return successResponse(updatedTranscription, 200, 'Transcription completed successfully')

    } catch (transcriptionError: any) {
      console.error('Transcription failed:', transcriptionError)
      
      await dynamodbService.updateTranscriptionStatus(userId, transcriptionId, {
        status: 'failed',
        metadata: {
          ...transcription.metadata,
          processingTime: Date.now() - new Date(transcription.createdAt).getTime(),
          errorMessage: transcriptionError?.message || 'Unknown error'
        }
      })

      return handleError(transcriptionError)
    }

  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Get transcription by ID
 * GET /transcriptions/{transcriptionId}
 */
export const getTranscription: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Get transcription:', JSON.stringify(event, null, 2))

    const { userId } = getUserFromToken(event)

    const transcriptionId = event.pathParameters?.transcriptionId
    if (!transcriptionId) {
      return validationErrorResponse('Transcription ID is required')
    }

    const transcription = await dynamodbService.getTranscription(userId, transcriptionId)
    if (!transcription) {
      return validationErrorResponse('Transcription not found')
    }

    return successResponse(transcription, 200, 'Transcription retrieved successfully')

  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: List transcription of the user
 * GET /transcriptions
 */
export const listTranscriptions: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('List transcriptions:', JSON.stringify(event, null, 2))

    const { userId } = getUserFromToken(event)

    const limit = parseInt(event.queryStringParameters?.limit || '10')
    const nextPage = event.queryStringParameters?.nextPage

    if (limit > 50) {
      return validationErrorResponse('Limit cannot exceed 50')
    }

    const result = await dynamodbService.getUserTranscriptions(userId, limit, nextPage)

    return successResponse(result, 200, 'Transcriptions retrieved successfully')

  } catch (error) {
    return handleError(error)
  }
}

/**
 * Lambda: Generate download URL
 * GET /transcriptions/{transcriptionId}/download
 */
export const getDownloadUrl: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Download URL request:', JSON.stringify(event, null, 2))

    const { userId } = getUserFromToken(event)

    const transcriptionId = event.pathParameters?.transcriptionId
    if (!transcriptionId) {
      return validationErrorResponse('Transcription ID is required')
    }

    const transcription = await dynamodbService.getTranscription(userId, transcriptionId)
    if (!transcription) {
      return validationErrorResponse('Transcription not found')
    }

    const s3Key = transcription.originalUrl.replace(`s3://${process.env.S3_BUCKET}/`, '')
    const downloadUrl = await s3Service.generateDownloadUrl(s3Key, 3600)

    return successResponse({
      downloadUrl,
      filename: transcription.filename,
      expiresIn: 3600
    }, 200, 'Download URL generated successfully')

  } catch (error) {
    return handleError(error)
  }
} 

/**
 * Lambda: Create realtime transcription
 * POST /transcriptions/realtime
 */
export const createRealtimeTranscription: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  try {
    console.log('Create realtime transcription:', JSON.stringify(event, null, 2))

    const { userId } = getUserFromToken(event)

    if (!event.body) {
      return validationErrorResponse('Request body is required')
    }

    const requestData = JSON.parse(event.body)

    if (!requestData.transcriptText || typeof requestData.transcriptText !== 'string') {
      return validationErrorResponse('transcriptText is required')
    }

    if (requestData.transcriptText.trim().length === 0) {
      return validationErrorResponse('transcriptText cannot be empty')
    }

    if (requestData.transcriptText.length > 10000) {
      return validationErrorResponse('transcriptText cannot exceed 10000 characters')
    }

    const transcription = await dynamodbService.createTranscription(userId, {
      filename: `realtime_${Date.now()}.txt`,
      originalUrl: `realtime://transcription`,
      status: 'completed',
      transcriptText: requestData.transcriptText.trim(),
      fileSize: requestData.transcriptText.length,
      language: requestData.language || 'es',
      metadata: {
        originalName: `Transcripción en tiempo real - ${new Date().toLocaleDateString('es-ES')}`,
        mimeType: 'text/plain',
        type: 'realtime',
        processingTime: 0
      }
    })

    return successResponse(transcription, 201, 'Realtime transcription saved successfully')

  } catch (error) {
    return handleError(error)
  }
} 