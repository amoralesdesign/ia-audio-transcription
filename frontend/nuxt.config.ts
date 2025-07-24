export default defineNuxtConfig({
  compatibilityDate: '2025-01-19',
  devtools: { enabled: true },

  ssr: true,

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    '@vee-validate/nuxt',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/eslint'
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      speechmaticsApiKey: process.env.NUXT_PUBLIC_SPEECHMATICS_API_KEY
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
  },

  routeRules: {
    '/': { redirect: { to: '/login', statusCode: 302 } }
  },

  imports: {
    dirs: ['composables/**']
  }
})
