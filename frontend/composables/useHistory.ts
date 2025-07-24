import type { Transcription } from '~/types'

export const useHistory = () => {
  const { listTranscriptions, getDownloadUrl, isLoading, error } = useTranscriptions()

  const transcriptions = ref<Transcription[]>([])
  const selectedTranscription = ref<Transcription | null>(null)
  const downloadingId = ref<string | null>(null)
  const currentPage = ref(1)
  const nextPageToken = ref<string | undefined>()
  const hasNextPage = ref(false)
  const pageHistory = ref<string[]>([])

  const loadTranscriptions = async (pageToken?: string) => {
    try {
      const result = await listTranscriptions(10, pageToken)
      transcriptions.value = result.items
      nextPageToken.value = result.nextPage
      hasNextPage.value = !!result.nextPage
    } catch (err: any) {
      console.error('Error loading transcriptions:', err.message)
    }
  }

  const loadNextPage = async () => {
    if (nextPageToken.value) {
      pageHistory.value.push(nextPageToken.value)
      currentPage.value++
      await loadTranscriptions(nextPageToken.value)
    }
  }

  const loadPreviousPage = async () => {
    if (pageHistory.value.length > 0) {
      pageHistory.value.pop()
      currentPage.value--
      const prevToken = pageHistory.value[pageHistory.value.length - 1]
      await loadTranscriptions(prevToken)
    } else {
      currentPage.value = 1
      await loadTranscriptions()
    }
  }

  const viewTranscription = (transcription: Transcription) => {
    selectedTranscription.value = transcription
  }

  const closeModal = () => {
    selectedTranscription.value = null
  }

  const downloadAudio = async (transcription: Transcription) => {
    try {
      downloadingId.value = transcription.transcriptionId

      const { downloadUrl, filename } = await getDownloadUrl(transcription.transcriptionId)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err: any) {
      console.error('Error downloading audio:', err.message)
    } finally {
      downloadingId.value = null
    }
  }

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      completed: 'Completado',
      processing: 'Procesando',
      failed: 'Error',
      pending: 'Pendiente'
    }
    return statusMap[status] || status
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatProcessingTime = (milliseconds: number): string => {
    const seconds = Math.round(milliseconds / 1000)

    if (seconds < 60) {
      return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}m ${remainingSeconds}s`
  }

  onMounted(() => {
    loadTranscriptions()
  })

  return {
    transcriptions,
    selectedTranscription,
    downloadingId,
    currentPage,
    hasNextPage,
    isLoading,
    error,
    loadTranscriptions,
    loadNextPage,
    loadPreviousPage,
    viewTranscription,
    closeModal,
    downloadAudio,
    getStatusText,
    formatDate,
    formatFileSize,
    formatProcessingTime
  }
}
