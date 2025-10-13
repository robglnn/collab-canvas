# CollabCanvas MVP - Task List & PR Breakdown

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Canvas.jsx              # Main canvas component with Konva
│   │   ├── Toolbar.jsx             # Rectangle creation button
│   │   ├── UserList.jsx            # Online users sidebar
│   │   ├── UserCursor.jsx          # Remote user cursor component
│   │   ├── Auth.jsx                # Google sign-in component
│   │   ├── Shape.jsx               # Individual shape component (rectangle)
│   │   └── ContextMenu.jsx         # Right-click context menu for shapes
│   ├── hooks/
│   │   ├── useAuth.js              # Firebase auth state hook
│   │   ├── useFirestore.js         # Firestore real-time listeners
│   │   ├── useCanvas.js            # Canvas state management
│   │   ├── useCursors.js           # Cursor sync logic
│   │   └── usePresence.js          # User presence tracking
│   ├── lib/
│   │   ├── firebase.js             # Firebase config & initialization
│   │   ├── firestoreService.js     # Firestore CRUD operations
│   │   └── canvasUtils.js          # Canvas coordinate calculations
│   ├── App.jsx                     # Main app component
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles
├── .env.local                      # Firebase config (not committed)
├── .env.example                    # Example env file (committed)
├── .gitignore
├── .firebaserc                     # Firebase project config
├── firebase.json                   # Firebase hosting config
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Firestore indexes
├── package.json
├── vite.config.js
└── README.md
```

---

## PR #1: Project Setup & Firebase Configuration

**Branch:** `setup/initial-project`

**Goal:** Initialize React + Vite project, configure Firebase, deploy skeleton

### Tasks:

- [ ] **1.1: Initialize React + Vite Project**
  - Create new Vite project with React template
  - Install dependencies: `react`, `react-dom`, `vite`
  - Test dev server runs successfully
  - **Files Created:**
    - `package.json`
    - `vite.config.js`
    - `src/main.jsx`
    - `src/App.jsx`
    - `src/index.css`
    - `public/index.html`
    - `.gitignore`

- [ ] **1.2: Install Firebase & Konva Dependencies**
  - Install Firebase SDK: `npm install firebase`
  - Install Konva: `npm install konva react-konva`
  - Update package.json with all dependencies
  - **Files Modified:**
    - `package.json`

- [ ] **1.3: Create Firebase Project & Configure**
  - Create new Firebase project in console
  - Enable Firestore Database
  - Enable Google Authentication
  - Enable Firebase Hosting
  - Copy config values
  - **Files Created:**
    - `.env.example` (template with placeholder values)
    - `.env.local` (actual config - add to .gitignore)
    - **Files Modified:**
    - `.gitignore` (add `.env.local`)

- [ ] **1.4: Initialize Firebase in Project**
  - Create Firebase configuration file
  - Initialize Firestore and Auth
  - Export Firebase instances
  - **Files Created:**
    - `src/lib/firebase.js`

- [ ] **1.5: Set Up Firebase Hosting**
  - Install Firebase CLI: `npm install -g firebase-tools`
  - Run `firebase init hosting`
  - Configure for Vite build output (dist folder)
  - **Files Created:**
    - `.firebaserc`
    - `firebase.json`

- [ ] **1.6: Deploy Skeleton App**
  - Build project: `npm run build`
  - Deploy to Firebase: `firebase deploy`
  - Verify deployed URL works
  - Add deployed URL to README
  - **Files Created:**
    - `README.md` (with deployment URL)

---

## PR #2: Google OAuth Authentication

**Branch:** `feature/google-auth`

**Goal:** Implement Google sign-in with Firebase, display authenticated user

### Tasks:

- [ ] **2.1: Create Auth Hook**
  - Create custom hook to manage Firebase auth state
  - Handle sign-in, sign-out, and user state
  - Export user object with displayName, email, photoURL, uid
  - **Files Created:**
    - `src/hooks/useAuth.js`

- [ ] **2.2: Build Auth Component**
  - Create sign-in page with Google button
  - Show loading state during authentication
  - Display user info when authenticated
  - Add sign-out button
  - **Files Created:**
    - `src/components/Auth.jsx`
  - **Files Modified:**
    - `src/App.jsx` (integrate Auth component)

- [ ] **2.3: Set Up Firestore Security Rules**
  - Define rules: only authenticated users can read/write
  - Restrict user presence to own userId
  - **Files Created:**
    - `firestore.rules`

- [ ] **2.4: Test Authentication Flow**
  - Test sign-in with Google account
  - Verify user data persists on refresh
  - Test sign-out functionality
  - **Files Modified:**
    - `src/components/Auth.jsx` (bug fixes if needed)

- [ ] **2.5: Deploy Auth Updates**
  - Deploy Firestore rules: `firebase deploy --only firestore:rules`
  - Deploy hosting updates: `firebase deploy --only hosting`

---

## PR #3: Basic Canvas with Pan & Zoom (Local Only)

**Branch:** `feature/canvas-pan-zoom`

**Goal:** Implement Konva canvas with smooth pan and zoom, no multiplayer yet

### Tasks:

- [ ] **3.1: Create Canvas Component**
  - Set up Konva Stage and Layer
  - Implement viewport state (x, y, scale)
  - Render canvas with default background
  - **Files Created:**
    - `src/components/Canvas.jsx`
  - **Files Modified:**
    - `src/App.jsx` (add Canvas component)

- [ ] **3.2: Implement Pan Functionality**
  - Add mouse down/move/up event handlers
  - Calculate drag delta and update viewport position
  - Only pan when clicking on empty canvas (not shapes)
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **3.3: Implement Zoom Functionality**
  - Add wheel event handler
  - Calculate zoom scaling factor
  - Zoom towards mouse cursor position
  - Limit zoom range (e.g., 0.1x to 5x)
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **3.4: Set Canvas Boundaries**
  - Define canvas size: 5000x5000px workspace
  - Prevent panning beyond canvas boundaries
  - Clamp viewport position to stay within bounds
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/lib/canvasUtils.js`

