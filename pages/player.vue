<template>
  <div class="player-page">
    <div v-if="!isPlayerReady" class="loading-state">
      <div v-if="playerError" class="error-message">
        <i class="bi bi-exclamation-circle-fill me-2"></i>
        {{ playerError }}
      </div>
      <div v-else class="loading-message">
        <div class="spinner"></div>
        <p>Initializing player...</p>
      </div>
    </div>
    
    <div v-else class="player-content">
      <div class="current-track">
        <div class="track-image-container">
          <img 
            :src="currentTrack?.album?.images[0]?.url || '/images/placeholder.png'" 
            :alt="currentTrack?.name || 'No track playing'"
            class="track-image"
          />
          <div class="image-overlay">
            <button 
              @click="isPlaying ? pause() : play()" 
              class="control-button play-button-overlay"
              :disabled="!isPlayerReady"
            >
              <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
            </button>
          </div>
        </div>
        <div class="track-info">
          <h2>{{ currentTrack?.name || 'No track playing' }}</h2>
          <p class="artists">{{ currentTrack?.artists?.map(artist => artist.name).join(', ') || 'No artist' }}</p>
          <p class="album">{{ currentTrack?.album?.name || 'No album' }}</p>
        </div>
      </div>

      <div class="player-controls">
        <div class="control-buttons">
          <button 
            @click="previousTrack" 
            class="control-button"
            :disabled="!isPlayerReady"
          >
            <i class="bi bi-skip-start-fill"></i>
          </button>
          <button 
            @click="isPlaying ? pause() : play()" 
            class="control-button play-button"
            :disabled="!isPlayerReady"
          >
            <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
          </button>
          <button 
            @click="nextTrack" 
            class="control-button"
            :disabled="!isPlayerReady"
          >
            <i class="bi bi-skip-end-fill"></i>
          </button>
        </div>

        <div class="progress-container">
          <span class="time current-time">{{ currentTimeDisplay }}</span>
          <div 
            class="progress-bar"
            @click="handleSeek"
          >
            <div 
              class="progress" 
              :style="{ width: `${Math.max(0, Math.min(100, (currentProgress / (currentTrack?.duration_ms || 1)) * 100))}%` }"
            ></div>
            <div 
              class="progress-handle" 
              :style="{ left: `${Math.max(0, Math.min(100, (currentProgress / (currentTrack?.duration_ms || 1)) * 100))}%` }"
            ></div>
          </div>
          <span class="time total-time">{{ totalTimeDisplay }}</span>
        </div>

        <div class="volume-control">
          <button 
            @click="toggleMute" 
            class="control-button volume-button"
          >
            <i :class="volumeIcon"></i>
          </button>
          <div class="volume-slider">
            <input 
              type="range" 
              min="0" 
              max="100" 
              :value="currentVolume"
              @input="handleVolumeChange"
              class="volume-range"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useSpotify } from '~/composables/useSpotify'
import { useSpotifyPlayer } from '~/composables/useSpotifyPlayer'

interface SpotifyArtist {
  id: string
  name: string
  type: string
  uri: string
}

interface SpotifyPlaybackState {
  position: number
  duration: number
  paused: boolean
  track_window: {
    current_track: {
      duration_ms: number
      name: string
      artists: SpotifyArtist[]
      album: {
        name: string
        images: { url: string }[]
      }
    }
  }
}

const spotifyApi = useSpotify()
const { 
  isPlayerReady,
  playerError,
  currentTrack,
  isPlaying,
  play,
  pause,
  nextTrack,
  previousTrack,
  setVolume,
  volume,
  seek,
  playerState
} = useSpotifyPlayer()

const currentProgress = ref(0)
const isMuted = ref(false)
const previousVolume = ref(volume.value)
const isSeeking = ref(false)
const currentVolume = ref(volume.value * 100) // Store volume as percentage

// Update progress and time from player state
watch(playerState, (newState: SpotifyPlaybackState | null) => {
  if (newState && !isSeeking.value) {
    currentProgress.value = newState.position
  }
}, { immediate: true })

// Watch for track changes to reset progress
watch(currentTrack, () => {
  currentProgress.value = 0
})

// Watch for volume changes from the player
watch(volume, (newVolume) => {
  currentVolume.value = newVolume * 100
  if (newVolume === 0) {
    isMuted.value = true
  } else if (isMuted.value) {
    isMuted.value = false
  }
}, { immediate: true })

