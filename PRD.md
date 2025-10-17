# CollabCanvas MVP - Product Requirements Document

## Project Overview
**Goal:** Build a minimal viable Figma-like collaborative canvas that supports real-time multi-user editing.

**Success Criteria:** Pass MVP checkpoint by demonstrating solid multiplayer infrastructure with basic canvas functionality.

**Platform:** Desktop web-based only (no mobile support for MVP)

**MVP Scope:** 
- Single shared canvas accessible to all authenticated users
- Rectangles only (100x100px default, single color)
- Toolbar-based creation → click-to-place interaction
- Google OAuth authentication via Firebase
- Real-time multi-user sync with cursor presence
- Owner controls: priority shape locking + ability to remove users
- Shape deletion via Delete key

---

## User Stories

### Primary User: Designer/Creator (Owner)
- As a designer, I want to **create shapes on a canvas** so that I can start designing
- As a designer, I want to **move objects around** so that I can arrange my design
- As a designer, I want to **pan and zoom the canvas** so that I can navigate my workspace
- As a designer, I want to **see my work persist** so that I don't lose my progress when I refresh
- As the owner, I want to **have priority control** over collaborators for managing the canvas

### All Users (Owner + Collaborators)
- As any user, I want to **see all users' cursors in real-time** so that I know where everyone is working
- As any user, I want to **see changes instantly** when others create or move objects
- As any user, I want to **see who's online** so that I know who I'm working with
- As any user, I want to **authenticate with an account** so that others can identify me

---

## Key Features for MVP

### 1. Canvas Functionality
- **Canvas Boundaries**: 5000x5000px workspace
  - Pan within boundaries using left mouse button click and drag
  - Zoom in/out using mouse scroll wheel
- **Shape Creation**: Toolbar-based rectangle creation
  - Click "Rectangle" button in toolbar
  - Cursor changes to indicate "place mode"
  - Click once on canvas to place 100x100px rectangle
  - Auto-exit place mode after placing one shape
  - All rectangles same color (no customization for MVP)
- **Object Manipulation**: Move and delete objects
  - Click to select (show selection outline - single selection only)
  - Drag to move
  - Press Delete key to remove selected shape
  - Visual feedback for selection
  - Owner gets priority lock when manipulating (blocks other users)

### 2. Real-Time Collaboration
- **Cursor Sync**: Show all connected users' cursor positions with name labels
  - Update frequency: 10-20 updates/second (50-100ms)
  - Display user name next to cursor
  - All users see all other users' cursors
- **Object Sync**: Broadcast object creation and position changes
  - Update frequency: ≤100ms (target: 50-100ms)
  - Handle simultaneous edits from 3-5+ users
- **Presence System**: Display online users
  - Show active user count
  - Display user names list
  - Auto-detect disconnects

### 3. Authentication & Persistence
- **User Authentication**: Google OAuth via Firebase Authentication
  - "Sign in with Google" button
  - Pass through user's display name from Google account
  - User's Google profile photo (optional for cursor avatar)
- **State Persistence**: Save canvas state to Firestore
  - Auto-save on every change
  - Load saved state on page load
  - Persist through disconnects

### 4. Owner Controls
- **Kick Users**: Owner can remove collaborators from canvas
  - Show "Remove User" button next to online users (owner only)
  - Kicked user's shapes remain on canvas
- **Shape Lock Priority**: When owner is manipulating a shape, it's locked from other users
  - Visual indicator (e.g., red outline) when shape is locked
  - Lock releases when owner deselects or stops dragging
  - Other users see locked state in real-time
  - **Override Mechanism**: Owner can right-click a locked shape → select "Override Control" to take priority

---

### ✅ Selected Tech Stack: Firebase

**Backend:**
- Firebase Firestore (real-time database)
- Firebase Authentication (Google OAuth)
- Firebase Hosting (deployment)

**Frontend:**
- React + Vite
- **Konva.js** for canvas rendering
- Firebase SDK

