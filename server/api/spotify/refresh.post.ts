import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { refreshToken } = body

    if (!refreshToken) {
      throw createError({
        statusCode: 400,
        message: 'Refresh token is required'
      })
    }

    // Exchange the refresh token for a new access token
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${config.public.spotifyClientId}:${config.spotifyClientSecret}`
        ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString()
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Spotify token refresh failed:', data)
      throw createError({
        statusCode: response.status,
        message: data.error_description || data.error || 'Failed to refresh token'
      })
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in
    }
  } catch (error: any) {
    console.error('Token refresh error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
}) 