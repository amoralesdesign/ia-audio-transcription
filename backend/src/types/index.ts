// === TYPES OF AUTHENTICATION ===
export interface RegisterRequest {
  email: string
  password: string
  username?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ConfirmSignUpRequest {
  email: string
  confirmationCode: string
}

export interface CognitoUser {
  sub: string
  email: string
  email_verified: boolean
  username?: string
  name?: string
}

// === TYPES OF API RESPONSE ===
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode?: number
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    emailVerified: boolean
    username?: string
    createdAt: string
  }
  accessToken: string
  idToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface RegisterResponse {
  user: {
    id: string
    email: string
    emailVerified: boolean
    username?: string
    createdAt: string
  }
  message: string
  requiresConfirmation: boolean
}

// === TYPES OF LAMBDA ===
export interface LambdaContext {
  requestId: string
  functionName: string
  functionVersion: string
  memoryLimitInMB: string
  logGroupName: string
  logStreamName: string
  getRemainingTimeInMillis(): number
}

export interface CognitoEvent {
  requestContext: {
    authorizer: {
      claims: {
        sub: string
        email: string
        'cognito:username': string
        [key: string]: string
      }
    }
  }
}

// === TYPES OF TRANSCRIPTION ===
export interface Transcription {
  transcriptionId: string
  userId: string
  filename: string
  originalUrl: string
  transcriptText?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  duration?: number
  language?: string
  fileSize: number
  metadata: {
    originalName: string
    mimeType: string
    processingTime?: number
    errorMessage?: string
    [key: string]: any
  }
}

export interface TranscriptionRequest {
  filename: string
  fileSize: number
  mimeType: string
  language?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  limit: number
  hasMore: boolean
  nextPage?: string
}

// === TYPES OF DynamoDB ===
export interface DynamoDBRecord {
  PK: string
  SK: string
  GSI1PK?: string
  GSI1SK?: string
  createdAt: string
  updatedAt: string
  ttl?: number
}

export interface TranscriptionRecord extends DynamoDBRecord {
  transcriptionId: string
  userId: string
  filename: string
  originalUrl: string
  transcriptText?: string
  status: string
  duration?: number
  language?: string
  fileSize: number
  metadata: any
}

// === TYPES OF S3 ===
export interface S3UploadParams {
  bucket: string
  key: string
  body: Buffer | string
  contentType?: string
  metadata?: Record<string, string>
}

export interface S3PresignedUrlParams {
  bucket: string
  key: string
  expires?: number
  contentType?: string
}

// === TYPES OF SPEECHMATICS ===
export interface SpeechmaticsConfig {
  apiKey: string
  baseUrl: string
}

export interface SpeechmaticsJobRequest {
  url: string
  language: string
  format: string
  notification_config?: {
    url: string
    auth_headers?: Record<string, string>
  }
}

export interface SpeechmaticsJob {
  id: string
  status: 'running' | 'done' | 'error' | 'rejected'
  created_at: string
  duration?: number
  results?: {
    transcript?: string
    transcriptions?: Array<{
      transcript: string
    }>
    words?: Array<{
      word: string
      start_time: number
      end_time: number
    }>
  }
}

export interface SpeechmaticsJobResponse {
  job?: SpeechmaticsJob
  id?: string
  status?: 'running' | 'done' | 'error' | 'rejected'
  created_at?: string
  duration?: number
  results?: {
    transcript?: string
    transcriptions?: Array<{
      transcript: string
    }>
    words?: Array<{
      word: string
      start_time: number
      end_time: number
    }>
  }
}

// === TYPES OF VALIDATION ===
export interface ValidationError {
  field: string
  message: string
  code: string
}

// === TYPES OF CONFIGURATION ===
export interface EnvConfig {
  STAGE: string
  REGION: string
  COGNITO_USER_POOL_ID: string
  COGNITO_CLIENT_ID: string
  DYNAMODB_TRANSCRIPTIONS_TABLE: string
  S3_BUCKET: string
  SPEECHMATICS_API_KEY?: string
}

// === TYPES OF ERROR ===
export interface AppError extends Error {
  statusCode: number
  code?: string
  details?: any
}

export class AuthenticationError extends Error {
  statusCode = 401
  code = 'AUTHENTICATION_ERROR'
  
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends Error {
  statusCode = 400
  code = 'VALIDATION_ERROR'
  
  constructor(message: string = 'Validation failed', public fields?: ValidationError[]) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  statusCode = 404
  code = 'NOT_FOUND'
  
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
} 