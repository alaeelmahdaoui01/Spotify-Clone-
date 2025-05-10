export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client-side to avoid issues with SSR
  if (process.client) {
    const { isAuthenticated, user, authInitialized } = useAuth()

    // ✅ Allow public access to login and signup pages
    if (to.path === '/login' || to.path === '/signup') {
      return
    }

    // Wait for auth state to be initialized before making decisions
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

    // If not authenticated, redirect to login
    if (!isAuthenticated.value) {
      console.log('Auth Middleware - Redirecting to login')
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    console.log('Auth Middleware - User authenticated, proceeding to', to.fullPath)
  }
})



