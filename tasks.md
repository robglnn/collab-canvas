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

## PR #13: Advanced Color System

**Branch:** `feature/color-picker`

**Goal:** Add advanced color picker with default palette and custom user colors

### Tasks:

- [ ] **13.1: Create User Preferences Hook**
  - New hook to manage user-specific preferences
  - Load and save custom colors to Firestore
  - Store 5 custom hex colors per user
  - **Files Created:**
    - `src/hooks/useUserPreferences.js`

- [ ] **13.2: Add Color Picker to Toolbar**
  - Display 10 default color swatches
  - Display 5 custom color slots (empty until user saves)
  - Right-click custom slot to save current color
  - Add hex code input field with Apply button
  - **Files Modified:**
    - `src/components/Toolbar.jsx`
    - `src/components/Toolbar.css`

- [ ] **13.3: Implement Color Selection**
  - Clicking color swatch selects that color
  - Selected color applies to new shapes being created
  - If shapes are selected, apply color to all selected shapes
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/components/Shape.jsx`

- [ ] **13.4: Add Hex Input Validation**
  - Validate hex color format (#RRGGBB)
  - Show error if invalid format
  - Update selected color on valid input
  - **Files Modified:**
    - `src/components/Toolbar.jsx`

- [ ] **13.5: Update Shape Data Model**
  - Add `fill` field to shapes (for rectangles, circles, text)
  - Add `stroke` field for lines
  - Ensure backward compatibility with existing shapes
  - **Files Modified:**
    - `src/lib/firestoreService.js`

- [ ] **13.6: Create User Preferences Firestore Collection**
  - Add `/users/{userId}/` collection for preferences
  - Store customColors array
  - Update Firestore security rules
  - **Files Modified:**
    - `firestore.rules`

- [ ] **13.7: Test Color System**
  - Test color selection and application
  - Test custom color saving (persists across sessions)
  - Test applying color to multiple selected shapes
  - Test multi-user color sync

---

## PR #14: Rename Rectangle to Square

**Branch:** `feature/rename-square`

**Goal:** Update UI labels for clarity

### Tasks:

- [ ] **14.1: Update Toolbar Button Text**
  - Change "Rectangle" to "Square" in button label
  - Update tooltip text
  - Keep internal `type: "rectangle"` for backward compatibility
  - **Files Modified:**
    - `src/components/Toolbar.jsx`

- [ ] **14.2: Update Icon (Optional)**
  - Consider making icon more square-like (equal width/height)
  - **Files Modified:**
    - `src/components/Toolbar.jsx`

- [ ] **14.3: Update Hint Text**
  - Change "Click on canvas to place rectangle" to "place square"
  - **Files Modified:**
    - `src/components/Toolbar.jsx`

---

## PR #15: Circle Tool

**Branch:** `feature/circle-tool`

**Goal:** Add circle shape creation

### Tasks:

- [ ] **15.1: Add Circle Button to Toolbar**
  - Create circle button with SVG icon
  - Handle click to enter place mode
  - **Files Modified:**
    - `src/components/Toolbar.jsx`
    - `src/components/Toolbar.css`

- [ ] **15.2: Handle Circle Placement**
  - Click canvas to place circle (100px diameter)
  - Use selected color for fill
  - Auto-exit place mode after placement
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **15.3: Render Circles in Shape Component**
  - Add Konva Circle component rendering
  - Handle circle positioning (center vs top-left)
  - Support selection, dragging, resizing
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **15.4: Lock Aspect Ratio for Circles**
  - Set `keepRatio={true}` on Transformer for circles
  - Ensures circles stay circular during resize
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **15.5: Update Shape Data Model**
  - Ensure `type: "circle"` is supported
  - Use `width` and `height` fields (both equal for circles)
  - **Files Modified:**
    - `src/lib/firestoreService.js`

- [ ] **15.6: Test Circle Functionality**
  - Test creating circles
  - Test moving, resizing (stays circular), rotating
  - Test multi-user circle sync
  - Test color application

---

## PR #16: Line Tool

**Branch:** `feature/line-tool`

**Goal:** Add line shape with adjustable width

### Tasks:

- [ ] **16.1: Add Line Button to Toolbar**
  - Create line button with SVG icon
  - Add line width submenu/slider (1-100px)
  - **Files Modified:**
    - `src/components/Toolbar.jsx`
    - `src/components/Toolbar.css`

- [ ] **16.2: Implement Two-Click Line Placement**
  - First click sets start point
  - Second click sets end point and creates line
  - Store line start point in state between clicks
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **16.3: Render Lines in Shape Component**
  - Add Konva Line component rendering
  - Use `points` array [x1, y1, x2, y2]
  - Use `stroke` and `strokeWidth` instead of `fill`
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **16.4: Handle Line Movement**
  - Dragging line moves both endpoints together
  - Update points array by adding drag delta
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **16.5: Add Line Width Adjustment**
  - Line width slider in toolbar (active when line tool selected)
  - Context menu option to change width of existing line
  - **Files Modified:**
    - `src/components/Toolbar.jsx`
    - `src/components/ContextMenu.jsx`

- [ ] **16.6: Update Shape Data Model**
  - Add `type: "line"` support
  - Store `points`, `stroke`, `strokeWidth` fields
  - **Files Modified:**
    - `src/lib/firestoreService.js`

- [ ] **16.7: Test Line Functionality**
  - Test two-click line creation
  - Test moving lines
  - Test adjusting line width
  - Test multi-user line sync

---

## PR #17: Text Tool

**Branch:** `feature/text-tool`

**Goal:** Add text with font and styling options

### Tasks:

- [ ] **17.1: Add Text Button to Toolbar**
  - Create text button with SVG icon
  - Add font selector dropdown (Arial, Times New Roman, Papyrus)
  - Add Bold button (toggle)
  - Add Underline button (toggle)
  - **Files Modified:**
    - `src/components/Toolbar.jsx`
    - `src/components/Toolbar.css`

- [ ] **17.2: Implement Text Placement**
  - Click canvas to show text prompt
  - User enters text content
  - Place text at cursor position
  - Auto-exit place mode after placement
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **17.3: Render Text in Shape Component**
  - Add Konva Text component rendering
  - Apply fontSize, fontFamily, fontStyle, textDecoration
  - Use selected color for fill
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **17.4: Handle Text Editing**
  - Double-click text to edit (show prompt with current text)
  - Update text content in Firestore
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **17.5: Handle Text Resizing**
  - Resizing text scales font size (not just box)
  - Calculate new font size from scale factor
  - **Files Modified:**
    - `src/components/Shape.jsx`

- [ ] **17.6: Update Shape Data Model**
  - Add `type: "text"` support
  - Store `text`, `fontSize`, `fontFamily`, `fontStyle`, `textDecoration`
  - **Files Modified:**
    - `src/lib/firestoreService.js`

- [ ] **17.7: Test Text Functionality**
  - Test creating text with different fonts and styles
  - Test double-click editing
  - Test moving and resizing text
  - Test multi-user text sync

---

## PR #18: Multi-Select with Selection Box

**Branch:** `feature/multi-select`

**Goal:** Click and drag to select multiple shapes

### Tasks:

- [ ] **18.1: Change Selection State to Array**
  - Replace `selectedShapeId` (string) with `selectedShapeIds` (array)
  - Update all selection logic to handle arrays
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/hooks/useCanvas.js`

