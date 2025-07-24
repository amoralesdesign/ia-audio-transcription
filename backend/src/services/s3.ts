import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3UploadParams, S3PresignedUrlParams } from '../types'

const s3Client = new S3Client({ region: process.env.REGION })
const BUCKET_NAME = process.env.S3_BUCKET!

export const s3Service = {
  /**
   * Generate presigned URL for upload from frontend
   */
  async generateUploadUrl(params: S3PresignedUrlParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: params.bucket || BUCKET_NAME,
      Key: params.key,
      ContentType: params.contentType || 'audio/mpeg'
    })

    return await getSignedUrl(s3Client, command, { 
      expiresIn: params.expires || 3600
    })
  },

  /**
   * Generate presigned URL for download
   */
  async generateDownloadUrl(key: string, expires: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })

    return await getSignedUrl(s3Client, command, { expiresIn: expires })
  },

  /**
   * Upload directly to S3 (for backend use)
   */
  async uploadFile(params: S3UploadParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: params.bucket || BUCKET_NAME,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata
    })

    await s3Client.send(command)
    
    return `s3://${params.bucket || BUCKET_NAME}/${params.key}`
  },

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })

    await s3Client.send(command)
  },

  /**
   * Generate unique key for file
   */
  generateFileKey(userId: string, transcriptionId: string, originalFilename: string): string {
    const timestamp = Date.now()
    const extension = originalFilename.split('.').pop()
    return `${userId}/${transcriptionId}/${timestamp}.${extension}`
  },

  /**
   * Get public URL for Speechmatics
   */
  getPublicUrl(key: string): string {
    return `https://${BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${key}`
  },

  /**
   * Get file from S3 as Buffer (for internal use)
   */
  async getFileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })

    const response = await s3Client.send(command)
    
    if (!response.Body) {
      throw new Error('File not found in S3')
    }

    const chunks: Buffer[] = []
    const stream = response.Body as any
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
  },

  /**
   * Extract key from S3 URL
   */
  extractKeyFromUrl(s3Url: string): string {
    if (s3Url.startsWith('s3://')) {
      return s3Url.replace(`s3://${BUCKET_NAME}/`, '')
    } else if (s3Url.includes('.s3.')) {
      const urlParts = s3Url.split('/')
      return urlParts.slice(3).join('/') // Todo después del dominio
    }
    throw new Error('Invalid S3 URL format')
  }
} 