<template>
  <div class="recently-played p-4">
    <button @click="goBack" class="btn btn-outline-light mb-3">
      <i class="bi bi-arrow-left me-2"></i> Go Back
    </button>

    <h3 class="mb-4">Recently Played</h3>
    <div class="list-group">
      <div 
        v-for="item in recentlyPlayed" 
        :key="item.track.id" 
        class="list-group-item bg-dark text-white border-secondary d-flex align-items-center"
      >
        <img 
          :src="item.track.album.images[0].url" 
          class="rounded me-3" 
          width="56" 
          height="56" 
          :alt="item.track.name"
        >
        <div class="flex-grow-1">
          <div class="track-name">{{ item.track.name }}</div>
          <div class="artist-name text-muted small">
            {{ item.track.artists.map(a => a.name).join(', ') }}
          </div>
        </div>
        <div class="text-muted small me-3">
          {{ formatDate(item.played_at) }}
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

function goBack() {
  window.history.back();
}
</script>

<style scoped>
.playlist-page {
  min-height: 100vh;
  background: #121212;
}

.playlist-header {
  background: linear-gradient(to bottom, rgba(0,0,0,0.7), #121212);
  padding: 2rem;
}

.playlist-info {
  color: white;
}

.tracks-list {
  background: rgba(0, 0, 0, 0.3);
}

.list-group-item {
  transition: background-color 0.2s;
}

.list-group-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.track-number {
  width: 30px;
  text-align: center;
  color: #b3b3b3;
}

.track-name {
  font-weight: 500;
}

.artist-name {
  color: #b3b3b3;
}
</style> 