<script setup lang="ts">
interface Props {
  id?: string
  type?: string
  placeholder: string
  error?: string
}

const props = defineProps<Props>()

const modelValue = defineModel<string>({ default: '' })
</script>

<template>
  <div class="mb-4">
    <input
      :id="id"
      v-model="modelValue"
      :type="type || 'text'"
      :placeholder="placeholder"
      class="app-input"
      :class="{ 'border-red-500': error }"
      required
    >
    <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
  </div>
</template>
