# PR #23: Shape Comments System - Specification

**Branch:** `feature/comments`  
**Goal:** Add shape-specific comments accessible via right-click context menu

---

## Overview

The Comments System allows users to add, view, edit, and delete comments on any shape (rectangle, circle, text, line) in the canvas. Comments are accessed through a submenu that opens when users right-click a shape and select "Comments" from the context menu.

---

## User Experience Flow

1. **Access Comments:**
   - User right-clicks on any shape (rect, circle, text, line)
   - Context menu opens with existing options (Copy, Duplicate, etc.)
   - New "Comments 💬" option appears in the menu
   - Click "Comments" to open the comments submenu

2. **View Comments:**
   - Submenu displays to the right (or left if no space) of context menu
   - Shows list of all comments on that specific shape
   - Each comment shows:
     - User initials (first letter of first + last name)
     - Timestamp: "YY Month Day hh:mm:ss" format (24-hour time)
     - Comment text (up to 100 characters)
     - Edit icon (✏️) and Delete icon (🗑️)
   - Empty state: "No comments yet" if no comments exist

3. **Add New Comment:**
   - Text input box at bottom of submenu
   - Character counter shows remaining characters (100 max)
   - Type comment and click green checkmark ✓ to submit
   - Comment appears immediately for all users (real-time)

4. **Edit Comment:**
   - Click edit icon (✏️) next to any comment
   - Text transforms into editable textarea
   - Green checkmark ✓ to save, red X ✗ to cancel
   - Edited comments show "(edited)" indicator
   - Real-time update visible to all users

5. **Delete Comment:**
   - Click delete icon (🗑️) next to comment
   - Confirmation prompt: "Delete this comment?"
   - On confirm, comment is soft-deleted (not shown in UI)
   - Deletion is immediate and visible to all users
   - **Undo Support:** Press Ctrl+Z to rescue deleted comment (works once)
   - After second deletion or undo history clear, comment is permanently deleted from database

---

## Technical Specification

### Data Model

**Firestore Collection:** `/canvases/main/comments/{commentId}`

```javascript
{
  id: string,                    // Auto-generated UUID
  shapeId: string,               // ID of shape this comment belongs to
  text: string,                  // Comment text (max 100 chars)
  userId: string,                // User who created the comment
  userName: string,              // User's display name
  userInitials: string,          // Extracted initials (e.g., "JD")
  createdAt: timestamp,          // When comment was created
  updatedAt: timestamp,          // When comment was last edited
  deleted: boolean,              // Soft delete flag (can be undone once)
  deletedAt: timestamp | null,   // When comment was deleted
  permanentlyDeleted: boolean    // True after undo window expires
}
```

### Firestore Indexes

Composite index required:
- Collection: `comments`
- Fields: `shapeId` (Ascending) + `deleted` (Ascending) + `createdAt` (Descending)

### Security Rules

```javascript
match /canvases/{canvasId}/comments/{commentId} {
  // Authenticated users can read non-deleted comments
  allow read: if request.auth != null && resource.data.deleted == false;
  
  // Authenticated users can create comments
  allow create: if request.auth != null 
    && request.resource.data.userId == request.auth.uid;
  
  // Users can update/delete their own comments
  allow update, delete: if request.auth != null 
    && resource.data.userId == request.auth.uid;
}
```

### Real-Time Sync

- Use `onSnapshot()` listener filtered by `shapeId` and `deleted == false` and `permanentlyDeleted == false`
- Comments appear instantly for all users when added/edited/deleted
- Optimistic updates for local user (immediate feedback)
- Automatic rollback if Firestore write fails

### Undo/Redo Integration

- Comment deletion tracked in undo history as "Delete Comment" action
- First deletion: Set `deleted: true`, keep in database, can be rescued with Ctrl+Z
- Undo restores comment: Set `deleted: false`, comment reappears
- Second deletion or undo history clear: Set `permanentlyDeleted: true`, remove from Firestore
- Permanent deletion cleanup can happen immediately or via scheduled job

