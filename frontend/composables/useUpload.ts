import type { Transcription } from '~/types'

export const useUpload = () => {
  const { transcribeFile, isLoading, error } = useTranscriptions()

  const fileInput = ref<HTMLInputElement>()
  const selectedFile = ref<File | null>(null)
  const selectedLanguage = ref('es')
  const isProcessing = ref(false)
  const currentStage = ref('')
  const completedTranscription = ref<Transcription | null>(null)

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      alert('File cannot be larger than 20MB')
      return
    }

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg']
    if (file.type && !allowedTypes.includes(file.type)) {
      alert('File format not supported')
      return
    }

    selectedFile.value = file
  }

  const startTranscription = async () => {
    if (!selectedFile.value) return

    try {
      isProcessing.value = true
      completedTranscription.value = null

      const result = await transcribeFile(selectedFile.value, (stage) => {
        currentStage.value = stage
      })

      completedTranscription.value = result
    } catch (err) {
      console.error('Error in transcription:', err)
    } finally {
      isProcessing.value = false
    }
  }

  const resetForm = () => {
    selectedFile.value = null
    selectedLanguage.value = 'es'
    completedTranscription.value = null
    isProcessing.value = false
    currentStage.value = ''

    if (fileInput.value) fileInput.value.value = ''
  }

  const transcribeAnother = () => {
    resetForm()
  }

  const copyToClipboard = async () => {
    if (!completedTranscription.value?.transcriptText) return

    try {
      await navigator.clipboard.writeText(completedTranscription.value.transcriptText)
      alert('Text copied to clipboard')
    } catch (err) {
      console.error('Error copying text:', err)
    }
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
      return `${seconds} seconds`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}m ${remainingSeconds}s`
  }

  return {
    fileInput,
    selectedFile,
    selectedLanguage,
    isProcessing,
    currentStage,
    completedTranscription,
    isLoading,
    error,
    handleFileSelect,
    startTranscription,
    resetForm,
    transcribeAnother,
    copyToClipboard,
    formatFileSize,
    formatProcessingTime
  }
}
