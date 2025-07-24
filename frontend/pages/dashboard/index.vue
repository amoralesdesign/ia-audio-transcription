<template>

  <div>

    <Loading v-if="isLoading" text="Loading dashboard..." />

    <section v-else>
      <div class="mb-8">
        <h2>Welcome!</h2>
        <p class="text-gray-600 text-lg">Manage your audio transcriptions in a smart way</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

        <NuxtLink class="app-card" to="/dashboard/upload">
          <div class="text-center">
            <Icon name="duo-icons:folder-upload" class="text-6xl text-purple-400" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Upload Audio</h3>
            <p class="text-gray-600 mb-4">Transcribe audio files up to 20MB</p>
          </div>
        </NuxtLink>

        <NuxtLink class="app-card" to="/dashboard/realtime">
          <div class="text-center">
            <Icon name="duo-icons:message" class="text-6xl text-purple-400" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Realtime</h3>
            <p class="text-gray-600 mb-4">Transcribe in real time from your microphone</p>
          </div>
        </NuxtLink>

        <NuxtLink class="app-card" to="/dashboard/history">
          <div class="text-center">
            <Icon name="duo-icons:book-3" class="text-6xl text-purple-400" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">History</h3>
            <p class="text-gray-600 mb-4">View and download transcriptions</p>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const authStore = useAuthStore()
const { user, isLoading } = storeToRefs(authStore)

onMounted(async () => {
  if (!user.value) {
    await authStore.checkAuth()
  }
})
</script>
