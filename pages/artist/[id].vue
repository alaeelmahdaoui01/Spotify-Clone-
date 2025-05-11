<template>
  <div class="container-fluid">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-light">Loading artist details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger m-3">
      {{ error }}
    </div>

    <!-- Artist Content -->
    <div v-else>
      <!-- Artist Header -->
      <div class="artist-header mb-5">
        <div class="row align-items-end">
          <div class="col-auto">
            <img 
              :src="artist.images[0]?.url" 
              :alt="artist.name"
              class="artist-image rounded"
            >
          </div>
          <div class="col">
            <h1 class="display-4 mb-2">{{ artist.name }}</h1>
            <p class="text-muted mb-0">
              {{ artist.followers.total.toLocaleString() }} followers
            </p>
          </div>
        </div>
      </div>

      <!-- Top Tracks -->
      <section class="mb-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Popular</h2>
          <button 
            @click="playArtistTopTracks" 
            class="btn btn-success"
            :disabled="!isPlayerReady"
          >
            <i class="bi bi-play-fill me-2"></i>Play All
          </button>
        </div>

        <div class="tracks-list">
          <div 
            v-for="(track, index) in topTracks" 
            :key="track.id"
            class="track-item d-flex align-items-center p-3 rounded"
            :class="{ 'active': currentTrack?.id === track.id }"
          >
            <div class="track-number me-3" style="width: 30px">
              {{ index + 1 }}
            </div>
            <img 
              :src="track.album.images[0]?.url" 
              :alt="track.name"
              class="track-image me-3"
              width="40"
              height="40"
            >
            <div class="track-info flex-grow-1">
              <div class="track-name">{{ track.name }}</div>
              <div class="track-artists text-muted small">
                {{ track.artists.map(a => a.name).join(', ') }}
              </div>
            </div>
            <div class="track-duration text-muted me-3">
              {{ formatDuration(track.duration_ms) }}
            </div>
            <button 
              @click="playTrack(track)"
              class="btn btn-link text-white p-0"
              :disabled="!isPlayerReady"
            >
              <i class="bi bi-play-fill"></i>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSpotify } from '~/composables/useSpotify'
import { useSpotifyPlayer } from '~/composables/useSpotifyPlayer'

interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  album: {
    images: { url: string }[]
  }
  artists: Array<{ name: string }>
}

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string }[]
  followers: {
    total: number
  }
}

const route = useRoute()
const { getArtist, getArtistTopTracks, play } = useSpotify()
const { playTrack: playerPlayTrack, isPlayerReady, currentTrack } = useSpotifyPlayer()

const isLoading = ref(true)
const error = ref('')
const artist = ref<SpotifyArtist | null>(null)
const topTracks = ref<SpotifyTrack[]>([])

// Load artist data
const loadArtistData = async () => {
  const artistId = route.params.id as string
  if (!artistId) {
    error.value = 'No artist ID provided'
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    const [artistData, tracksData] = await Promise.all([
      getArtist(artistId),
      getArtistTopTracks(artistId)
    ])
    
    artist.value = artistData
    topTracks.value = tracksData
  } catch (err) {
    console.error('Error loading artist data:', err)
    error.value = 'Failed to load artist data'
  } finally {
    isLoading.value = false
  }
}

// Play a single track
const playTrack = (track: SpotifyTrack) => {
  if (!isPlayerReady.value) {
    console.warn('Player not ready')
    return
  }
  
  playerPlayTrack(track.uri)
}

// Play all top tracks
const playArtistTopTracks = async () => {
  if (!isPlayerReady.value || !artist.value) {
    console.warn('Player not ready or no artist data')
    return
  }

  try {
    await play({ context_uri: `spotify:artist:${artist.value.id}` })
  } catch (error) {
    console.error('Error playing artist tracks:', error)
  }
}

// Format duration in mm:ss
const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

onMounted(loadArtistData)
</script>

<style scoped>
.artist-header {
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
}

.artist-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.7), #121212);
  z-index: 0;
}

.artist-header > div {
  position: relative;
  z-index: 1;
}

.artist-image {
  width: 232px;
  height: 232px;
  object-fit: cover;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  transition: transform 0.3s ease;
}

.artist-image:hover {
  transform: scale(1.02);
}

.display-4 {
  font-size: 3rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 0.5rem;
}

.text-muted {
  font-size: 0.9rem;
  opacity: 0.8;
}

.btn-success {
  padding: 0.75rem 2rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
}

.btn-success:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(29, 185, 84, 0.4);
}

.btn-success:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tracks-list {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 2rem;
}

.track-item {
  transition: all 0.2s ease;
  border-radius: 4px;
  margin-bottom: 4px;
  padding: 0.75rem 1rem;
}

.track-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.track-item.active {
  background-color: rgba(29, 185, 84, 0.1);
}

.track-number {
  color: #b3b3b3;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.track-image {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.track-item:hover .track-image {
  transform: scale(1.05);
}

.track-name {
  font-weight: 500;
  font-size: 0.95rem;
  color: #ffffff;
  margin-bottom: 4px;
}

.track-artists {
  font-size: 0.85rem;
  color: #b3b3b3;
}

.track-duration {
  font-size: 0.85rem;
  min-width: 60px;
  text-align: right;
}

.btn-link {
  opacity: 0;
  transition: all 0.2s ease;
  padding: 8px;
  border-radius: 50%;
}

.track-item:hover .btn-link {
  opacity: 1;
}

.btn-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .artist-header {
    padding: 1.5rem 0;
  }

  .artist-image {
    width: 180px;
    height: 180px;
  }

  .display-4 {
    font-size: 2rem;
  }

  .tracks-list {
    padding: 0.75rem;
    margin-top: 1.5rem;
  }

  .track-item {
    padding: 0.5rem 0.75rem;
  }

  .track-number {
    min-width: 30px;
  }
}
</style> 