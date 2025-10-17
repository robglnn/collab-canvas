# CollabCanvas - Comprehensive Testing Guide

## 🎯 Purpose
This guide provides a systematic approach to testing all CollabCanvas features to ensure the MVP meets all requirements and handles edge cases properly.

---

## 🚀 Deployment Info
- **Production URL:** https://collab-canvas-d0e38.web.app
- **Firebase Console:** https://console.firebase.google.com/project/collab-canvas-d0e38/overview

---

## 📋 Pre-Testing Setup

### Required Resources:
- **3+ Google accounts** for multi-user testing
- **3+ browser windows** (Chrome, Firefox, Edge, or separate Chrome profiles)
- **Stable internet connection**
- **Desktop/laptop** (mobile not optimized in MVP)

### Setup Steps:
1. Open the deployed URL in 3+ browser windows
2. Sign in with different Google accounts in each window
3. Arrange windows side-by-side for easy observation
4. Open browser console (F12) in at least one window to monitor logs

---

## ✅ Test Checklist

### 1. Authentication & Initial Load

#### Test 1.1: Google Sign-In
- [ ] Purple gradient background fills entire screen
- [ ] Login card is centered
- [ ] Click "Sign in with Google"
- [ ] Google OAuth popup appears
- [ ] Successfully authenticate
- [ ] Redirected to canvas

**Expected:** Smooth auth flow, no errors

#### Test 1.2: Initial Spawn Position
- [ ] Canvas loads with user at center (2500, 2500)
- [ ] Zoom starts at 100%
- [ ] White 5000x5000 canvas visible
- [ ] Gray background visible around white canvas
- [ ] Debug panel shows correct metrics

**Expected:** Centered spawn, clear visual boundaries

#### Test 1.3: User Presence
- [ ] User list shows current user
- [ ] Profile photo displays
- [ ] Role shows "Owner" for first user, "Editor" for others
- [ ] Online count shows "1 user online"

**Expected:** Correct user info and count

---

### 2. Multi-User Collaboration

#### Test 2.1: Multiple Users Join
- [ ] Sign in with 2nd user in another window
- [ ] User appears in all windows' user lists
- [ ] Online count updates to "2 users online"
- [ ] Sign in with 3rd user
- [ ] Online count updates to "3 users online"

**Expected:** Real-time presence updates in all windows

#### Test 2.2: Cursor Synchronization
- [ ] Move mouse in Window 1
- [ ] Cursor appears in Windows 2 & 3 with username label
- [ ] Move mouse in Window 2
- [ ] Cursor appears in Windows 1 & 3
- [ ] Move mouse rapidly in all windows
- [ ] Cursors update smoothly (20 updates/sec)
- [ ] No ghost cursors appear

**Expected:** Smooth cursor sync, no lag, no duplicates

---

### 3. Shape Creation & Manipulation

#### Test 3.1: Create Shapes
- [ ] Click "Rectangle" button in toolbar
- [ ] Cursor changes to crosshair
- [ ] Click canvas to place rectangle
- [ ] Rectangle appears with random color
- [ ] Place mode auto-exits
- [ ] Shape appears in all windows within 100ms

**Expected:** Instant sync across all users

#### Test 3.2: Move Shapes
- [ ] Click shape to select (blue outline)
- [ ] Drag shape to new position
- [ ] Shape moves in all windows in real-time
- [ ] Other users see smooth movement

**Expected:** Real-time position sync

#### Test 3.3: Resize Shapes
- [ ] Select shape (8 handles appear: 4 corners + 4 middles)
- [ ] Drag corner handle → resize proportionally
- [ ] Drag middle handle → stretch/squash freely
- [ ] Resize syncs to all windows
- [ ] No jumpy or stuttering behavior

**Expected:** Smooth resize, real-time sync

#### Test 3.4: Rotate Shapes
- [ ] Select shape
- [ ] Rotation handle visible (circular icon above shape)
- [ ] Drag rotation handle
- [ ] Shape rotates 0-360°
- [ ] Rotation syncs to all windows in real-time
- [ ] No stuttering during rotation

**Expected:** Smooth rotation, instant sync

#### Test 3.5: Delete Shapes
- [ ] Right-click shape → context menu appears
- [ ] Click "Delete" → shape disappears in all windows
- [ ] Alternative: Select shape → press Delete key
- [ ] Shape removed from all windows

**Expected:** Shape deletion syncs immediately

---

### 4. Shape Locking Mechanism

#### Test 4.1: Basic Locking
- [ ] User 1 selects shape in Window 1
- [ ] Shape shows red border with "Locked by [User 1]" in Windows 2 & 3
- [ ] User 2 tries to select/move/resize locked shape
- [ ] Shape does not respond to User 2's actions

**Expected:** Lock prevents editing by other users

#### Test 4.2: Lock Release
- [ ] User 1 clicks empty canvas (deselect)
- [ ] Red border disappears in all windows
- [ ] User 2 can now select and edit the shape

**Expected:** Lock released on deselection

