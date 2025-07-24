<script setup lang="ts">
interface Props {
  to: string
  icon: string
  text: string
}

const props = defineProps<Props>()

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
<template>
  <li>
    <NuxtLink
      :to="to"
      class="py-4 px-1 border-b-2 whitespace-nowrap font-medium text-sm transition-colors flex items-center gap-2"
      :class="isActive
        ? 'border-indigo-500 text-indigo-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
    >
      <Icon :name="icon" class="text-lg" />
      {{ text }}
    </NuxtLink>
  </li>
</template>
