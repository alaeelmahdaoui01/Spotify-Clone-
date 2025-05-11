<template>
  
  <div v-if="isAuthenticated" class="spotify-app">
    <!-- Left Sidebar -->
    <nav class="sidebar bg-black">
      <div class="topthing p-3">
        <div class="logo-link">
          <svg viewBox="0 0 24 24" class="spotify-logo">
            <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span class="spotify-logo mb-0"> Spotify</span>
        </div>
        <div class="dropdown">
          <button class="btn btn-outline-light border-0 p-0 dropdown-toggle d-flex align-items-center gap-2" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
            <div class="profile-pic-container">
              <img 
                v-if="user?.photoURL" 
                :src="user.photoURL" 
                :alt="user?.displayName || 'User'" 
                class="profile-pic"
              >
              <div v-else class="profile-pic-placeholder">
                <i class="bi bi-person-fill"></i>
              </div>
            </div>
            <span class="profile-name d-none d-md-inline">{{ user?.displayName || user?.email?.split('@')[0] }}</span>
          </button>

          <ul class="dropdown-menu dropdown-menu-dark mt-2" aria-labelledby="dropdownMenuButton">
            <li class="dropdown-header">
              <div class="user-info">
                <div class="user-name">{{ user?.displayName || user?.email?.split('@')[0] }}</div>
                <div class="user-email text-muted small">{{ user?.email }}</div>
              </div>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <NuxtLink to="/profile" class="dropdown-item">
                <i class="bi bi-person me-2"></i>Profile
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/account" class="dropdown-item">
                <i class="bi bi-gear me-2"></i>Account
              </NuxtLink>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <NuxtLink to="/logout" class="dropdown-item text-danger">
                <i class="bi bi-box-arrow-right me-2"></i>Log out
              </NuxtLink>
            </li>
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
        </ul>
      </div>

      <div class="library-section">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h6 class="library text-muted mb-0">
      <NuxtLink to="/my-music" class="nav-link text-white d-flex align-items-center">
        <i class="bi bi-music-note-list me-3"></i> Library
      </NuxtLink>
    </h6>
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

  <!-- 🔍 Search Bar -->
  <div class="inputbar input-group mb-3">
  <span class="input-group-text bg-dark border-secondary text-light">
    <i class="bi bi-search"></i>
  </span>
  <input
    type="text"
    class="form-control bg-dark border-secondary text-light"
    v-model="searchQuery"
    placeholder="Search playlists..."
    aria-label="Search"
  />
</div>

  <!-- Playlists -->
  <div class="playlists">
    <div v-if="isLoading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else>
      <NuxtLink 
        to="/likedsongs" 
        class="d-flex align-items-center text-white text-decoration-none py-2 px-3 rounded"
      >
        <img 
          src="https://misc.scdn.co/liked-songs/liked-songs-640.png" 
          alt="likedsongs"
          class="playlist-cover me-3"
        >
        <div class="flex-grow-1">
          <div class="text-truncate">Liked songs</div>
          <div class="text-muted small text-truncate">📌</div>
        </div>
      </NuxtLink>

      <!-- 🔁 Filtered Playlists -->
      <div 
        v-for="playlist in filteredPlaylists" 
        :key="playlist.id" 
        class="playlist-item"
      >
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
              {{ playlist.tracks.total }} songs • {{ playlist.owner.display_name }}
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
          <div class="player-controls d-flex flex-column align-items-center gap-2" style="width: 40%">
            <div class="d-flex align-items-center gap-3">
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
            </div>

            <div class="progress-container d-flex align-items-center gap-2 w-100 px-2">
              <span class="time current-time">{{ formatTime(currentTime) }}</span>
              <div class="progress flex-grow-1" style="height: 4px;" @click="seekTo">
                <div 
                  class="progress-bar bg-white" 
                  role="progressbar" 
                  :style="{ width: `${progressPercentage}%` }"
                ></div>
              </div>
              <span class="time total-time">{{ formatTime(duration) }}</span>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
  setVolume,
  seek,
  getCurrentState
} = useSpotifyPlayer()

const isSpotifyConnected = computed(() => isInitialized.value && isConnected.value)

const isLoading = ref(true)
const footer = ref(true)
const userPlaylists = ref<SpotifyPlaylist[]>([])
const volume = ref(50)

const currentTime = ref(0)
const duration = ref(0)
const progressPercentage = ref(0)
const isDragging = ref(false)

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