**Why This Stack:**
- Integrated ecosystem (auth, database, hosting all in Firebase)
- Built-in real-time sync with Firestore onSnapshot
- No server code required
- Free tier sufficient for testing
- Google OAuth built-in to Firebase Auth

**Trade-offs Accepted:**
- Vendor lock-in to Firebase
- Less control over sync logic
- Firestore query limitations (acceptable for MVP)

---

## Critical Technical Decisions

### 1. State Management Pattern
**Recommendation:** Centralized state in Firestore, local state mirrors it

```
Firestore (source of truth)
    ↓ (onSnapshot listeners)
Local State (React state)
    ↓
Canvas Rendering (Konva.js)
```

**Flow:**
1. User makes change → Update local state immediately (optimistic)
2. Write change to Firestore
3. Firestore broadcasts to all clients via onSnapshot
4. All clients update local state → re-render canvas

**Firestore Collection Structure:**
```
/canvases/main/
  - metadata: { ownerId, createdAt }
  
/canvases/main/objects/{objectId}
  - Canvas object data (x, y, width, height, lockedBy, etc.)
  - Delete via Firestore document deletion (propagates to all clients)
  
/canvases/main/cursors/{userId}
  - User cursor position (x, y, userName)
  
/canvases/main/presence/{userId}
  - User presence data (online, role, photoURL, lastSeen)
```

### 2. Data Model
```javascript
// Canvas Object
{
  id: string,
  type: 'rectangle',
  x: number,
  y: number,
  width: number,
  height: number,
  createdBy: userId,
  lockedBy: userId | null, // null if not locked, userId if being edited
  updatedAt: timestamp
}

// User Cursor
{
  userId: string,
  userName: string,
  x: number,
  y: number,
  lastUpdate: timestamp
}

// User Presence (stored in Firestore)
{
  userId: string,
  userName: string,
  userEmail: string,
  photoURL: string | null, // from Google profile
  role: 'owner' | 'collaborator',
  online: boolean,
  lastSeen: timestamp
}

// Canvas Metadata (single shared canvas for MVP)
{
  canvasId: 'main', // hardcoded for single canvas
  ownerId: string, // first user to load app becomes permanent owner for MVP
  createdAt: timestamp
}
```

### 3. Conflict Resolution Strategy
**Primary: Owner Priority Lock**
- When ANY user selects/drags a shape, set `lockedBy: userId` in Firestore
- If locked by owner → all other users blocked from editing that shape
- If locked by collaborator → owner can override (takes priority)
- Lock releases when user deselects or stops dragging
- Visual indicator: locked shapes show username + lock icon

**Fallback: Last Write Wins**
- For simultaneous operations on different shapes
- Timestamp all updates
- Most recent timestamp wins
- Acceptable for low concurrency scenarios

---

## Potential Pitfalls & Solutions

### Pitfall 1: Performance with Many Objects
**Problem:** Canvas rendering slows with 100+ objects
**Solution:** Start with limit of 50 objects for MVP, add virtualization later

### Pitfall 2: Cursor Thrashing
**Problem:** Sending cursor updates on every mousemove = hundreds of DB writes/sec
**Solution:** ✅ Throttle cursor updates to 10-20 updates/second (50-100ms intervals)

### Pitfall 3: Stale State on Reconnect
**Problem:** User disconnects and misses updates
**Solution:** 
- Show "Disconnected" banner after 3 seconds of disconnect
- Prompt user to refresh page to reconnect
- On reconnect, fetch full canvas state, don't try to merge
- Discard any optimistic changes made while offline

### Pitfall 4: Authentication Complexity
**Problem:** Building auth from scratch can be time-consuming
**Solution:** ✅ Use Firebase Google OAuth - built-in, secure, gets user's name automatically

### Pitfall 5: Canvas Library Choice
**Problem:** HTML5 Canvas is low-level and time-consuming
**Solution:** ✅ Use Konva.js (simpler API, well-documented) - saves 4-6 hours

### Pitfall 6: Deployment Issues
**Problem:** Figuring out deployment at the last minute
**Solution:** Deploy early (even with broken features) to catch CORS, env vars, Firebase config issues

