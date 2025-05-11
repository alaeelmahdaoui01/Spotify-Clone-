<template>
  <div class="container-fluid">
    <!-- Search Header -->
    <div class="search-header p-4">
      <div class="d-flex align-items-center mb-4">
        <h1 class="mb-0 me-4"></h1>
        <div class="search-bar flex-grow-1">
          <input
            v-model="searchQuery"
            type="text"
            class="form-control form-control-lg bg-dark text-white border-0"
            placeholder="Search for songs or artists..."
            @input="handleSearch"
          >
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchQuery" class="search-results p-4">
      <!-- Tracks Section -->
      <section v-if="tracks.length > 0" class="mb-5">
        <h2 class="mb-4">Songs</h2>
        <div class="row g-4">
          <div v-for="track in tracks" :key="track.id" class="col-md-6 col-lg-4">
            <div class="card bg-dark text-white h-100">
              <div class="position-relative">
                <img 
                  :src="track.album.images[0]?.url" 
                  class="card-img-top" 
                  :alt="track.name"
                >
                <button 
                  @click="playTrack(track)"
                  class="btn btn-success position-absolute bottom-0 end-0 m-3 rounded-circle"
                  :disabled="!isPlayerReady"
                >
                  <i class="bi bi-play-fill"></i>
                </button>
              </div>
              <div class="card-body">
                <h5 class="card-title text-truncate">{{ track.name }}</h5>
                <p class="card-text text-muted">
                  {{ track.artists.map(artist => artist.name).join(', ') }}
                </p>
                <div class="d-flex gap-2">
                  <NuxtLink 
                    v-for="artist in track.artists" 
                    :key="artist.id"
                    :to="`/artist/${artist.id}`"
                    class="btn btn-outline-light btn-sm"
                  >
                    <i class="bi bi-person"></i> {{ artist.name }}
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Artists Section -->
      <section v-if="artists.length > 0" class="mb-5">
        <h2 class="mb-4">Artists</h2>
        <div class="row g-4">
          <div v-for="artist in artists" :key="artist.id" class="col-md-4 col-lg-3">
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
                  <p class="card-text text-muted">Artist</p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      

      <!-- No Results -->
      <div v-if="!isLoading && tracks.length === 0 && artists.length === 0" class="text-center py-5">
        <p class="text-muted">No results found for "{{ searchQuery }}"</p>
      </div>
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
  artists: Array<{ id: string; name: string }>
}

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string }[]
}

interface SpotifyCategory {
  id: string
  name: string
  icons: { url: string }[]
}

const { searchTracks, searchArtists, getCategories } = useSpotify()
const { playTrack: playerPlayTrack, isPlayerReady } = useSpotifyPlayer()

const searchQuery = ref('')
const tracks = ref<SpotifyTrack[]>([])
const artists = ref<SpotifyArtist[]>([])
const categories = ref<SpotifyCategory[]>([])
const isLoading = ref(false)

// Load categories on mount
onMounted(async () => {
  try {
    const response = await getCategories()
    categories.value = response.categories.items
  } catch (error) {
    console.error('Error loading categories:', error)
  }
})

// Handle search input
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    tracks.value = []
    artists.value = []
    return
  }

  try {
    isLoading.value = true
    const [tracksData, artistsData] = await Promise.all([
      searchTracks(searchQuery.value),
      searchArtists(searchQuery.value)
    ])
    
    tracks.value = tracksData
    artists.value = artistsData
  } catch (error) {
    console.error('Error searching:', error)
  } finally {
    isLoading.value = false
  }
}



const playTrack = (track: SpotifyTrack) => {


  if (!isPlayerReady.value) {
    console.warn('Player not ready')
    return
  }
  playerPlayTrack(track.uri)


}

</script>





<style scoped>
.search-header {
  padding: 2rem 1.5rem;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), #121212);
}

.search-bar input {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-bar input:focus {
  background: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  outline: none;
}

.search-bar input::placeholder {
  color: #b3b3b3;
  opacity: 0.8;
}

.search-results {
  padding: 1.5rem;
}

/* Section Headers */
section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  padding-left: 0.5rem;
}

/* Card Styles */
.card {
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: #181818 !important;
  border: none;
  border-radius: 8px;
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

/* Play Button */
.btn-success {
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
  border: none;
}

.card:hover .btn-success {
  opacity: 1;
  transform: translateY(0);
}

.btn-success:hover {
  transform: scale(1.1);
  background-color: #1ed760;
  box-shadow: 0 6px 16px rgba(29, 185, 84, 0.4);
}

.btn-success i {
  color: white;
  font-size: 1.5rem;
  margin-left: 2px;
}

/* Artist Links */
.btn-outline-light {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 0.875rem;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.btn-outline-light:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  color: #fff;
}

.btn-outline-light i {
  margin-right: 0.5rem;
  font-size: 0.875rem;
}

/* No Results State */
.text-muted {
  color: #b3b3b3 !important;
  font-size: 1.1rem;
}

/* Loading State */
.spinner-border {
  width: 2rem;
  height: 2rem;
  border-width: 0.2em;
  color: #1DB954;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .search-header {
    padding: 1.5rem 1rem;
  }

  .search-bar input {
    font-size: 1rem;
    padding: 0.8rem 1.2rem;
  }

  .card-img-top {
    height: 160px;
  }
  
  .card-title {
    font-size: 0.9rem;
  }
  
  .card-text {
    font-size: 0.8rem;
  }
  
  .btn-success {
    width: 40px;
    height: 40px;
  }
  
  .btn-success i {
    font-size: 1.25rem;
  }
  
  .btn-outline-light {
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
  }
}
</style> 