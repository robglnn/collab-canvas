# PR30: Hybrid RTDB - Performance Testing Instructions

## Overview
Test the hybrid Firestore + RTDB architecture to validate performance targets:
- ✅ **Sub-50ms cursor sync** (RTDB)
- ✅ **Sub-100ms object sync** for rapid edits (RTDB temp updates)
- ✅ **Zero visible lag** for local user (optimistic updates)
- ✅ **1000+ objects at 60 FPS**
- ✅ **12+ concurrent users** without contention

---

## Prerequisites

### 1. Verify RTDB URL in `.env.local`
Ensure you have the RTDB URL configured:
```
VITE_FIREBASE_DATABASE_URL=https://collab-canvas-d0e38-default-rtdb.firebaseio.com
```

### 2. Build and Deploy
```bash
npm run build
firebase deploy --only hosting
```

Or test locally:
```bash
npm run dev
```

---

## Test 1: Cursor Sync Latency (Target: <50ms)

### Setup:
1. Open 3 browser windows (use incognito or different profiles)
2. Sign in with different Google accounts in each window
3. All windows should show the same canvas

### Test:
1. In window 1, move the cursor around the canvas
2. Observe the cursor appear in windows 2 and 3
3. Open DevTools Console in window 2
4. Look for log: `[RTDB] Cursor latency: Xms`

### Expected Results:
- ✅ Cursors appear in <50ms
- ✅ Smooth cursor movement with no stuttering
- ✅ Console logs show latency <50ms
- ✅ All 3 users see each other's cursors

### How to Measure:
The `useCursors.js` hook automatically logs latency:
```javascript
// Check console for:
[RTDB] Cursor latency: 25ms  // Good!
[RTDB] Cursor latency: 45ms  // Good!
[RTDB] Cursor latency: 150ms // Bad - investigate
```

---

## Test 2: Line Width Real-Time Sync (Target: <100ms)

### Setup:
1. Use the same 3 browser windows from Test 1
2. Create a line in window 1

### Test:
1. In window 1, select the line
2. Drag the line width slider slowly
3. Watch windows 2 and 3 while dragging
4. Release the slider
5. Check console for: `[RTDB] Temp update latency for shape-xxx: Xms`

### Expected Results:
- ✅ While dragging: Other users see width change in <100ms
- ✅ Local user: Instant feedback (0ms)
- ✅ After release: All users have the same final width
- ✅ Console logs show latency <100ms

### Edge Cases to Test:
- Multiple users dragging different lines simultaneously
- Rapid slider movements
- Network throttling (DevTools → Network → Slow 3G)

---

## Test 3: 12-User Concurrent Test

### Setup:
1. Open 12 browser windows/tabs
   - Use different Chrome profiles, or
   - Use incognito windows, or
   - Mix browsers (Chrome, Firefox, Edge)
2. Sign in with different accounts

### Test:
1. All users move cursors simultaneously
2. All users create shapes
3. Multiple users select and move shapes
4. Check for:
   - ✅ No lag or jank
   - ✅ All cursors visible
   - ✅ All shape updates sync
   - ✅ No error messages in console

### Expected Results:
- ✅ Smooth performance with 12 users
- ✅ No "write contention" errors
- ✅ Cursor updates remain <50ms
- ✅ Memory usage stays stable

---

## Test 4: 1000+ Shapes Performance Test

### Setup:
1. Open canvas in 2 windows
2. Use AI agent to create many shapes:
   ```
   Create a grid of 50x20 squares
   ```
   This creates 1000 shapes

### Test:
1. Pan and zoom the canvas
2. Select multiple shapes
3. Move shapes around
4. Open DevTools → Performance
5. Record and check FPS

### Expected Results:
- ✅ Canvas maintains 60 FPS
- ✅ Smooth panning and zooming
- ✅ No frame drops during interactions
- ✅ Both windows perform well

---

## Test 5: Presence Auto-Disconnect

