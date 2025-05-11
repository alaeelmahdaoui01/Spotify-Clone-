<template>
  
  <div v-if="isAuthenticated" class="spotify-app">
    <!-- Left Sidebar -->
    <nav class="sidebar bg-black">
      <div class="topthing p-3">
        <div class="logo-link">
        <svg viewBox="0 0 24 24" class="spotify-logo">
            <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span class="spotify-logo mb-0"> Spotify</span> </div>
        <!-- <h3 class="spotify-logo mb-0">Spotify</h3> -->
        <div class="dropdown me-2">
                <button class="btn btn-dark rounded-circle dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                  <img v-if="user?.photoURL" :src="user.photoURL" :alt="user?.displayName || 'User'" 
                      class="rounded-circle" width="32" height="32">
                  <i v-else class="bi bi-person"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" aria-labelledby="dropdownMenuButton">
                  <li class="dropdown-item-text text-white">User: {{ user?.displayName || user?.email?.split('@')[0] }}</li>
                  <li><hr class="dropdown-divider"></li>
                  <li><NuxtLink to="/profile" class="dropdown-item">Edit profile</NuxtLink></li>
                  <!-- <li><NuxtLink to="/debug-auth" class="dropdown-item">Debug Auth</NuxtLink></li> -->
                  <li><NuxtLink to="/logout" class="dropdown-item">
                    <span class="text-danger"><i class="bi bi-box-arrow-right me-2"></i>Log out</span>
                  </NuxtLink></li>
                </ul>
              </div>
      </div>

      <!-- Main Navigation -->
      <div class="nav-section mb-4">
        <ul class="nav flex-column">
          <li class="nav-item">
            <NuxtLink to="/" class="nav-link text-white d-flex align-items-center">
              <i class="bi bi-house-door-fill me-3"></i> Home
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/search" class="nav-link text-white d-flex align-items-center">
              <i class="bi bi-search me-3"></i> Search
            </NuxtLink>
          </li>
          <li class="nav-item" v-if="isAuthenticated">
            <NuxtLink to="/my-music" class="nav-link text-white d-flex align-items-center">
              <i class="bi bi-music-note-list me-3"></i> My Music
            </NuxtLink>
          </li>
          <li class="nav-item">
            <!-- <NuxtLink to="/player" class="nav-link text-white d-flex align-items-center">
              <i class="bi bi-speaker-fill me-3"></i>
              <span>Player</span>
            </NuxtLink> -->
          </li>
        </ul>
      </div>

      <!-- Spotify Connection Status -->
      <div v-if="isAuthenticated && !isSpotifyConnected" class="spotify-status-panel p-3 mb-3 rounded-3 bg-dark-subtle">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h6 class="mb-0">Connect to Spotify</h6>
        </div>
        <p class="text-muted small mb-2">Connect to see your playlists and listen to music</p>
        <button @click="connectSpotify" class="btn btn-success btn-sm rounded-pill w-100">
          <i class="bi bi-spotify me-2"></i> Connect
        </button>
      </div>

      <!-- Library Section -->
      <div class="library-section">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="library text-muted mb-0">Library</h6>
          <div class="buttons">
          <button 
            @click="createPlaylist" 
            class="btn btn-link text-white p-0"
            :disabled="!isConnected"
          >
            <i class="bi bi-plus-lg"></i>
          </button>
            <NuxtLink 
              to="/my-music"
              class="btn btn-link text-white p-0 text-decoration-none"
            >
              <div class="view"> View All </div>
          </NuxtLink>
          </div>
        </div>
        
        <!-- Playlists -->
        <div class="playlists">
          <div v-if="isLoading" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-light" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          
          <div v-else>
            <div v-for="playlist in userPlaylists.slice(0,4)" :key="playlist.id" class="playlist-item">
              <NuxtLink 
                :to="`/playlist/${playlist.id}`" 
                class="d-flex align-items-center text-white text-decoration-none py-2 px-3 rounded"
                :class="{ 'active': route.path === `/playlist/${playlist.id}` }"
              >
                <img 
                  :src="playlist.images?.[0]?.url || '/img/placeholder-playlist.png'" 
                  :alt="playlist.name"
                  class="playlist-cover me-3"
                >
                <div class="flex-grow-1">
                  <div class="text-truncate">{{ playlist.name }}</div>
                  <div class="text-muted small text-truncate">
                    {{ playlist.tracks.total }} tracks
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </nav>


    <main class="main-content">

      <!-- Page Content -->
      <div class="content-area">
        <div v-if="user && $route.path === '/'" class="welcome-banner p-4 mb-4 rounded-3 bg-success bg-opacity-25">
          <h3>Hello, {{ user.displayName || user.email?.split('@')[0] }}!</h3>
          <p>Explore your playlists or find something new to enjoy today.</p>
        </div>
        <slot />
      </div>

      <!-- Now Playing Bar -->
      <footer class="now-playing-bar bg-black p-3" >
        <div class="d-flex justify-content-between align-items-center">
          <!-- Track Info -->
          <div class="d-flex align-items-center" style="width: 30%">
            <div v-if="currentTrack">
              <img :src="currentTrack.album?.images?.[0]?.url || '/img/placeholder-album.png'" 
                   class="rounded me-3" width="56" height="56" :alt="currentTrack.name">
              <div>
                <div class="track-name">{{ currentTrack.name }}</div>
                <div class="artist-name text-muted small">{{ currentTrack.artists?.[0]?.name }}</div>
              </div>
              <span>
                <!-- <button class="btn btn-link text-white ms-3">
                <i class="bi bi-heart"></i>
              </button> -->
              </span>
              
            </div>
            <div v-else class="d-flex align-items-center">
              
              <!-- <NuxtLink to="/player" class="btn btn-link text-white ms-3" title="Open player" @click="footer=false">
                <div class="text-muted small">Click to see what's currently playing</div>
                <i class="bi bi-music-player"></i>
              </NuxtLink> -->
            </div>
          </div>

          <!-- Player Controls -->
          <div class="player-controls d-flex align-items-center gap-3">
            <button 
              @click="previousTrack" 
              class="btn btn-link text-white p-0"
              :disabled="!isSpotifyConnected"
            >
              <i class="bi bi-skip-start-fill fs-4"></i>
            </button>
            
            <button 
              @click="togglePlay" 
              class="btn btn-link text-white p-0"
              :disabled="!isSpotifyConnected"
            >
              <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'" class="fs-4"></i>
            </button>
            
            <button 
              @click="nextTrack" 
              class="btn btn-link text-white p-0"
              :disabled="!isSpotifyConnected"
            >
              <i class="bi bi-skip-end-fill fs-4"></i>
            </button>
            
            <div class="volume-control d-flex align-items-center gap-2">
              <i class="bi bi-volume-down text-white"></i>
              <input 
                type="range" 
                class="form-range" 
                min="0" 
                max="100" 
                v-model="volume"
                @input="updateVolume"
              >
              <i class="bi bi-volume-up text-white"></i>
            </div>
          </div>

          <div class="volume-controls d-flex align-items-center justify-content-end gap-3" style="width: 30%">
            <button class="btn btn-link text-white ms-3">
                <i class="bi bi-heart"></i>
              </button>
            <NuxtLink to="/player" @click="footer=false" class="btn btn-link text-white">
              <i class="bi bi-arrows-angle-expand"></i>
            </NuxtLink>
          </div>
        </div>
      </footer>
    </main>
  </div>

  <div v-else>
    <NavBar />
    <div class="main-content2">
      <div class="welcome-message2">
        <h1>Listen to millions of songs, for free.</h1>
        <p class="subtitle2">It seems you're not logged in. Please log in to continue.</p>
        <div class="cta-buttons2">
          <NuxtLink to="/login" class="cta-btn2 login-btn">Log in</NuxtLink>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useSpotify } from '~/composables/useSpotify'
