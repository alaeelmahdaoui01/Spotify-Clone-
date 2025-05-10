<template>
    <div class="my-music-page">
      <h1 class="mb-4"></h1>
      
      <!-- <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading your home page...</p>
      </div> -->
      
      <div >
        <!-- Connection Status -->
        <!-- <div v-if="!isSpotifyConnected" class="text-center py-5">
          <div class="alert alert-dark">
            <h4>Connect to Spotify</h4>
            <p class="mb-3">To view your personalized music data, you need to connect your Spotify account.</p>
            <button @click="connectSpotify" class="btn btn-success rounded-pill px-4">
              <i class="bi bi-spotify me-2"></i> Connect to Spotify
            </button>
          </div>
        </div> -->
  
        <div >
          
  
          <!-- Featuredplaylists -->
          <section class="mb-5">
            <h2 class="mb-3">Your Featured playlists</h2>
            <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
              <div v-for="playlist in featuredplaylists" :key="playlist.id" class="col">
                <div class="card bg-dark h-100">
                  <img :src="playlist.images[0]?.url || '/img/placeholder-artist.png'" class="card-img-top" :alt="playlist.name">
                  <div class="card-body">
                    <h5 class="card-title">{{ playlist.name }}</h5>
                    <p class="card-text text-muted">Playlist</p>
                  </div>
                </div>
              </div>
              <div v-if="featuredplaylists.length === 0" class="col-12">
                <div class="alert alert-dark">
                  <p class="mb-0">No featured playlists found. Start listening to build your profile!</p>
                </div>
              </div>
            </div>
          </section>

          <section class="mb-5">
            <h2 class="mb-3">Made for you</h2>
            <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
              <div v-for="playlist in madeforyou" :key="playlist.id" class="col">
                <div class="card bg-dark h-100">
                  <img :src="playlist.images[0]?.url || '/img/placeholder-artist.png'" class="card-img-top" :alt="playlist.name">
                  <div class="card-body">
                    <h5 class="card-title">{{ playlist.name }}</h5>
                    <p class="card-text text-muted">Playlist</p>
                  </div>
                </div>
              </div>
              <div v-if="madeforyou.length === 0" class="col-12">
                <div class="alert alert-dark">
                  <p class="mb-0">No featured playlists found. Start listening to build your profile!</p>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Recently Played -->
          <section class="mb-5">
            <h2 class="mb-3">Recently Played</h2>
            <div class="row">
              <div v-for="track in recentlyPlayed" :key="track.played_at" class="col-12 mb-2">
                <div class="d-flex align-items-center p-2 rounded hover-bg-dark">
                  <img :src="track.track.album.images[0]?.url || '/img/placeholder-album.png'" 
                      class="me-3" width="48" height="48" :alt="track.track.name">
                  <div class="flex-grow-1">
                    <div class="track-name">{{ track.track.name }}</div>
                    <div class="artist-name text-muted">{{ track.track.artists.map(a => a.name).join(', ') }}</div>
                  </div>
                  <div class="text-muted small me-3">{{ formatDate(track.played_at) }}</div>
                  <button @click="playTrack(track.track)" 
                          class="btn btn-sm btn-success rounded-circle" 
                          title="Play track">
                    <i class="bi bi-play-fill"></i>
                  </button>
                </div>
              </div>
              <div v-if="recentlyPlayed.length === 0" class="col-12">
                <div class="alert alert-dark">
                  <p class="mb-0">No recently played tracks found. Start listening to see your history!</p>
                </div>
              </div>
            </div>
          </section>
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
  }
  
  interface Playlist {
  id: string
  name: string
  description?: string
  imageUrl: string
  uri?: string
}

// interface Track {
//   id: string
//   name: string
//   artist: string
//   imageUrl: string
//   album?: string
//   duration?: number
// }

  interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    artists: Array<{
      id: string;
      name: string;
      uri: string;
    }>;
  }
  
  interface RecentlyPlayedItem {
    track: SpotifyTrack;
    played_at: string;
  }
  
  // Add auth middleware to protect this route
  definePageMeta({
    middleware: ['auth']
  })
  
  const { getFeaturedPlaylists,getMadeForYouPlaylists, getMyRecentlyPlayed, login, hasToken, isConnected, isInitialized } = useSpotify()
  const { playTrack: playerPlayTrack, isPlayerReady } = useSpotifyPlayer()
  const { user, isAuthenticated } = useAuth()
  const isLoading = ref(true)
//   const topArtists = ref<SpotifyArtist[]>([])
  const madeforyou = ref<Playlist[]>([])
  const featuredplaylists= ref<Playlist[]>([])
  const recentlyPlayed = ref<RecentlyPlayedItem[]>([])
  const isSpotifyConnected = computed(() => isInitialized.value && isConnected.value)
  
  onMounted(async () => {
  console.log('Starting mount...')
  try {
    await waitFor(() => isInitialized.value)
    console.log('Spotify initialized:', { isConnected: isConnected.value })
    
    if (isConnected.value) {
      console.log('Loading music data...')
      await loadMusicData()
      console.log('Data loaded:', { 
        featured: featuredplaylists.value,
        madeForYou: madeforyou.value,
        recent: recentlyPlayed.value
      })
    }
  } catch (error) {
    console.error('Mount error:', error)
  } finally {
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
  
  const loadMusicData = async () => {
  isLoading.value = true
  try {
    const [playlistsData, madeForYouData, recentlyPlayedData] = await Promise.allSettled([
      getFeaturedPlaylists(),
      getMadeForYouPlaylists(), // Add this call
      getMyRecentlyPlayed()
    ])
    
    // Add error logging
    if (playlistsData.status === 'rejected') console.error('Playlists error:', playlistsData.reason)
    if (madeForYouData.status === 'rejected') console.error('Made for you error:', madeForYouData.reason)
    if (recentlyPlayedData.status === 'rejected') console.error('Recently played error:', recentlyPlayedData.reason)

    featuredplaylists.value = playlistsData.status === 'fulfilled' ? playlistsData.value : []
    madeforyou.value = madeForYouData.status === 'fulfilled' ? madeForYouData.value : [] // Add this line
    recentlyPlayed.value = recentlyPlayedData.status === 'fulfilled' ? recentlyPlayedData.value : []
    
  } catch (error) {
    console.error('Error loading music data:', error)
    featuredplaylists.value = []
    madeforyou.value = [] // Initialize this
    recentlyPlayed.value = []
  } finally {
    isLoading.value = false
  }
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
    login()
  }
  </script>
  
  <style scoped>
  .my-music-page {
    padding: 1rem;
  }
  
  .hover-bg-dark:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  </style> 