import type {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  ConfirmSignUpRequest
} from '~/types'

export const useAuthStore = defineStore('auth', () => {

  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = computed(() => !!getToken())

  const api = useApi()

  const accessToken = useCookie<string | null>('transcription_access_token', {
    default: () => null,
    secure: true,
    sameSite: 'strict'
  })

  const idToken = useCookie<string | null>('transcription_id_token', {
    default: () => null,
    secure: true,
    sameSite: 'strict'
  })

  const refreshToken = useCookie<string | null>('transcription_refresh_token', {
    default: () => null,
    secure: true,
    sameSite: 'strict'
  })

  const getToken = () => accessToken.value
  const getIdToken = () => idToken.value

  const setTokens = (tokens: { accessToken: string; idToken: string; refreshToken?: string }) => {
    accessToken.value = tokens.accessToken
    idToken.value = tokens.idToken
    if (tokens.refreshToken) {
      refreshToken.value = tokens.refreshToken
    }
  }

  const clearTokens = () => {
    accessToken.value = null
    idToken.value = null
    refreshToken.value = null
  }

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      isLoading.value = true
      error.value = null

      const loginData = await api.auth.login(credentials) as LoginResponse

      setTokens({
        accessToken: loginData.accessToken,
        idToken: loginData.idToken,
        refreshToken: loginData.refreshToken
      })
      user.value = loginData.user

      return loginData
    } catch (err: any) {
      error.value = err.data?.error || err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<{ requiresConfirmation: boolean }> => {
    try {
      isLoading.value = true
      error.value = null

      await api.auth.register(userData)

      return { requiresConfirmation: true }

    } catch (err: any) {
      error.value = err.data?.error || err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const confirmSignUp = async (data: ConfirmSignUpRequest): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      await api.auth.confirm(data)
    } catch (err: any) {
      error.value = err.data?.error || err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const refreshTokens = async (): Promise<boolean> => {
    try {

      if (!refreshToken.value) {
        return false
      }

      const data = await api.auth.refresh(refreshToken.value) as any

      setTokens({
        accessToken: data.accessToken,
        idToken: data.idToken
      })
      return true
    } catch (err: any) {
      await logout()
      return false
    }
  }

  const checkAuth = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const token = getToken()
      if (!token) {
        return
      }

      const userData = await api.auth.me(token) as User

      user.value = userData
    } catch (err: any) {
      clearTokens()
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const token = getToken()
      if (token) {
        await api.auth.logout(token)
      }
    } catch (err: any) {
      console.error('Error logging out:', err)
    } finally {
      clearTokens()
      user.value = null
      isLoading.value = false
      await navigateTo('/login')
    }
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated,

    login,
    register,
    confirmSignUp,
    refreshTokens,
    checkAuth,
    logout,

    getToken,
    getIdToken,
    setTokens,
    clearTokens
  }
})
