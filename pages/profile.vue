<template>
  <div class="container-fluid profile-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-light">Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger m-3">
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <div>
          <strong>Error</strong>
          <p class="mb-0">{{ error }}</p>
        </div>
      </div>
      <button @click="loadProfile" class="btn btn-danger mt-3">
        <i class="bi bi-arrow-clockwise me-2"></i>
        Retry
      </button>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="profile-content">
      <!-- Profile Header -->
      <div class="profile-header p-4" :style="headerStyle">
        <div class="d-flex align-items-end">
          <img 
            :src="profile.images?.[0]?.url || '/img/placeholder-user.png'" 
            class="rounded-circle shadow me-4" 
            width="200" 
            height="200" 
            :alt="profile.display_name"
          >
          <div class="profile-info">
            <h1 class="mb-2">{{ profile.display_name }}</h1>
            <div class="d-flex align-items-center mb-4">
              <span class="text-muted">{{ profile.followers?.total?.toLocaleString() }} followers</span>
              <span class="text-muted mx-2">•</span>
              <span class="text-muted">{{ profile.country }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Details -->
      <div class="profile-details p-4">
        <div class="row g-4">
          <!-- Account Information -->
          <div class="col-md-6">
            <div class="card bg-dark text-white">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="bi bi-person-circle me-2"></i>
                  Account Information
                </h5>
              </div>
              <div class="card-body">
                <div class="info-item mb-3">
                  <label class="text-muted">Email</label>
                  <div class="text-white">{{ profile.email }}</div>
                </div>
                <div class="info-item mb-3">
                  <label class="text-muted">Spotify ID</label>
                  <div class="text-white">{{ profile.id }}</div>
                </div>
                <div class="info-item mb-3">
                  <label class="text-muted">Account Type</label>
                  <div class="text-white">
                    <span class="badge" :class="profile.product === 'premium' ? 'bg-success' : 'bg-secondary'">
                      {{ profile.product?.charAt(0).toUpperCase() + profile.product?.slice(1) }}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <label class="text-muted">Country</label>
                  <div class="text-white">{{ profile.country }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Account Statistics -->
          <div class="col-md-6">
            <div class="card bg-dark text-white">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="bi bi-graph-up me-2"></i>
                  Account Statistics
                </h5>
              </div>
              <div class="card-body">
                <div class="info-item mb-3">
                  <label class="text-muted">Followers</label>
                  <div class="text-white">{{ profile.followers?.total?.toLocaleString() }}</div>
                </div>
                <div class="info-item mb-3">
                  <label class="text-muted">Following</label>
                  <div class="text-white">{{ profile.following?.total?.toLocaleString() || '0' }}</div>
                </div>
                <div class="info-item mb-3">
                  <label class="text-muted">Playlists</label>
                  <div class="text-white">{{ userPlaylists.length }}</div>
                </div>
                <div class="info-item">
                  <label class="text-muted">Account Created</label>
                  <div class="text-white">{{ formatDate(profile.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSpotify } from '~/composables/useSpotify'

interface SpotifyProfile {
  id: string
  display_name: string
  email: string
  country: string
  product: string
  images: { url: string }[]
  followers: {
    total: number
  }
  created_at?: string
}

const { getUserProfile, getUserPlaylists, isConnected, isInitialized } = useSpotify()

const isLoading = ref(true)
const error = ref<string | null>(null)
const profile = ref<SpotifyProfile | null>(null)
const userPlaylists = ref<any[]>([])

// Compute header background style
const headerStyle = computed(() => {
  if (!profile.value?.images?.[0]?.url) return {}
  
  return {
    background: `linear-gradient(to bottom, rgba(0,0,0,0.7), #121212), url(${profile.value.images[0].url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
})

// Load profile data
const loadProfile = async () => {
  if (!isConnected.value) return

  try {
    isLoading.value = true
    error.value = null

    // Load user profile and playlists
    const [profileData, playlistsData] = await Promise.all([
      getUserProfile(),
      getUserPlaylists()
    ])
    
    profile.value = profileData.body
    userPlaylists.value = playlistsData
  } catch (err) {
    console.error('Error loading profile:', err)
    error.value = 'Failed to load profile data'
  } finally {
    isLoading.value = false
  }
}

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    // Wait for Spotify to initialize
    await new Promise<void>((resolve) => {
      if (isInitialized.value) {
        resolve()
      } else {
        const unwatch = watch(isInitialized, (newValue) => {
          if (newValue) {
            unwatch()
            resolve()
          }
        })
      }
    })
    
    // Only try to load data if we have a token
    if (isConnected.value) {
      loadProfile()
    }
  } catch (error) {
    console.error('Error in initialization:', error)
    isLoading.value = false
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #121212;
  padding-bottom: 90px; /* Account for now playing bar */
}

.profile-header {
  background: linear-gradient(to bottom, rgba(0,0,0,0.7), #121212);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  backdrop-filter: blur(20px);
  z-index: 0;
}

.profile-header > div {
  position: relative;
  z-index: 1;
}

.profile-info {
  color: white;
}

.profile-info h1 {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.profile-info .text-muted {
  font-size: 0.9rem;
  opacity: 0.8;
}

.profile-details {
  padding: 2rem;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

.card-header {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
}

.card-header h5 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

.info-item label {
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  display: block;
}

.info-item .text-white {
  font-size: 1rem;
  font-weight: 500;
}

.badge {
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
}

.bg-success {
  background-color: #1DB954 !important;
}

.bg-secondary {
  background-color: #535353 !important;
}

/* Loading and Error States */
.spinner-border {
  width: 2rem;
  height: 2rem;
  border-width: 0.2em;
  color: #1DB954;
}

.alert-danger {
  background-color: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.2);
  color: #ff4e45;
}

.alert-danger .bi-exclamation-triangle {
  color: #ff4e45;
}

.btn-danger {
  background-color: #ff4e45;
  border-color: #ff4e45;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background-color: #ff6b63;
  border-color: #ff6b63;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .profile-header {
    padding: 1.5rem;
  }

  .profile-info h1 {
    font-size: 2rem;
  }

  .profile-header img {
    width: 150px;
    height: 150px;
  }

  .profile-details {
    padding: 1rem;
  }

  .card-header {
    padding: 0.75rem 1rem;
  }

  .card-body {
    padding: 1rem;
  }
}
</style> 