---

## UI Components

### 1. CommentsSubmenu Component

**Location:** `src/components/CommentsSubmenu.jsx`

**Props:**
```javascript
{
  shapeId: string,           // Shape to show comments for
  x: number,                 // X position of parent context menu
  y: number,                 // Y position of parent context menu
  onClose: function          // Callback to close submenu
}
```

**Features:**
- Positioned to right of context menu (or left if no space)
- Scrollable comment list (max height: 400px)
- Text input with character counter
- Real-time comment updates
- Edit/delete functionality per comment

### 2. ContextMenu Component Updates

**Location:** `src/components/ContextMenu.jsx`

**Changes:**
- Add "Comments 💬" menu item after Duplicate
- On click, set state to show CommentsSubmenu
- Pass shapeId to submenu
- Keep context menu open when submenu is active

### 3. useComments Hook

**Location:** `src/hooks/useComments.js`

**Functions:**
```javascript
{
  comments: array,                           // Array of comments for shape
  loading: boolean,                          // Loading state
  addComment: async (shapeId, text),        // Add new comment
  updateComment: async (commentId, text),   // Edit comment
  deleteComment: async (commentId, firstDelete), // Soft or permanent delete
  // firstDelete = true: soft delete (can undo)
  // firstDelete = false: permanent delete
}
```

---

## Timestamp Format

**Display Format:** "YY Month Day hh:mm:ss"

**Examples:**
- `24 Oct 19 14:32:15`
- `25 Jan 05 09:05:48`
- `24 Dec 31 23:59:59`