### Pitfall 7: Shape Locking Race Conditions
**Problem:** Two users try to grab the same shape simultaneously
**Solution:** Let Firestore handle it with transactions or accept minor race conditions for MVP. Owner always wins if there's a conflict.

### Pitfall 8: Optimistic Update Failures
**Problem:** User makes change locally but Firestore write fails (permissions, network, etc.)
**Solution:** Roll back the optimistic local change and show error feedback to user

---

## Development Build Order

### Phase 1: Setup & Authentication
- Initialize React + Vite project
- Set up Firebase project (Firestore, Auth, Hosting)
- Configure Google OAuth sign-in
- Deploy skeleton to Firebase Hosting (test deployment early)

### Phase 2: Basic Canvas (Local Only)
- Implement pan & zoom with Konva.js (left-click drag + scroll wheel)
- Add toolbar with "Rectangle" button
- Implement click-to-place shape creation (auto-exit after one placement)
- Add drag-to-move functionality
- Add selection visual feedback (single selection)
- Add Delete key handler to remove selected shape
- Test locally without multiplayer

### Phase 3: Real-Time Sync ⚠️ MOST CRITICAL
- Connect to Firestore
- Implement object creation sync
- Implement object move sync
- Implement object deletion sync
- Set up Firestore listeners (onSnapshot)
- Implement optimistic updates with rollback on failure
- Add disconnection detection (show banner after 3 seconds)
- Test with 2 browser windows
- Debug sync issues

### Phase 4: Multiplayer Features
- Implement cursor synchronization (throttled updates)
- Set up user presence system
- Display online users list
- Add username labels to cursors
- Test with 3+ users

