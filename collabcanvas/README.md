# CollabCanvas MVP

A real-time collaborative canvas application built with React, Firebase, and Konva.js.

## 🚀 Live Demo

**Deployed URL:** [https://collab-canvas-d0e38.web.app](https://collab-canvas-d0e38.web.app)

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Canvas:** Konva.js + React-Konva
- **Backend:** Firebase (Firestore + Authentication + Hosting)
- **Auth:** Google OAuth via Firebase Authentication

## 📋 Features (MVP)

- Real-time collaborative canvas (5000x5000px workspace)
- Google OAuth authentication
- Rectangle shape creation and manipulation
- Multi-user cursor synchronization
- User presence tracking
- Owner controls with priority locking
- Persistent canvas state

## 🏃 Development Setup

### Prerequisites

- Node.js (v18 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- Google account for Firebase

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file in the project root:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## 📁 Project Structure

```
src/
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Firebase & utilities
│   └── firebase.js  # Firebase configuration
├── App.jsx          # Main app component
└── main.jsx         # React entry point
```

## 🔐 Security

- Firebase API keys are stored in `.env.local` (not committed)
- Firestore security rules enforce authentication
- Only authenticated users can read/write data

## 📖 Documentation

- [Product Requirements Document (PRD)](../PRD.md)
- [Task Breakdown](../tasks.md)

## 🎯 Current Status

**PR #1: Project Setup & Firebase Configuration** ✅ Complete

- React + Vite initialized
- Firebase & Konva dependencies installed
- Firebase project configured
- Firebase Hosting set up and deployed
- Firestore security rules deployed

---

Built with ❤️ as a Figma clone MVP
