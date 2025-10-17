# PR30: Hybrid RTDB Implementation - Task Checklist

**Branch:** `feature/hybrid-rtdb` (create from `feature/line-tool`)  
**Estimated Time:** 3-4 hours  
**Reference:** See `RTDBPRD.md` for full context and code examples  

---

## 🎯 PERFORMANCE TARGETS

- [ ] **Sub-50ms cursor sync** (currently 100-200ms)
- [ ] **Sub-100ms object sync** for rapid edits (currently 100-200ms)
- [ ] **12+ concurrent users** without lag or contention
- [ ] **1000+ shapes at 60 FPS** maintained
- [ ] **Zero visible lag** for local user

---

## 🌿 GIT SETUP

```bash
# Start Phase 2
git checkout feature/line-tool
git pull origin feature/line-tool
git checkout -b feature/hybrid-rtdb
```

- [ ] Created `feature/hybrid-rtdb` branch
- [ ] Verified starting from `feature/line-tool`
- [ ] Confirmed RTDB URL in `.env.local`

---

## ✅ TASK 1: RTDB Configuration (30 min)

**Goal:** Initialize Firebase Realtime Database connection

### Subtasks:
- [ ] 1.1: Import RTDB in `src/lib/firebase.js`
  - [ ] Add: `import { getDatabase } from 'firebase/database';`
  - [ ] Add: `export const database = getDatabase(app);`
  - [ ] Verify RTDB uses `VITE_FIREBASE_DATABASE_URL` from env

- [ ] 1.2: Test RTDB connection
  - [ ] Open dev tools console
  - [ ] Verify no RTDB connection errors
  - [ ] Test read/write permissions (temp test)

### Files Modified:
- `src/lib/firebase.js`

### Test:
```javascript
// Temp test in console:
import { ref, set } from 'firebase/database';
set(ref(database, 'test'), { hello: 'world' });
// Check Firebase Console → Realtime Database
```

---

## ✅ TASK 2: Migrate Cursors to RTDB (1 hour) ⭐ HIGH IMPACT

**Goal:** Move cursor updates from Firestore to RTDB for sub-50ms sync

### Subtasks:
- [ ] 2.1: Update imports in `src/hooks/useCursors.js`
  - [ ] Import: `ref, onValue, set, off` from `firebase/database`
  - [ ] Import: `database` from `../lib/firebase`
  - [ ] Remove Firestore imports

- [ ] 2.2: Replace Firestore listeners with RTDB
  - [ ] Change from `onSnapshot()` to `onValue()`
  - [ ] Update ref path: `cursors/${canvasId}`
  - [ ] Parse RTDB data format: `snapshot.val()`
  - [ ] Add proper cleanup with `off()` in useEffect

- [ ] 2.3: Replace Firestore writes with RTDB
  - [ ] Change from `setDoc()` to `set()`
  - [ ] Update ref path: `cursors/${canvasId}/${userId}`
  - [ ] Add `timestamp: Date.now()` to cursor data

- [ ] 2.4: Add throttling (50ms = 20 updates/sec)
  - [ ] Implement throttle function or use lodash
  - [ ] Wrap cursor update in throttle
  - [ ] Verify cursor updates don't exceed 20/sec

- [ ] 2.5: Add cleanup on unmount
  - [ ] Call `off()` for all RTDB listeners
  - [ ] Remove cursor from RTDB on unmount
  - [ ] Verify no memory leaks in DevTools

### Files Modified:
- `src/hooks/useCursors.js`

### Test Checklist:
- [ ] Open 3 browser windows
- [ ] Move cursor in each window
- [ ] Verify all cursors appear in <50ms
- [ ] Check console for latency logs
- [ ] Verify no console errors
- [ ] Check Firebase Console → Realtime Database → cursors data

### Performance Measurement:
```javascript
// Add in listener:
const sendTime = cursorData.timestamp;
const receiveTime = Date.now();
console.log(`Cursor latency: ${receiveTime - sendTime}ms`); // Should be <50ms
```

---

## ✅ TASK 3: Migrate Presence to RTDB (1 hour)

**Goal:** Real-time online/offline status with auto-disconnect

### Subtasks:
- [ ] 3.1: Update imports in `src/hooks/usePresence.js`
  - [ ] Import: `ref, onValue, set, onDisconnect, off` from `firebase/database`
  - [ ] Import: `database` from `../lib/firebase`
  - [ ] Remove Firestore imports