- [ ] **3.5: Create Canvas Utilities**
  - Helper function: screen coordinates to canvas coordinates
  - Helper function: canvas coordinates to screen coordinates
  - Helper function: clamp zoom level
  - Helper function: clamp viewport position to canvas boundaries
  - **Files Created:**
    - `src/lib/canvasUtils.js`
  - **Files Modified:**
    - `src/components/Canvas.jsx` (use utils)

- [ ] **3.6: Test Pan & Zoom**
  - Test smooth panning with mouse drag
  - Test zoom with mouse wheel
  - Test zoom centering on cursor position
  - Test boundary enforcement (can't pan beyond 5000x5000px)
  - Verify performance (60 FPS)
  - **Files Modified:**
    - `src/components/Canvas.jsx` (performance optimizations if needed)

---

## PR #4: Shape Creation & Local Manipulation

**Branch:** `feature/shape-creation`

**Goal:** Add toolbar, create rectangles on click, drag to move, delete with Delete key (local only)

### Tasks:

- [ ] **4.1: Create Canvas State Hook**
  - Manage shapes array in React state
  - Functions: addShape, updateShape, selectShape
  - **Files Created:**
    - `src/hooks/useCanvas.js`

- [ ] **4.2: Build Toolbar Component**
  - Create toolbar with "Rectangle" button
  - Manage "place mode" state
  - Style toolbar (fixed position, top or side)
  - **Files Created:**
    - `src/components/Toolbar.jsx`
  - **Files Modified:**
    - `src/App.jsx` (add Toolbar)
    - `src/index.css` (toolbar styles)

- [ ] **4.3: Implement Click-to-Place Rectangle**
  - When in place mode, change cursor style
  - On canvas click, create rectangle at cursor position
  - Default size: 100x100px, black fill (all rectangles same color)
  - Auto-exit place mode after placing one rectangle
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/hooks/useCanvas.js` (addShape function)

- [ ] **4.4: Create Shape Component**
  - Render Konva Rectangle with props
  - Show selection outline when selected
  - **Files Created:**
    - `src/components/Shape.jsx`
  - **Files Modified:**
    - `src/components/Canvas.jsx` (render shapes)

- [ ] **4.5: Implement Shape Selection**
  - Click shape to select (single selection only - no multi-select)
  - Show visual feedback (outline, border, or handles)
  - Deselect when clicking empty canvas
  - **Files Modified:**
    - `src/components/Shape.jsx`
    - `src/hooks/useCanvas.js`

- [ ] **4.6: Implement Drag to Move**
  - Add drag handlers to selected shape
  - Update shape position in state
  - Keep shape selected while dragging
  - **Files Modified:**
    - `src/components/Shape.jsx`
    - `src/hooks/useCanvas.js` (updateShape function)

- [ ] **4.7: Implement Shape Deletion (Local)**
  - Add keyboard event listener for Delete key
  - When shape is selected and Delete pressed, remove from local state
  - Deselect after deletion
  - **Files Modified:**
    - `src/components/Canvas.jsx` (keyboard handler)
    - `src/hooks/useCanvas.js` (deleteShape function)

- [ ] **4.8: Test Shape Lifecycle**
  - Create multiple rectangles
  - Select and move shapes
  - Select and delete shapes with Delete key
  - Verify shapes don't interfere with pan/zoom
  - Test performance with 20+ shapes

---

## PR #5: Firestore Integration & Real-Time Sync ⚠️ CRITICAL

**Branch:** `feature/realtime-sync`

**Goal:** Connect canvas to Firestore, sync shape creation, movement, and deletion across users

### Tasks:

- [ ] **5.1: Create Firestore Service**
  - Functions: addShape, updateShape, deleteShape, getShapes
  - Functions: setCanvasOwner, getCanvasOwner
  - All operations target `/canvases/main/` collection
  - **Files Created:**
    - `src/lib/firestoreService.js`

- [ ] **5.2: Create Firestore Hook**
  - Custom hook for Firestore real-time listeners
  - Subscribe to shapes collection with onSnapshot
  - Return shapes array and loading state
  - **Files Created:**
    - `src/hooks/useFirestore.js`

- [ ] **5.3: Connect Canvas to Firestore**
  - Replace local state with Firestore state
  - Write to Firestore when creating shapes
  - Write to Firestore when moving shapes
  - Write to Firestore when deleting shapes (delete document)
  - Listen to Firestore updates and re-render
  - **Files Modified:**
    - `src/hooks/useCanvas.js` (integrate Firestore)
    - `src/components/Canvas.jsx`

- [ ] **5.4: Set Up Canvas Owner Logic**
  - On mount, check if canvas has owner
  - If no owner, set current user as owner (permanent for MVP)
  - Store ownerId in Firestore `/canvases/main/metadata`
  - First user to load app becomes permanent owner
  - **Files Modified:**
    - `src/hooks/useCanvas.js`
    - `src/lib/firestoreService.js`

- [ ] **5.5: Test Real-Time Sync**
  - Open app in 2 browser windows
  - Create shape in window 1 → should appear in window 2
  - Move shape in window 2 → should update in window 1
  - Delete shape in window 1 → should disappear in window 2
  - Test sync latency (should be <100ms)
  - **Files Modified:**
    - `src/hooks/useFirestore.js` (optimizations if needed)

- [ ] **5.6: Add Optimistic Updates with Rollback**
  - Update local state immediately on user action
  - Write to Firestore in background
  - Handle Firestore update without double-rendering
  - If Firestore write fails, rollback local state change
  - Show error feedback to user (toast/alert) on rollback
  - **Files Modified:**
    - `src/hooks/useCanvas.js`
    - `src/lib/firestoreService.js` (add error handling)

- [ ] **5.7: Deploy & Test Remotely**
  - Deploy to Firebase Hosting
  - Test with 2 different devices/networks
  - Verify remote sync works

---

## PR #6: Cursor Synchronization

**Branch:** `feature/cursor-sync`

**Goal:** Show all users' cursors in real-time with name labels

### Tasks:

- [ ] **6.1: Create Cursors Hook**
  - Subscribe to `/canvases/main/cursors` collection
  - Throttle cursor position updates (50-100ms)
  - Filter out current user's cursor
  - **Files Created:**
    - `src/hooks/useCursors.js`

- [ ] **6.2: Update Cursor Position to Firestore**
  - On mouse move, throttle and write to Firestore
  - Include userId, userName, x, y, timestamp
  - **Files Modified:**
    - `src/components/Canvas.jsx` (add mousemove handler)
    - `src/hooks/useCursors.js`

- [ ] **6.3: Create Cursor Component**
  - Render cursor with custom SVG or icon
  - Display username label next to cursor
  - Style with unique color per user (optional)
  - **Files Created:**
    - `src/components/UserCursor.jsx`
  - **Files Modified:**
    - `src/index.css` (cursor styles)

- [ ] **6.4: Render Remote Cursors on Canvas**
  - Map over cursors array and render UserCursor components
  - Transform cursor positions based on viewport (pan/zoom)
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **6.5: Test Cursor Sync**
  - Open 3+ browser windows
  - Move mouse in each window
  - Verify all cursors appear in all windows
  - Verify cursor labels show correct usernames
  - Test cursor update frequency (<50ms latency)
  - **Files Modified:**
    - `src/hooks/useCursors.js` (adjust throttle if needed)

---

## PR #7: User Presence System

**Branch:** `feature/user-presence`

**Goal:** Display online users list, detect disconnects

### Tasks:

- [ ] **7.1: Create Presence Hook**
  - Subscribe to `/canvases/main/presence` collection
  - On mount, set current user as online
  - On unmount, set current user as offline
  - Handle page close/refresh with beforeunload
  - **Files Created:**
    - `src/hooks/usePresence.js`

- [ ] **7.2: Write User Presence to Firestore**
  - Include: userId, userName, email, photoURL, role, online, lastSeen
  - Use Firestore onDisconnect() to handle crashes
  - **Files Modified:**
    - `src/hooks/usePresence.js`

- [ ] **7.3: Build User List Component**
  - Display list of online users
  - Show user's name, photo (if available), role badge
  - Highlight current user
  - **Files Created:**
    - `src/components/UserList.jsx`
  - **Files Modified:**
    - `src/App.jsx` (add UserList)
    - `src/index.css` (user list styles)

- [ ] **7.4: Display User Count**
  - Show total online user count
  - Update in real-time as users join/leave
  - **Files Modified:**
    - `src/components/UserList.jsx`

- [ ] **7.5: Test Presence Tracking**
  - Open 3+ browser windows
  - Verify all users appear in user list
  - Close a window → verify user disappears
  - Refresh a window → verify user stays online
  - Test disconnect detection (kill network)

---

## PR #8: Owner Controls - Shape Locking

**Branch:** `feature/shape-locking`

**Goal:** Implement owner priority locking when manipulating shapes

### Tasks:

- [ ] **8.1: Add LockedBy Field to Shapes**
  - Update shape data model with `lockedBy: userId | null`
  - **Files Modified:**
    - `src/lib/firestoreService.js`
    - `src/hooks/useCanvas.js`

- [ ] **8.2: Lock Shape on Selection/Drag**
  - When user selects a shape, write `lockedBy: userId` to Firestore
  - When user starts dragging, ensure lock is set
  - **Files Modified:**
    - `src/components/Shape.jsx`
    - `src/hooks/useCanvas.js`

- [ ] **8.3: Release Lock on Deselection**
  - When user deselects shape, set `lockedBy: null`
  - When drag ends, optionally release lock or keep selected
  - **Files Modified:**
    - `src/components/Shape.jsx`
    - `src/hooks/useCanvas.js`

- [ ] **8.4: Enforce Owner Priority**
  - Check if shape is locked by another user before allowing interaction
  - If locked by owner → block all collaborators
  - If locked by collaborator → allow owner to override
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **8.5: Visual Lock Indicator**
  - Show lock icon or colored outline on locked shapes
  - Display "Locked by [username]" tooltip or label
  - Different style for owner lock vs collaborator lock
  - **Files Modified:**
    - `src/components/Shape.jsx`
    - `src/index.css` (lock indicator styles)

- [ ] **8.6: Create Right-Click Context Menu**
  - Build context menu component for shapes
  - Show on right-click of any shape
  - Position menu at cursor location
  - Close menu when clicking outside
  - **Files Created:**
    - `src/components/ContextMenu.jsx`
  - **Files Modified:**
    - `src/components/Shape.jsx` (add right-click handler)
    - `src/index.css` (context menu styles)

- [ ] **8.7: Add Owner Override Control**
  - Add "Override Control" option to context menu (owner only)
  - Only show when shape is locked by a collaborator
  - On click, force set `lockedBy: ownerId` in Firestore
  - Update local state immediately
  - **Files Modified:**
    - `src/components/ContextMenu.jsx`
    - `src/hooks/useCanvas.js` (add forceOverrideLock function)
    - `src/lib/firestoreService.js`

- [ ] **8.8: Test Locking Scenarios**
  - Owner locks shape → verify collaborator can't edit
  - Collaborator locks shape → verify owner can override via right-click
  - Test simultaneous lock attempts (race condition)
  - Test lock release on disconnect
  - Test context menu shows/hides correctly
  - **Files Modified:**
    - `src/hooks/useCanvas.js` (bug fixes)

---

## PR #9: Owner Controls - Kick User

**Branch:** `feature/kick-user`

**Goal:** Allow owner to remove collaborators from canvas

### Tasks:

- [ ] **9.1: Add Owner Check Utility**
  - Function to check if current user is owner
  - Compare currentUser.uid with canvas ownerId
  - **Files Modified:**
    - `src/hooks/usePresence.js` (export isOwner boolean)

- [ ] **9.2: Add "Remove User" Button (Owner Only)**
  - In UserList, show remove button next to each collaborator
  - Only visible to owner
  - Can't remove self
  - **Files Modified:**
    - `src/components/UserList.jsx`

- [ ] **9.3: Implement Kick Functionality**
  - Create function to set user's `online: false` in Firestore
  - Optionally add to a "kicked users" list to prevent rejoin
  - **Files Created:**
    - `src/lib/firestoreService.js` (addKickUser function)
  - **Files Modified:**
    - `src/components/UserList.jsx`

- [ ] **9.4: Handle Being Kicked**
  - Listen to own presence document
  - If set to offline by someone else, redirect to sign-out
  - Show "You have been removed from the canvas" message
  - **Files Modified:**
    - `src/hooks/usePresence.js`
    - `src/components/Auth.jsx` (show kicked message)

- [ ] **9.5: Test Kick Flow**
  - Owner kicks collaborator → verify collaborator is signed out
  - Verify kicked user can sign back in (or is blocked if implemented)
  - Test that owner cannot kick themselves
  - **Files Modified:**
    - Bug fixes as needed

---

## PR #10: State Persistence & Reconnection

**Branch:** `feature/state-persistence`

**Goal:** Ensure canvas state persists through refresh and reconnects

### Tasks:

- [ ] **10.1: Test State Persistence**
  - Create shapes
  - Refresh browser
  - Verify shapes are still there
  - **Files Modified:**
    - None (should already work if Firestore is set up correctly)

- [ ] **10.2: Handle Reconnection Logic**
  - On reconnect, fetch full canvas state
  - Don't try to merge with stale local state
  - Clear local state and reload from Firestore
  - **Files Modified:**
    - `src/hooks/useFirestore.js`
    - `src/hooks/useCanvas.js`

- [ ] **10.3: Add Loading States**
  - Show loading spinner while fetching initial canvas state
  - Show reconnecting indicator if connection drops
  - **Files Modified:**
    - `src/App.jsx` (loading UI)
    - `src/components/Canvas.jsx`
    - `src/index.css` (loading styles)

- [ ] **10.4: Handle Disconnection with Banner**
  - Detect when user goes offline/disconnects
  - Show "Disconnected" banner after 3 seconds of disconnect
  - Banner prompts user to refresh the page to reconnect
  - Discard any optimistic changes made while offline
  - On reconnect, fetch full canvas state (don't merge)
  - **Files Modified:**
    - `src/App.jsx` (disconnection banner UI)
    - `src/hooks/useFirestore.js` (connection state detection)
    - `src/index.css` (banner styles)

- [ ] **10.5: Test Disconnect Scenarios**
  - Kill network mid-edit → verify reconnection works
  - All users disconnect → verify state persists
  - Refresh during high activity → verify no data loss

---

## PR #11: Polish, Performance & Bug Fixes

**Branch:** `feature/polish`

**Goal:** Final optimizations, bug fixes, UI polish

### Tasks:

- [ ] **11.1: Performance Optimization**
  - Verify 60 FPS during pan/zoom with 50+ shapes
  - Optimize Firestore listeners (use indexes if needed)
  - Throttle expensive operations
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `firestore.indexes.json` (if needed)

- [ ] **11.2: UI/UX Improvements**
  - Add hover states to toolbar buttons
  - Improve cursor visibility on dark shapes
  - Add success/error toast notifications
  - Polish user list design
  - **Files Modified:**
    - `src/index.css`
    - `src/components/Toolbar.jsx`
    - `src/components/UserList.jsx`
    - `src/components/UserCursor.jsx`

- [ ] **11.3: Error Handling**
  - Handle Firestore errors gracefully
  - Handle auth errors (sign-in failures)
  - Add try-catch blocks to critical functions
  - **Files Modified:**
    - `src/hooks/useAuth.js`
    - `src/hooks/useFirestore.js`
    - `src/lib/firestoreService.js`

- [ ] **11.4: Edge Case Testing**
  - Test with 5+ concurrent users
  - Test rapid shape creation (10+ shapes in 1 second)
  - Test extreme zoom levels
  - Test with slow network (throttle in DevTools)
  - **Files Modified:**
    - Bug fixes as discovered

- [ ] **11.5: Documentation**
  - Update README with setup instructions
  - Document Firestore structure
  - Add inline code comments for complex logic
  - **Files Modified:**
    - `README.md`
    - Various files (add comments)

---

## PR #12: Final Deployment & Testing

**Branch:** `feature/final-deployment`

**Goal:** Deploy final version, verify all MVP requirements

### Tasks:

- [ ] **12.1: Update Firestore Rules**
  - Ensure security rules are production-ready
  - Test rules with Firebase emulator
  - **Files Modified:**
    - `firestore.rules`

- [ ] **12.2: Environment Configuration**
  - Verify all environment variables are set
  - Update .env.example with all required vars
  - **Files Modified:**
    - `.env.example`

- [ ] **12.3: Build & Deploy**
  - Run production build: `npm run build`
  - Deploy to Firebase: `firebase deploy`
  - Test deployed URL on multiple devices
  - **Files Modified:**
    - None (deployment only)

- [ ] **12.4: MVP Checklist Verification**
  - ✅ Users can sign in with Google OAuth
  - ✅ Single shared canvas (5000x5000px) loads for all authenticated users
  - ✅ Users can click toolbar button once and place one rectangle (auto-exit place mode)
  - ✅ All rectangles are black (single color, no customization)
  - ✅ Users can drag rectangles to move them
  - ✅ Users can select and delete rectangles with Delete key
  - ✅ Pan canvas with left-click drag, zoom with scroll wheel
  - ✅ Canvas boundaries prevent panning beyond 5000x5000px
  - ✅ 2+ users can edit simultaneously in different browsers
  - ✅ Changes appear for all users within 100ms
  - ✅ All users see each other's cursors with names in real-time
  - ✅ Users can see who's online in a user list
  - ✅ Owner can remove collaborators from canvas (shapes remain)
  - ✅ When owner edits a shape, it's locked from other users
  - ✅ Owner can right-click locked shape and select "Override Control"
  - ✅ Disconnection shows banner after 3 seconds with refresh prompt
  - ✅ Optimistic updates rollback on Firestore write failure
  - ✅ Canvas state persists through refresh and disconnects
  - ✅ Deployed to Firebase Hosting and publicly accessible

- [ ] **12.5: Record Demo Video**
  - Record 3-5 minute demo showing all features
  - Show real-time collaboration with 2+ users
  - Explain architecture briefly
  - **Deliverable:**
    - Demo video file

- [ ] **12.6: Final Submission**
  - Ensure GitHub repo is public
  - Add deployed URL to README
  - Verify all code is committed
  - Submit GitHub repo link + demo video

---

## Quick Reference: PR Order

1. ✅ Project Setup & Firebase Configuration
2. ✅ Google OAuth Authentication
3. ✅ Basic Canvas with Pan & Zoom
4. ✅ Shape Creation & Local Manipulation
5. ⚠️ **Firestore Integration & Real-Time Sync (CRITICAL)**
6. ✅ Cursor Synchronization
7. ✅ User Presence System
8. ✅ Owner Controls - Shape Locking
9. ✅ Owner Controls - Kick User
10. ✅ State Persistence & Reconnection
11. ✅ Polish, Performance & Bug Fixes
12. ✅ Final Deployment & Testing

---

## Development Tips

**For Each PR:**
1. Create branch from `main`
2. Complete all subtasks in the PR
3. Test thoroughly (use 2+ browser windows)
4. Commit with descriptive messages
5. Push to GitHub
6. Create Pull Request with checklist in description
7. Review code
8. Merge to `main`
9. Deploy to Firebase (test deployed version)
10. Move to next PR

**Testing Strategy:**
- Always test with 2+ browser windows during development
- Test on deployed URL before marking PR complete
- Use Chrome DevTools to throttle network and test slow connections
- Test on different devices (desktop, tablet, mobile if time permits)

**Common Pitfalls to Avoid:**
- Don't skip PR #5 (Real-Time Sync) - this is the hardest part
- Deploy early and often to catch Firebase config issues
- Throttle cursor updates or you'll hit Firestore rate limits
- Test state persistence in every PR after #5