**Implementation:**
```javascript
function formatTimestamp(timestamp) {
  const date = timestamp.toDate(); // Firestore timestamp
  const year = String(date.getFullYear()).slice(-2);
  const month = date.toLocaleString('en', { month: 'short' });
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year} ${month} ${day} ${hours}:${minutes}:${seconds}`;
}
```

---

## User Initials Extraction

**Format:** First letter of first name + first letter of last name

**Examples:**
- "John Doe" → "JD"
- "Alice" → "A"
- "Bob Smith Jones" → "BS" (first + second word)
- "" → "?" (fallback)

**Implementation:**
```javascript
function extractInitials(userName) {
  if (!userName) return '?';
  const words = userName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
```

---

## Edge Cases & Validation

### Input Validation
- ✅ Max 100 characters enforced in UI and backend
- ✅ Empty comments are rejected
- ✅ Trim whitespace before submission
- ✅ Show character counter (100 - current length)

### Multi-User Scenarios
- ✅ Real-time updates: New comments appear instantly
- ✅ Edit conflicts: Show error if comment deleted while editing
- ✅ Multiple users editing same shape: All comments visible

### Positioning
- ✅ Submenu opens to right of context menu
- ✅ If no space on right, open to left
- ✅ Adjust vertical position to stay in viewport
- ✅ Handle edge of screen gracefully

### Empty States
- ✅ "No comments yet" when no comments exist
- ✅ Encourage users to add first comment

### Performance
- ✅ Filter by shapeId to avoid loading all comments
- ✅ Only load non-deleted and non-permanently-deleted comments
- ✅ Pagination if more than 50 comments (future enhancement)

### Deletion & Undo
- ✅ First deletion: Soft delete, can be rescued with Ctrl+Z
- ✅ Undo restores comment exactly as it was
- ✅ Second deletion or undo clear: Permanent deletion from database
- ✅ Track deletion state in undo history
- ✅ Cleanup permanently deleted comments immediately

---

## Files to Create

1. `src/hooks/useComments.js` - Comments hook with Firestore integration
2. `src/components/CommentsSubmenu.jsx` - Comments submenu component
3. `src/components/CommentsSubmenu.css` - Submenu styling

## Files to Modify

1. `src/components/ContextMenu.jsx` - Add Comments menu item
2. `src/components/ContextMenu.css` - Add submenu styling
3. `src/lib/canvasUtils.js` - Add timestamp and initials helper functions
4. `src/hooks/useHistory.js` - Add comment deletion to undo/redo system
5. `firestore.rules` - Add comments security rules
6. `firestore.indexes.json` - Add composite index for comments

---

## Testing Checklist

### Basic Functionality
- [ ] Right-click shape opens context menu with Comments option
- [ ] Click Comments opens submenu with correct positioning
- [ ] Add comment with text and green checkmark
- [ ] Comment appears in list with correct initials and timestamp
- [ ] Character counter decreases as you type
- [ ] Cannot submit empty comment
- [ ] Cannot submit comment over 100 characters

### Edit/Delete
- [ ] Click edit icon enters edit mode
- [ ] Edit comment and save with checkmark
- [ ] Cancel edit with X button reverts changes
- [ ] Edited comment shows "(edited)" indicator
- [ ] Click delete icon shows confirmation
- [ ] Confirm delete removes comment from list (soft delete)
- [ ] Cancel delete keeps comment
- [ ] Press Ctrl+Z to restore deleted comment
- [ ] Delete same comment again permanently removes from database
- [ ] Cannot undo after undo history is cleared

### Multi-User Testing
- [ ] Open 2 browser windows with different users
- [ ] Add comment in window 1, appears in window 2 instantly
- [ ] Edit comment in window 1, updates in window 2
- [ ] Delete comment in window 1, disappears in window 2
- [ ] Both users can comment on same shape

### Different Shape Types
- [ ] Test on rectangle shape
- [ ] Test on circle shape
- [ ] Test on text shape
- [ ] Test on line shape

### Edge Cases
- [ ] Test with very long comment (100 chars)
- [ ] Test with single word username (initials work)
- [ ] Test submenu positioning at screen edges
- [ ] Test with many comments (scrolling works)
- [ ] Test rapid add/edit/delete operations
- [ ] Test deleting comment, undoing, then deleting again (permanent)
- [ ] Test deleting comment, performing 10+ other actions, cannot undo
- [ ] Test multi-user: User A deletes, User B sees it disappear, User A undoes, User B sees it reappear

### Visual/UX
- [ ] Submenu matches context menu styling
- [ ] Hover effects on icons work correctly
- [ ] Transitions are smooth
- [ ] Character counter is visible and accurate
- [ ] Timestamps are formatted correctly

---

## Implementation Order (from tasks.md)

1. **23.1:** Create Comments Hook
2. **23.2:** Create Comments Submenu Component
3. **23.3:** Update Context Menu with Comments Option
4. **23.4:** Implement Submenu Positioning Logic
5. **23.5:** Implement Add Comment
6. **23.6:** Implement Edit Comment
7. **23.7:** Implement Delete Comment
8. **23.8:** Format Timestamps and Initials
9. **23.9:** Create Comments Firestore Collection
10. **23.10:** Handle Edge Cases
11. **23.11:** Style Comments Submenu
12. **23.12:** Test Comments System

---

## Questions & Clarifications

**Answered:**
- ✅ Character limit: 100 characters
- ✅ Timestamp format: "YY Month Day hh:mm:ss"
- ✅ Access method: Right-click context menu → "Comments" → submenu
- ✅ User initials: First letter of first + last name
- ✅ Edit/delete: Icons next to each comment
- ✅ Submit: Green checkmark button
- ✅ Delete with undo: Ctrl+Z rescues once, second delete is permanent

**For future consideration:**
- Should there be a notification when someone comments on a shape you created?
- Should comments support @mentions?
- Should there be a comment count indicator on shapes?
- Should comments be exportable/printable?

---

**Total Estimated Time:** 4-6 hours

**Priority:** Medium (enhances collaboration but not core to canvas functionality)

**Dependencies:** None (can be implemented independently)

