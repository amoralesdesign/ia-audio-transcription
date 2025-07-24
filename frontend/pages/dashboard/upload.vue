<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Upload Audio File'
})

const {
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
} = useUpload()
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h2>Transcribe your audio file</h2>
        <p class="text-lg text-gray-600">Upload an audio file and we will get the transcription</p>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <div v-if="!isProcessing && !completedTranscription" class="space-y-6">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <div class="space-y-4">
              <div class="flex justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4M7 4H17M7 4V20C7 20.5523 7.44772 21 8 21H16C16.5523 21 17 20.5523 17 20V4M10 9L12 11L14 9"/>
                </svg>
              </div>

              <div>
                <label for="audioFile" class="cursor-pointer">
                  <span class="text-lg font-medium text-gray-900">
                    {{ selectedFile ? selectedFile.name : 'Select an audio file' }}
                  </span>
                  <input
                    id="audioFile"
                    ref="fileInput"
                    type="file"
                    class="sr-only"
                    accept="audio/*"
                    @change="handleFileSelect"
                  >
                </label>
                <p class="text-sm text-gray-500 mt-2">
                  Supported formats: MP3, WAV, MP4, M4A, OGG (max 20MB)
                </p>
              </div>

              <button
                v-if="!selectedFile"
                type="button"
                class="cta-btn"
                @click="() => fileInput?.click()"
              >
                Select file
              </button>
            </div>
          </div>

          <div v-if="selectedFile" class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-3">File details</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Name:</span>
                <p class="font-medium">{{ selectedFile.name }}</p>
              </div>
              <div>
                <span class="text-gray-500">Size:</span>
                <p class="font-medium">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <div>
                <span class="text-gray-500">Type:</span>
                <p class="font-medium">{{ selectedFile.type || 'audio/mpeg' }}</p>
              </div>
            </div>
          </div>

          <div>
            <label for="language" class="block text-sm font-medium text-gray-700 mb-2">
              Audio language
            </label>
            <select
              id="language"
              v-model="selectedLanguage"
              class="app-input"
            >
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>

          <div class="flex gap-4">
            <button
              type="button"
              class="cta-btn flex-1"
              :disabled="!selectedFile || isLoading"
              @click="startTranscription"
            >
              <span v-if="isLoading" class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
                Processing...
              </span>
              <span v-else>Start Transcription</span>
            </button>

            <button
              type="button"
              class="cta-btn-secondary"
              @click="resetForm"
            >
              Clear
            </button>
          </div>
        </div>

        <div v-if="isProcessing" class="text-center space-y-6">
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"/>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ currentStage }}</h3>
            <p class="text-gray-600">
              This process may take a few minutes depending on the file size
            </p>
          </div>

          <div class="flex justify-center space-x-8">
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span class="text-sm text-gray-600 mt-2">File uploaded</span>
            </div>

            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"/>
              <span class="text-sm text-gray-600 mt-2">Transcribing</span>
            </div>
          </div>
        </div>

        <div v-if="completedTranscription" class="space-y-6">
          <div class="text-center">
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg class="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Transcription completed!</h3>
            <p class="text-gray-600">{{ completedTranscription.filename }}</p>
          </div>

          <div class="bg-gray-50 rounded-lg p-6">
            <div class="flex justify-between items-start mb-4">
              <h4 class="font-medium text-gray-900">Transcribed text</h4>
              <button
                type="button"
                class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                @click="copyToClipboard"
              >
                Copy text
              </button>
            </div>

            <div class="prose max-w-none">
              <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {{ completedTranscription.transcriptText || 'Could not get transcription' }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 rounded-lg p-4">
            <div>
              <span class="text-gray-500">Status:</span>
              <p class="font-medium capitalize">{{ completedTranscription.status }}</p>
            </div>
            <div>
              <span class="text-gray-500">Language:</span>
              <p class="font-medium">{{ completedTranscription.language }}</p>
            </div>
            <div v-if="completedTranscription.metadata?.processingTime">
              <span class="text-gray-500">Processing time:</span>
              <p class="font-medium">{{ formatProcessingTime(completedTranscription.metadata.processingTime) }}</p>
            </div>
          </div>

          <div class="flex gap-4">

            <button
              type="button"
              class="cta-btn-outline"
              @click="transcribeAnother"
            >
              Transcribe another file
            </button>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error in transcription</h3>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