- [ ] 3.2: Replace Firestore presence with RTDB
  - [ ] Change from `onSnapshot()` to `onValue()`
  - [ ] Update ref path: `presence/${canvasId}`
  - [ ] Parse RTDB data format: `snapshot.val()`

- [ ] 3.3: Update online status writes
  - [ ] Change from `setDoc()` to `set()`
  - [ ] Update ref path: `presence/${canvasId}/${userId}`
  - [ ] Add: `{ online: true, lastSeen: Date.now(), displayName, photoURL }`

- [ ] 3.4: Add auto-disconnect with `onDisconnect()`
  - [ ] On connect: Set online = true
  - [ ] Setup: `onDisconnect().set({ online: false, lastSeen: serverTimestamp() })`
  - [ ] This auto-triggers when user closes tab/disconnects

- [ ] 3.5: Update cleanup
  - [ ] Call `off()` for presence listeners
  - [ ] Set online = false on unmount
  - [ ] Verify ghost users don't persist

### Files Modified:
- `src/hooks/usePresence.js`

### Files to Verify:
- `src/components/UserList.jsx` (should work automatically with new data)

### Test Checklist:
- [ ] Open 2 browser windows
- [ ] Verify both show as online
- [ ] Close one window
- [ ] Verify it shows offline in <2 seconds
- [ ] Refresh page
- [ ] Verify online status updates correctly
- [ ] Check Firebase Console → Realtime Database → presence data

---

## ✅ TASK 4: Add Temp Updates Hook (45 min)

**Goal:** Create hook for temporary shape updates (line width while dragging)

### Subtasks:
- [ ] 4.1: Create `src/hooks/useRTDB.js`
  - [ ] Import RTDB functions
  - [ ] Import database instance
  - [ ] Export custom hook

- [ ] 4.2: Implement `writeTempUpdate(shapeId, updates)`
  - [ ] Write to: `tempUpdates/${canvasId}/${shapeId}`
  - [ ] Include: `{ ...updates, timestamp: Date.now() }`
  - [ ] Handle errors gracefully

- [ ] 4.3: Implement `subscribeTempUpdates(canvasId, callback)`
  - [ ] Listen to: `tempUpdates/${canvasId}`
  - [ ] Call callback with updates object
  - [ ] Return unsubscribe function

- [ ] 4.4: Implement `clearTempUpdate(shapeId)`
  - [ ] Remove from: `tempUpdates/${canvasId}/${shapeId}`
  - [ ] Use `remove()` from RTDB

- [ ] 4.5: Add cleanup/unmount logic
  - [ ] Unsubscribe all listeners
  - [ ] Clear all temp updates for user
  - [ ] Verify no memory leaks

### Files Created:
- `src/hooks/useRTDB.js`

### Code Template:
```javascript
import { ref, set, onValue, remove, off } from 'firebase/database';
import { database } from '../lib/firebase';
import { useEffect } from 'react';

export function useRTDB(canvasId) {
  const writeTempUpdate = (shapeId, updates) => {
    const tempRef = ref(database, `tempUpdates/${canvasId}/${shapeId}`);
    return set(tempRef, { ...updates, timestamp: Date.now() });
  };

  const subscribeTempUpdates = (callback) => {
    const tempRef = ref(database, `tempUpdates/${canvasId}`);
    onValue(tempRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
    return () => off(tempRef);
  };

  const clearTempUpdate = (shapeId) => {
    const tempRef = ref(database, `tempUpdates/${canvasId}/${shapeId}`);
    return remove(tempRef);
  };

  return { writeTempUpdate, subscribeTempUpdates, clearTempUpdate };
}
```

### Test Checklist:
- [ ] Import and use hook in Canvas.jsx
- [ ] Test writeTempUpdate() writes to RTDB
- [ ] Test subscribeTempUpdates() receives updates
- [ ] Test clearTempUpdate() removes data
- [ ] Check Firebase Console → Realtime Database → tempUpdates data

---

## ✅ TASK 5: Enhance Optimistic Updates (30 min)

**Goal:** Integrate RTDB temp updates with existing optimistic pattern