- [ ] **18.2: Implement Selection Box Drawing**
  - Track mouse down position on empty canvas
  - Draw blue selection rectangle while dragging
  - Calculate selection box bounds
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/components/Canvas.css`

- [ ] **18.3: Detect Shapes Within Selection Box**
  - On mouse up, check which shapes intersect selection box
  - Convert selection box to canvas coordinates
  - Add intersecting shapes to `selectedShapeIds`
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **18.4: Render Selection Box**
  - Draw dashed blue rectangle on canvas while dragging
  - Use Konva Rect with dash pattern
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **18.5: Handle Multi-Shape Movement**
  - When dragging one selected shape, move all selected shapes
  - Calculate delta from original position
  - Apply same delta to all selected shapes
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **18.6: Handle Multi-Shape Color Change**
  - When color selected, apply to all selected shapes
  - Update all shapes in single batch
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **18.7: Handle Multi-Shape Deletion**
  - Delete key removes all selected shapes
  - Clear selection after deletion
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **18.8: Test Multi-Select**
  - Test drag-to-select with multiple shapes
  - Test moving multiple shapes together
  - Test changing color of multiple shapes
  - Test deleting multiple shapes
  - Test multi-user multi-select

---

## PR #19: Copy/Paste Shapes

**Branch:** `feature/copy-paste`

**Goal:** Right-click copy and paste shapes

### Tasks:

- [ ] **19.1: Add Clipboard State**
  - Add clipboard state to store copied shapes
  - Store array of shape data (supports multi-select)
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **19.2: Add Copy to Context Menu**
  - Add "Copy" option to context menu
  - Show when shape is right-clicked
  - Copy selected shape(s) to clipboard state
  - **Files Modified:**
    - `src/components/ContextMenu.jsx`
    - `src/components/ContextMenu.css`

- [ ] **19.3: Add Paste to Context Menu**
  - Add "Paste" option to context menu
  - Show when canvas is right-clicked and clipboard has data
  - Paste shapes at cursor position with slight offset
  - **Files Modified:**
    - `src/components/ContextMenu.jsx`

- [ ] **19.4: Implement Copy Logic**
  - Store shape data in clipboard state
  - If multiple shapes selected, copy all
  - Include all shape properties
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **19.5: Implement Paste Logic**
  - Create new shapes from clipboard data
  - Generate new IDs for pasted shapes
  - Position at cursor with offset
  - Clear locks and update createdBy
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **19.6: Add Keyboard Shortcuts**
  - Ctrl+C / Cmd+C to copy
  - Ctrl+V / Cmd+V to paste
  - Paste at viewport center when using keyboard
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **19.7: Test Copy/Paste**
  - Test copying and pasting single shape
  - Test copying and pasting multiple shapes
  - Test keyboard shortcuts
  - Test multi-user scenarios

---

## PR #20: Arrow Key Movement

**Branch:** `feature/arrow-keys`

**Goal:** Move selected shapes with arrow keys (1px precision)

### Tasks:

- [ ] **20.1: Add Arrow Key Handler**
  - Listen for arrow key events (ArrowLeft, ArrowRight, ArrowUp, ArrowDown)
  - Prevent default page scrolling behavior
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **20.2: Implement Shape Movement**
  - Calculate dx/dy based on arrow key (±1 pixel)
  - Update position of all selected shapes
  - Handle lines separately (update points array)
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **20.3: Test Arrow Key Movement**
  - Test moving single shape with arrow keys
  - Test moving multiple shapes with arrow keys
  - Test all four directions
  - Test that page doesn't scroll

---

## PR #21: Undo/Redo System

**Branch:** `feature/undo-redo`

**Goal:** Implement undo/redo with 10-step history

### Tasks:

- [ ] **21.1: Create Undo/Redo Hook**
  - Track undo and redo stacks (max 10 entries)
  - Store snapshots of shapes before each action
  - Functions: saveState, undo, redo
  - **Files Created:**
    - `src/hooks/useUndoRedo.js`

- [ ] **21.2: Integrate Undo/Redo with Canvas**
  - Call saveState before shape modifications
  - Restore previous state on undo
  - Restore next state on redo
  - Clear redo stack when new action performed
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/hooks/useCanvas.js`

