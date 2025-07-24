import type { ApiResponse } from '~/types'

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  idToken?: string
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl

  const apiCall = async <T>(endpoint: string, options: ApiCallOptions = {}): Promise<T> => {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      if (options.idToken) {
        headers.Authorization = `Bearer ${options.idToken}`
      }

      const response = await $fetch<ApiResponse<T>>(`${baseURL}${endpoint}`, {
        ...options,
        headers
      })

      if (!response.success) {
        throw new Error(response.error || 'API Error')
      }

      return response.data!
    } catch (error: any) {
      if (error.status === 401 && error.data?.message?.includes('expired') && options.idToken) {
        const authStore = useAuthStore()
        const refreshed = await authStore.refreshTokens()

        if (refreshed) {
          const newIdToken = useCookie('transcription_id_token')
          const headers: any = {
            'Content-Type': 'application/json',
            ...options.headers,
            Authorization: `Bearer ${newIdToken.value}`
          }

          const response = await $fetch<ApiResponse<T>>(`${baseURL}${endpoint}`, {
            ...options,
            headers
          })

          if (!response.success) {
            throw new Error(response.error || 'API Error')
          }

          return response.data!
        }
      }
      throw error
    }
  }

  const auth = {
    login: (credentials: any) =>
      apiCall('/auth/login', { method: 'POST', body: credentials }),

    register: (userData: any) =>
      apiCall('/auth/register', { method: 'POST', body: userData }),

    confirm: (data: any) =>
      apiCall('/auth/confirm', { method: 'POST', body: data }),

    refresh: (refreshToken: string) =>
      apiCall('/auth/refresh', { method: 'POST', body: { refreshToken } }),

    logout: (token?: string) =>
      apiCall('/auth/logout', {
        method: 'POST',
        idToken: token
      }),

    me: (token: string) =>
      apiCall('/auth/me', {
        method: 'GET',
        idToken: token
      })
  }

  const transcriptions = {
    getUploadUrl: (data: any, idToken: string) =>
      apiCall('/transcriptions/upload-url', { method: 'POST', body: data, idToken }),

    process: (transcriptionId: string, idToken: string) =>
      apiCall(`/transcriptions/${transcriptionId}/process`, { method: 'POST', idToken }),

    get: (transcriptionId: string, idToken: string) =>
      apiCall(`/transcriptions/${transcriptionId}`, { idToken }),

    list: (params: { limit?: number; nextPage?: string; idToken: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.nextPage) queryParams.append('nextPage', params.nextPage)
      const query = queryParams.toString()
      return apiCall(`/transcriptions${query ? `?${query}` : ''}`, { idToken: params.idToken })
    },

    getDownloadUrl: (transcriptionId: string, idToken: string) =>
      apiCall(`/transcriptions/${transcriptionId}/download`, { idToken }),

    createRealtime: (data: { transcriptText: string; language: string }, idToken: string) =>
      apiCall('/transcriptions/realtime', { method: 'POST', body: data, idToken })
  }

  return {
    auth,
    transcriptions
  }
}