### Subtasks:
- [ ] 5.1: Update `handleUpdateLineWidth` in Canvas.jsx
  - [ ] Keep Phase 1 optimistic update (instant local)
  - [ ] Add RTDB temp update write (50-100ms to others)
  - [ ] On mouse up: Write to Firestore + clear RTDB temp update

- [ ] 5.2: Subscribe to temp updates in Canvas.jsx
  - [ ] Use `subscribeTempUpdates()` from useRTDB hook
  - [ ] Merge temp updates with optimistic updates
  - [ ] Apply to shapes rendering

- [ ] 5.3: Add React.memo to UserCursor component
  - [ ] Wrap component export with React.memo
  - [ ] Add comparison function if needed
  - [ ] Verify re-renders reduced

- [ ] 5.4: Add useMemo for cursors filtering
  - [ ] Memoize cursors array transformations
  - [ ] Add dependency array
  - [ ] Verify performance improvement

### Files Modified:
- `src/components/Canvas.jsx`
- `src/components/UserCursor.jsx`

### Updated Flow:
```javascript
// On slider drag (onInput):
1. setOptimisticUpdates({ [shapeId]: { strokeWidth } })  // 0ms local
2. writeTempUpdate(shapeId, { strokeWidth })             // 50-100ms to others

// On slider release (onChange):
3. updateShape(shapeId, { strokeWidth })                 // Firestore (permanent)
4. clearTempUpdate(shapeId)                              // Clean RTDB
```

### Test Checklist:
- [ ] Drag line width slider
- [ ] Verify instant local update (0ms)
- [ ] Open 2nd browser
- [ ] Verify 2nd browser sees update in <100ms
- [ ] Release slider
- [ ] Verify Firestore persisted change
- [ ] Verify RTDB temp update cleared
- [ ] Check DevTools React Profiler for re-render optimization

---

## ✅ TASK 6: Add RTDB Security Rules (15 min)

**Goal:** Secure RTDB data with authentication rules

### Subtasks:
- [ ] 6.1: Create `database.rules.json` in project root
  - [ ] Copy template from RTDBPRD.md
  - [ ] Customize for project needs

- [ ] 6.2: Add rules for cursors
  - [ ] Read: Any authenticated user
  - [ ] Write: Only own cursor (auth.uid == $userId)

- [ ] 6.3: Add rules for presence
  - [ ] Read: Any authenticated user
  - [ ] Write: Only own presence (auth.uid == $userId)

- [ ] 6.4: Add rules for tempUpdates
  - [ ] Read: Any authenticated user in canvas
  - [ ] Write: Any authenticated user in canvas

- [ ] 6.5: Deploy rules
  - [ ] Run: `firebase deploy --only database`
  - [ ] Verify no errors
  - [ ] Test read/write permissions in browser

### Files Created:
- `database.rules.json`

