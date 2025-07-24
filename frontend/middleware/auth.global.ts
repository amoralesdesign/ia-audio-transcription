export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()

  const routes = {
    guest: ['/login', '/register'],
    protected: ['/dashboard']
  }

  const isGuest = routes.guest.includes(to.path)
  const isAuthenticated = auth.isAuthenticated || !!auth.getToken()

  if (isGuest) {
    return isAuthenticated ? navigateTo('/dashboard') : undefined
  }

  return isAuthenticated ? undefined : navigateTo('/login')
})
