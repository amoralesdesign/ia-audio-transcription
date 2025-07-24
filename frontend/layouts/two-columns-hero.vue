<template>
  <main class="min-h-screen bg-gray-50 text-gray-900 flex justify-center">
    <div class="max-w-screen-xl sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
      <section class="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
        <Logo width="302" height="64" alt="App Logo" class="mx-auto m-12" />
        <slot />
      </section>
      <section class="flex-1 bg-indigo-100 text-center hidden lg:flex justify-center">
        <div class="text-white p-8 xl:m-24 bg-contain bg-center app-gradient rounded-xl">
          <Icon name="uil:brain" class="opacity-90 text-6xl my-6 text-white" />
          <h3 class="text-2xl font-bold mb-4">
            Intelligent Audio Transcriptions
          </h3>
          <p class="text-lg opacity-90 mb-6">
            Transform your audio files into text with advanced AI technology
          </p>
          <ul class="space-y-3 text-left max-w-sm mx-auto">
            <li v-for="advantage in advantages" :key="advantage" class="flex items-center">
              <Icon name="uil:check-circle" class="text-green-300 mr-2" />
              {{ advantage }}
            </li>
          </ul>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
const advantages = [
  'Transcription of files up to 20MB',
  'Real-time transcription',
  'History and download of transcriptions',
  'Multiple audio formats'
]
</script>
