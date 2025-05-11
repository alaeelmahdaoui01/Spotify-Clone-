export default defineNuxtRouteMiddleware(async (to) => {

  if (process.client) {
    const { isAuthenticated, user, authInitialized } = useAuth()


    if (to.path === '/login' || to.path === '/signup') {
      return
    }

    if (!authInitialized.value) {
      console.log('Auth Middleware - Waiting for auth state to initialize...')
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('Auth Middleware - Current state:', {
      authInitialized: authInitialized.value,
      isAuthenticated: isAuthenticated.value,
      user: user.value ? {
        uid: user.value.uid,
        email: user.value.email,
        displayName: user.value.displayName
      } : null,
      route: to.fullPath
    })


    if (!isAuthenticated.value) {
      console.log('Auth Middleware - Redirecting to login')
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    console.log('Auth Middleware - User authenticated, proceeding to', to.fullPath)
  }
})



