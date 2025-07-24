import type {
  Transcription,
  TranscriptionRequest,
  UploadUrlResponse,
  PaginatedResponse,
} from '~/types'

export const useTranscriptions = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const api = useApi()

  const getIdToken = () => {
    const idToken = useCookie('transcription_id_token')
    if (!idToken.value) {
      throw new Error('No authentication token found')
    }
    return idToken.value
  }

  const getUploadUrl = async (file: File): Promise<UploadUrlResponse> => {
    try {
      isLoading.value = true
      error.value = null

      const requestData: TranscriptionRequest = {
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type || 'audio/mpeg',
        language: 'es'
      }

      return await api.transcriptions.getUploadUrl(requestData, getIdToken()) as UploadUrlResponse
    } catch (err: any) {
      error.value = err.message || 'Error getting upload URL'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const uploadFile = async (file: File, uploadUrl: string): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'audio/mpeg'
        }
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }
    } catch (err: any) {
      error.value = err.message || 'Error uploading file'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const processTranscription = async (transcriptionId: string): Promise<Transcription> => {
    try {
      isLoading.value = true
      error.value = null

      return await api.transcriptions.process(transcriptionId, getIdToken()) as Transcription
    } catch (err: any) {
      error.value = err.message || 'Error processing transcription'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const transcribeFile = async (file: File, onProgress?: (stage: string) => void): Promise<Transcription> => {
    try {
      onProgress?.('Preparing upload...')
      const { transcriptionId, uploadUrl } = await getUploadUrl(file)

      onProgress?.('Uploading file...')
      await uploadFile(file, uploadUrl)

      onProgress?.('Transcribing audio...')
      const result = await processTranscription(transcriptionId)

      onProgress?.('Completed!')
      return result
    } catch (err: any) {
      error.value = err.message || 'Error in transcription process'
      throw err
    }
  }

  const getTranscription = async (transcriptionId: string): Promise<Transcription> => {
    try {
      isLoading.value = true
      error.value = null

      return await api.transcriptions.get(transcriptionId, getIdToken()) as Transcription
    } catch (err: any) {
      error.value = err.message || 'Error getting transcription'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const listTranscriptions = async (
    limit: number = 10,
    nextPage?: string
  ): Promise<PaginatedResponse<Transcription>> => {
    try {
      isLoading.value = true
      error.value = null

      return await api.transcriptions.list({ limit, nextPage, idToken: getIdToken() }) as PaginatedResponse<Transcription>
    } catch (err: any) {
      error.value = err.message || 'Error listing transcriptions'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getDownloadUrl = async (transcriptionId: string): Promise<{ downloadUrl: string; filename: string }> => {
    try {
      isLoading.value = true
      error.value = null

      return await api.transcriptions.getDownloadUrl(transcriptionId, getIdToken()) as { downloadUrl: string; filename: string }
    } catch (err: any) {
      error.value = err.message || 'Error getting download URL'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createRealtimeTranscription = async (
    transcriptText: string,
    language: string = 'es'
  ): Promise<Transcription> => {
    try {
      isLoading.value = true
      error.value = null

      return await api.transcriptions.createRealtime({ transcriptText, language }, getIdToken()) as Transcription
    } catch (err: any) {
      error.value = err.message || 'Error saving realtime transcription'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    getUploadUrl,
    uploadFile,
    processTranscription,
    transcribeFile,
    getTranscription,
    listTranscriptions,
    getDownloadUrl,
    createRealtimeTranscription
  }
}
