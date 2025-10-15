# CollabCanvas MVP

A real-time collaborative canvas application built with React, Firebase, and Konva.js.

## 🚀 Live Demo

**Deployed URL:** [https://collab-canvas-d0e38.web.app](https://collab-canvas-d0e38.web.app)

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Canvas:** Konva.js + React-Konva
- **Backend:** Firebase (Firestore + Authentication + Hosting)
- **Auth:** Google OAuth via Firebase Authentication

## ✨ Features (MVP)

### Core Canvas Features
- **5000x5000px workspace** with pan (drag) and smooth cursor-centered zoom (scroll wheel)
- **Rectangle creation** - Click toolbar button, then click canvas to place (random colors)
- **Free-form resizing** - 8 handles (4 corners + 4 middles) for any aspect ratio
- **Shape rotation** - 360° rotation via Konva Transformer handles
- **Shape manipulation** - Drag to move, resize, rotate, delete (right-click or Delete key)
- **Canvas boundaries** - Visual gray/white distinction, prevents panning beyond limits
- **Debug panel** - Real-time metrics: zoom, canvas center, cursor position, user/shape counts

### Real-Time Collaboration
- **Multi-user cursor sync** - See everyone's mouse position with name labels
- **Instant shape sync** - Changes appear for all users within 100ms
- **User presence** - See who's online with profile photos and roles
- **Shape locking** - Auto-locks when editing to prevent conflicts

### Owner Controls
- **Priority locking** - Owner can always edit any shape
- **Override control** - Right-click locked shapes to take control
- **Kick users** - Remove collaborators from canvas (UI present)
- **Permanent ownership** - First user becomes permanent owner

### Reliability
- **State persistence** - Canvas survives refresh and disconnects
- **Optimistic updates** - Immediate UI feedback with rollback on errors
- **Reconnection handling** - 3-second disconnect banner with refresh prompt
- **Firestore sync** - All data persisted in real-time database

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

## 🎯 Project Status

### Completed PRs

- ✅ **PR #1-6:** Setup, Auth, Canvas, Shapes, Real-time Sync, Cursor Sync
- ✅ **PR #7:** User Presence System  
- ✅ **PR #8:** Shape Locking + Owner Override
- ✅ **PR #9:** Kick User Feature
- ✅ **PR #10:** State Persistence & Reconnection
- ✅ **PR #11:** Polish, Performance & Bug Fixes (rotation, smooth zoom, presence cleanup, cursor cleanup, lock cleanup, auth styling)
- ✅ **PR #12:** Final Deployment & MVP Testing

---

## 📚 Firestore Structure

```
/canvases/main/
├── metadata/           # Canvas owner, created timestamp
├── objects/{id}/       # Shapes (x, y, width, height, lockedBy, createdBy)
├── cursors/{userId}/   # Real-time cursor positions (x, y, userName)
└── presence/{userId}/  # User online status (userName, role, online, kicked)
```

## 🎨 Color Coding

- **Blue outline:** Selected shape
- **Green outline:** Locked by you
- **Red outline:** Locked by another user  
- **Black:** Unlocked shape

---

Built with ❤️ as a Figma-like collaborative canvas MVP
