import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import { useSpotify } from './useSpotify'

export const useSpotifyPlayer = () => {
  const { isConnected, spotifyApi, refreshAccessToken } = useSpotify()
  
  const player = shallowRef<Spotify.Player | null>(null)
  const deviceId = ref<string | null>(null)
  const isPlayerReady = ref(false)
  const isPlaying = ref(false)
  const currentTrack = ref<any>(null)
  const playerState = ref<Spotify.PlaybackState | null>(null)
  const playerError = ref<string | null>(null)
  
  
  const loadSpotifyScript = () => {
    return new Promise<void>((resolve, reject) => {
   
      if (document.getElementById('spotify-player')) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.id = 'spotify-player'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      
      script.onload = () => resolve()
      script.onerror = (error) => reject(error)
      
      document.body.appendChild(script)
    })
  }
  
 
  const initializePlayer = () => {
    console.log('[SpotifyPlayer] initializePlayer called')
    if (!window.Spotify) {
      console.error('[SpotifyPlayer] Spotify SDK not loaded')
      playerError.value = 'Spotify SDK not loaded'
      return
    }

    const token = spotifyApi.getAccessToken()
    if (!token) {
      console.error('[SpotifyPlayer] No Spotify access token available')
      playerError.value = 'No Spotify access token available'
      return
    }

    console.log('[SpotifyPlayer] Initializing Spotify Web Player...')

    player.value = new window.Spotify.Player({
      name: 'Spotify Clone Web Player',
      getOAuthToken: async (cb: (token: string) => void) => {
        let token = spotifyApi.getAccessToken()
        try {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            token = spotifyApi.getAccessToken() || ''
            console.log('[SpotifyPlayer] Token refreshed successfully for player')
          } else {
            console.warn('[SpotifyPlayer] Token refresh was not successful')
          }
        } catch (error) {
          console.error('[SpotifyPlayer] Error refreshing access token:', error)
        }
        if (!token) {
          console.error('[SpotifyPlayer] No access token available after refresh attempt')
        }
        cb(token || '')
      },
      volume: 0.5
    })
    
  
    player.value.addListener('initialization_error', ({ message }) => {
      console.error('[SpotifyPlayer] Initialization error:', message)
      playerError.value = `Initialization error: ${message}`
      isPlayerReady.value = false
    })
    
    player.value.addListener('authentication_error', ({ message }) => {
      console.error('[SpotifyPlayer] Authentication error:', message)
      playerError.value = `Authentication error: ${message}`
      isPlayerReady.value = false
    })
    
    player.value.addListener('account_error', ({ message }) => {
      console.error('[SpotifyPlayer] Account error:', message)
      playerError.value = `Premium required: ${message}`
      isPlayerReady.value = false
    })
    
    player.value.addListener('playback_error', ({ message }) => {
      console.error('[SpotifyPlayer] Playback error:', message)
      playerError.value = `Playback error: ${message}`
    })
    
  
    player.value.addListener('player_state_changed', (state) => {
      console.log('[SpotifyPlayer] player_state_changed', state)
      if (!state) {
        isPlaying.value = false
        currentTrack.value = null
        return
      }
      
      playerState.value = state
      isPlaying.value = !state.paused
      
      if (state.track_window?.current_track) {
        currentTrack.value = {
          ...state.track_window.current_track,
          duration_ms: state.duration,
          progress_ms: state.position
        }
      }
    })
    
    
    player.value.addListener('ready', async ({ device_id }) => {
      console.log('[SpotifyPlayer] Ready with Device ID', device_id)
      deviceId.value = device_id
      
      
      const success = await setActiveDevice()
      if (success) {
        isPlayerReady.value = true
        playerError.value = null
        
        
        try {
          if (player.value) {
            const state = await player.value.getCurrentState()
            console.log('[SpotifyPlayer] Initial playback state', state)
            if (state) {
              isPlaying.value = !state.paused
              currentTrack.value = state.track_window.current_track
            }
          }
        } catch (error) {
          console.error('[SpotifyPlayer] Error getting initial playback state:', error)
        }
      } else {
        playerError.value = 'Failed to set device as active'
        isPlayerReady.value = false
        console.error('[SpotifyPlayer] Failed to set device as active')
      }
    })
    
    
    player.value.addListener('not_ready', ({ device_id }) => {
      console.log('[SpotifyPlayer] Device ID has gone offline', device_id)
      isPlayerReady.value = false
      deviceId.value = null
    })
    
    
    player.value.connect().then(success => {
      if (success) {
        console.log('[SpotifyPlayer] Successfully connected to Spotify player')
      } else {
        console.error('[SpotifyPlayer] Failed to connect to Spotify player')
        playerError.value = 'Failed to connect to player'
        isPlayerReady.value = false
      }
    }).catch(error => {
      console.error('[SpotifyPlayer] Error connecting to Spotify player:', error)
      playerError.value = 'Error connecting to player'
      isPlayerReady.value = false
    })
  }
  
  
  const disconnect = () => {
    if (player.value) {
      player.value.disconnect()
      isPlayerReady.value = false
      deviceId.value = null
    }
  }
  
  interface SpotifyDevice {
    id: string
    is_active: boolean
    is_private_session: boolean
    is_restricted: boolean
    name: string
    type: string
    volume_percent: number
  }
  
 
  const setActiveDevice = async () => {
    if (!deviceId.value) {
      console.error('[SpotifyPlayer] setActiveDevice: No device ID available')
      return false
    }

    try {
      
      const response = await spotifyApi.getMyDevices()
      const devices = response.body.devices as SpotifyDevice[]
      const currentDevice = devices.find((d: SpotifyDevice) => d.id === deviceId.value)
      console.log('[SpotifyPlayer] setActiveDevice: Devices', devices)
      if (currentDevice?.is_active) {
        console.log('[SpotifyPlayer] setActiveDevice: Device is already active')
        return true
      }

    
      await spotifyApi.transferMyPlayback([deviceId.value], { play: false })
      console.log('[SpotifyPlayer] setActiveDevice: Transferred playback to device', deviceId.value)
      
     
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    
      const verifyResponse = await spotifyApi.getMyDevices()
      const verifyDevices = verifyResponse.body.devices as SpotifyDevice[]
      const verifyDevice = verifyDevices.find((d: SpotifyDevice) => d.id === deviceId.value)
      
      if (!verifyDevice?.is_active) {
        console.error('[SpotifyPlayer] setActiveDevice: Device activation verification failed')
        return false
      }
      
      return true
    } catch (error) {
      console.error('[SpotifyPlayer] setActiveDevice: Error setting active device:', error)
      return false
    }
  }
  
  const playTrack = async (trackUri: string) => {
    if (!isPlayerReady.value || !deviceId.value) {
      playerError.value = 'Player not ready'
      return
    }
    
    try {

      const success = await setActiveDevice()
      if (!success) {
        playerError.value = 'Failed to set device as active'
        return
      }
    
      await new Promise(resolve => setTimeout(resolve, 500))
      
    
      const state = await player.value?.getCurrentState()
      if (!state) {
        console.log('No current state, attempting to reconnect player...')
        await player.value?.connect()
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      await spotifyApi.play({
        device_id: deviceId.value,
        uris: [trackUri]
      })
    } catch (error) {
      console.error('Error playing track:', error)
      playerError.value = 'Error playing track'
    }
  }

  const playAlbum = async (albumUri: string) => {
    if (!isPlayerReady.value || !deviceId.value) {
      playerError.value = 'Player not ready'
      return
    }
    
    try {

      await setActiveDevice()
      
      await spotifyApi.play({
        device_id: deviceId.value,
        context_uri: albumUri
      })
    } catch (error) {
      console.error('Error playing album:', error)
      playerError.value = 'Error playing album'
    }
  }
  

  const playPlaylist = async (playlistUri: string) => {
    if (!isPlayerReady.value || !deviceId.value) {
      playerError.value = 'Player not ready'
      return
    }
    
    try {
      // Ensure this device is active
      await setActiveDevice()
      
      await spotifyApi.play({
        device_id: deviceId.value,
        context_uri: playlistUri
      })
    } catch (error) {
      console.error('Error playing playlist:', error)
      playerError.value = 'Error playing playlist'
    }
  }

  const togglePlay = async () => {
    if (!player.value) return
    
    try {
      await player.value.togglePlay()
    } catch (error) {
      console.error('Error toggling play state:', error)
      playerError.value = 'Error toggling play state'
    }
  }

  const seek = async (positionMs: number) => {
    if (!player.value) return
    
    try {
      await player.value.seek(positionMs)
    } catch (error) {
      console.error('Error seeking:', error)
      playerError.value = 'Error seeking'
    }
  }
  

  const setVolume = async (volumePercentage: number) => {
    if (!player.value || !isPlayerReady.value) return
    
    try {
      await player.value.setVolume(volumePercentage)
    } catch (error) {
      console.error('Error setting volume:', error)
      playerError.value = 'Error setting volume'
    }
  }
  
  const play = async () => {
    if (!player.value || !isPlayerReady.value || !deviceId.value) {
      playerError.value = 'Player not ready'
      return
    }
    
    try {
  
      await setActiveDevice()
      
      const state = await player.value.getCurrentState()
      if (state?.paused) {
        await player.value.togglePlay()
      }
      isPlaying.value = true
    } catch (error) {
      console.error('Error playing track:', error)
      playerError.value = 'Error playing track'
    }
  }

  const pause = async () => {
    if (!player.value || !isPlayerReady.value || !deviceId.value) {
      playerError.value = 'Player not ready'
      return
    }
    
    try {

      await setActiveDevice()
      
      const state = await player.value.getCurrentState()
      if (!state?.paused) {
        await player.value.togglePlay()
      }
      isPlaying.value = false
    } catch (error) {
      console.error('Error pausing track:', error)
      playerError.value = 'Error pausing track'
    }
  }
  
 
  const volume = ref(0.5)
  

  onMounted(async () => {
    if (process.client) {
      try {
       
        if (!isConnected.value) {
          console.log('Waiting for Spotify connection before initializing player...')
          
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            if (isConnected.value) break
          }
        }
        
       
        if (!isConnected.value) {
          console.warn('Not connected to Spotify, not initializing player')
          return
        }
        
        await loadSpotifyScript()
        
        window.onSpotifyWebPlaybackSDKReady = () => {
          console.log('Spotify Web Playback SDK is ready')
          initializePlayer()
        }
        
       
        if (window.Spotify) {
          initializePlayer()
        }
      } catch (error) {
        console.error('Error initializing Spotify player:', error)
        playerError.value = 'Error initializing player'
        isPlayerReady.value = false
      }
    }
  })
  

  onUnmounted(() => {
    if (player.value) {
      disconnect()
    }
  })
  
  
  const previousTrack = async () => {
    if (!player.value || !isPlayerReady.value || !deviceId.value) {
      playerError.value = 'Player not ready'
      console.warn('[SpotifyPlayer] Previous: Player not ready', { player: !!player.value, isPlayerReady: isPlayerReady.value, deviceId: deviceId.value })
      return
    }

    try {
      
      await setActiveDevice()
      const state = await player.value.getCurrentState()
      console.log('[SpotifyPlayer] Previous: Current state', state)
      if (state?.disallows.skipping_prev) {
        playerError.value = 'Cannot skip to previous track (disallowed by Spotify)'
        console.warn('[SpotifyPlayer] Previous: Skipping previous is disallowed', state?.disallows)
        return
      }
      await player.value.previousTrack()
      console.log('[SpotifyPlayer] Previous: Command sent')
    } catch (error) {
      console.error('[SpotifyPlayer] Error skipping to previous track:', error)
      playerError.value = 'Error skipping to previous track'
    }
  }
  

  const nextTrack = async () => {
    if (!player.value || !isPlayerReady.value || !deviceId.value) {
      playerError.value = 'Player not ready'
      console.warn('[SpotifyPlayer] Next: Player not ready', { player: !!player.value, isPlayerReady: isPlayerReady.value, deviceId: deviceId.value })
      return
    }

    try {
      
      const success = await setActiveDevice()
      if (!success) {
        playerError.value = 'Failed to set device as active'
        console.warn('[SpotifyPlayer] Next: Failed to set device as active')
        return
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      const state = await player.value.getCurrentState()
      console.log('[SpotifyPlayer] Next: Current state', state)
      if (state?.disallows.skipping_next) {
        playerError.value = 'Cannot skip to next track (disallowed by Spotify)'
        console.warn('[SpotifyPlayer] Next: Skipping next is disallowed', state?.disallows)
        return
      }
      await player.value.nextTrack()
      console.log('[SpotifyPlayer] Next: Command sent')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      const newState = await player.value.getCurrentState()
      if (newState) {
        isPlaying.value = !newState.paused
        currentTrack.value = newState.track_window.current_track
      }
    } catch (error) {
      console.error('[SpotifyPlayer] Error skipping to next track:', error)
      playerError.value = 'Error skipping to next track'
    }
  }
  
  return {
    player,
    deviceId,
    isPlayerReady,
    isPlaying,
    currentTrack,
    playerState,
    playerError,
    playTrack,
    playAlbum,
    playPlaylist,
    togglePlay,
    seek,
    setVolume,
    previousTrack,
    nextTrack,
    disconnect,
    play,
    pause,
    volume,
    setActiveDevice
  }
}