### Setup:
1. Open 3 browser windows
2. Sign in with different accounts

### Test:
1. Note the "3 Users" button shows correct count
2. Close window 2 (don't sign out, just close it)
3. Wait 2-3 seconds
4. Check windows 1 and 3

### Expected Results:
- ✅ User count drops to "2 Users" within 2-3 seconds
- ✅ Closed user's cursor disappears
- ✅ Console shows: `[RTDB] Presence updated: 2 online`
- ✅ No ghost users remain

---

## Test 6: Memory Leak Check

### Setup:
1. Open Chrome DevTools → Performance → Memory
2. Start recording heap snapshots

### Test:
1. Open canvas with 3 users
2. Move cursors continuously for 5 minutes
3. Drag line widths repeatedly
4. Take heap snapshots every minute
5. Compare snapshots

### Expected Results:
- ✅ Heap size stays stable (±5 MB)
- ✅ No continuous growth
- ✅ Garbage collection works properly
- ✅ No detached DOM nodes accumulating

---

## Test 7: Offline/Reconnection

### Setup:
1. Open canvas in 2 windows
2. Open DevTools → Network

### Test:
1. In window 1, set Network to "Offline"
2. Try to move cursor (won't sync)
3. Try to update shapes (won't sync)
4. Set Network back to "Online"
5. Wait 2-3 seconds

### Expected Results:
- ✅ RTDB reconnects automatically
- ✅ Presence updates to online
- ✅ Cursor sync resumes
- ✅ No data loss

---

## Performance Metrics to Record

Create a table with your test results:

| Test | Target | Actual Result | Pass/Fail |
|------|--------|---------------|-----------|
| Cursor sync latency | <50ms | _____ ms | ⬜ |
| Line width sync latency | <100ms | _____ ms | ⬜ |
| 12 users concurrent | No lag | _____ | ⬜ |
| 1000 shapes FPS | 60 FPS | _____ FPS | ⬜ |
| Presence auto-disconnect | <3 sec | _____ sec | ⬜ |
| Memory usage | Stable | _____ | ⬜ |
| Offline reconnect | Works | _____ | ⬜ |

---

## Troubleshooting

### If cursor latency >50ms:
1. Check RTDB URL is correct in `.env.local`
2. Verify RTDB rules are deployed
3. Check Firebase Console → Realtime Database for data
4. Test network latency to Firebase servers

### If temp updates don't sync:
1. Check console for RTDB errors
2. Verify `useRTDB` hook is initialized
3. Check RTDB rules allow write to `/tempUpdates`
4. Verify slider has `onLineWidthInput` handler

### If presence doesn't update:
1. Check `onDisconnect()` is set up correctly
2. Verify RTDB rules allow write to `/presence`
3. Check for errors in usePresence.js
4. Test in incognito to avoid cached data

### If performance is poor:
1. Check for console warnings about large chunks
2. Verify React.memo is applied to UserCursor
3. Check for unnecessary re-renders with React DevTools
4. Profile with Chrome DevTools Performance tab

---

## Deployment

Once all tests pass:

```bash
# Push to GitHub
git push -u origin feature/hybrid-rtdb

# Deploy to production
firebase deploy --only hosting

# Test on production URL
# https://collab-canvas-d0e38.web.app
```

---

## Success Criteria

PR30 is **COMPLETE** when:
- ✅ All 7 tests pass
- ✅ Cursor latency <50ms consistently
- ✅ Line width sync <100ms consistently
- ✅ 12 users work without issues
- ✅ 1000+ shapes at 60 FPS
- ✅ No memory leaks
- ✅ Auto-disconnect works properly
- ✅ Deployed and stable in production

---

## Next Steps After Testing

1. Update `RTDB_TASKS.md` with actual performance results
2. Update `PRD.md` to reflect hybrid architecture
3. Document any issues found
4. Create follow-up tasks if needed

Good luck! 🚀

