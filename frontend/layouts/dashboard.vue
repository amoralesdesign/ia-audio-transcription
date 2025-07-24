<script setup lang="ts">
import Logo from '~/components/Logo.vue'

const authStore = useAuthStore()
const { user, isLoading } = storeToRefs(authStore)
const isLoggingOut = ref(false)

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    await authStore.logout()
  } catch (error: any) {
    console.error(error)
  } finally {
    isLoggingOut.value = false
  }
}

</script>
<template>
  <div>
    <header class="bg-white">
      <div class="max-w-7xl mx-auto px-6 flex justify-between items-center py-4 shadow-sm">
        <NuxtLink to="/dashboard">
          <Logo width="200" alt="App Logo" />
        </NuxtLink>
        <div class="flex items-center space-x-4">
          <span v-if="!isLoading" class="hidden sm:inline-block text-sm text-gray-700">Hello, {{ user?.username || user?.email || 'Usuario' }}</span>
          <button
            :disabled="isLoggingOut"
            class="border-l border-gray-300 text-indigo-600 px-4 py-2 gap-1  flex items-center text-sm font-medium"
            @click="handleLogout"
          >
            <Icon name="uil:exit" class="text-xl" />

            {{ isLoggingOut ? 'Closing session...' : 'Logout' }}
          </button>
        </div>
      </div>
      <Nav class="border-b border-gray-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NavItem to="/dashboard" icon="uil:chart-bar" text="Dashboard" />
        <NavItem to="/dashboard/upload" icon="uil:folder-upload" text="Upload Audio" />
        <NavItem to="/dashboard/realtime" icon="uil:microphone" text="Realtime" />
        <NavItem to="/dashboard/history" icon="uil:history" text="History" />
      </Nav>
    </header>

    <main class="flex-1 min-h-screen bg-gray-50">
      <div v-if="isLoggingOut" class="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50">
        <div class="rounded-lg p-6 flex items-center w-full h-full justify-center">
          <Loading text="Closing session..." />
        </div>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <slot />
      </div>
    </main>

  </div>
</template>
