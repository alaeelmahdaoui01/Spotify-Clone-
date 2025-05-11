<template>
  <div class="logout-page d-flex justify-content-center align-items-center" style="height: 100vh;">
    <div class="text-center">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Logging out...</span>
      </div>
      <p class="text-light mt-3">Logging you out...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { logout: logoutFirebase } = useAuth()
const { logout: logoutSpotify } = useSpotify()

// Clear Spotify tokens from localStorage
const clearSpotifyTokens = () => {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_refresh_token')
  localStorage.removeItem('spotify_token_expires')
}

onMounted(async () => {
  try {
    // Logout from both services
    await Promise.all([
      logoutFirebase(),
      logoutSpotify()
    ])
    
    // Clear any remaining tokens from localStorage
    if (process.client) {
      clearSpotifyTokens()
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always redirect to home page after logout attempt
    router.push('/')
  }
})
</script>

<style scoped>
.logout-page {
  background: linear-gradient(to bottom, #1e1e1e, #121212);
}
</style> 