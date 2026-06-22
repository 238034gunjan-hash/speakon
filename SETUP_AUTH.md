# Authentication Setup Guide - Speak-On

This guide will help you set up user authentication with login, signup, and Google OAuth.

## 📋 What's Been Implemented

✅ User signup with email & password  
✅ User login with JWT tokens  
✅ Google OAuth 2.0 sign-in  
✅ JWT token refresh mechanism  
✅ Protected API routes  
✅ User database schema (Neon PostgreSQL)

---

## 🔧 Step 1: Set Up Database

Run this command to create or migrate the Neon tables:

```bash
cd backend
python setup_db.py
```

You should see: `Database schema is ready.`

The same idempotent migration also runs automatically when the Flask app starts.

---

## 🔑 Step 2: Generate JWT Secret Key

Add a secure JWT secret to your `.env` file. Replace the placeholder:

**In `backend/.env`:**

```
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

**Better yet**, generate a random key:

### On Windows (PowerShell):
```powershell
$bytes = New-Object Byte[] 32
(New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
$key = [Convert]::ToBase64String($bytes)
Write-Host $key
```

### On Mac/Linux:
```bash
openssl rand -base64 32
```

Copy the output and update `.env`:
```
JWT_SECRET_KEY=<your-generated-key-here>
```

---

## 🌐 Step 3: Set Up Google OAuth 2.0

### 3.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown and select **"New Project"**
3. Name it `speakon-auth` (or your preference)
4. Click **Create**
5. Wait for the project to initialize

### 3.2 Enable Google+ API

1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click on it and press **Enable**

### 3.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Select **External** for User Type
   - Fill in:
     - **App name**: Speak-On
     - **User support email**: your-email@example.com
     - **Developer contact info**: your-email@example.com
   - Click **Save and Continue** through all steps

4. Back to OAuth credentials:
   - Select **Web application**
   - Name: `Speak-On Web`
   - Add **Authorized JavaScript origins**:
     ```
     http://localhost:5000
     http://localhost:3000
     ```
   - Use `http://localhost:5000` when opening the app. Google considers
     `localhost` and `127.0.0.1` to be different origins.
   - Click **Create**

### 3.4 Copy Your Credentials

You'll see a popup with:
- **Client ID** (looks like: `xxx.apps.googleusercontent.com`)
- **Client Secret**

Copy these values.

---

## 📝 Step 4: Update Environment Variables

**In `backend/.env`:**

```
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

The frontend loads the public client ID from `/api/auth/config`. Do not
hard-code OAuth credentials in the HTML or JavaScript files.

---

## 📦 Step 5: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## 🚀 Step 6: Run Your Application

### Terminal 1 - Backend:
```bash
cd backend
python app.py
```

You should see:
```
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

### Terminal 2 - Frontend (Open in browser):
```
http://localhost:5000
```

---

## 🧪 Testing the Authentication

### Test Signup:
1. Go to `http://localhost:5000/signup.html`
2. Enter email, password, and name
3. Click **Create Account**
4. You should be logged in and redirected to home

### Test Login:
1. Go to `http://localhost:5000/login.html`
2. Enter the same email and password
3. Click **Login**
4. You should be logged in

### Test Google Sign-In:
1. Go to `http://localhost:5000/login.html` or signup page
2. Click **Sign in with Google**
3. Select your Google account
4. You should be logged in with Google account info

### Check Token in Browser:
Open DevTools → Application → Local Storage:
- `access_token` - JWT token for API requests
- `refresh_token` - Token to get new access tokens
- `user` - User info (email, name, profile picture)

---

## 🔐 API Endpoints

### Authentication Routes

#### **POST** `/api/auth/signup`
Create a new user with email & password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": { "id": 1, "email": "user@example.com", ... },
  "access_token": "eyJ0...",
  "refresh_token": "eyJ0..."
}
```

---

#### **POST** `/api/auth/login`
Login with email & password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { "id": 1, "email": "user@example.com", ... },
  "access_token": "eyJ0...",
  "refresh_token": "eyJ0..."
}
```

---

#### **POST** `/api/auth/google`
Google OAuth sign-in

**Request:**
```json
{
  "token": "google-id-token-from-frontend"
}
```

**Response:**
```json
{
  "message": "Google sign-in successful",
  "user": { "id": 1, "email": "user@gmail.com", ... },
  "access_token": "eyJ0...",
  "refresh_token": "eyJ0..."
}
```

---

#### **POST** `/api/auth/refresh`
Refresh access token using refresh token

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "access_token": "new-jwt-token"
}
```

---

#### **GET** `/api/auth/me`
Get current user info

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": { "id": 1, "email": "user@example.com", ... }
}
```

---

#### **POST** `/api/auth/logout`
Logout user (frontend should delete tokens)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## 🛡️ Using Authentication in Your App

### In Frontend JavaScript:

```javascript
// Signup
await auth.signup('email@example.com', 'password', 'John', 'Doe');

// Login
await auth.login('email@example.com', 'password');

// Google sign-in (handled by auth.js automatically)

// Get current user
const user = auth.user;
console.log(user.email);

// Check if logged in
if (auth.isLoggedIn()) {
  console.log('User is logged in');
}

// Make authenticated API call
const response = await auth.fetchWithAuth('/api/translate', {
  method: 'POST',
  body: JSON.stringify({ text: 'hello' })
});

// Logout
auth.logout();
```

---

## 🐛 Troubleshooting

### "Google token is invalid"
- Check if GOOGLE_CLIENT_ID in `.env` matches the frontend
- Make sure your Google Cloud project is set up correctly
- Verify OAuth consent screen is configured

### "User already exists"
- Try a different email or delete the user from database

### "Invalid credentials"
- Make sure password is correct
- User must exist in database

### "JWT_SECRET_KEY not set"
- Add `JWT_SECRET_KEY` to `.env`

### "CORS error"
- CORS is already enabled in Flask (`flask-cors`)
- Make sure backend is running on localhost:5000

---

## 📱 Protecting Routes

To protect your existing API routes with JWT, add this decorator:

```python
from flask_jwt_extended import jwt_required, get_jwt_identity

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected_route():
    user_id = get_jwt_identity()
    # Your code here
    return jsonify({"message": "Protected data"})
```

---

## 🔒 Security Best Practices

1. **Never commit `.env`** - Add to `.gitignore`
2. **Change JWT_SECRET_KEY in production** - Use a strong random key
3. **Use HTTPS in production** - Not just HTTP
4. **Regenerate Google OAuth credentials** for production
5. **Set CORS properly** - Restrict to your domain only
6. **Password requirements** - Consider adding minimum length validation

---

## 📞 Need Help?

- Check backend logs: `app.run(debug=True)`
- Check browser console (F12) for frontend errors
- Verify all `.env` variables are set
- Make sure database connection is working

---

**You're all set! Start the backend and test the authentication system.** 🎉
