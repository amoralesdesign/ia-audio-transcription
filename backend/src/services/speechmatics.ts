import { SpeechmaticsJobRequest, SpeechmaticsJobResponse } from '../types'
import FormData from 'form-data'
import axios from 'axios'
import { s3Service } from './s3'

const SPEECHMATICS_API_KEY = process.env.SPEECHMATICS_API_KEY
const SPEECHMATICS_BASE_URL = 'https://asr.api.speechmatics.com/v2'

export const speechmaticsService = {
  /**
   * Create transcription job
   */
  async createTranscriptionJob(audioUrl: string, language: string = 'es'): Promise<string> {
    if (!SPEECHMATICS_API_KEY) {
      throw new Error('Speechmatics API key not configured')
    }

    try {
      console.log(`📥 Downloading file from S3: ${audioUrl}`)
      const s3Key = s3Service.extractKeyFromUrl(audioUrl)
      console.log(`🔑 S3 Key extracted: ${s3Key}`)
      
      const audioBuffer = await s3Service.getFileBuffer(s3Key)
      console.log(`📁 File downloaded: ${audioBuffer.length} bytes`)
      
      const formData = new FormData()
      
      const transcriptionConfig = {
        type: "transcription",
        transcription_config: {
          language: language,
          operating_point: "enhanced"
        }
      }
      
      formData.append('config', JSON.stringify(transcriptionConfig))
      formData.append('data_file', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      })

      const response = await axios.post(`${SPEECHMATICS_BASE_URL}/jobs`, formData, {
        headers: {
          'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
          ...formData.getHeaders()
        }
      })

      return response.data.id
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data
        throw new Error(`Speechmatics API error: ${error.response.status} - ${JSON.stringify(errorData)}`)
      } else if (error.request) {
        // Error de red
        throw new Error(`Network error contacting Speechmatics: ${error.message}`)
      } else {
        // Otro error
        throw new Error(`Error creating transcription job: ${error.message}`)
      }
    }
  },

  /**
   * Get job status and result
   */
  async getJobResult(jobId: string): Promise<SpeechmaticsJobResponse> {
    if (!SPEECHMATICS_API_KEY) {
      throw new Error('Speechmatics API key not configured')
    }

    try {
      const response = await axios.get(`${SPEECHMATICS_BASE_URL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`
        }
      })

      return response.data
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data
        throw new Error(`Speechmatics API error: ${error.response.status} - ${JSON.stringify(errorData)}`)
      } else {
        throw new Error(`Error getting job result: ${error.message}`)
      }
    }
  },

  /**
   * Get the complete transcript of the job
   */
  async getTranscript(jobId: string): Promise<string> {
    if (!SPEECHMATICS_API_KEY) {
      throw new Error('Speechmatics API key not configured')
    }

    try {
      const response = await axios.get(`${SPEECHMATICS_BASE_URL}/jobs/${jobId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`
        }
      })

      const results = response.data.results
      if (!results || !Array.isArray(results)) {
        throw new Error('No transcript results found')
      }

      const transcript = results
        .filter(result => result.type === 'word')
        .map(result => result.alternatives?.[0]?.content || '')
        .join(' ')

      return transcript.trim()
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data
        throw new Error(`Speechmatics transcript error: ${error.response.status} - ${JSON.stringify(errorData)}`)
      } else {
        throw new Error(`Error getting transcript: ${error.message}`)
      }
    }
  },

  /**
   * Get complete transcription (polling until complete)
   */
  async transcribeAudio(audioUrl: string, language: string = 'es'): Promise<string> {
    const jobId = await this.createTranscriptionJob(audioUrl, language)
    
    const maxAttempts = 100
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const response = await this.getJobResult(jobId)
      
      const job = response.job || response
      const status = job.status
      
      
      if (status === 'done') {
        const transcript = await this.getTranscript(jobId)
        return transcript
      }
      
      if (status === 'error' || status === 'rejected') {
        throw new Error(`Transcription failed with status: ${status}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      attempts++
    }
    
    throw new Error('Transcription timeout - job took too long')
  },

  /**
   * Validate API configuration
   */
  validateConfig(): boolean {
    return !!SPEECHMATICS_API_KEY
  }
} 