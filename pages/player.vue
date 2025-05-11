<template>
  <div class="player-page">
    <div v-if="!isPlayerReady" class="loading-state">
      <div v-if="playerError" class="error-message">
        {{ playerError }}
      </div>
      <div v-else class="loading-message">
        <div class="spinner"></div>
        <p>Initialization</p>
      </div>
    </div>
    
    <div v-else class="player-content">
      <div class="current-track">
        <img 
          :src="currentTrack?.album?.images[0]?.url || '/images/placeholder.png'" 
          :alt="currentTrack?.name || 'No track playing'"
          class="track-image"
        />
        <div class="track-info">
          <h2>{{ currentTrack?.name || 'No track playing' }}</h2>
          <p class="artists">{{ currentTrack?.artists?.map(artist => artist.name).join(', ') || 'No artist' }}</p>
          <p class="album">{{ currentTrack?.album?.name || 'No album' }}</p>
        </div>
      </div>

      <div class="player-controls">
        <button 
          @click="isPlaying ? pause() : play()" 
          class="control-button play-button"
          :disabled="!isPlayerReady"
        >
          <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'" class="fs-4"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSpotify } from '~/composables/useSpotify'
import { useSpotifyPlayer } from '~/composables/useSpotifyPlayer'

interface SpotifyArtist {
  id: string
  name: string
  type: string
  uri: string
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
  volume
} = useSpotifyPlayer()

// Format time in milliseconds to MM:SS
const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.player-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.error-message {
  color: #e74c3c;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
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
}

.current-track {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.track-image {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.track-info {
  flex: 1;
}

.track-info h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #fff;
  font-weight: 700;
}

.track-info .artists {
  font-size: 1.2rem;
  color: #b3b3b3;
  margin-bottom: 0.5rem;
}

.track-info .album {
  font-size: 1rem;
  color: #808080;
}

.player-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
}

.control-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
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
  font-size: 2rem;
  background: #1DB954;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button:hover:not(:disabled) {
  background: #1ed760;
  transform: scale(1.1);
}

@media (max-width: 640px) {
  .current-track {
    flex-direction: column;
    text-align: center;
  }
  
  .track-image {
    width: 200px;
    height: 200px;
  }
  
  .track-info h2 {
    font-size: 1.5rem;
  }
  
  .track-info .artists {
    font-size: 1rem;
  }
  
  .play-button {
    width: 56px;
    height: 56px;
    font-size: 1.8rem;
  }
}
</style> 