# CollabCanvas MVP

A real-time collaborative canvas application built with React, Firebase, and Konva.js.

## 🚀 Live Demo

**Deployed URL:** [https://collab-canvas-d0e38.web.app](https://collab-canvas-d0e38.web.app)

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite
- **Canvas:** Konva.js + React-Konva
- **Backend:** Firebase (Firestore + Authentication + Hosting)
- **Auth:** Google OAuth via Firebase Authentication
- **AI:** OpenAI GPT-4 Turbo for natural language commands

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

### 🤖 AI Canvas Agent (NEW!)
- **Natural language commands** - Control canvas with plain English
- **Smart shape creation** - "Create 5 blue circles in a row"
- **Layout automation** - "Arrange these shapes in a grid"
- **UI templates** - "Create a login form" or "Make a dashboard"
- **Undo/Redo integration** - AI commands are fully undoable
- **Rate limiting** - 5 second cooldown per user, 300/minute per canvas
- **Multi-user coordination** - Queue system prevents conflicts

#### Supported Commands
- **Creation:** "Create 3 rectangles", "Add a circle at 500, 600"
- **Manipulation:** "Move selected shapes right", "Rotate all squares 45 degrees"
- **Layout:** "Arrange horizontally", "Create a 3x3 grid", "Align shapes to the left"
- **Selection:** "Select all red shapes", "Deselect everything"
- **Templates:** "Create a login form", "Make a nav bar", "Build a dashboard", "Add a sidebar"
- **Queries:** "How many shapes are there?", "What colors are being used?"

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
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

   **Note:** Get your OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

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

- ✅ **PR #1-12:** MVP (Setup, Auth, Canvas, Shapes, Real-time Sync, Cursor Sync, Presence, Locking, State Persistence)
- ✅ **PR #13-14:** Advanced Color System + Rename Square
- ✅ **PR #15:** Circle Tool
- ✅ **PR #16:** Line Tool (Basic)
- ✅ **PR #17:** Text Tool
- ✅ **PR #18:** Multi-Select with Selection Box
- ✅ **PR #19:** Copy/Paste Shapes
- ✅ **PR #20:** Arrow Key Movement
- ✅ **PR #21:** Undo/Redo System (50 steps)
- ✅ **PR #26-29:** AI Canvas Agent (Core, Advanced Commands, Queue System, Polish & Optimization)

---

## 📚 Firestore Structure

```
/canvases/main/
├── metadata/           # Canvas owner, created timestamp
├── objects/{id}/       # Shapes (x, y, width, height, lockedBy, createdBy, createdByAI)
├── cursors/{userId}/   # Real-time cursor positions (x, y, userName)
├── presence/{userId}/  # User online status (userName, role, online, kicked)
├── aiCommands/{id}/    # AI command queue (command, userId, status, timestamp)
└── aiRateLimits/{userId}/  # Rate limit tracking (lastCommandTime, commandCount)
```

## 🎨 Color Coding

- **Blue outline:** Selected shape
- **Green outline:** Locked by you
- **Red outline:** Locked by another user  
- **Black:** Unlocked shape

## 🤖 AI Command Examples

### Simple Commands
```
"Create 5 blue circles in a row"
"Make a red square at 1000, 2000"
"Rotate selected shapes 90 degrees"
"Delete all rectangles"
```

### Layout Commands
```
"Arrange these shapes in a 3x3 grid"
"Align all shapes to the left"
"Space these elements evenly horizontally"
```

### UI Templates
```
"Create a login form"
"Make a navigation bar with Home, About, Contact"
"Build a dashboard with 6 cards"
"Add a sidebar with 5 menu items"
```

### Advanced Commands
```
"Create 10 squares in a grid and color them blue"
"Make a button that says Submit and center it"
"Build a card layout with title and description"
```

## ⚙️ AI Configuration

The AI agent uses OpenAI's GPT-4 Turbo for fast, accurate command interpretation.

**Rate Limits:**
- 5 seconds between commands per user
- 300 commands per minute per canvas
- Visual cooldown timer in UI

**Features:**
- Input sanitization (XSS protection)
- Parameter validation (bounds checking)
- Partial success handling with detailed feedback
- Integration with undo/redo system
- Multi-user queue system

---

Built with ❤️ as a Figma-like collaborative canvas with AI superpowers