// Format time in milliseconds to MM:SS
const formatTime = (ms: number) => {
  if (!ms || ms < 0) return '0:00'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Get current time display
const currentTimeDisplay = computed(() => {
  return formatTime(currentProgress.value)
})

// Get total time display
const totalTimeDisplay = computed(() => {
  return formatTime(currentTrack.value?.duration_ms || 0)
})

// Handle seeking on progress bar
const handleSeek = async (event: MouseEvent) => {
  if (!isPlayerReady.value || !currentTrack.value) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const seekPosition = Math.floor(percent * (currentTrack.value.duration_ms || 0))
  
  isSeeking.value = true
  currentProgress.value = seekPosition
  
  try {
    await seek(seekPosition)
  } catch (error) {
    console.error('Error seeking:', error)
  } finally {
    isSeeking.value = false
  }
}

const volumeIcon = computed(() => {
  if (isMuted.value || currentVolume.value === 0) return 'bi bi-volume-mute-fill'
  if (currentVolume.value < 50) return 'bi bi-volume-down-fill'
  return 'bi bi-volume-up-fill'
})

const toggleMute = async () => {
  if (isMuted.value) {
    await setVolume(previousVolume.value)
    isMuted.value = false
  } else {
    previousVolume.value = volume.value
    await setVolume(0)
    isMuted.value = true
  }
}

const handleVolumeChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const newVolume = parseInt(target.value) / 100
  currentVolume.value = parseInt(target.value)
  await setVolume(newVolume)
  isMuted.value = newVolume === 0
}
</script>

<style scoped>
.player-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
  background: #121212;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: #fff;
}

.error-message {
  color: #e74c3c;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(231, 76, 60, 0.1);
  padding: 1rem 2rem;
  border-radius: 8px;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #fff;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(29, 185, 84, 0.1);
  border-top: 4px solid #1DB954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.player-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.current-track {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.track-image-container {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.track-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.track-image-container:hover .track-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.track-image-container:hover .image-overlay {
  opacity: 1;
}

.play-button-overlay {
  width: 64px;
  height: 64px;
  background: #1DB954;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button-overlay:hover {
  transform: scale(1.1);
  background: #1ed760;
}

.track-info {
  flex: 1;
}

.track-info h2 {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  color: #fff;
  font-weight: 700;
  line-height: 1.2;
}

.track-info .artists {
  font-size: 1.25rem;
  color: #b3b3b3;
  margin-bottom: 0.5rem;
}

.track-info .album {
  font-size: 1rem;
  color: #808080;
}

.player-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.control-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-button {
  width: 72px;
  height: 72px;
  background: #1DB954;
  font-size: 2rem;
}

.play-button:hover:not(:disabled) {
  background: #1ed760;
  transform: scale(1.1);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
  width: 100%;
}

.time {
  color: #b3b3b3;
  font-size: 0.875rem;
  min-width: 45px;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  overflow: visible;
  transition: height 0.1s ease;
  display: flex;
  align-items: center;
}

.progress-bar:hover {
  height: 6px;
}

.progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #1DB954;
  border-radius: 2px;
  transition: width 0.1s linear;
  pointer-events: none;
  min-width: 0;
  width: 0;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.progress-bar:hover .progress-handle {
  opacity: 1;
}

.progress-bar:hover .progress {
  background: #1ed760;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
}

.volume-button {
  font-size: 1.25rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  margin-right: 8px;
}

.volume-button:hover {
  opacity: 1;
}

.volume-slider {
  flex: 1;
  max-width: 200px;
  position: relative;
  padding: 8px 0;
  display: flex;
  align-items: center;
}

.volume-range {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  transition: height 0.1s ease;
  margin: 0;
  padding: 0;
}

.volume-range:hover {
  height: 6px;
}

.volume-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 1;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  margin-top: -4px; /* Align with track */
}

.volume-range:hover::-webkit-slider-thumb {
  margin-top: -5px; /* Adjust for taller track on hover */
}

.volume-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: #1DB954;
  box-shadow: 0 0 6px rgba(29, 185, 84, 0.4);
}

.volume-range::-webkit-slider-runnable-track {
  background: rgba(255, 255, 255, 0.1);
  height: 4px;
  border-radius: 2px;
  cursor: pointer;
  border: none;
}

.volume-range:hover::-webkit-slider-runnable-track {
  background: rgba(255, 255, 255, 0.2);
  height: 6px;
}

/* Firefox styles */
.volume-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.volume-range::-moz-range-thumb:hover {
  transform: scale(1.2);
  background: #1DB954;
  box-shadow: 0 0 6px rgba(29, 185, 84, 0.4);
}

.volume-range::-moz-range-track {
  background: rgba(255, 255, 255, 0.1);
  height: 4px;
  border-radius: 2px;
  cursor: pointer;
  border: none;
}

.volume-range:hover::-moz-range-track {
  background: rgba(255, 255, 255, 0.2);
  height: 6px;
}

@media (max-width: 768px) {
  .player-page {
    padding: 1rem;
  }

  .player-content {
    padding: 1rem;
  }

  .current-track {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }

  .track-image-container {
    width: 160px;
    height: 160px;
  }

  .track-info h2 {
    font-size: 1.5rem;
  }

  .track-info .artists {
    font-size: 1rem;
  }

  .control-buttons {
    gap: 1rem;
  }

  .play-button {
    width: 56px;
    height: 56px;
    font-size: 1.5rem;
  }

  .volume-slider {
    max-width: 150px;
  }
}
</style> 