// Format time in MM:SS
const formatTime = (ms: number) => {
  if (!ms) return '0:00'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Handle seeking
const seekTo = (event: MouseEvent) => {
  if (!isSpotifyConnected.value) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const seekTime = Math.floor(percent * duration.value)
  
  seek(seekTime)
  currentTime.value = seekTime
  progressPercentage.value = (seekTime / duration.value) * 100
}

// Update progress
const updateProgress = async () => {
  if (!isSpotifyConnected.value || !isPlaying.value) return
  
  try {
    const state = await getCurrentState()
    if (state) {
      currentTime.value = state.position
      duration.value = state.duration
      progressPercentage.value = (state.position / state.duration) * 100
    }
  } catch (error) {
    console.error('Error updating progress:', error)
  }
}

// Start progress updates when playing
watch(isPlaying, (newValue) => {
  if (newValue) {
    const interval = setInterval(updateProgress, 1000)
    onUnmounted(() => clearInterval(interval))
  }
})

// Update initial state
onMounted(async () => {
  if (isSpotifyConnected.value) {
    await updateProgress()
  }
})

// Search query
const searchQuery = ref('')


// Filtered playlists based on search query
const filteredPlaylists = computed(() =>
  userPlaylists.value.filter(playlist =>
    playlist.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)
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

.topthing {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px !important;
  border-bottom: 1px solid #282828;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  height: 40px;
}

.spotify-logo {
  width: 32px;
  height: 32px;
  color: #1DB954;
}

.btn-outline-light {
  border: none;
  padding: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 23px;
  background-color: rgba(0, 0, 0, 0.7);
  height: 32px;
}

.profile-pic-container {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #282828;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.profile-name {
  font-size: 13px;
  font-weight: 600;
  color: white;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
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

.buttons{
  display:flex;
  flex-direction: row;
  gap : 4px; 
  align-items: center 
}

.library{
  margin-left: 20px
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

.inputbar {
  margin-left: 20px;
  max-width: 200px;
  font-size: 0.875rem;
}

.inputbar input::placeholder {
  color: #ccc !important; /* Make placeholder more visible */
  opacity: 1; /* Fix for Firefox */
}

.inputbar .input-group-text {
  padding: 0.375rem 0.5rem;
}

.inputbar .form-control {
  padding: 0.375rem 0.5rem;
}

/* Remove the spotify-status-panel styles */
.spotify-status-panel {
  display: none;
}

.dropdown-menu {
  background-color: #282828;
  border: 1px solid #404040;
  border-radius: 4px;
  padding: 4px;
  min-width: 240px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  margin-top: 8px !important;
}

.dropdown-menu::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 16px;
  width: 12px;
  height: 12px;
  background-color: #282828;
  border-left: 1px solid #404040;
  border-top: 1px solid #404040;
  transform: rotate(45deg);
}

.dropdown-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid #404040;
}

.user-info {
  padding: 4px 0;
}

.user-name {
  color: white;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
  letter-spacing: 0.3px;
}

.user-email {
  font-size: 12px;
  color: #b3b3b3;
  letter-spacing: 0.2px;
}

.dropdown-item {
  color: #b3b3b3;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  border-radius: 2px;
  margin: 2px 4px;
  width: calc(100% - 8px);
}

.dropdown-item:hover {
  color: white;
  background-color: #404040;
}

.dropdown-item i {
  font-size: 16px;
  width: 20px;
  opacity: 0.9;
}

.dropdown-item.text-danger {
  color: #ff4e45 !important;
  margin-top: 4px;
}

.dropdown-item.text-danger:hover {
  background-color: rgba(255, 78, 69, 0.1);
  color: #ff4e45 !important;
}

.dropdown-divider {
  border-color: #404040;
  margin: 4px 0;
  opacity: 0.5;
}

.dropdown-caret {
  font-size: 12px;
  color: #b3b3b3;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.btn-outline-light.show .dropdown-caret {
  transform: rotate(180deg);
  color: white;
}

@media (max-width: 768px) {
  .topthing {
    padding: 12px 16px !important;
  }
  
  .logo-link {
    font-size: 20px;
    height: 32px;
  }
  
  .spotify-logo {
    width: 28px;
    height: 28px;
  }
  
  .btn-outline-light {
    height: 28px;
  }
  
  .profile-pic-container {
    width: 20px;
    height: 20px;
  }
}

.progress-container {
  position: relative;
  cursor: pointer;
}

.progress {
  background-color: #4d4d4d;
  border-radius: 2px;
  cursor: pointer;
  transition: height 0.1s ease;
}

.progress:hover {
  height: 6px !important;
}

.progress-bar {
  background-color: #b3b3b3;
  transition: width 0.1s linear;
}

.progress:hover .progress-bar {
  background-color: #1DB954;
}

.time {
  font-size: 11px;
  color: #b3b3b3;
  min-width: 40px;
  text-align: center;
}

.player-controls {
  position: relative;
}

.player-controls .btn-link {
  opacity: 0.7;
  transition: all 0.2s ease;
}

.player-controls .btn-link:hover {
  opacity: 1;
  transform: scale(1.1);
}

.player-controls .btn-link:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style> 


