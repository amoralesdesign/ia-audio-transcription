<script setup lang="ts">
import { registerSchema } from '~/utils/validation'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useField } from 'vee-validate'
import type { RegisterRequest } from '~/types'

definePageMeta({
  layout: 'two-columns-hero'
})

const authStore = useAuthStore()

const showConfirmationForm = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')
const confirmationCode = ref('')

const { handleSubmit, resetForm: resetValidationForm } = useForm({
  validationSchema: toTypedSchema(registerSchema)
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: username, errorMessage: usernameError } = useField<string>('username')
const { value: password, errorMessage: passwordError } = useField<string>('password')
const { value: confirmPassword, errorMessage: confirmPasswordError } = useField<string>('confirmPassword')

const resetForm = () => {
  resetValidationForm()
  confirmationCode.value = ''
  showConfirmationForm.value = false
  showSuccessMessage.value = false
  successMessage.value = ''
}

const handleRegister = handleSubmit(async (values) => {
  const registerData: RegisterRequest = {
    email: values.email.trim(),
    password: values.password.trim(),
    username: values.username?.trim() || undefined
  }

  const result = await authStore.register(registerData)

  if (result.requiresConfirmation) {
    showConfirmationForm.value = true
    successMessage.value = 'Account created. Check your email for the confirmation code.'
    showSuccessMessage.value = true
  }
})

const handleConfirmation = async () => {
  if (!email.value || !confirmationCode.value) return

  try {
    await authStore.confirmSignUp({
      email: email.value,
      confirmationCode: confirmationCode.value
    })

    showSuccessMessage.value = true
    successMessage.value = 'Account confirmed successfully. Logging in...'

    try {
      await authStore.login({
        email: email.value,
        password: password.value
      })
      await navigateTo('/dashboard', { replace: true })
    } catch (loginError) {
      successMessage.value = 'Account confirmed successfully. Please log in manually.'
    }
  } catch (err) {
    console.error('Error in confirmation:', err)
  }
}
</script>

<template>
  <div class="text-center">
    <h2>
      {{ showConfirmationForm ? 'Confirm your account' : 'Create Account' }}
    </h2>
    <p class="mt-2 mb-8">
      {{ showConfirmationForm
        ? 'A confirmation code has been sent to your email address.'
        : 'Join the leading audio transcription platform'
      }}
    </p>

    <div v-if="authStore.error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600 text-sm">{{ authStore.error }}</p>
    </div>

    <div v-if="showSuccessMessage" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-green-600 text-sm">{{ successMessage }}</p>
    </div>

    <form v-if="showConfirmationForm" class="mx-auto max-w-xs" @submit.prevent="handleConfirmation">
      <FormInput
        v-model="confirmationCode"
        type="text"
        placeholder="Código de confirmación"
        maxlength="6"
      />

      <button
        type="submit"
        :disabled="authStore.isLoading || !confirmationCode"
        class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cta-btn disabled:opacity-50"
      >
        <span v-if="authStore.isLoading" class="flex items-center justify-center">
          Confirming...
        </span>
        <span v-else>Confirm account</span>
      </button>

      <div class="mt-4 text-center">
        <button
          type="button"
          class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          @click="resetForm"
        >
          Back to registration
        </button>
      </div>
    </form>

    <form v-else novalidate class="mx-auto max-w-xs" @submit.prevent="handleRegister">
      <FormInput
        v-model="email"
        type="email"
        placeholder="Email"
        :error="emailError"
      />

      <FormInput
        v-model="username"
        type="text"
        placeholder="Username (optional)"
        :error="usernameError"
      />

      <FormInput
        v-model="password"
        type="password"
        placeholder="Password"
        :error="passwordError"
      />

      <FormInput
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        :error="confirmPasswordError"
      />

      <button
        type="submit"
        :disabled="authStore.isLoading"
        class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cta-button disabled:opacity-50"
      >
        <span v-if="authStore.isLoading" class="flex items-center justify-center">
          Creating account...
        </span>
        <span v-else>
          Create Account
        </span>
      </button>
    </form>

    <p v-if="!showConfirmationForm" class="mt-6">
      Already have an account?
      <NuxtLink to="/login" class="text-indigo-600 hover:text-indigo-800">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