import { useSpotifyPlayer } from '~/composables/useSpotifyPlayer'

interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images: { url: string }[]
  tracks: {
    total: number
  }
  owner: {
    display_name: string
  }
}

const router = useRouter()
const route = useRoute()
const { user, isAuthenticated, logout } = useAuth()
const { 
  getUserPlaylists, 
  createPlaylist: spotifyCreatePlaylist,
  login,
  isConnected,
  isInitialized
} = useSpotify()


const { 
  currentTrack, 
  isPlaying, 
  togglePlay, 
  nextTrack,
  previousTrack,
  setVolume
} = useSpotifyPlayer()

const isSpotifyConnected = computed(() => isInitialized.value && isConnected.value)

const isLoading = ref(true)
const footer = ref(true)
const userPlaylists = ref<SpotifyPlaylist[]>([])
const volume = ref(50)

// Load playlists
const loadPlaylists = async () => {
  if (!isConnected.value) return
  
  try {
    isLoading.value = true
    const playlists = await getUserPlaylists()
    userPlaylists.value = playlists
  } catch (error) {
    console.error('Error loading playlists:', error)
  } finally {
    isLoading.value = false
  }
}

// Create new playlist
const createPlaylist = async () => {
  if (!isConnected.value) return
  
  try {
    const name = prompt('Enter playlist name:')
    if (!name) return
    
    const description = prompt('Enter playlist description (optional):') || undefined
    
    const playlist = await spotifyCreatePlaylist(name, description)
    if (playlist) {
      // Reload playlists
      await loadPlaylists()
      // Navigate to the new playlist
      router.push(`/playlist/${playlist.id}`)
    }
  } catch (error) {
    console.error('Error creating playlist:', error)
    alert('Failed to create playlist. Please try again.')
  }
}