// Declare the Spotify global namespace for TypeScript
declare global {
  interface Window {
    Spotify: {
      Player: new (options: Spotify.PlayerInit) => Spotify.Player;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// Spotify types
declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }
  
  interface Player {
    connect: () => Promise<boolean>;
    disconnect: () => void;
    addListener: (eventName: string, callback: (state: any) => void) => void;
    removeListener: (eventName: string, callback?: (state: any) => void) => void;
    togglePlay: () => Promise<void>;
    seek: (positionMs: number) => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    previousTrack: () => Promise<void>;
    nextTrack: () => Promise<void>;
    getCurrentState: () => Promise<PlaybackState | null>;
  }
  
  interface PlaybackState {
    context: {
      uri: string;
      metadata: Record<string, unknown>;
    };
    disallows: {
      pausing: boolean;
      resuming: boolean;
      seeking: boolean;
      skipping_prev: boolean;
      skipping_next: boolean;
    };
    duration: number;
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: WebPlaybackTrack;
      previous_tracks: WebPlaybackTrack[];
      next_tracks: WebPlaybackTrack[];
    };
  }
  
  interface WebPlaybackTrack {
    uri: string;
    id: string;
    type: 'track' | 'episode' | 'ad';
    media_type: 'audio' | 'video';
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: { url: string }[];
    };
    artists: {
      uri: string;
      name: string;
    }[];
  }
}

interface SpotifyArtist {
  id: string
  name: string
  type: string
  uri: string
}

interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
  uri: string
} 