### Phase 5: Owner Controls & Locking
- Implement shape locking mechanism
- Add owner role assignment (first user becomes permanent owner)
- Build "kick user" functionality for owner (kicked user's shapes remain)
- Add right-click context menu for owner to override locked shapes
- Add visual indicators for locked shapes
- Test priority locking scenarios

### Phase 6: Polish & Deploy
- Bug fixes and edge cases
- State persistence testing
- Multi-user stress testing
- Final deployment to Firebase Hosting
- Test deployed version with multiple users

---

## Success Metrics

### Must Have (Pass/Fail)
- ✅ Users can sign in with Google OAuth
- ✅ Single shared canvas (5000x5000px) loads for all authenticated users
- ✅ Users can click toolbar button once and place one rectangle on canvas (auto-exit place mode)
- ✅ Users can drag rectangles to move them
- ✅ Users can select and delete rectangles with Delete key
- ✅ Pan canvas with left-click drag, zoom with scroll wheel
- ✅ 2+ users can edit simultaneously in different browsers
- ✅ Changes appear for all users within 100ms
- ✅ All users see each other's cursors with names in real-time
- ✅ Users can see who's online in a user list
- ✅ Owner can remove collaborators from canvas (shapes remain)
- ✅ When owner edits a shape, it's locked from other users
- ✅ Owner can right-click locked shape and select "Override Control"
- ✅ Disconnection shows banner after 3 seconds with refresh prompt
- ✅ Canvas state persists through refresh and disconnects
- ✅ Deployed to Firebase Hosting and publicly accessible

### Nice to Have (Extra Credit)
- 🎯 Smooth 60 FPS performance
- 🎯 Handles 5+ concurrent users without degradation
- 🎯 Sub-50ms cursor updates
- 🎯 Clean, intuitive UI with clear visual feedback
- 🎯 Google profile photos shown next to cursors

### Explicitly Out of Scope for MVP

**✅ Now Implemented (Post-MVP):**
- ✅ Undo/Redo functionality (PR #21 - COMPLETE)
- ✅ Multi-select with selection box (PR #18 - COMPLETE)
- ✅ Resize & Rotate transforms (PR #18.5 - COMPLETE)
- ✅ Additional shape types: Circle (PR #15 - COMPLETE), Text (PR #17 - COMPLETE)
- ✅ Copy/Paste/Duplicate (PR #19 - COMPLETE)
- ✅ Arrow key movement (PR #20 - COMPLETE)

**⬜ Still Out of Scope:**
- ❌ Shape customization (colors, borders) (PRs #13-14)
- ❌ Mobile/touch device support
- ❌ Owner transfer/reassignment

**🚀 In Progress:**
- 🔄 AI Canvas Agent (PRs #26-29 - NEXT)

---

## Next Steps - Ready to Build!

All decisions have been made. Time to start building:

1. ✅ **PRD Approved** - All technical decisions locked in
2. **Initialize Project** - Create React + Vite app, set up Firebase project
3. **Set up Firebase** - Enable Firestore, Google Auth, Hosting
4. **Deploy Early** - Get skeleton deployed to catch config issues
5. **Build Vertically** - Complete one phase at a time following build order
6. **Test Continuously** - Use multiple browser windows throughout development

**Build Order Priority:**
1. Auth → 2. Local Canvas → 3. Real-Time Sync → 4. Cursors → 5. Locking → 6. Polish

---

## Decisions Made ✅

- [x] **Backend:** Firebase (Firestore + Auth)
- [x] **Canvas Library:** Konva.js
- [x] **Frontend:** React + Vite
- [x] **Deployment:** Firebase Hosting
- [x] **Platform:** Desktop web-based only
- [x] **Authentication:** Firebase Google OAuth (pass through user's display name)
- [x] **Canvas Model:** Single shared canvas (5000x5000px) - all authenticated users see same canvas
- [x] **Shape Creation:** Toolbar button → cursor changes → click once to place → auto-exit place mode
- [x] **Shape Appearance:** All rectangles same color, no customization for MVP
- [x] **Shape Types:** ✅ Rectangles, ✅ Circles (PR #15), ✅ Text (PR #17)
- [x] **Shape Selection:** ✅ Multi-select with selection box (PR #18), Shift-click to add
- [x] **Shape Manipulation:** ✅ Resize & Rotate transforms (PR #18.5)
- [x] **Shape Deletion:** Select shape(s) → press Delete key
- [x] **Copy/Paste:** ✅ Ctrl+C/V/D for copy/paste/duplicate (PR #19)
- [x] **Arrow Keys:** ✅ Move shapes 1px or 10px with Shift (PR #20)
- [x] **Undo/Redo:** ✅ Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y (PR #21)
- [x] **Pan & Zoom:** Left-click drag, middle-click drag, scroll wheel (up/down), Shift+scroll (left/right), Ctrl+scroll (zoom)
- [x] **Owner Assignment:** First user to load app becomes permanent owner
- [x] **Owner Controls:** Can kick users (shapes remain) + gets priority lock + can override locked shapes via right-click menu
- [x] **Cursor Update Frequency:** 10-20 updates/second (50-100ms)
- [x] **Object Sync Target:** ≤100ms
- [x] **Conflict Resolution:** Last-write-wins + owner priority lock
- [x] **Reconnect Strategy:** Show banner after 3 seconds → prompt refresh → fetch full state, don't merge
- [x] **Optimistic Updates:** Roll back on Firestore write failure
- [x] **AI Canvas Agent:** ✅ Natural language commands (PRs #26-29)
  - GPT-4 Turbo integration with function calling
  - Command types: creation, manipulation, layout, selection, templates, queries
  - UI templates: login form, nav bar, card, button, dashboard, sidebar
  - Rate limiting: 5s cooldown per user, 300/min per canvas
  - Undo/redo integration, input validation, multi-user queue
- [x] **Users Online Button:** ✅ Circular dropdown button in header (PR #24)
  - Shows count of online users
  - Click to see full list with avatars, names, and roles
  - User account menu with Settings and Sign Out options
  - Only displays currently online users
- [x] **Originally Out of Scope:** ~~Undo/redo~~ ✅ (PR #21), ~~multi-select~~ ✅ (PR #18), shape customization (still pending), mobile support (still pending)