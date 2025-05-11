<template>
  <div class="create-playlist-page">
    <div class="container py-4">
      <div class="row">
        <!-- Left Column: Playlist Form and Selected Tracks -->
        <div class="col-md-4 mb-4">
          <!-- Playlist Details Form -->
          <div class="playlist-form p-4 rounded bg-dark mb-4">
            <h2 class="text-white mb-4">Create New Playlist</h2>
            <form @submit.prevent="savePlaylist">
              <div class="mb-3">
                <label for="playlistName" class="form-label text-white">Playlist Name</label>
                <input
                  type="text"
                  class="form-control bg-dark text-white border-secondary"
                  id="playlistName"
                  v-model="playlistName"
                  required
                  placeholder="My Playlist"
                >
              </div>
              <div class="mb-4">
                <label for="playlistDescription" class="form-label text-white">Description</label>
                <textarea
                  class="form-control bg-dark text-white border-secondary"
                  id="playlistDescription"
                  v-model="playlistDescription"
                  rows="3"
                  placeholder="Add an optional description"
                ></textarea>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <button 
                  type="submit" 
                  class="btn btn-success"
                  :disabled="!isConnected || !playlistName || selectedTracks.length === 0"
                >
                  Save Playlist
                </button>
                <span class="text-muted small">
                  {{ selectedTracks.length }} tracks selected
                </span>
              </div>
            </form>
          </div>

          <!-- Selected Tracks -->
          <div v-if="selectedTracks.length > 0" class="selected-tracks">
            <h3 class="text-white mb-3">Selected Tracks</h3>
            <div class="track-list selected-tracks-list">
              <div 
                v-for="track in selectedTracks" 
                :key="track.id"
                class="track-item d-flex align-items-center p-3 rounded"
              >
                <img 
                  :src="track.album?.images?.[0]?.url || '/img/placeholder-album.png'" 
                  :alt="track.name"
                  class="track-cover me-3"
                >
                <div class="track-info flex-grow-1">
                  <div class="track-name">{{ track.name }}</div>
                  <div class="track-artist text-muted">
                    {{ track.artists?.map(artist => artist.name).join(', ') }}
                  </div>
                </div>
                <button 
                  class="btn btn-link text-danger"
                  @click="removeTrack(track)"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Search and Results -->
        <div class="col-md-8">
          <div class="search-section mb-4">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary">
                <i class="bi bi-search"></i>
              </span>
              <input
                type="text"
                class="form-control bg-dark text-white border-secondary"
                v-model="searchQuery"
                placeholder="Search for songs..."
                @input="handleSearch"
              >
            </div>
          </div>

          <!-- Search Results -->
          <div class="search-results">
            <div v-if="isSearching" class="text-center py-4">
              <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Searching...</span>
              </div>
            </div>
            
            <div v-else-if="searchResults.length > 0" class="track-list">
              <div 
                v-for="track in searchResults" 
                :key="track.id"
                class="track-item d-flex align-items-center p-3 rounded"
                :class="{ 'selected': isTrackSelected(track) }"
              >
                <img 
                  :src="track.album?.images?.[0]?.url || '/img/placeholder-album.png'" 
                  :alt="track.name"
                  class="track-cover me-3"
                >
                <div class="track-info flex-grow-1">
                  <div class="track-name">{{ track.name }}</div>
                  <div class="track-artist text-muted">
                    {{ track.artists?.map(artist => artist.name).join(', ') }}
                  </div>
                </div>
                <button 
                  class="btn btn-link text-white"
                  @click="toggleTrackSelection(track)"
                >
                  <i :class="isTrackSelected(track) ? 'bi bi-dash-lg' : 'bi bi-plus-lg'"></i>
                </button>
              </div>
            </div>

            <div v-else-if="searchQuery" class="text-center py-4 text-muted">
              No tracks found
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotify } from '~/composables/useSpotify'
import { useAuth } from '~/composables/useAuth'

interface SpotifyTrack {
  id: string
  name: string
  uri: string
  album: {
    images: { url: string }[]
  }
  artists: Array<{ id: string; name: string }>
}

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string }[]
}

const router = useRouter()
const { isConnected, searchTracks, searchArtists, createPlaylist, addTracksToPlaylist, refreshAccessToken } = useSpotify()
const { user } = useAuth()

const playlistName = ref('')
const playlistDescription = ref('')
const searchQuery = ref('')
const searchResults = ref<SpotifyTrack[]>([])
const selectedTracks = ref<SpotifyTrack[]>([])
const isSearching = ref(false)

