<template>
    <div class="navbar">
      <div class="navbar-content">
        <NuxtLink to="/" class="logo-link">
          <svg viewBox="0 0 24 24" class="spotify-logo">
            <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>Spotify</span>
        </NuxtLink>
        <div class="links">
          <NuxtLink to="/" class="navbar-link">Home</NuxtLink>
          <NuxtLink to="/login" class="navbar-link login-btn">Log in/Sign up</NuxtLink>
        </div>
      </div>
    </div>
  </template>
  
  <style scoped>
  .navbar {
    background-color: #000000;
    color: white;
    padding: 0 32px;
    height: 80px;
    display: flex;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .navbar-content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo-link {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    font-weight: 700;
    color: white;
    text-decoration: none;
  }
  
  .spotify-logo {
    width: 40px;
    height: 40px;
    color: #1DB954;
  }
  
  .links {
    display: flex;
    align-items: center;
    gap: 30px;
  }
  
  .navbar-link {
    color: white;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    transition: color 0.2s ease;
  }
  
  .navbar-link:hover {
    color: #1DB954;
  }
  
  .login-btn {
    background-color: white;
    color: black !important;
    padding: 12px 32px;
    border-radius: 500px;
    font-weight: 700;
    transition: all 0.2s ease;
  }
  
  .login-btn:hover {
    transform: scale(1.04);
    background-color: #1DB954;
    color: white !important;
  }
  
  .login-btn:last-child {
    background-color: transparent;
    color: white !important;
    border: 1px solid white;
  }
  
  .login-btn:last-child:hover {
    background-color: #333;
    border-color: #333;
  }
  </style>