### Rules Template:
```json
{
  "rules": {
    "cursors": {
      "$canvasId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    },
    "presence": {
      "$canvasId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    },
    "tempUpdates": {
      "$canvasId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

### Test Checklist:
- [ ] Deploy rules successfully
- [ ] Test authenticated user can read/write
- [ ] Test unauthenticated user is blocked
- [ ] Test user can only write own cursor/presence
- [ ] Check Firebase Console → Realtime Database → Rules tab

---

## ✅ TASK 7: Performance Testing (30 min)

**Goal:** Validate performance targets achieved

### Subtasks:
- [ ] 7.1: 12-User Simulation Test
  - [ ] Open 12 browser windows (use different profiles if needed)
  - [ ] Move cursors in all windows
  - [ ] Verify smooth cursor updates
  - [ ] Check no lag or jank

- [ ] 7.2: Cursor Latency Measurement
  - [ ] Add console.log with timestamps
  - [ ] Measure: Cursor write → Cursor receive
  - [ ] Target: <50ms average
  - [ ] Record results

- [ ] 7.3: Line Width Drag Test
  - [ ] Select line in window 1
  - [ ] Drag slider in window 1
  - [ ] Watch window 2
  - [ ] Measure latency
  - [ ] Target: <100ms

- [ ] 7.4: Memory Leak Check
  - [ ] Open DevTools → Performance → Memory
  - [ ] Record for 10 minutes with 12 users
  - [ ] Check for memory growth
  - [ ] Verify heap stays stable

- [ ] 7.5: Shape Rendering Performance
  - [ ] Create 1000+ shapes
  - [ ] Move canvas around
  - [ ] Check FPS in DevTools
  - [ ] Target: 60 FPS maintained

- [ ] 7.6: Firebase Quota Check
  - [ ] Open Firebase Console → Usage
  - [ ] Check RTDB bandwidth usage
  - [ ] Estimate monthly cost
  - [ ] Verify within budget (~$60/month)

### Test Scenarios:
- [ ] **Scenario 1:** All 12 users move cursors simultaneously
- [ ] **Scenario 2:** 2 users drag line widths simultaneously
- [ ] **Scenario 3:** 1 user creates shapes while others watch
- [ ] **Scenario 4:** Rapid shape edits from multiple users
- [ ] **Scenario 5:** User disconnects/reconnects (presence update)

### Performance Logs:
```javascript
// Add these console logs:
console.log(`Cursor latency: ${latency}ms`);       // Target: <50ms
console.log(`Object sync latency: ${latency}ms`);  // Target: <100ms
console.log(`FPS: ${fps}`);                        // Target: 60
console.log(`Memory usage: ${memoryMB}MB`);        // Should stay stable
```

### Results Documentation:
- [ ] Screenshot performance metrics
- [ ] Record average latencies
- [ ] Document any issues found
- [ ] Create list of optimizations if needed

---

## 🚀 FINAL CHECKLIST

### Pre-Deployment:
- [ ] All 7 tasks completed
- [ ] No console errors
- [ ] All tests passing
- [ ] Performance targets met:
  - [ ] Cursor latency: <50ms ✅
  - [ ] Object sync: <100ms ✅
  - [ ] 12 users: No lag ✅
  - [ ] 1000+ shapes: 60 FPS ✅
  - [ ] Memory: Stable ✅

### Code Quality:
- [ ] No linter errors
- [ ] No TypeScript errors (if applicable)
- [ ] Code formatted consistently
- [ ] Comments added for complex logic
- [ ] No debug console.logs left in

### Git:
- [ ] All changes committed
- [ ] Descriptive commit messages
- [ ] Branch pushed to GitHub

### Documentation:
- [ ] Update `tasks.md` with PR30 completion
- [ ] Update `PRD.md` with performance results
- [ ] Update `README.md` if needed

---

## 🎯 DEPLOYMENT

### Build & Deploy:
```bash
# Build production version
cd collabcanvas
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Test on production URL
# https://collab-canvas-d0e38.web.app
```

### Deployment Checklist:
- [ ] Build completed without errors
- [ ] Deployed to Firebase successfully
- [ ] Production site loads correctly
- [ ] Test with real users (12 windows)
- [ ] Monitor Firebase Console for errors
- [ ] Check Firebase usage/costs

### Rollback Plan (if needed):
```bash
# If issues occur, redeploy previous version:
git checkout feature/line-tool
cd collabcanvas
npm run build
firebase deploy --only hosting
```

---

## 📊 SUCCESS METRICS

Record actual results:

### Latency Results:
- Cursor sync latency: ______ ms (target: <50ms)
- Object sync latency: ______ ms (target: <100ms)
- Firestore write time: ______ ms

### Performance Results:
- FPS with 1000 shapes: ______ fps (target: 60)
- Memory usage: ______ MB
- 12-user test: ______ (Pass/Fail)

### Firebase Usage:
- RTDB bandwidth: ______ GB/month
- Estimated cost: $______ /month
- Within budget: ______ (Yes/No)

---

## ✅ DEFINITION OF DONE

Phase 2 (PR30) is **COMPLETE** when:

- [x] All 7 implementation tasks finished
- [x] Performance targets achieved and documented
- [x] No memory leaks or console errors
- [x] RTDB security rules deployed and tested
- [x] Deployed to production and verified stable
- [x] 12-user test passed successfully
- [x] Code committed and pushed to GitHub
- [x] Documentation updated (tasks.md, PRD.md, README.md)
- [x] Stable in production for 24 hours

---

## 🎉 READY TO START?

**Current Status:** ⏳ Not Started

**Next Step:** Task 1 - RTDB Configuration (30 min)

**Commands to begin:**
```bash
git checkout feature/line-tool
git pull origin feature/line-tool
git checkout -b feature/hybrid-rtdb
```

**Then open:** `RTDBPRD.md` for detailed code examples and reference.

---

**LET'S ACHIEVE SUB-50MS PERFORMANCE! 🚀**