// Search tracks
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  try {
    isSearching.value = true
    const [tracksData] = await Promise.all([
      searchTracks(searchQuery.value)
    ])
    
    searchResults.value = tracksData
  } catch (error) {
    console.error('Error searching:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// Track selection
const isTrackSelected = (track: SpotifyTrack) => {
  return selectedTracks.value.some(t => t.id === track.id)
}

const toggleTrackSelection = (track: SpotifyTrack) => {
  if (isTrackSelected(track)) {
    removeTrack(track)
  } else {
    selectedTracks.value.push(track)
  }
}

const removeTrack = (track: SpotifyTrack) => {
  selectedTracks.value = selectedTracks.value.filter(t => t.id !== track.id)
}

// Save playlist
const savePlaylist = async () => {
  if (!isConnected.value) {
    alert('Please connect to Spotify first')
    return
  }

  if (!playlistName.value || selectedTracks.value.length === 0) {
    return
  }

  try {
    // Try to refresh the token first
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      alert('Unable to connect to Spotify. Please try logging in again.')
      return
    }

    // Create the playlist
    const playlist = await createPlaylist(
      playlistName.value,
      playlistDescription.value || undefined
    )

    if (!playlist) {
      throw new Error('Failed to create playlist')
    }

    // Add tracks to the playlist
    const trackUris = selectedTracks.value.map((track: SpotifyTrack) => track.uri)
    await addTracksToPlaylist(playlist.id, trackUris)

    // Navigate to the new playlist
    router.push(`/playlist/${playlist.id}`)
  } catch (error) {
    console.error('Error creating playlist:', error)
    if (error instanceof Error && error.message.includes('No Spotify access token available')) {
      alert('Your Spotify session has expired. Please log in again.')
      // You might want to trigger a re-login here
      // login()
    } else {
      alert('Failed to create playlist. Please try again.')
    }
  }
}
</script>

<style scoped>
.create-playlist-page {
  min-height: calc(100vh - 60px); /* Subtract footer height */
  background: linear-gradient(to bottom, #1e1e1e, #121212);
  color: white;
  padding: 2rem 0 4rem 0; /* Increased bottom padding */
  margin-bottom: 60px; /* Add margin for footer */
}

.playlist-form {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.playlist-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.form-control {
  background-color: rgba(255, 255, 255, 0.07) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-control:focus {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(29, 185, 84, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2);
}

.form-control::placeholder {
  color: #b3b3b3;
  font-weight: 400;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: #ffffff;
}

.btn-success {
  background-color: #1DB954;
  border: none;
  padding: 10px 28px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 14px;
}

.btn-success:hover {
  background-color: #1ed760;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
}

.btn-success:disabled {
  background-color: #1DB954;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

.search-section {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(to bottom, #1e1e1e, #121212);
  padding: 16px 0;
  margin-bottom: 24px;
}

.input-group {
  background-color: rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.input-group:focus-within {
  border-color: rgba(29, 185, 84, 0.5);
  box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2);
}

.input-group-text {
  background: transparent;
  border: none;
  color: #b3b3b3;
  padding: 12px 16px;
}

.track-list {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.track-item {
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
}

.track-item:last-child {
  border-bottom: none;
}

.track-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.track-item.selected {
  background-color: rgba(29, 185, 84, 0.1);
  border-left: 3px solid #1DB954;
}

.track-cover {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.track-item:hover .track-cover {
  transform: scale(1.05);
}

.track-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #ffffff;
}

.track-artist {
  font-size: 12px;
  color: #b3b3b3;
}

.btn-link {
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  color: #ffffff !important;
  opacity: 0.7;
}

.btn-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
  opacity: 1;
}

.selected-tracks {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
}

.selected-tracks-list {
  max-height: 400px;
  overflow-y: auto;
}

.selected-tracks h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-tracks h3::after {
  content: '';
  flex: 1;
  margin-left: 12px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.spinner-border {
  width: 2rem;
  height: 2rem;
  border-width: 0.2em;
  color: #1DB954;
}

@media (max-width: 768px) {
  .create-playlist-page {
    padding: 1rem 0 4rem 0;
    margin-bottom: 60px;
  }
  
  .playlist-form {
    margin-bottom: 24px;
  }
  
  .track-item {
    padding: 8px 12px;
  }
  
  .track-cover {
    width: 40px;
    height: 40px;
  }
  
  .selected-tracks {
    margin-top: 16px;
    padding: 12px;
  }
  
  .selected-tracks-list {
    max-height: 300px;
  }
}

/* Custom scrollbar */
.track-list::-webkit-scrollbar {
  width: 8px;
}

.track-list::-webkit-scrollbar-track {
  background: transparent;
}

.track-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.track-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style> 