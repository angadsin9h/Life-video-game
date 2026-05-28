# Firebase Setup Guide

Follow these steps to enable Google Sign-In and cloud sync for LifeQuest.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Name it `lifequest` (or anything you like)
4. Disable Google Analytics (optional)
5. Click **Create project**

## 2. Enable Google Sign-In

1. In the left sidebar click **Authentication** → **Get started**
2. Click the **Sign-in method** tab
3. Click **Google** → toggle **Enable** → Save
4. Set your **Project support email** to your Gmail address

## 3. Create Firestore Database

1. In the left sidebar click **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select a region close to you (e.g. `us-central`)
4. Click **Done**

## 4. Apply Security Rules

In the Firebase console → **Firestore Database** → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

## 5. Get your Firebase config

1. Go to **Project settings** (gear icon) → **General**
2. Scroll to **Your apps** → click **Add app** → choose Web (`</>`)
3. Register your app (any nickname)
4. Copy the `firebaseConfig` values — you'll see something like:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "yourproject.firebaseapp.com",
  projectId: "yourproject",
  storageBucket: "yourproject.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

## 6. Add config to your deployment

### Netlify
1. In your Netlify dashboard → **Site settings** → **Environment variables**
2. Add each variable:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | your apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | your authDomain |
| `VITE_FIREBASE_PROJECT_ID` | your projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | your storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your messagingSenderId |
| `VITE_FIREBASE_APP_ID` | your appId |

3. Trigger a new deploy.

### Vercel
1. In your Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add the same 6 variables above
3. Redeploy.

### Local development
Create `client/.env.local` (gitignored):
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

## 7. Add your domain to Authorized Domains

1. Firebase console → **Authentication** → **Settings** → **Authorized domains**
2. Add your Netlify/Vercel domain (e.g. `lifequest.netlify.app`)

That's it! Your friends can now sign in with Google and have their data saved to the cloud.
