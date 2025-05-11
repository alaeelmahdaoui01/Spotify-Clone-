import SpotifyWebApi from 'spotify-web-api-node'
import { ref, onMounted } from 'vue'

// Create persistent token storage
const persistToken = (token: any) => {
  if (process.client) {
    localStorage.setItem('spotify_access_token', token.access_token)
    localStorage.setItem('spotify_refresh_token', token.refresh_token)
    localStorage.setItem('spotify_token_expires', (Date.now() + token.expires_in * 1000).toString())
  }
}

// Load tokens from storage
const loadTokens = () => {
  if (process.client) {
    return {
      accessToken: localStorage.getItem('spotify_access_token'),
      refreshToken: localStorage.getItem('spotify_refresh_token'),
      expiresAt: localStorage.getItem('spotify_token_expires')
    }
  }
  return { accessToken: null, refreshToken: null, expiresAt: null }
}

export const useSpotify = () => {
  const config = useRuntimeConfig()
  const isInitialized = ref(false)
  const hasToken = ref(false)
  const isConnected = ref(false)
  
  // Create API instance
  const spotifyApi = new SpotifyWebApi({
    clientId: config.public.spotifyClientId,
    redirectUri: config.public.spotifyRedirectUri
  })
  
  // For client-side only code
  if (process.client) {
    // Set client secret only in secure contexts
    try {
      if (config.spotifyClientSecret) {
        spotifyApi.setClientSecret(config.spotifyClientSecret)
      }
    } catch (e) {
      console.warn('Could not set client secret. Some features might not work.')
    }
    
    // Try to load tokens from local storage
    onMounted(() => {
      const { accessToken, refreshToken, expiresAt } = loadTokens()
      
      if (accessToken && refreshToken) {
        spotifyApi.setAccessToken(accessToken)
        spotifyApi.setRefreshToken(refreshToken)
        hasToken.value = true
        
        // Check if token is expired
        if (expiresAt && parseInt(expiresAt) < Date.now()) {
          // Token expired, need to refresh
          refreshAccessToken()
        } else {
          isConnected.value = true
        }
      }
      
      isInitialized.value = true
    })
  }

  // Refresh access token using refresh token
  const refreshAccessToken = async () => {
    if (!process.client) return null
    
    try {
      const refreshToken = localStorage.getItem('spotify_refresh_token')
      if (!refreshToken) {
        console.error('No refresh token available')
        isConnected.value = false
        return null
      }

      // Call our server endpoint to refresh the token
      const response = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Token refresh failed:', data)
        isConnected.value = false
        throw new Error(data.message || 'Failed to refresh token')
      }

      if (!data.access_token) {
        console.error('Invalid token response:', data)
        isConnected.value = false
        throw new Error('Invalid token response from server')
      }

      // Update tokens
      const newAccessToken = data.access_token
      const newRefreshToken = data.refresh_token || refreshToken
      const expiresIn = data.expires_in

      // Store tokens
      localStorage.setItem('spotify_access_token', newAccessToken)
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', newRefreshToken)
      }
      localStorage.setItem('spotify_token_expires', (Date.now() + expiresIn * 1000).toString())

      // Update API instance
      spotifyApi.setAccessToken(newAccessToken)
      isConnected.value = true
      return newAccessToken
    } catch (error) {
      console.error('Error refreshing token:', error)
      isConnected.value = false
      return null
    }
  }

  // Login with Spotify - redirects to Spotify authorization page
  const login = () => {
    if (!process.client) return
    
    // Clear existing tokens to force re-authentication
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_token_expires')
    
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-recently-played',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      'playlist-modify',
      'streaming',
      'user-library-read',
      'user-library-modify'
    ].join(' ')
    
    const params = new URLSearchParams({
      client_id: config.public.spotifyClientId,
      response_type: 'code',
      redirect_uri: config.public.spotifyRedirectUri,
      scope: scopes,
      show_dialog: 'true',  // Force re-authentication
      state: generateRandomString(16)  // Add state parameter for security
    })
    
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  const handleCallback = async (code: string) => {
    try {
      console.log('Processing Spotify callback with code')
      
      // Exchange the code for tokens using our server endpoint
      const response = await fetch('/api/spotify/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Token exchange failed:', errorData)
        throw new Error(errorData.message || 'Failed to exchange token')
      }
      
      const tokenData = await response.json()
      
      if (!tokenData.access_token || !tokenData.refresh_token) {
        console.error('Invalid token data received:', tokenData)
        throw new Error('Invalid token data received from Spotify')
      }
      
      console.log('Successfully received tokens')
      
      // Set the access token and refresh token
      spotifyApi.setAccessToken(tokenData.access_token)
      spotifyApi.setRefreshToken(tokenData.refresh_token)
      
      // Store tokens
      persistToken(tokenData)
      hasToken.value = true
      isConnected.value = true
      
      return tokenData
    } catch (error) {
      console.error('Error getting tokens:', error)
      hasToken.value = false
      isConnected.value = false
      throw error
    }
  }

  // Wrap API calls with token refresh logic
  const callWithTokenRefresh = async (apiCall: () => Promise<any>) => {
    try {
      // Check if we have a token at all
      if (!spotifyApi.getAccessToken()) {
        console.error('No Spotify access token available')
        isConnected.value = false
        return null
      }
      
      // Try the call
      const result = await apiCall()
      // If we get here, the call was successful, so we're definitely connected
      isConnected.value = true
      return result
    } catch (error: any) {
      // If token expired, refresh and try again
      if (error.statusCode === 401) {
        console.log('Token expired, refreshing...')
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          const result = await apiCall()
          isConnected.value = true
          return result
        } else {
          isConnected.value = false
          throw new Error('Failed to refresh token')
        }
      }
      // For other errors, we might still be connected
      // Only set to false if it's an authentication error
      if (error.statusCode === 403 || error.statusCode === 401) {
        isConnected.value = false
      }
      throw error
    }
  }

  const getFeaturedPlaylists = async () => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getFeaturedPlaylists()
        return response.body.playlists.items
      } catch (error) {
        console.error('Error getting featured playlists:', error)
        throw error
      }
    })
  }

  const getMyTopArtists = async () => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getMyTopArtists()
        return response.body.items
      } catch (error) {
        console.error('Error getting top artists:', error)
        throw error
      }
    })
  }

  const getMyRecentlyPlayed = async () => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getMyRecentlyPlayedTracks()
        return response.body.items
      } catch (error) {
        console.error('Error getting recently played tracks:', error)
        throw error
      }
    })
  }

  const getMyuniqueRecentlyPlayed = async () => {
  return callWithTokenRefresh(async () => {
    try {
      const response = await spotifyApi.getMyRecentlyPlayedTracks();
      const items = response.body.items;

      // Use a Set to remove duplicates based on track ID
      const seen = new Set();
      const uniqueItems = items.filter(item => {
        const trackId = item.track?.id;
        if (seen.has(trackId)) return false;
        seen.add(trackId);
        return true;
      });

      return uniqueItems;
    } catch (error) {
      console.error('Error getting recently played tracks:', error);
      throw error;
    }
  });
};


  const searchTracks = async (query: string) => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.searchTracks(query)
        return response.body.tracks?.items || []
      } catch (error) {
        console.error('Error searching tracks:', error)
        throw error
      }
    })
  }

  const searchArtists = async (query: string) => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.searchArtists(query)
        return response.body.artists?.items || []
      } catch (error) {
        console.error('Error searching artists:', error)
        throw error
      }
    })
  }

  const getCategories = async () => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getCategories()
        return response.body
      } catch (error) {
        console.error('Error getting categories:', error)
        throw error
      }
    })
  }

  // Log out from Spotify
  const logout = () => {
    if (process.client) {
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expires')
      hasToken.value = false
      isConnected.value = false
      
      // Create a new instance to clear tokens
      spotifyApi.resetAccessToken()
      spotifyApi.resetRefreshToken()
    }
  }

  // Helper function to generate random string for state
  const generateRandomString = (length: number) => {
    if (!process.client) return 'server-side'
    
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const values = crypto.getRandomValues(new Uint8Array(length))
    return values.reduce((acc, x) => acc + possible[x % possible.length], '')
  }

  // Play a track or context
  const play = async (options: any) => {
    return callWithTokenRefresh(async () => {
      try {
        await spotifyApi.play(options)
        return true
      } catch (error) {
        console.error('Error playing content:', error)
        throw error
      }
    })
  }

  // Add these functions before the return statement
  const getUserProfile = async () => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getMe()
        return response
      } catch (error) {
        console.error('Error fetching user profile:', error)
        throw error
      }
    })
  }

  const getUserPlaylists = async (limit = 50) => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getUserPlaylists({ limit })
        return response.body.items
      } catch (error) {
        console.error('Error fetching user playlists:', error)
        throw error
      }
    })
  }

  const getUseruniquePlaylists = async (limit = 50) => {
  return callWithTokenRefresh(async () => {
    try {
      const response = await spotifyApi.getUserPlaylists({ limit });
      const items = response.body.items;

      // Remove duplicates based on playlist ID
      const seen = new Set();
      const uniqueItems = items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      return uniqueItems;
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      throw error;
    }
  });
};


  const getPlaylistTracks = async (playlistId: string) => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getPlaylistTracks(playlistId)
        return response.body.items
      } catch (error) {
        console.error('Error fetching playlist tracks:', error)
        throw error
      }
    })
  }

  const getLikedSongs = async (limit = 50) => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getMySavedTracks({ limit })
        return response.body.items
      } catch (error) {
        console.error('Error fetching liked songs:', error)
        throw error
      }
    })
  }

  // Create a new playlist
  const createPlaylist = async (name: string, description?: string) => {
    return callWithTokenRefresh(async () => {
      try {
        // Get current user's ID
        const me = await spotifyApi.getMe()
        const userId = me.body.id

        // Create the playlist
        const response = await spotifyApi.createPlaylist(name, {
          description: description || undefined,
          public: false
        })

        return response.body
      } catch (error) {
        console.error('Error creating playlist:', error)
        throw error
      }
    })
  }

  // Add tracks to a playlist
  const addTracksToPlaylist = async (playlistId: string, trackUris: string[]) => {
    return callWithTokenRefresh(async () => {
      try {
        // Spotify API has a limit of 100 tracks per request
        const chunkSize = 100
        for (let i = 0; i < trackUris.length; i += chunkSize) {
          const chunk = trackUris.slice(i, i + chunkSize)
          await spotifyApi.addTracksToPlaylist(playlistId, chunk)
        }
        return true
      } catch (error) {
        console.error('Error adding tracks to playlist:', error)
        throw error
      }
    })
  }

  // Get artist's top tracks
  const getArtistTopTracks = async (artistId: string) => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getArtistTopTracks(artistId, 'US')
        return response.body.tracks
      } catch (error) {
        console.error('Error fetching artist top tracks:', error)
        throw error
      }
    })
  }

  // Get artist details
  const getArtist = async (artistId: string) => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getArtist(artistId)
        return response.body
      } catch (error) {
        console.error('Error fetching artist details:', error)
        throw error
      }
    })
  }

  // Transfer playback to a specific device
  const transferMyPlayback = async (deviceIds: string[], options: { play?: boolean } = {}) => {
    return callWithTokenRefresh(async () => {
      try {
        await spotifyApi.transferMyPlayback(deviceIds, options)
        return true
      } catch (error) {
        console.error('Error transferring playback:', error)
        throw error
      }
    })
  }

  console.log('SpotifyWebApi initialized with redirect URI:', config.public.spotifyRedirectUri)

  return {
    login,
    logout,
    handleCallback,
    isInitialized,
    hasToken,
    isConnected,
    getFeaturedPlaylists,
    getMyTopArtists,
    getMyRecentlyPlayed,
    getMyuniqueRecentlyPlayed,
    searchTracks,
    searchArtists,
    getCategories,
    spotifyApi,
    refreshAccessToken,
    play,
    getUserProfile,
    getUserPlaylists,
    getUseruniquePlaylists,
    getPlaylistTracks,
    getLikedSongs,
    createPlaylist,
    addTracksToPlaylist,
    getArtistTopTracks,
    getArtist,
    transferMyPlayback
  }
} 