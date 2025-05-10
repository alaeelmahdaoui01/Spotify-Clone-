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
    try {
      if (!spotifyApi.getRefreshToken()) {
        console.error('No refresh token available')
        return false
      }
      
      const data = await spotifyApi.refreshAccessToken()
      const token = {
        access_token: data.body.access_token,
        refresh_token: spotifyApi.getRefreshToken(),
        expires_in: data.body.expires_in
      }
      
      spotifyApi.setAccessToken(data.body.access_token)
      persistToken(token)
      isConnected.value = true
      return true
    } catch (error) {
      console.error('Failed to refresh access token', error)
      return false
    }
  }

  // Login with Spotify - redirects to Spotify authorization page
  const login = () => {
    if (!process.client) return
    
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
      'streaming'
    ]
    
    // Get current URI for better redirect handling
    let redirectUri = config.public.spotifyRedirectUri
    
    // Ensure we're not trying to use a production URI in local development
    if (process.client && window.location.hostname === 'localhost' && 
        !redirectUri.includes('localhost')) {
      redirectUri = `http://${window.location.host}/callback`
      console.warn('Using localhost redirect URI:', redirectUri)
    }
    
    // Generate authorization URL manually if createAuthorizeURL is not available
    try {
      const state = generateRandomString(16)
      let authorizeURL
      
      if (typeof spotifyApi.createAuthorizeURL === 'function') {
        // Override the redirect URI for local development if needed
        authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
      } else {
        // Manual URL creation as fallback
        const scopeString = scopes.join(' ')
        authorizeURL = 'https://accounts.spotify.com/authorize' +
          '?client_id=' + config.public.spotifyClientId +
          '&response_type=code' +
          '&redirect_uri=' + encodeURIComponent(redirectUri) +
          '&scope=' + encodeURIComponent(scopeString) +
          '&state=' + state
      }
      
      console.log('Redirecting to Spotify login:', authorizeURL)
      window.location.href = authorizeURL
    } catch (error) {
      console.error('Error creating authorize URL:', error)
      alert('Error connecting to Spotify. Please try again later.')
    }
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
      
      const responseText = await response.text()
      let tokenData
      
      try {
        tokenData = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse token response:', responseText)
        throw new Error('Invalid response from server')
      }
      
      if (!response.ok) {
        console.error('Token exchange failed:', tokenData)
        throw new Error(tokenData.message || 'Failed to exchange token')
      }
      
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
        return null
      }
      
      // Try the call
      return await apiCall()
    } catch (error: any) {
      // If token expired, refresh and try again
      if (error.statusCode === 401) {
        console.log('Token expired, refreshing...')
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          return await apiCall()
        } else {
          throw new Error('Failed to refresh token')
        }
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

  // const getMadeForYouPlaylists = async () => {
  //   return callWithTokenRefresh(async () => {
  //     try {
  //       const response = await spotifyApi.getUserPlaylists()
  //       const madeForYou = response.body.items.filter(playlist =>
  //         /made for you|discover weekly|release radar|your mix/i.test(playlist.name)
  //       )
  //       return madeForYou
  //     } catch (error) {
  //       console.error('Error getting Made For You playlists:', error)
  //       throw error
  //     }
  //   })
  // }

  const getMadeForYouPlaylists = async () => {
    return callWithTokenRefresh(async () => {
      try {
        const response = await spotifyApi.getUserPlaylists()
        return response.body.items
      } catch (error) {
        console.error('Error getting user playlists:', error)
        throw error
      }
    })
  }


  // Add these methods to your useSpotify composable

// const getFeaturedPlaylists = async (limit = 6) => {
//   return callWithTokenRefresh(async () => {
//     try {
//       const response = await spotifyApi.getFeaturedPlaylists({
//         limit,
//         country: 'US' // You can make this dynamic based on user location
//       })
//       return response.body.playlists.items.map((playlist: any) => ({
//         id: playlist.id,
//         name: playlist.name,
//         description: playlist.description,
//         imageUrl: playlist.images[0]?.url || '/placeholder.png',
//         uri: playlist.uri
//       }))
//     } catch (error) {
//       console.error('Error getting featured playlists:', error)
//       throw error
//     }
//   })
// }

// const getMadeForYouPlaylists = async (limit = 6) => {
//   return callWithTokenRefresh(async () => {
//     try {
//       // First get the current user's ID
//       const meResponse = await spotifyApi.getMe()
//       const userId = meResponse.body.id
      
//       // Then get the "Made For You" playlists (Spotify's personalized playlists)
//       const response = await spotifyApi.getUserPlaylists(userId, {
//         limit,
//         offset: 0
//       })
      
//       // Filter for "Made For You" type playlists
//       const madeForYouPlaylists = response.body.items.filter((playlist: any) => {
//         return (
//           playlist.owner.id === 'spotify' && 
//           playlist.name.includes('Made For You')
//         )
//       })
      
//       // If we didn't get enough, fall back to other personalized playlists
//       if (madeForYouPlaylists.length < limit) {
//         const additionalPlaylists = response.body.items.filter((playlist: any) => {
//           return (
//             playlist.owner.id === 'spotify' && 
//             (playlist.name.includes('Discover Weekly') || 
//              playlist.name.includes('Daily Mix') ||
//              playlist.name.includes('Release Radar'))
//           )
//         })
//         madeForYouPlaylists.push(...additionalPlaylists.slice(0, limit - madeForYouPlaylists.length))
//       }
      
//       return madeForYouPlaylists.map((playlist: any) => ({
//         id: playlist.id,
//         name: playlist.name,
//         description: playlist.description || `Your personalized ${playlist.name}`,
//         imageUrl: playlist.images[0]?.url || '/placeholder.png',
//         uri: playlist.uri
//       }))
//     } catch (error) {
//       console.error('Error getting made for you playlists:', error)
//       throw error
//     }
//   })
// }



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

  console.log('SpotifyWebApi initialized with redirect URI:', config.public.spotifyRedirectUri)

  return {
    login,
    logout,
    handleCallback,
    isInitialized,
    hasToken,
    isConnected,
    getFeaturedPlaylists,
    getMadeForYouPlaylists,
    getMyTopArtists,
    getMyRecentlyPlayed,
    searchTracks,
    spotifyApi,
    refreshAccessToken,
    play
  }
} 


