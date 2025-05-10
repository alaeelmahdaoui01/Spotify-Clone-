<template>
  <div>
    <NavBar />
    <div class="login-page">
      <div class="login-container">
        <div class="login-card">
          <div class="text-center mb-6">
            <svg viewBox="0 0 24 24" class="spotify-logo mb-4">
              <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <h4 class="login-title">Log in to Spotify</h4>
          </div>
          
          <!-- Login Form -->
          <form @submit.prevent="handleEmailLogin" v-if="!isRegistering" class="login-form">
            <div class="form-group">
              <label for="email" class="form-label">Email address</label>
              <input 
                type="email" 
                class="form-input" 
                id="email" 
                v-model="email" 
                required
                placeholder=""
              >
            </div>
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                class="form-input" 
                id="password" 
                v-model="password" 
                required
                placeholder="Enter your password"
              >
            </div>
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            <button type="submit" class="login-btn">
              Log In
            </button>
          </form>

          <!-- Register Form -->
          <form @submit.prevent="handleRegister" v-else class="login-form">
            <div class="form-group">
              <label for="register-email" class="form-label">Email address</label>
              <input 
                type="email" 
                class="form-input" 
                id="register-email" 
                v-model="email" 
                required
                placeholder="name@domain.com"
              >
            </div>
            <div class="form-group">
              <label for="register-password" class="form-label">Password</label>
              <input 
                type="password" 
                class="form-input" 
                id="register-password" 
                v-model="password" 
                required
                placeholder="Enter your password"
              >
            </div>
            <div class="form-group">
              <label for="confirm-password" class="form-label">Confirm Password</label>
              <input 
                type="password" 
                class="form-input" 
                id="confirm-password" 
                v-model="confirmPassword" 
                required
                placeholder="Re-enter your password"
              >
            </div>
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            <button type="submit" class="login-btn">
              Sign Up
            </button>
          </form>

          <!-- Divider -->
          <div class="divider">
            <span class="divider-line"></span>
            <span class="divider-text">or</span>
            <span class="divider-line"></span>
          </div>
          
          <!-- Social Login -->
          <button @click="handleGoogleLogin" class="google-btn">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <!-- Toggle Login/Register -->
          <div class="toggle-auth text-center">
            <p v-if="!isRegistering">
              Don't have an account? 
              <a href="#" @click.prevent="isRegistering = true" class="toggle-link">Sign up for Spotify</a>
            </p>
            <p v-else>
              Already have an account? 
              <a href="#" @click.prevent="isRegistering = false" class="toggle-link">Log in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  background-color: #191414;
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-container {
  width: 100%;
  max-width: 450px;
}

.login-card {
  background-color: #000;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.spotify-logo {
  width: 48px;
  height: 48px;
}

.login-title {
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 0;
}

.login-form {
  margin-top: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  color: white;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px;
  background-color: #121212;
  border: 1px solid #333;
  border-radius: 4px;
  color: white;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #1DB954;
}

.error-message {
  color: #ff4e45;
  font-size: 14px;
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 500px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.login-btn:hover {
  background-color: #1ed760;
  transform: scale(1.02);
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: #333;
}

.divider-text {
  color: #b3b3b3;
  font-size: 12px;
  padding: 0 16px;
  text-transform: uppercase;
}

.google-btn {
  width: 100%;
  padding: 12px;
  background-color: transparent;
  color: white;
  border: 1px solid #727272;
  border-radius: 500px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.google-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.google-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.toggle-auth {
  margin-top: 32px;
  color: #b3b3b3;
  font-size: 16px;
}

.toggle-link {
  color: white;
  text-decoration: none;
  font-weight: 700;
}

.toggle-link:hover {
  color: #1DB954;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px;
  }
  
  .login-title {
    font-size: 20px;
  }
}
</style>

<script setup lang="ts">
// Your existing script setup remains the same
const router = useRouter()
const route = useRoute()
const { loginWithGoogle, loginWithEmail, registerWithEmail, isAuthenticated } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const isRegistering = ref(false)

// Redirect if already authenticated
onMounted(() => {
  if (isAuthenticated.value) {
    router.push('/')
  }
  
  // Check if register parameter is present in the URL
  if (route.query.register) {
    isRegistering.value = true
  }
})

// Handle redirection after successful login
const redirectAfterLogin = () => {
  // Check if there's a redirect path in the query parameters
  const redirectPath = route.query.redirect as string
  if (redirectPath) {
    router.push(redirectPath)
  } else {
    router.push('/')
  }
}

const handleGoogleLogin = async () => {
  try {
    errorMessage.value = ''
    await loginWithGoogle()
    redirectAfterLogin()
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to login with Google'
  }
}

const handleEmailLogin = async () => {
  try {
    errorMessage.value = ''
    await loginWithEmail(email.value, password.value)
    redirectAfterLogin()
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to login'
  }
}

const handleRegister = async () => {
  try {
    errorMessage.value = ''
    
    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Passwords do not match'
      return
    }
    
    await registerWithEmail(email.value, password.value)
    redirectAfterLogin()
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to register'
  }
}

definePageMeta({
  layout: false,
  middleware: [] // optional: to skip global auth if needed
})
</script>