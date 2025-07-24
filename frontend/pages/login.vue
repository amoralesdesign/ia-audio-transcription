<script setup lang="ts">
import { loginSchema } from '~/utils/validation'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useField } from 'vee-validate'

definePageMeta({
  layout: 'two-columns-hero'
})

const authStore = useAuthStore()

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(loginSchema)
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

const handleLogin = handleSubmit(async (values) => {
  await authStore.login(values)
  await navigateTo('/dashboard', { replace: true })
})
</script>

<template>
  <div class="text-center">
    <h2>Login</h2>
    <p class="mt-2 mb-8">
      Access your audio transcription platform
    </p>
    <div v-if="authStore.error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600 text-sm">{{ authStore.error }}</p>
    </div>

    <form novalidate class="mx-auto max-w-xs" @submit.prevent="handleLogin">
      <FormInput
        v-model="email"
        type="email"
        placeholder="Email"
        :error="emailError"
      />
      <FormInput
        v-model="password"
        type="password"
        placeholder="Password"
        :error="passwordError"
      />

      <button
        type="submit"
        :disabled="authStore.isLoading"
        class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cta-btn disabled:opacity-50"
      >
        <span v-if="authStore.isLoading" class="flex items-center justify-center">
          Logging in...
        </span>
        <span v-else>
          Login
        </span>
      </button>
    </form>
    <p class="mt-6">
      Don't have an account? <NuxtLink to="/register" class="text-indigo-600 hover:text-indigo-800">Create an account</NuxtLink>
    </p>
  </div>
</template>
