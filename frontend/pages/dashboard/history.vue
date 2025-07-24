<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const {
  transcriptions,
  selectedTranscription,
  downloadingId,
  currentPage,
  hasNextPage,
  isLoading,
  error,
  loadNextPage,
  loadPreviousPage,
  viewTranscription,
  closeModal,
  downloadAudio,
  getStatusText,
  formatDate,
  formatFileSize,
  formatProcessingTime
} = useHistory()
</script>

<template>
  <div>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h2>History of Transcriptions</h2>
            <p class="mt-2 text-gray-600">Manage and download your previous transcriptions</p>
          </div>

          <NuxtLink
            to="/dashboard/upload"
            class="cta-btn hidden md:inline"
          >
            + New Transcription
          </NuxtLink>
        </div>
      </div>

      <Loading v-if="isLoading &&  !transcriptions.length" text="Loading history..." />

      <div v-else-if="!isLoading && !transcriptions.length" class="text-center py-12">
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-xl font-medium text-gray-900 mb-2">No hay transcriptions yet</h3>
        <p class="text-gray-600 mb-6">Start by uploading your first audio file!</p>
        <NuxtLink
          to="/dashboard/upload"
          class="cta-btn"
        >
          Create first transcription
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div v-if="hasNextPage || currentPage > 1" class="flex items-center justify-between mt-8 bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
          <div class="text-sm text-gray-700 mr-2">
            Showing {{ transcriptions.length }} transcriptions
          </div>
          <div class="flex space-x-2">
            <button
              v-if="currentPage > 1"
              :disabled="isLoading"
              class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 transition-colors"
              @click="loadPreviousPage"
            >
              <span class="hidden md:inline">←</span> Prev
            </button>
            <button
              v-if="hasNextPage"
              :disabled="isLoading"
              class="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 transition-colors"
              @click="loadNextPage"
            >
              Next <span class="hidden md:inline">→</span>
            </button>
          </div>
        </div>
        <div
          v-for="transcription in transcriptions"
          :key="transcription.transcriptionId"
          class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3">
                  <span
                    :class="{
                      'bg-green-100 text-green-800': transcription.status === 'completed',
                      'bg-yellow-100 text-yellow-800': transcription.status === 'processing',
                      'bg-red-100 text-red-800': transcription.status === 'failed',
                      'bg-gray-100 text-gray-800': transcription.status === 'pending'
                    }"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    <span
                      :class="{
                        'bg-green-400': transcription.status === 'completed',
                        'bg-yellow-400': transcription.status === 'processing',
                        'bg-red-400': transcription.status === 'failed',
                        'bg-gray-400': transcription.status === 'pending'
                      }"
                      class="w-1.5 h-1.5 rounded-full mr-1.5"
                    />
                    {{ getStatusText(transcription.status) }}
                  </span>

                  <span class="bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ transcription.language?.toUpperCase() || 'ES' }}
                  </span>
                </div>

                <h3 class="mt-2 text-lg font-semibold text-gray-900 truncate">
                  {{ transcription.filename }}
                </h3>

                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span class="flex items-center">
                    📅 {{ formatDate(transcription.createdAt) }}
                  </span>
                  <span class="flex items-center">
                    📊 {{ formatFileSize(transcription.fileSize) }}
                  </span>
                  <span v-if="transcription.metadata?.processingTime" class="flex items-center">
                    ⏱️ {{ formatProcessingTime(transcription.metadata.processingTime) }}
                  </span>
                </div>

                <div v-if="transcription.transcriptText && transcription.status === 'completed'" class="mt-3">
                  <p class="text-sm text-gray-700 line-clamp-2">
                    "{{ transcription.transcriptText.substring(0, 150) }}{{ transcription.transcriptText.length > 150 ? '...' : '' }}"
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-2 ml-4">
                <button
                  class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Ver detalles"
                  @click="viewTranscription(transcription)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>

                <button
                  v-if="transcription.status === 'completed'"
                  :disabled="downloadingId === transcription.transcriptionId"
                  class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Descargar audio"
                  @click="downloadAudio(transcription)"
                >
                  <svg v-if="downloadingId === transcription.transcriptionId" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-if="selectedTranscription" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click="closeModal">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" @click.stop>
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">{{ selectedTranscription.filename }}</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="closeModal">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <span class="text-sm text-gray-500">Status:</span>
              <p class="font-medium">{{ getStatusText(selectedTranscription.status) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Language:</span>
              <p class="font-medium">{{ selectedTranscription.language?.toUpperCase() || 'ES' }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Creation date:</span>
              <p class="font-medium">{{ formatDate(selectedTranscription.createdAt) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">File size:</span>
              <p class="font-medium">{{ formatFileSize(selectedTranscription.fileSize) }}</p>
            </div>
            <div v-if="selectedTranscription.metadata?.processingTime">
              <span class="text-sm text-gray-500">Processing time:</span>
              <p class="font-medium">{{ formatProcessingTime(selectedTranscription.metadata.processingTime) }}</p>
            </div>
          </div>

          <div v-if="selectedTranscription.transcriptText && selectedTranscription.status === 'completed'" class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium text-gray-900">Transcription</h3>

            </div>
            <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ selectedTranscription.transcriptText }}</p>
            </div>
          </div>

          <div v-else-if="selectedTranscription.status === 'failed'" class="mb-6">
            <h3 class="text-lg font-medium text-red-900 mb-3">Error in transcription</h3>
            <div class="bg-red-50 rounded-lg p-4">
              <p class="text-red-700">{{ selectedTranscription.metadata?.errorMessage || 'Error desconocido' }}</p>
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              v-if="selectedTranscription.status === 'completed'"
              :disabled="downloadingId === selectedTranscription.transcriptionId"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cta-btn disabled:opacity-50"
              @click="downloadAudio(selectedTranscription)"
            >
              <span v-if="downloadingId === selectedTranscription.transcriptionId">Downloading...</span>
              <span v-else>Download Audio</span>
            </button>
            <button class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg" @click="closeModal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
