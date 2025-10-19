# CollabCanvas - Real-Time Collaborative Canvas

A Figma-like collaborative canvas MVP built with React, Firebase, and Konva.js.

## 🚀 Live Application

**Deployed URL:** [https://collab-canvas-d0e38.web.app](https://collab-canvas-d0e38.web.app)

## 📖 Project Documentation

- **[PRD.md](./PRD.md)** - Complete Product Requirements Document
- **[tasks.md](./tasks.md)** - Detailed task breakdown and PR workflow
- **[App README](./collabcanvas/README.md)** - Development setup and instructions

## 🎯 Features

### Core Functionality ✅
- ✅ Real-time multi-user collaborative canvas
- ✅ Google OAuth authentication
- ✅ Multiple shape types: Rectangles, Circles, Lines, Text
- ✅ Live cursor synchronization (sub-50ms via RTDB)
- ✅ User presence tracking
- ✅ Owner controls with priority locking
- ✅ Persistent canvas state

### Advanced Features ✅
- ✅ Multi-select with selection box
- ✅ Resize & rotate transforms
- ✅ Copy/Paste/Duplicate (Ctrl+C/V/D)
- ✅ Arrow key movement (1px or 10px with Shift)
- ✅ Undo/Redo (Ctrl+Z/Y, 10-step history)
- ✅ Layers panel with drag-to-reorder
- ✅ AI Canvas Agent (natural language commands)
- ✅ Users online button with dropdown

### In Development 🚧
- 🚧 Shape Comments (PR #23) - Right-click shapes to add/edit/delete comments (100 char limit, undo support)

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Canvas Rendering:** Konva.js
- **Backend:** Firebase (Firestore + RTDB + Auth + Hosting)
- **Real-time Sync:** Hybrid architecture (Firestore + Realtime Database)
  - Firestore: Persistent data (shapes, comments, metadata)
  - RTDB: Ephemeral data (cursors, presence, temp updates)

## 📋 Development Progress

See [tasks.md](./tasks.md) for complete PR breakdown and implementation details.

### Recently Completed ✅
- **PR #30:** Hybrid RTDB Architecture (sub-50ms performance)
- **PR #26-29:** AI Canvas Agent with GPT-4 Turbo integration
- **PR #24:** Users Online Button
- **PR #21:** Undo/Redo System
- **PR #18-20:** Multi-select, Transforms, Copy/Paste, Arrow Keys

### Currently In Development 🚧
- **PR #23:** Shape Comments System (context menu based)

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
