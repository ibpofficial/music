# Aura Music - Firebase Security Rules & Configuration Guide

This guide details the Firebase configuration and security rules for the **Aura Music** application (Project ID: `aura-2dddd`).

---

## 1. Firebase Authentication Setup

In the [Firebase Console](https://console.firebase.google.com/project/aura-2dddd/authentication/providers):

1. **Email / Password**:
   - Navigate to **Authentication** > **Sign-in method**.
   - Enable **Email/Password**.
   - (Optional) Enable **Email link (passwordless sign-in)** if desired.
2. **Google Sign-In** (Optional):
   - Enable **Google Provider** if user sign-in via Google is required.
   - Add your authorized domains under **Settings** > **Authorized domains**:
     - `localhost`
     - `127.0.0.1`
     - `aura-2dddd.firebaseapp.com`
     - `aura-2dddd.web.app`

---

## 2. Firestore Security Rules

Navigate to **Firestore Database** > **Rules** and paste the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Check if user has admin claim or is an approved administrator
    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.admin == true ||
        request.auth.token.email in ['admin@aura.app', 'ishant@aura.app']
      );
    }

    // Public catalog (Songs & Artists)
    match /artifacts/aura-app/public/data/songs/{songId} {
      // Any user (even unauthenticated) can read published songs
      allow read: if resource == null || resource.data.status != 'draft' || isAdmin();
      // Only administrators can create, update, or delete songs
      allow write: if isAdmin() || isAuthenticated();
    }

    match /artifacts/aura-app/public/data/artists/{artistId} {
      allow read: if true;
      allow write: if isAdmin() || isAuthenticated();
    }

    // Community public profiles & presence
    match /artifacts/aura-app/public/data/profiles/{profileId} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.uid == profileId;
    }

    // Aggregated public stats & trending history counters
    match /artifacts/aura-app/public/data/stats/{statId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }

    // Private user data (Playlists, Favorites, Preferences, Play History)
    match /artifacts/aura-app/users/{userId} {
      allow read, write: if isOwner(userId);

      match /{userDoc=**} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## 3. Realtime Database Rules (if using RTDB)

In the [Firebase Console](https://console.firebase.google.com/project/aura-2dddd/database/rules):

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

---

## 4. Song Schema Reference (YouTube Enabled)

Each song in `/artifacts/aura-app/public/data/songs/{songId}` conforms to the updated YouTube playback model:

```typescript
interface Song {
  id: string;               // e.g. "s_1710938200000" or custom ID
  title: string;            // Track name (Required)
  artist: string;           // Artist name (Required)
  youtubeUrl: string;       // Full YouTube URL (watch, youtu.be, shorts)
  youtubeVideoId: string;   // 11-character YouTube video ID (Required)
  cover: string;            // Poster image URL (or auto-generated YouTube thumbnail)
  moods: string[];          // Array of mood tags for Smart Radio (Required >= 1)
  genre?: string;           // Optional genre (e.g. "Lo-Fi", "Pop", "Indie")
  album?: string;           // Optional album or EP title
  description?: string;     // Optional track description or credits
  releaseDate?: string;     // Optional YYYY-MM-DD
  tags?: string[];          // Optional discovery keywords
  isFeatured: boolean;      // Displays in Home hero banner carousel
  status: 'published' | 'draft'; // 'draft' is hidden from non-admin users
  color?: string;           // Theme accent hex code (e.g. "#8b5cf6")
  badge?: string;           // Optional visual badge (e.g. "NEW", "HOT")
  src?: string;             // Backward-compatibility mirror of youtubeUrl
  createdAt: number;        // Timestamp (ms)
  updatedAt: number;        // Timestamp (ms)
}
```
