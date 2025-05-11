<template>
  <div class="container-fluid">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-light">Loading your music...</p>
    </div>

    <!-- Network Error -->
    <div v-else-if="networkError" class="alert alert-warning m-3">
      <div class="d-flex align-items-center">
        <i class="bi bi-wifi-off me-2"></i>
        <div>
          <strong>Connection Error</strong>
          <p class="mb-0">Unable to connect to Spotify. Please check your internet connection.</p>
        </div>
      </div>
      <button @click="loadMusicData" class="btn btn-warning mt-3">
        <i class="bi bi-arrow-clockwise me-2"></i>
        Retry Connection
      </button>
    </div>


    <div v-else-if="!isConnected" class="alert alert-info m-3">
      <div class="d-flex align-items-center">
        <i class="bi bi-spotify me-2"></i>
        <div>
          <strong>Connect to Spotify</strong>
          <p class="mb-0">Connect your Spotify account to see your music.</p>
        </div>
      </div>
      <button @click="connectSpotify" class="btn btn-success mt-3" :disabled="isConnecting">
        <i class="bi bi-spotify me-2"></i>
        {{ isConnecting ? 'Connecting...' : 'Connect to Spotify' }}
      </button>
    </div>

    <div v-else>
      
      <div class="playlists-section p-4">
        <h3 class="mb-4">All your playlists</h3>
        <div class="row g-4">
          <div v-for="playlist in userPlaylists" :key="playlist.id" class="col-md-4 col-lg-3">
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
      </div>

      <div v-if="selectedPlaylist" class="playlist-tracks p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h3>{{ selectedPlaylist.name }}</h3>
          <button @click="selectedPlaylist = null" class="btn btn-link text-white">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div v-if="isLoadingPlaylist" class="text-center py-5">
          <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="!playlistTracks || playlistTracks.length === 0" class="text-center py-5">
          <p class="text-muted">No tracks found in this playlist</p>
        </div>
        
        <div v-else class="list-group">
          <div 
            v-for="(item, index) in playlistTracks" 
            :key="item.track?.id || index"
            class="list-group-item bg-dark text-white border-secondary d-flex align-items-center"
          >
            <div class="me-3">{{ index + 1 }}</div>
            <img 
              :src="item.track?.album?.images?.[0]?.url || '/img/placeholder-album.png'" 
              class="rounded me-3" 
              width="40" 
              height="40" 
              :alt="item.track?.name"
            >
            <div class="flex-grow-1">
              <div class="track-name">{{ item.track?.name }}</div>
              <div class="artist-name text-muted small">
                {{ item.track?.artists?.map(artist => artist.name).join(', ') }}
              </div>
            </div>
            <div class="text-muted small me-3">
              {{ formatDate(item.added_at) }}
            </div>
            <button 
              @click="playTrack(item.track)" 
              class="btn btn-link text-white"
              :disabled="!isPlayerReady"
            >
              <i class="bi bi-play-fill"></i>
            </button>
          </div>
        </div>
      </div>


      <div class="top-artists p-4">
        <h3 class="mb-4">Your Top Artists</h3>
        <div class="row g-4">
          <div v-for="artist in topArtists" :key="artist.id" class="col-6 col-md-4 col-lg-3">
            <NuxtLink :to="`/artist/${artist.id}`" class="text-decoration-none">
              <div class="card bg-dark text-white h-100">
                <img 
                  :src="artist.images[0]?.url" 
                  :alt="artist.name"
                  class="card-img-top"
                  style="aspect-ratio: 1; object-fit: cover;"
                >
                <div class="card-body">
                  <h5 class="card-title text-truncate">{{ artist.name }}</h5>
                  
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>


      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSpotify } from '~/composables/useSpotify'
import { useSpotifyPlayer } from '~/composables/useSpotifyPlayer'
import { useAuth } from '~/composables/useAuth'

// Types for Spotify data
interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  uri: string;
  genres?: string[];
}

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
  track: SpotifyTrack;
  played_at: string;
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

interface PlaylistTrack {
  track: SpotifyTrack
  added_at: string
}

// Add auth middleware to protect this route
definePageMeta({
  middleware: ['auth']
})

const { 
  getMyTopArtists, 
  getMyRecentlyPlayed, 
  login, 
  hasToken, 
  isConnected, 
  isInitialized, 
  getUserProfile, 
  getUserPlaylists, 
  getPlaylistTracks,
  play 
} = useSpotify()


