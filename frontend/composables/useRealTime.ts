import { createSpeechmaticsJWT } from '@speechmatics/auth'
import { RealtimeClient } from '@speechmatics/real-time-client'

export const useRealTime = () => {
  const { createRealtimeTranscription, isLoading: isSavingTranscription } = useTranscriptions()

  const isRecording = ref(false)
  const isConnecting = ref(false)
  const selectedLanguage = ref('es')
  const connectionStatus = ref('')
  const error = ref<string | null>(null)
  const saveSuccess = ref(false)

  const finalAccumulatedText = ref('')
  const currentPartialText = ref('')

  const allText = computed(() => {
    const final = finalAccumulatedText.value
    const partial = currentPartialText.value
    return partial ? `${final}${final ? ' ' : ''}${partial}` : final
  })

  const statusText = computed(() => {
    return isConnecting.value ? 'Connecting...' :
      isRecording.value ? 'Recording - Speak now' :
        'Ready to record'
  })

  let realtimeClient: RealtimeClient | null = null
  let audioContext: AudioContext | null = null
  let processor: ScriptProcessorNode | null = null
  let audioStream: MediaStream | null = null

  const handlePartialTranscript = (transcript: string) => {
    currentPartialText.value = transcript
  }

  const handleFinalTranscript = (transcript: string) => {
    if (transcript) {
      finalAccumulatedText.value = finalAccumulatedText.value
        ? `${finalAccumulatedText.value} ${transcript}`
        : transcript
      currentPartialText.value = ''
    }
  }

  const handleEndOfUtterance = () => {
    if (currentPartialText.value) {
      finalAccumulatedText.value = finalAccumulatedText.value
        ? `${finalAccumulatedText.value} ${currentPartialText.value}`
        : currentPartialText.value
      currentPartialText.value = ''
    }
  }

  const getSpeechmaticsJWT = async (): Promise<string> => {
    try {
      const config = useRuntimeConfig()
      const apiKey = config.public.speechmaticsApiKey as string

      if (!apiKey) {
        throw new Error('Speechmatics API key not configured')
      }

      const jwt = await createSpeechmaticsJWT({
        type: 'rt',
        apiKey,
        ttl: 3600
      })
      return jwt
    } catch (err: any) {
      throw new Error(`Error creando JWT: ${err.message}`)
    }
  }

  const initializeSpeechmaticsClient = async () => {
    try {
      connectionStatus.value = 'Getting credentials...'
      const jwt = await getSpeechmaticsJWT()

      connectionStatus.value = 'Connecting to Speechmatics...'

      realtimeClient = new RealtimeClient()

      realtimeClient.addEventListener('receiveMessage', (event: any) => {
        const { data } = event
        const transcript = data.metadata?.transcript?.trim() || ''

        switch (data.message) {
        case 'RecognitionStarted':
          connectionStatus.value = 'Connected - Ready to transcribe'
          break
        case 'AddPartialTranscript':
          handlePartialTranscript(transcript)
          break
        case 'AddTranscript':
          handleFinalTranscript(transcript)
          break
        case 'EndOfUtterance':
          handleEndOfUtterance()
          break
        case 'Error':
          error.value = `Error de Speechmatics: ${data.reason}`
          stopRecording()
          break
        }
      })

      realtimeClient.addEventListener('socketStateChange', (event: any) => {
        if (event.data === 'open') {
          connectionStatus.value = 'WebSocket connected'
        } else if (event.data === 'closed') {
          connectionStatus.value = 'Disconnected'
        }
      })

      await realtimeClient.start(jwt, {
        audio_format: {
          type: 'raw',
          encoding: 'pcm_s16le',
          sample_rate: 16000
        },
        transcription_config: {
          language: selectedLanguage.value,
          operating_point: 'standard',
          enable_partials: true,
          max_delay: 1.0,
          transcript_filtering_config: {
            remove_disfluencies: true
          },
          conversation_config: {
            end_of_utterance_silence_trigger: 1.5
          }
        }
      })

    } catch (err: any) {
      throw new Error(`Error connecting to Speechmatics: ${err.message}`)
    }
  }

  const setupAudioProcessing = (stream: MediaStream) => {
    audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    processor = audioContext.createScriptProcessor(4096, 1, 1)

    processor.onaudioprocess = (event) => {
      if (!realtimeClient || !isRecording.value) return

      const inputData = event.inputBuffer.getChannelData(0)
      const int16Array = new Int16Array(inputData.length)

      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputData[i]))
        int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      }

      realtimeClient.sendAudio(int16Array.buffer)
    }

    source.connect(processor)
    processor.connect(audioContext.destination)
  }

  const initializeAudioCapture = async () => {
    connectionStatus.value = 'Requesting microphone access...'

    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 16000 }
    })

    connectionStatus.value = 'Configuring audio PCM...'
    setupAudioProcessing(audioStream)
    connectionStatus.value = 'Microphone activated'
  }

  const startRecording = async () => {
    error.value = null
    isConnecting.value = true

    try {
      await Promise.all([
        initializeSpeechmaticsClient(),
        initializeAudioCapture()
      ])

      isRecording.value = true
    } catch (err: any) {
      error.value = err.message
      cleanup()
    } finally {
      isConnecting.value = false
    }
  }

  const stopRecording = () => {
    isRecording.value = false
    connectionStatus.value = 'Stopping...'

    try {
      realtimeClient?.stopRecognition()
      connectionStatus.value = 'Detenido'
    } catch (err: any) {
      console.error('Error stopping recording:', err)
    } finally {
      cleanup()
    }
  }

  const cleanup = () => {
    audioStream?.getTracks().forEach(track => track.stop())
    if (processor) processor.disconnect()
    if (audioContext && audioContext.state !== 'closed') audioContext.close()

    audioStream = null
    processor = null
    audioContext = null
    realtimeClient = null
    connectionStatus.value = ''
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Text copied to clipboard')
    } catch (err) {
      console.error('Error copying text:', err)
    }
  }

  const saveTranscription = async () => {
    if (!allText.value || allText.value.trim().length === 0) {
      error.value = 'No text to save'
      return
    }

    try {
      error.value = null
      saveSuccess.value = false

      await createRealtimeTranscription(allText.value, selectedLanguage.value)

      saveSuccess.value = true

      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)

    } catch (err: any) {
      error.value = `Error saving transcription: ${err.message}`
    }
  }

  const clearTranscripts = () => {
    finalAccumulatedText.value = ''
    currentPartialText.value = ''
    saveSuccess.value = false
  }

  onUnmounted(() => {
    if (isRecording.value) {
      stopRecording()
    }
  })

  return {
    isRecording,
    isConnecting,
    selectedLanguage,
    connectionStatus,
    error,
    saveSuccess,
    allText,
    statusText,
    isSavingTranscription,
    startRecording,
    stopRecording,
    copyToClipboard,
    saveTranscription,
    clearTranscripts
  }
}
