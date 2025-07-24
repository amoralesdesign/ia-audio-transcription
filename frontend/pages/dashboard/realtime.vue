<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const {
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
} = useRealTime()
</script>
<template>
  <div>
    <div class="mb-8">
      <h2>Transcribe in real time</h2>
      <p class="text-gray-600 text-lg">Speak into your microphone and see the transcription in real time</p>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-6 md:p-8">

      <div class="text-center mb-8">
        <div class="flex justify-center items-center space-x-4 mb-4">
          <div
            :class="{
              'bg-red-100 text-red-600': isRecording,
              'bg-gray-100 text-gray-600': !isRecording,
              'animate-pulse': isRecording
            }"
            class="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300"
          >
            <Icon name="uil:microphone" class="text-4xl text-purple-400" />
          </div>
        </div>

        <div class="space-y-2">
          <h3
            :class="{
              'text-red-600': isRecording,
              'text-gray-900': !isRecording
            }"
            class="text-xl font-semibold transition-colors"
          >
            {{ statusText }}
          </h3>
          <p v-if="connectionStatus" class="text-sm text-gray-600">
            {{ connectionStatus }}
          </p>
        </div>
      </div>

      <div class="flex justify-center space-x-4 mb-8">
        <button
          v-if="!isRecording"
          :disabled="isConnecting"
          class="cta-btn"
          @click="startRecording"
        >
          <span>{{ isConnecting ? 'Connecting...' : 'Start Recording' }}</span>
        </button>

        <button
          v-else
          class="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg cta-button flex items-center space-x-2 transition-colors"
          @click="stopRecording"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
          <span>Stop Recording</span>
        </button>
      </div>

      <div v-if="!isRecording" class="mb-8 max-w-xs mx-auto">
        <label for="language" class="block mx-auto text-sm font-medium text-gray-700 mb-2">
          Language of transcription
        </label>
        <select
          id="language"
          v-model="selectedLanguage"
          class="app-input block"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="fr">Francés</option>
          <option value="de">German</option>
          <option value="pt">Portugués</option>
        </select>
      </div>

      <div class="space-y-4">
        <div v-if="allText || isRecording" class="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p class="text-gray-800 text-lg leading-relaxed min-h-[100px]">{{ allText || 'Habla para comenzar la transcripción...' }}</p>
        </div>
      </div>

      <div v-if="saveSuccess" class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center">
          <div>
            <h3 class="text-sm font-medium text-green-800">Success!</h3>
            <p class="text-sm text-green-700 mt-1">Transcription saved correctly. You can see it in the history.</p>
          </div>
        </div>
      </div>

      <div v-if="error" class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <div>
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <div v-if="allText" class="md:flex text-center justify-center md:space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          :disabled="isSavingTranscription"
          class="cta-btn-outline w-full md:w-auto mb-2"
          @click="saveTranscription"
        >
          <Icon name="uil:save" class="text-xl" />

          {{ isSavingTranscription ? 'Saving...' : 'Save Transcription' }}
        </button>

        <button
          class="btn w-full md:w-auto mb-2"
          @click="copyToClipboard(allText)"
        >
          <Icon name="uil:copy" class="text-xl" />
          Copy Text
        </button>

        <button
          class="btn w-full md:w-auto mb-2"
          @click="clearTranscripts"
        >
          <Icon name="uil:trash" class="text-xl" />
          Clear
        </button>
      </div>
    </div>

  </div>
</template>
