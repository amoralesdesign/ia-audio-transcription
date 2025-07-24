export interface User {
  id: string
  email: string
  username?: string
  emailVerified: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

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

export interface UploadUrlResponse {
  transcriptionId: string
  uploadUrl: string
  expiresIn: number
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  limit: number
  hasMore: boolean
  nextPage?: string
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  idToken: string
  refreshToken: string
}

export interface RegisterResponse {
  user: User
  message: string
  requiresConfirmation: boolean
}

export interface ConfirmSignUpRequest {
  email: string
  confirmationCode: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TranscriptionHistory {
  transcriptions: Transcription[]
  totalCount: number
  page: number
  limit: number
  hasMore: boolean
}
