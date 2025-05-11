<template>
  <div class="container-fluid">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-light">Loading your music...</p>
    </div>

    <!-- Connection Status -->
    <div v-else-if="!isConnected" class="alert alert-info m-3">
      <div class="d-flex align-items-center">
        <i class="bi bi-spotify me-2"></i>
        <div>
          <strong>Connect to Spotify</strong>
          <p class="mb-0">Connect your Spotify account to see your personalized content.</p>
        </div>
      </div>
      <div class="mt-3">
        <button @click="connectSpotify" class="btn btn-success rounded-pill px-4 py-2" :disabled="isConnecting">
          <i class="bi bi-spotify me-2"></i>
          {{ isConnecting ? 'Connecting...' : 'Connect to Spotify' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Recently Played Section -->
      <section class="mb-5">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0">Recently Played</h2>
    <NuxtLink to="/recentlyplayed" class="">
      View all
    </NuxtLink>
  </div>

  <div class="row g-4">
    <div v-for="item in recentlyPlayed.slice(0,4)" :key="item.track.id" class="col-md-4 col-lg-3">
      <div class="card bg-dark text-white h-100">
        <img 
          :src="item.track.album.images[0].url" 
          class="card-img-top" 
          :alt="item.track.name"
        >
        <div class="card-body position-relative">
          <h5 class="card-title">{{ item.track.name }}</h5>
          <p class="card-text text-muted small">
            {{ item.track.artists.map(a => a.name).join(', ') }}
          </p>
          <button 
            @click="playTrack(item.track)" 
            class="play-button-overlay btn btn-success rounded-circle"
            :disabled="!isPlayerReady"
          >
            <i class="bi bi-play-fill fs-4"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>


      <section class="mb-5">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0">Your Latest Liked Songs</h2>
    <NuxtLink to="/likedsongs" class="">
      View all
    </NuxtLink>
  </div>

  <div class="row g-4">
    <div
      v-for="item in likedSongs.slice(0,4)"
      :key="item.track.id"
      class="col-md-4 col-lg-3"
    >
      <div class="card bg-dark text-white h-100">
        <img 
          :src="item.track.album.images[0].url" 
          class="card-img-top" 
          :alt="item.track.name"
        >
        <div class="card-body position-relative">
          <h5 class="card-title">{{ item.track.name }}</h5>
          <p class="card-text text-muted small">
            {{ item.track.artists.map(a => a.name).join(', ') }}
          </p>
          <button 
            @click="playTrack(item.track)" 
            class="play-button-overlay btn btn-success rounded-circle"
            :disabled="!isPlayerReady"
          >
            <i class="bi bi-play-fill fs-4"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>


      <!-- Your Playlists Section -->
      <section class="mb-5">
        <h2 class="mb-4">Your Latest Playlists</h2>
        <div class="row g-4">
          <div v-for="playlist in userPlaylists.slice(0,4)" :key="playlist.id" class="col-md-4 col-lg-3">
            <div class="card bg-dark text-white h-100">
              <img 
                :src="playlist.images?.[0]?.url || '/img/placeholder-playlist.png'" 
                class="card-img-top" 
                :alt="playlist.name"
              >
              <div class="card-body">
                <h5 class="card-title">{{ playlist.name }}</h5>
                <p class="card-text text-muted small">
                  {{ playlist.tracks.total }} songs • {{ playlist.owner.display_name }}
                </p>
                <div class="d-flex gap-2">
                  <!-- <button 
                    @click="playPlaylist(playlist)" 
                    class="btn btn-success btn-sm"
                    :disabled="!isPlayerReady"
                  >
                    <i class="bi bi-play-fill"></i> Play
                  </button> -->
                  <!-- <NuxtLink 
                    :to="`/playlist/${playlist.id}`" 
                    class="btn btn-outline-light btn-sm"
                  >
                    <i class="bi bi-list"></i> View Playlist
                  </NuxtLink> -->


                  <NuxtLink 
                    :to="`/playlist/${playlist.id}`" 
                  class="play-button-overlay2 btn  btn-sm"
                  >
                      <i class="bi bi-play-fill fs-4"></i> View Playlist
                    </NuxtLink>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section class="mb-5">
        <h2 class="mb-4">Made For You</h2>
        <div class="row g-4">
          <div v-for="playlist in featuredPlaylists.slice(0,4)" :key="playlist.id" class="col-md-4 col-lg-3">
            <div class="card bg-dark text-white h-100">
              <img 
                :src="playlist.images?.[0]?.url || '/img/placeholder-playlist.png'" 
                class="card-img-top" 
                :alt="playlist.name"
              >
              <div class="card-body">
                <h5 class="card-title">{{ playlist.name }}</h5>
                <p class="card-text text-muted small">
                  {{ playlist.tracks.total }} songs - By {{ playlist.owner.display_name }}
                </p>
                <div class="d-flex gap-2">
                  <!-- <button 
                    @click="playPlaylist(playlist)" 
                    class="btn btn-success btn-sm"
                    :disabled="!isPlayerReady"
                  >
                    <i class="bi bi-play-fill"></i> Play
                  </button> -->
                  <!-- <NuxtLink 
                    :to="`/playlist/${playlist.id}`" 
                    class="btn btn-outline-light btn-sm"
                  >
                    <i class="bi bi-list"></i> View Playlist
                  </NuxtLink> -->


                  <NuxtLink 
                    :to="`/playlist/${playlist.id}`" 
                  class="play-button-overlay btn btn-success rounded-circle"
                  >
                      <i class="bi bi-play-fill fs-4"></i> View Playlist
                    </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSpotify } from '~/composables/useSpotify'
import { useSpotifyPlayer } from '~/composables/useSpotifyPlayer'

interface SpotifyTrack {
  id: string
  name: string
  uri: string
  album: {
    images: { url: string }[]
  }
  artists: Array<{ name: string }>
}

interface RecentlyPlayedItem {
  track: SpotifyTrack
  played_at: string
}

interface LikedSong {
  track: SpotifyTrack
  added_at: string
}

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

const { 
  getFeaturedPlaylists,
  getMyuniqueRecentlyPlayed, 
  getUserPlaylists, 
  getLikedSongs,
  login,
  logout,
  isConnected,
  isInitialized,
  play
} = useSpotify()

const { playTrack: playerPlayTrack, isPlayerReady } = useSpotifyPlayer()

const isLoading = ref(true)
const isConnecting = ref(false)
const recentlyPlayed = ref<RecentlyPlayedItem[]>([])
const userPlaylists = ref<SpotifyPlaylist[]>([])
const featuredPlaylists = ref<SpotifyPlaylist[]>([])
const likedSongs = ref<LikedSong[]>([])

onMounted(async () => {
  try {
    // Wait for Spotify to initialize
    await waitFor(() => isInitialized.value)
    isLoading.value = false
    
    // Only try to load data if we have a token
    if (isConnected.value) {
      loadHomeData()
    }
  } catch (error) {
    console.error('Error in initialization:', error)
    isLoading.value = false
  }
})

// Function to wait for a condition
const waitFor = (condition: () => boolean, maxWait = 5000, interval = 100) => {
  return new Promise<void>((resolve, reject) => {
    if (condition()) {
      resolve()
      return
    }
    
    const startTime = Date.now()
    const intervalId = setInterval(() => {
      if (condition()) {
        clearInterval(intervalId)
        resolve()
        return
      }
      
      if (Date.now() - startTime > maxWait) {
        clearInterval(intervalId)
        resolve() // Resolve anyway after timeout
      }
    }, interval)
  })
}

// Load home page data
const loadHomeData = async () => {
  if (!isConnected.value) return

  try {
    isLoading.value = true

    // Load data in parallel
    const [liked,recent, playlists] = await Promise.all([
      getLikedSongs(),
      getMyuniqueRecentlyPlayed(),
      getUserPlaylists(),
    ])
    likedSongs.value=liked
    recentlyPlayed.value = recent
    userPlaylists.value = playlists


  } catch (error) {
    console.error('Error loading home data:', error)
  } finally {
    isLoading.value = false
  }
}

// Play a track
const playTrack = (track: SpotifyTrack) => {
  if (!isPlayerReady.value) {
    console.warn('Player not ready')
    return
  }
  
  playerPlayTrack(track.uri)
}

// Play a playlist
const playPlaylist = async (playlist: SpotifyPlaylist) => {
  if (!isPlayerReady.value) {
    console.warn('Player not ready')
    return
  }

  try {
    await play({ context_uri: `spotify:playlist:${playlist.id}` })
  } catch (error) {
    console.error('Error playing playlist:', error)
  }
}

// Connect to Spotify
const connectSpotify = () => {
  isConnecting.value = true
  login()
}
</script>

<style scoped>
.card {
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: #181818 !important;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.card:hover {
  transform: translateY(-8px);
  background: #282828 !important;
}

.card-img-top {
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
  aspect-ratio: 1;
}

.card:hover .card-img-top {
  transform: scale(1.05);
}

.card-body {
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
  position: relative;
  z-index: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-text {
  font-size: 0.875rem;
  color: #b3b3b3 !important;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.play-button-overlay {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  background-color: #1DB954;
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 2;
}

.card:hover .play-button-overlay {
  opacity: 1;
  transform: translateY(0);
}

.play-button-overlay:hover {
  transform: scale(1.1);
  background-color: #1ed760;
  box-shadow: 0 6px 16px rgba(29, 185, 84, 0.4);
}

.play-button-overlay i {
  color: white;
  font-size: 1.5rem;
  margin-left: 2px;
}

.play-button-overlay2 {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  background-color: #1DB954;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 2;
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.card:hover .play-button-overlay2 {
  opacity: 1;
  transform: translateY(0);
}

.play-button-overlay2:hover {
  transform: scale(1.05);
  background-color: #1ed760;
  box-shadow: 0 6px 16px rgba(29, 185, 84, 0.4);
  color: white;
}

.play-button-overlay2 i {
  margin-right: 0.5rem;
}

/* Section Headers */
section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
}

section a {
  color: #b3b3b3;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

section a:hover {
  color: #fff;
}

/* Alert Styling */
.alert-info {
  background-color: rgba(29, 185, 84, 0.1);
  border: 1px solid rgba(29, 185, 84, 0.2);
  color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
}

/* Button Styling */
.btn-success {
  background-color: #1DB954;
  border: none;
  font-weight: 600;
  transition: all 0.2s ease;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
}

.btn-success:hover {
  background-color: #1ed760;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
}

.btn-success:disabled {
  background-color: #1DB954;
  opacity: 0.7;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .card-img-top {
    height: 160px;
  }
  
  .card-title {
    font-size: 0.9rem;
  }
  
  .card-text {
    font-size: 0.8rem;
  }
  
  .play-button-overlay {
    width: 40px;
    height: 40px;
  }
  
  .play-button-overlay i {
    font-size: 1.25rem;
  }
  
  .play-button-overlay2 {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style> 