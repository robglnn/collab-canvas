# CollabCanvas - Real-Time Collaborative Canvas

A Figma-like collaborative canvas MVP built with React, Firebase, and Konva.js.

## 🚀 Live Application

**Deployed URL:** [https://collab-canvas-d0e38.web.app](https://collab-canvas-d0e38.web.app)

## 📖 Project Documentation

- **[PRD.md](./PRD.md)** - Complete Product Requirements Document
- **[tasks.md](./tasks.md)** - Detailed task breakdown and PR workflow
- **[App README](./collabcanvas/README.md)** - Development setup and instructions

## 🎯 MVP Features

- ✅ Real-time multi-user collaborative canvas
- ✅ Google OAuth authentication
- ✅ Rectangle shape creation and manipulation
- ✅ Live cursor synchronization
- ✅ User presence tracking
- ✅ Owner controls with priority locking
- ✅ Persistent canvas state

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Canvas Rendering:** Konva.js
- **Backend:** Firebase (Firestore + Auth + Hosting)
- **Real-time Sync:** Firestore onSnapshot listeners

## 📋 Development Progress

### ✅ PR #1: Project Setup & Firebase Configuration (Complete)
- React + Vite initialized
- Firebase & Konva dependencies installed
- Firebase project configured with Firestore and Auth
- Deployed to Firebase Hosting

### 🚧 Next Up: PR #2 - Google OAuth Authentication

## 🏃 Quick Start

```bash
cd collabcanvas
npm install
npm run dev
```

See [collabcanvas/README.md](./collabcanvas/README.md) for detailed setup instructions.

## 📁 Repository Structure

```
collab-canvas/
├── collabcanvas/          # Main React + Vite application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── dist/              # Build output (not committed)
├── PRD.md                 # Product requirements
├── tasks.md               # Task breakdown
└── README.md              # This file
```

## 🔐 Security

- All Firebase API keys stored in `.env.local` (gitignored)
- Firestore security rules enforce authentication
- OAuth handled securely through Firebase Auth

---

**Project Goal:** Build a minimal viable Figma clone demonstrating solid multiplayer infrastructure with basic canvas functionality.