// Connect to Spotify
const connectSpotify = () => {
  login()
}

// Watch for connection changes
watch(isConnected, (newValue) => {
  if (newValue) {
    loadPlaylists()
  }
})

// Load playlists on mount if connected
onMounted(async () => {
  if (isConnected.value) {
    await loadPlaylists()
  }
})

// Handle logout
const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Handle track selection
const handleTrackSelect = (track: any) => {
  console.log('Selected track:', track)
  // TODO: Implement track playback
}

// Update volume
const updateVolume = () => {
  setVolume(volume.value)
}
</script>

<style scoped>
.spotify-app {
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100vh;
  background-color: #000000;
  color: white;
}

.sidebar {
  width: 300px;
  height: 100%;
  overflow-y: auto;
  background-color: #000000;
  border-right: 1px solid #282828;
  
}

.topthing{
  display:flex;
  flex-direction: row;
  justify-content:space-between
}

.main-content {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  background: linear-gradient(to bottom, #1e1e1e, #121212);
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.content-area {
  overflow-y: auto;
  padding: 20px;
}
.now-playing-bar {
  position: fixed; /* Fix the footer to the viewport */
  bottom: 0; /* Align it to the bottom of the viewport */
  left: 0; /* Align it to the left edge */
  width: 100%; /* Make it span the full width of the viewport */
  max-height: 150px;
  border-top: 1px solid #282828;
  background-color: #000; /* Ensure it has a background to cover content behind it */
  z-index: 1000; /* Ensure it stays above other elements */
}
.nav-link {
  color: #b3b3b3;
  transition: color 0.2s;
}

.nav-link:hover, .nav-link.active {
  color: white !important;
}

.play-button {
  background-color: #1DB954;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button:hover {
  transform: scale(1.1);
  background-color: #1ed760;
}

.progress {
  cursor: pointer;
  background-color: #4d4d4d;
}

.progress:hover .progress-bar {
  background-color: #1DB954;
}

.playlist-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.playlist-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background-color: rgba(255, 255, 255, 0.1);
}

.playlist-cover {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.hover-bg-dark:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 6px;
  border: 3px solid #000000;
}

::-webkit-scrollbar-thumb:hover {
  background: #888;
}

.spotify-logo {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: -1px;
}

.search-container {
  position: relative;
  min-width: 300px;
}


.main-content2 {
  background: linear-gradient(#1DB954, #191414);
  min-height: calc(100vh - 80px); /* Subtract navbar height */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
}

.welcome-message2 {
  text-align: center;
  max-width: 800px;
  padding: 40px;
  animation: fadeIn 0.8s ease;
}

h1 {
  font-size: 64px;
  font-weight: 900;
  margin-bottom: 24px;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle2 {
  font-size: 20px;
  margin-bottom: 40px;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons2 {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-btn2 {
  padding: 16px 48px;
  border-radius: 500px;
  font-weight: 700;
  font-size: 18px;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
}



.login-btn {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.login-btn:hover {
  transform: scale(1.05);
  background-color: rgba(255, 255, 255, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  h1 {
    font-size: 48px;
  }
  
  .subtitle2 {
    font-size: 18px;
  }
  
  .cta-btn2 {
    padding: 14px 36px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 36px;
  }
  
  .cta-buttons2 {
    flex-direction: column;
    gap: 12px;
  }
  
  .cta-btn2 {
    width: 100%;
  }
}

.view {
  
  font-size: 13px; /* Adjust the font size */
  font-weight: bold; /* Make the text bold */
  color: #048531; /* Spotify green color */
  cursor: pointer; /* Change the cursor to a pointer */
  transition: color 0.3s ease; /* Add a smooth transition effect */
  margin-right: 5px; 
}

.view a {
  text-decoration:none;
}

.view:hover {
  color: #0b8636; /* Lighter green on hover */
}

 
  
  .spotify-logo {
    width: 40px;
    height: 40px;
    color: #1DB954;
  }

  .logo-link {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    font-weight: 700;
    color: white;
    text-decoration: none;
  }

  .buttons{
    display:flex;
    flex-direction: row;
    gap : 4px; 
    align-items: center 
  }

.library{
  margin-left: 10px
}

.welcome-banner h3 {
  font-size: 28px;
  font-weight: bold;
  color: #1DB954; /* Spotify green */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
}

.welcome-banner p {
  font-size: 16px;
  color: #ffffff; /* White text */
  opacity: 0.8;
  line-height: 1.5;
}
</style> 


