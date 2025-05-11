# Spotify Clone 


## Getting Started

Follow these instructions to set up and run the project locally.

### 1. Clone the Repository


git clone https://github.com/alaeelmahdaoui01/Spotify-Clone-.git  <br>
cd spotify-clone

### 2. Install Dependencies

npm install

### 3. Set Up Environment Variables

Create a .env file in the root directory of the project. <br>
by copying the example file: .env.example

### 4. Spotify Developer Setup

Go to the Spotify Developer Dashboard: https://developer.spotify.com/dashboard/applications

Log in with your Spotify account (or sign up if you don't have one).

Create an App and fill in the required details.

In the app settings, set the Redirect URI to: http://127.0.0.1:3000/callback

Copy your Client ID and Client Secret, and paste them into your .env file

### 5. Running the Project

Once everything is set up: npm run dev


### Quick remark 

If you want to use another account in the OAuth2.0 spotify authentification other than the one you used for the creation of the project, You should add the user's email in User Management in your Spotify Developer's dashboard