#### Test 4.3: Owner Override
- [ ] Owner (User 1) in Window 1
- [ ] Editor (User 2) selects shape in Window 2 (locks it)
- [ ] Owner right-clicks the locked shape in Window 1
- [ ] Context menu shows "Override Control"
- [ ] Owner clicks "Override Control"
- [ ] Owner gains control, User 2 loses lock
- [ ] Shape shows "Locked by [Owner]" in Window 2

**Expected:** Owner can force take control

#### Test 4.4: Lock Cleanup on Disconnect
- [ ] User 2 selects shape (locks it)
- [ ] Close Window 2 without signing out
- [ ] Wait 5 seconds (lock cleanup interval)
- [ ] Shape unlocks in Window 1
- [ ] User 1 can now edit the shape

**Expected:** Stale locks auto-released after 5 seconds

---

### 5. Canvas Navigation

#### Test 5.1: Pan (Drag)
- [ ] Click and drag empty canvas area
- [ ] Canvas pans smoothly
- [ ] All shapes move together
- [ ] Cannot pan beyond canvas boundaries
- [ ] At max pan, gray background visible

**Expected:** Smooth pan, boundary enforcement

#### Test 5.2: Zoom (Scroll Wheel)
- [ ] Scroll wheel up → zoom in
- [ ] Scroll wheel down → zoom out
- [ ] Zoom centers on cursor position (not 0,0)
- [ ] Zoom is smooth (1.05 scale factor)
- [ ] No stuttering or jumping
- [ ] Debug panel shows zoom % updating

**Expected:** Smooth cursor-centered zoom

#### Test 5.3: Combined Pan & Zoom
- [ ] Zoom in to 200%
- [ ] Pan around canvas
- [ ] Zoom out to 50%
- [ ] Pan around canvas
- [ ] Zoom feels centered on cursor at all times

**Expected:** Intuitive navigation

---

### 6. Owner Controls

#### Test 6.1: Kick User
- [ ] Owner (Window 1) opens user list
- [ ] Click "Kick" button next to Editor (User 2)
- [ ] User 2 sees "You have been removed" banner in Window 2
- [ ] Wait 3 seconds
- [ ] User 2 auto-signed out in Window 2
- [ ] User list in Window 1 shows "2 users online"
- [ ] User 2's cursor disappears from Window 1
- [ ] Shapes remain on canvas

**Expected:** Clean kick flow, shapes persist

#### Test 6.2: Kicked User Rejoins
- [ ] User 2 signs back in in Window 2
- [ ] User rejoins successfully
- [ ] User list shows "3 users online" again
- [ ] User 2 has "Editor" role (not banned)

**Expected:** Can rejoin after being kicked

---

### 7. Presence & Cursor Cleanup

#### Test 7.1: Sign Out
- [ ] User 2 clicks "Sign Out" in Window 2
- [ ] User list updates to "2 users online" in Windows 1 & 3
- [ ] User 2's cursor disappears immediately
- [ ] Any shapes locked by User 2 are unlocked

**Expected:** Clean signout, no ghost data

#### Test 7.2: Close Browser Without Signout
- [ ] User 3 closes browser tab/window without signing out
- [ ] Wait 2 seconds (cursor cleanup delay)
- [ ] User list updates to "2 users online" in Windows 1 & 2
- [ ] User 3's cursor disappears
- [ ] Any shapes locked by User 3 are unlocked after 5 seconds

**Expected:** Presence and cursor cleanup work

#### Test 7.3: Ghost Cursor Prevention
- [ ] Perform Test 7.2 above
- [ ] Refresh Window 1
- [ ] After refresh, only see cursors for online users
- [ ] No frozen ghost cursors visible

**Expected:** No persistent ghost cursors

---

### 8. State Persistence

#### Test 8.1: Refresh Page
- [ ] Create 5+ shapes with different colors, sizes, rotations
- [ ] Move some shapes around
- [ ] Refresh browser (F5 or Ctrl+R)
- [ ] All shapes persist with exact positions/sizes/rotations
- [ ] Zoom and pan position reset to center

**Expected:** All data survives refresh

#### Test 8.2: Sign Out & Sign In
- [ ] User 1 signs out
- [ ] User 1 signs back in
- [ ] All shapes still visible
- [ ] Canvas state unchanged

**Expected:** Data persists across sessions

---

### 9. Disconnection Handling

#### Test 9.1: Network Disconnect
- [ ] Open DevTools (F12) → Network tab
- [ ] Set throttling to "Offline"
- [ ] Wait 3 seconds
- [ ] "Disconnected from server" banner appears
- [ ] Banner says "Please refresh the page to reconnect"
- [ ] Click refresh or press F5
- [ ] Canvas reloads with all shapes intact

**Expected:** Clear disconnection feedback

#### Test 9.2: Network Reconnect
- [ ] Disconnect network as above
- [ ] See disconnect banner
- [ ] Set throttling back to "Online"
- [ ] Refresh page
- [ ] Canvas loads normally

**Expected:** Graceful reconnection

---

### 10. Performance Testing

#### Test 10.1: Many Shapes
- [ ] Create 20+ shapes on canvas
- [ ] Move, resize, rotate shapes
- [ ] Pan and zoom around canvas
- [ ] Verify smooth 60 FPS (no lag)