- [ ] **21.3: Add Keyboard Shortcuts**
  - Ctrl+Z / Cmd+Z for undo
  - Ctrl+Shift+Z / Cmd+Shift+Z for redo
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **21.4: Add Undo Limit Banner**
  - Show banner when user tries to undo beyond 10 steps
  - Auto-hide banner after 3 seconds
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/components/Canvas.css`

- [ ] **21.5: Handle Firestore Batch Updates**
  - Calculate diff between current and target state
  - Batch update Firestore with changes
  - Let Firestore listener update local state
  - **Files Modified:**
    - `src/hooks/useUndoRedo.js`
    - `src/lib/firestoreService.js`

- [ ] **21.6: Test Undo/Redo**
  - Test undoing shape creation, movement, deletion, color change
  - Test redo after undo
  - Test 10-step limit
  - Test that undo limit banner appears

---

## PR #22: Layers Panel

**Branch:** `feature/layers-panel`

**Goal:** Add layers management with drag-to-reorder

### Tasks:

- [ ] **22.1: Install Drag-and-Drop Library**
  - Install react-beautiful-dnd for drag-to-reorder
  - **Command:** `npm install react-beautiful-dnd`

- [ ] **22.2: Create Layers Panel Component**
  - Expandable panel in left sidebar
  - List all shapes sorted by zIndex (top = front)
  - Show shape icon and name
  - Highlight selected shapes
  - **Files Created:**
    - `src/components/LayersPanel.jsx`
    - `src/components/LayersPanel.css`

- [ ] **22.3: Implement Drag-to-Reorder**
  - Allow clicking and dragging layers in list
  - Reorder shapes based on new position
  - Update zIndex values in Firestore
  - **Files Modified:**
    - `src/components/LayersPanel.jsx`

- [ ] **22.4: Add Layer Actions to Context Menu**
  - Add "Bring to Front" option
  - Add "Send to Back" option
  - Update shape zIndex on click
  - **Files Modified:**
    - `src/components/ContextMenu.jsx`
    - `src/components/Canvas.jsx`

- [ ] **22.5: Implement Layer Ordering Logic**
  - Add `zIndex` field to shapes
  - Assign zIndex based on creation order initially
  - Update zIndex when layers reordered
  - **Files Modified:**
    - `src/components/Canvas.jsx`
    - `src/hooks/useCanvas.js`
    - `src/lib/firestoreService.js`

- [ ] **22.6: Render Shapes in Layer Order**
  - Sort shapes by zIndex before rendering
  - Lower zIndex = rendered first (back)
  - Higher zIndex = rendered last (front)
  - **Files Modified:**
    - `src/components/Canvas.jsx`

- [ ] **22.7: Integrate Layers Panel**
  - Add LayersPanel to left sidebar
  - Connect to shape selection
  - **Files Modified:**
    - `src/App.jsx`

- [ ] **22.8: Test Layers Functionality**
  - Test drag-to-reorder layers
  - Test bring to front / send to back
  - Test visual layer order on canvas
  - Test multi-user layer sync

---

## PR #23: Comments System

**Branch:** `feature/comments`

**Goal:** Add shape comments with add/edit/delete functionality

### Tasks:

- [ ] **23.1: Create Comments Hook**
  - Subscribe to `/canvases/main/comments` collection
  - Functions: addComment, updateComment, deleteComment (soft delete)
  - Return comments array sorted by creation date
  - **Files Created:**
    - `src/hooks/useComments.js`

- [ ] **23.2: Create Comments Panel Component**
  - Expandable panel in left sidebar (under Layers)
  - Show + button to add comment
  - List all comments with user initials, timestamp, text
  - Click text to edit, click elsewhere to save
  - X button to delete comment
  - **Files Created:**
    - `src/components/CommentsPanel.jsx`
    - `src/components/CommentsPanel.css`

- [ ] **23.3: Implement Add Comment**
  - Click + button opens add form
  - Select shape from dropdown
  - Enter comment text (max 100 chars)
  - Submit to Firestore
  - **Files Modified:**
    - `src/components/CommentsPanel.jsx`

- [ ] **23.4: Implement Edit Comment**
  - Click comment text to enter edit mode
  - Show textarea with current text
  - Save on blur or click outside
  - **Files Modified:**
    - `src/components/CommentsPanel.jsx`

- [ ] **23.5: Implement Delete Comment**
  - Click X button to delete
  - Soft delete (set deleted: true)
  - Filter out deleted comments in UI
  - **Files Modified:**
    - `src/components/CommentsPanel.jsx`
    - `src/hooks/useComments.js`

- [ ] **23.6: Format User Initials and Timestamps**
  - Extract first letter of first + last name
  - Format timestamp as relative (e.g., "3m ago", "2h ago")
  - **Files Modified:**
    - `src/components/CommentsPanel.jsx`

- [ ] **23.7: Create Comments Firestore Collection**
  - Add `/canvases/main/comments/{commentId}` collection
  - Store shapeId, text, userId, userName, userInitials, timestamps
  - Update Firestore security rules
  - **Files Modified:**
    - `firestore.rules`

- [ ] **23.8: Integrate Comments Panel**
  - Add CommentsPanel to left sidebar
  - Position below LayersPanel
  - **Files Modified:**
    - `src/App.jsx`

- [ ] **23.9: Test Comments System**
  - Test adding comments to shapes
  - Test editing comments
  - Test deleting comments
  - Test multi-user comments (all users can see/edit)
  - Test 100 character limit

---

## PR #24: Users Online Button

**Branch:** `feature/users-button`

**Goal:** Replace sidebar user list with top bar button

### Tasks:

- [ ] **24.1: Create Users Online Button**
  - Show "XX Users" text (count of online users)
  - Position in top bar, left of user profile icon
  - Click to toggle dropdown
  - **Files Modified:**
    - `src/App.jsx`
    - `src/components/UserList.jsx` (convert to dropdown)

- [ ] **24.2: Create Users Dropdown**
  - Show full user list when button clicked
  - Display user names, photos, roles
  - Click outside to close
  - **Files Modified:**
    - `src/components/UserList.jsx`
    - `src/components/UserList.css`

- [ ] **24.3: Update Top Bar Layout**
  - Add top bar container
  - Left side: connection indicator + users button
  - Right side: user profile
  - **Files Modified:**
    - `src/App.jsx`
    - `src/index.css`

- [ ] **24.4: Test Users Button**
  - Test user count updates in real-time
  - Test dropdown shows/hides correctly
  - Test with multiple users joining/leaving

---

## PR #25: Connection Indicator

**Branch:** `feature/connection-indicator`

**Goal:** Show connection status with green/red circle

### Tasks:

- [ ] **25.1: Create Connection Indicator Component**
  - Show green circle when connected
  - Show red circle after 1000ms of disconnect
  - Position left of "XX Users" button in top bar
  - **Files Created:**
    - `src/components/ConnectionIndicator.jsx`
    - `src/components/ConnectionIndicator.css`

- [ ] **25.2: Monitor Firestore Connection State**
  - Subscribe to Firestore connection status
  - Update isConnected state
  - **Files Modified:**
    - `src/hooks/useFirestore.js`

- [ ] **25.3: Implement Disconnect Delay**
  - Wait 1000ms before showing red circle
  - Clear timer if reconnected before delay
  - **Files Modified:**
    - `src/components/ConnectionIndicator.jsx`

- [ ] **25.4: Implement Auto-Reconnect**
  - Attempt reconnection every 5 seconds when disconnected
  - Firestore handles reconnection automatically
  - **Files Modified:**
    - `src/components/ConnectionIndicator.jsx`

- [ ] **25.5: Add Pulse Animation**
  - Animate red circle with pulse effect
  - Static green circle when connected
  - **Files Modified:**
    - `src/components/ConnectionIndicator.css`

- [ ] **25.6: Integrate Connection Indicator**
  - Add to top bar, left side
  - Position before users button
  - **Files Modified:**
    - `src/App.jsx`

- [ ] **25.7: Test Connection Indicator**
  - Test shows green when connected
  - Test shows red after network disconnect (with 1s delay)
  - Test turns green after reconnection
  - Test auto-reconnect attempts

---

## Quick Reference: PR Order

### MVP (Completed)
1. ✅ Project Setup & Firebase Configuration
2. ✅ Google OAuth Authentication
3. ✅ Basic Canvas with Pan & Zoom
4. ✅ Shape Creation & Local Manipulation
5. ✅ Firestore Integration & Real-Time Sync
6. ✅ Cursor Synchronization
7. ✅ User Presence System
8. ✅ Owner Controls - Shape Locking
9. ✅ Owner Controls - Kick User
10. ✅ State Persistence & Reconnection
11. ✅ Polish, Performance & Bug Fixes
12. ✅ Final Deployment & Testing

### Feature Additions (PRs 13-25)
13. ⬜ Advanced Color System (4-5 hours)
14. ⬜ Rename Rectangle to Square (15 minutes)
15. ⬜ Circle Tool (2-3 hours)
16. ⬜ Line Tool (4-5 hours)
17. ⬜ Text Tool (4-5 hours)
18. ⬜ Multi-Select with Selection Box (5-6 hours)
19. ⬜ Copy/Paste Shapes (3-4 hours)
20. ⬜ Arrow Key Movement (1-2 hours)
21. ⬜ Undo/Redo System (6-8 hours)
22. ⬜ Layers Panel (5-6 hours)
23. ⬜ Comments System (6-8 hours)
24. ⬜ Users Online Button (2-3 hours)
25. ⬜ Connection Indicator (2-3 hours)

**Total Estimated Effort for PRs 13-25:** 50-65 hours

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