const { playTrack: playerPlayTrack, isPlayerReady } = useSpotifyPlayer()
const { user, isAuthenticated } = useAuth()
const isLoading = ref(true)
const topArtists = ref<SpotifyArtist[]>([])
const recentlyPlayed = ref<RecentlyPlayedItem[]>([])
const isSpotifyConnected = computed(() => isInitialized.value && isConnected.value)
const userProfile = ref<any>(null)
const userPlaylists = ref<SpotifyPlaylist[]>([])
const selectedPlaylist = ref<SpotifyPlaylist | null>(null)
const playlistTracks = ref<PlaylistTrack[]>([])
const isLoadingPlaylist = ref(false)
const networkError = ref(false)
const isConnecting = ref(false)

onMounted(async () => {
  console.log('My Music Page - Auth State:', { 
    user: user.value, 
    isAuthenticated: isAuthenticated.value,
    spotifyState: {
      isInitialized: isInitialized.value,
      hasToken: hasToken.value,
      isConnected: isConnected.value
    }
  })
  
  try {
    // Wait for Spotify to initialize
    await waitFor(() => isInitialized.value)
    isLoading.value = false
    
    // Only try to load data if we have a token
    if (isConnected.value) {
      loadMusicData()
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

// Load music data from Spotify
const loadMusicData = async () => {
  if (!isConnected.value) return

  try {
    isLoading.value = true
    networkError.value = false

    // Load user profile
    userProfile.value = await getUserProfile()

    // Load user playlists
    userPlaylists.value = await getUserPlaylists()

    // Load top artists and recently played
    const [artists, recent] = await Promise.all([
      getMyTopArtists(),
      getMyRecentlyPlayed()
    ])

    topArtists.value = artists as SpotifyArtist[]
    recentlyPlayed.value = recent as RecentlyPlayedItem[]
  } catch (error) {
    console.error('Error loading music data:', error)
    if (error instanceof Error && error.message.includes('network')) {
      networkError.value = true
    }
  } finally {
    isLoading.value = false
  }
}

// Play a track
const playTrack = (track: SpotifyTrack) => {
  if (!isPlayerReady.value) {
    console.warn('Spotify player is not ready yet')
    return
  }
  
  console.log('Playing track:', track.name)
  playerPlayTrack(track.uri)
}

// Format date to relative time (e.g., "2 hours ago")
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  } else {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  }
}

// Connect to Spotify
const connectSpotify = () => {
  isConnecting.value = true
  login()
}

// Add function to load playlist tracks
const loadPlaylistTracks = async (playlist: SpotifyPlaylist) => {
  try {
    console.log('Loading tracks for playlist:', playlist.name)
    isLoadingPlaylist.value = true
    selectedPlaylist.value = playlist
    const tracks = await getPlaylistTracks(playlist.id)
    console.log('Playlist tracks:', tracks)
    playlistTracks.value = tracks
    console.log('Updated playlist tracks state:', {
      selectedPlaylist: selectedPlaylist.value,
      tracksCount: playlistTracks.value.length,
      isLoading: isLoadingPlaylist.value
    })
  } catch (error) {
    console.error('Error loading playlist tracks:', error)
  } finally {
    isLoadingPlaylist.value = false
  }
}

// Add function to play playlist
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
</script>

<style scoped>
.my-music-page {
  padding: 2rem;
  background: #121212;
  min-height: calc(100vh - 60px);
}

.playlists-section, .top-artists {
  margin-bottom: 3rem;
}

h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  padding-left: 0.5rem;
  position: relative;
}

h3::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.5rem;
  width: 40px;
  height: 3px;
  background: #1DB954;
  border-radius: 2px;
}

.card {
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: #181818 !important;
  border: none;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  height: 100%;
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
  padding: 1.25rem;
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

.play-button-overlay2 {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s ease;
  background-color: #1DB954;
  padding: 0.5rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}

.playlist-tracks {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.list-group-item {
  transition: all 0.2s ease;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  background: transparent;
}

.list-group-item:last-child {
  border-bottom: none;
}

.list-group-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(8px);
}

.track-name {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.25rem;
}

.artist-name {
  font-size: 0.875rem;
  color: #b3b3b3;
}

.btn-link {
  opacity: 0;
  transform: translateX(8px);
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 50%;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1);
}

.list-group-item:hover .btn-link {
  opacity: 1;
  transform: translateX(0);
}

.btn-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .my-music-page {
    padding: 1rem;
  }

  h3 {
    font-size: 1.5rem;
  }

  .card-img-top {
    height: 160px;
  }

  .card-body {
    padding: 1rem;
  }

  .card-title {
    font-size: 0.9rem;
  }

  .card-text {
    font-size: 0.8rem;
  }

  .play-button-overlay2 {
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
  }

  .list-group-item {
    padding: 0.75rem;
  }

  .track-name {
    font-size: 0.9rem;
  }

  .artist-name {
    font-size: 0.8rem;
  }
}
</style> 