**Expected:** Smooth performance with 20+ shapes

#### Test 10.2: Rapid Actions
- [ ] Rapidly create 10 shapes (click, click, click...)
- [ ] All shapes sync to other windows
- [ ] Rapidly move a shape back and forth
- [ ] Movement syncs smoothly

**Expected:** No lag or race conditions

#### Test 10.3: Simultaneous Editing
- [ ] User 1 creates shape in one area
- [ ] User 2 creates shape in another area
- [ ] User 3 moves an existing shape
- [ ] All actions sync correctly in all windows
- [ ] No conflicts or data loss

**Expected:** Concurrent editing works

---

### 11. Edge Cases

#### Test 11.1: Boundary Testing
- [ ] Pan to top-left corner (0, 0)
- [ ] Try to pan further → blocked
- [ ] Pan to bottom-right corner (5000, 5000)
- [ ] Try to pan further → blocked

**Expected:** Cannot pan beyond canvas

#### Test 11.2: Extreme Zoom
- [ ] Zoom in to maximum (scroll up many times)
- [ ] Canvas still responsive
- [ ] Zoom out to minimum (scroll down many times)
- [ ] Canvas still responsive

**Expected:** No crash at zoom extremes

#### Test 11.3: Lock Race Condition
- [ ] Two users try to select the same shape simultaneously
- [ ] First user to click gets the lock
- [ ] Second user sees lock message
- [ ] No shape corruption

**Expected:** Clean lock handling

#### Test 11.4: Rapid Sign In/Out
- [ ] User signs out
- [ ] User signs back in immediately
- [ ] Repeat 3x
- [ ] No duplicate presence entries
- [ ] User count accurate

**Expected:** Presence system stable

---

### 12. Debug Panel Verification

#### Test 12.1: Metrics Accuracy
- [ ] Check "Zoom" → matches visual zoom level
- [ ] Check "Canvas Center" → updates when panning
- [ ] Move mouse → "Cursor" shows canvas coordinates
- [ ] Check "Stage Offset" → updates when panning
- [ ] Check "Canvas" → shows 5000 x 5000
- [ ] Check "Shapes | Cursors" → matches actual count
- [ ] Check "Role" → shows "Owner" or "Editor"

**Expected:** All metrics accurate

---

### 13. UI/UX Polish

#### Test 13.1: Visual Feedback
- [ ] Selected shape has blue outline
- [ ] Locked shape has red border with owner name
- [ ] Hover over toolbar button → visual feedback
- [ ] Context menu appears on right-click
- [ ] All text is readable and properly sized

**Expected:** Clear visual indicators

#### Test 13.2: Error Handling
- [ ] (Simulated) Try to edit when Firestore write fails
- [ ] Check console for error messages
- [ ] UI should rollback gracefully

**Expected:** Graceful error handling

---

## 🐛 Known Issues to Verify Fixed

### PR11 Fixes:
- [x] Stuttery zoom → should be smooth and cursor-centered
- [x] User count incorrect after signout → should update immediately
- [x] Ghost cursors after disconnect → should be cleaned up
- [x] Stale locks after disconnect → should be released after 5 seconds
- [x] Auth page sizing → should fill screen with centered card

---

## 📊 Test Results Template

### Test Session Info:
- **Date:** ____________
- **Tester:** ____________
- **Number of Users:** ____________
- **Browsers Used:** ____________

### Summary:
- **Total Tests:** 50+
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___

### Issues Found:
1. **Issue:** ____________________________________
   - **Severity:** Critical / High / Medium / Low
   - **Steps to Reproduce:** __________________________
   - **Expected:** ___________________________________
   - **Actual:** _____________________________________

---

## 🎯 Success Criteria

**All 18 MVP Requirements:**
- ✅ Google OAuth authentication
- ✅ 5000x5000px canvas with pan/zoom
- ✅ Rectangle creation with toolbar
- ✅ Random shape colors
- ✅ Move, resize, rotate shapes
- ✅ Delete shapes (right-click or Delete key)
- ✅ Real-time sync (<100ms latency)
- ✅ Multi-user cursor sync
- ✅ User presence list
- ✅ Owner controls (kick users)
- ✅ Shape locking (owner priority)
- ✅ Override control (right-click)
- ✅ Disconnect banner (3 seconds)
- ✅ Optimistic updates
- ✅ State persistence
- ✅ Canvas boundaries
- ✅ Deployed to Firebase Hosting
- ✅ Publicly accessible

**MVP Complete when:**
- All 50+ test cases pass
- No critical bugs
- Performance is smooth (60 FPS with 20+ shapes)
- Multi-user collaboration works flawlessly
- All cleanup mechanisms functioning (presence, cursors, locks)

---

## 📞 Next Steps After Testing

1. **Document any bugs** found during testing
2. **Create GitHub issues** for critical bugs
3. **Prioritize fixes** based on severity
4. **Retest** after fixes
5. **Consider additional features** beyond MVP
6. **Record demo video** showing all features

---

**Happy Testing! 🚀**


