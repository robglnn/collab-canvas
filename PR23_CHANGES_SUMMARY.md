# PR #23 Comments System - Changes Summary

## Updates Made (October 19, 2025)

### Character Limit: 200 → 100
- Changed from 200 characters to **100 characters** max per comment
- Character counter updated to show remaining out of 100
- Updated in all documentation files

### Deletion with Undo Support Added
Previously: Simple soft delete with `deleted: true` flag  
**Now:** Two-stage deletion with undo rescue capability

**New Deletion Flow:**
1. **First Delete:** User clicks delete → Confirmation → Soft delete (`deleted: true`)
   - Comment disappears from UI
   - Still in database with `deleted: true`
   - Can be rescued with **Ctrl+Z** (undo)
   
2. **Undo Rescue:** User presses Ctrl+Z
   - Comment restored (`deleted: false`)
   - Reappears in UI for all users
   - Undo action tracked in history
   
3. **Permanent Delete:** 
   - User deletes same comment again, OR
   - Undo history is cleared (10+ actions later)
   - Comment permanently deleted from Firestore database
   - Cannot be recovered

**Database Schema Update:**
Added `permanentlyDeleted: boolean` field to track permanent deletion state.

---

## Files Updated

### 1. tasks.md (PR #23 Section)
- ✅ Changed character limit from 200 to 100 in all mentions
- ✅ Updated Task 23.5: Add Comment (100 char limit)
- ✅ Renamed Task 23.7: "Implement Delete Comment with Undo Support"
- ✅ Added undo integration details to Task 23.7
- ✅ Added `src/hooks/useHistory.js` modification for comment deletion
- ✅ Updated Task 23.9: Added `permanentlyDeleted` field to schema
- ✅ Updated Task 23.10: Added undo rescue edge cases
- ✅ Updated Task 23.12: Added undo/redo testing requirements

### 2. PRD.md
- ✅ Updated Shape Comments feature description: 100 char limit
- ✅ Added "Delete with undo support" to feature list
- ✅ Updated comment data model with `permanentlyDeleted` field
- ✅ Changed `deleted` field comment to clarify "can be undone once"

### 3. PR23_SPECIFICATION.md
- ✅ Updated User Experience Flow: Added undo support details
- ✅ Updated Technical Specification: 100 char limit
- ✅ Updated Data Model: Added `permanentlyDeleted` field
- ✅ Added new section: "Undo/Redo Integration" with detailed flow
- ✅ Updated useComments hook: `deleteComment` now has `firstDelete` parameter
- ✅ Updated Input Validation: 100 character enforcement
- ✅ Added "Deletion & Undo" section to Edge Cases
- ✅ Added `src/hooks/useHistory.js` to Files to Modify
- ✅ Updated Testing Checklist: Added undo/redo test cases
- ✅ Updated Questions & Clarifications: 100 chars + undo support

### 4. README.md
- ✅ Updated In Development section: Clear description with 100 char limit and undo support

### 5. architecture.md
- ✅ Already updated with comments collection (no changes needed for character limit)

---

## Key Implementation Details

### Undo/Redo Integration

**In useHistory.js:**
```javascript
// New action type: 'deleteComment'
{
  type: 'deleteComment',
  commentId: string,
  commentData: object, // Full comment object for restoration
  timestamp: Date.now()
}
```

**In useComments.js:**
```javascript
deleteComment: async (commentId, firstDelete = true) => {
  if (firstDelete) {
    // Soft delete - can be undone
    await updateDoc(commentRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    });
    
    // Add to undo history
    saveToHistory('deleteComment', { commentId, commentData: fullComment });
  } else {
    // Permanent delete
    await updateDoc(commentRef, {
      permanentlyDeleted: true
    });
    // Or: await deleteDoc(commentRef); // Remove completely
  }
}
```

**Undo Logic:**
```javascript
// When user presses Ctrl+Z and last action is 'deleteComment'
const restoreComment = async (commentId) => {
  await updateDoc(commentRef, {
    deleted: false,
    deletedAt: null
  });
  // Comment reappears for all users
}
```

### Database Query Filters

**Old Filter:**
```javascript
where('shapeId', '==', shapeId)
where('deleted', '==', false)
```

**New Filter:**
```javascript
where('shapeId', '==', shapeId)
where('deleted', '==', false)
where('permanentlyDeleted', '==', false)  // NEW
```

---

## Testing Requirements Added

### New Test Cases:
1. ✅ Delete comment → Press Ctrl+Z → Verify comment restored
2. ✅ Delete comment → Undo → Delete again → Verify permanent deletion
3. ✅ Delete comment → Perform 10+ actions → Cannot undo anymore
4. ✅ Multi-user: User A deletes → User B sees disappear → User A undoes → User B sees reappear

---

## Questions Answered

**Q1: What's the character limit?**  
✅ **100 characters** (down from initial 200)

**Q2: Can deleted comments be recovered?**  
✅ **Yes, once!** Press Ctrl+Z immediately after deletion to rescue. After second deletion or undo history clear, permanently deleted.

**Q3: How does undo work for comments?**  
✅ Integrates with existing undo/redo system (PR #21). Comment deletion is tracked as an action in the undo history. Works exactly like shape deletion undo.

**Q4: What happens to permanently deleted comments?**  
✅ Either:
- Set `permanentlyDeleted: true` and clean up later via scheduled job, OR
- Immediately delete document from Firestore using `deleteDoc()`

*Recommendation: Immediate deletion for simplicity.*

---

## Ready to Implement

All documentation is now complete and consistent:
- ✅ Character limit: 100 characters
- ✅ Deletion flow: Soft delete → Undo rescue → Permanent delete
- ✅ Database schema updated
- ✅ Integration with existing undo/redo system
- ✅ Comprehensive test cases defined

**Next Step:** Begin implementation following `tasks.md` PR #23 (12 tasks, estimated 4-6 hours)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Implementation ✅

