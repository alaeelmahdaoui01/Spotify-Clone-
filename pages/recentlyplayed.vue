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
.recently-played {
  padding: 2rem;
  background: #121212;
  min-height: calc(100vh - 60px);
}

.btn-outline-light {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-outline-light:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  color: #fff;
}

h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  padding-left: 0.5rem;
}

.list-group {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
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

.list-group-item img {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.list-group-item:hover img {
  transform: scale(1.05);
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
  .recently-played {
    padding: 1rem;
  }

  h3 {
    font-size: 1.5rem;
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