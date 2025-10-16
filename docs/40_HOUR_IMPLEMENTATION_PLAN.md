# CollabCanvas 40-Hour Implementation Plan
## Goal: Score 90+ on Grading Rubric

---

## 📊 Rubric Score Projection: 97/100 (A Grade)

### Score Breakdown:
- **Section 1:** Core Infrastructure (PRs 1-12) → **29/30 pts** ✓
- **Section 2:** Canvas Features & Performance → **19/20 pts**
- **Section 3:** Advanced Figma Features → **12/15 pts** (Good)
- **Section 4:** AI Canvas Agent → **24/25 pts** ✓
- **Section 5:** Technical Implementation → **9/10 pts** ✓
- **Section 6:** Documentation & Deployment → **4/5 pts** ✓
- **Bonus:** Polish & Performance → **+0-2 pts**

**Total: 97-99 points = A Grade**

---

## 🎯 Implementation Schedule (40 Hours)

### **Week 1: Essential Features (21 hours)**

#### Day 1-2 (10 hours)
**PR #18: Multi-Select with Selection Box** (5 hours)
- Change selection state from single ID to array
- Implement drag-to-select box (blue dashed rectangle)
- Detect shapes within selection bounds
- Multi-shape movement (move all selected together)
- Multi-shape color change
- Multi-shape deletion
- **Test:** 2+ browsers, select & move multiple shapes
- **Rubric Impact:** +3 pts (Tier 2 feature)

**PR #15: Circle Tool** (2 hours)
- Add Circle button to toolbar
- Click-to-place circle (100px diameter)
- Use selected color for fill
- Render with Konva Circle component
- Lock aspect ratio on resize (keepRatio=true)
- **Test:** Create, move, resize circles
- **Rubric Impact:** Canvas functionality (3+ shape types)

**PR #17: Text Tool (Basic)** (2 hours)
- Add Text button to toolbar
- Click to show text prompt
- Place text at cursor position
- Basic properties only: text content, fontSize (16px), fill color
- Skip fonts, bold, underline (save time)
- Double-click to edit text
- **Test:** Create, move, edit text
- **Rubric Impact:** Canvas functionality (text support)

**PR #18.5: Resize & Rotate Transforms** (1 hour)
- Add Konva Transformer to selected shapes
- Enable resize handles (corner + edge)
- Enable rotation handle (top center)
- Update shape dimensions in Firestore on transform
- **Test:** Resize and rotate all 3 shape types
- **Rubric Impact:** +2 pts (Transform operations → 8/8 pts in Canvas Functionality)

---

#### Day 3-4 (10 hours)
**PR #20: Arrow Key Movement** (1 hour)
- Listen for ArrowUp/Down/Left/Right keys
- Move selected shape(s) 1px in direction
- Prevent page scrolling (preventDefault)
- **Test:** Select shape, use arrow keys
- **Rubric Impact:** +2 pts (Tier 1 keyboard shortcuts)

**PR #19: Copy/Paste Shapes** (2 hours)
- Add clipboard state for copied shapes
- Right-click context menu: "Copy" option
- Right-click canvas: "Paste" option
- Keyboard shortcuts: Ctrl+C / Ctrl+V
- Paste with 10px offset
- Support multi-shape copy/paste
- **Test:** Copy single & multiple shapes
- **Rubric Impact:** Better UX (doesn't add rubric points but improves polish)

**PR #21: Undo/Redo System** (7 hours)
- Create useUndoRedo hook
- Track undo stack (max 10 snapshots)
- Track redo stack (clear on new action)
- Save canvas snapshot before each modification
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
- Banner when undo limit reached (10 steps)
- Firestore batch updates on undo/redo
- **Test:** Undo create, move, delete, color change
- **Rubric Impact:** +2 pts (Tier 1 feature - critical!)

---

### **Week 2: AI Canvas Agent (19 hours)**

#### Day 5-6 (10 hours)
**PR #26: Core AI Infrastructure** (8 hours)
- **Task 26.1:** OpenAI Configuration (1 hour)
  - Install `npm install openai`
  - Add VITE_OPENAI_API_KEY to `.env.local`
  - Create `src/lib/openai.js` with API client
  - Test basic API call

- **Task 26.2:** AI Command Bar Component (1.5 hours)
  - Build collapsible UI above Rectangle tool
  - Input with 200 char limit + counter
  - Submit button with states (blue → loading → green ✓)
  - `src/components/AICommandBar.jsx` + CSS

- **Task 26.3:** AI Banner Component (0.5 hours)
  - Error/warning/info/success banner
  - Auto-hide after 3 seconds
  - `src/components/AIBanner.jsx` + CSS

- **Task 26.4-26.5:** Function Schemas & Executor (2.5 hours)
  - Define OpenAI function schemas in `src/lib/aiTools.js`
  - Support: createShape (rectangle, circle, text), moveShape, resizeShape, rotateShape, changeShapeColor, deleteShape
  - Support: selectShapesByProperty, deselectAll
  - Support: arrangeHorizontal, arrangeVertical, arrangeGrid, alignShapes
  - Implement executors in `src/lib/aiExecutor.js`
  - Add permission checks (respect shape locks)

- **Task 26.6-26.7:** AI Hook & Integration (2 hours)
  - Create `src/hooks/useAI.js`
  - Build context (shapes, viewport, selectedShapeIds)
  - Send to OpenAI, parse function calls
  - Execute via aiExecutor
  - Connect to AICommandBar

- **Task 26.8-26.9:** Attribution & Testing (0.5 hours)
  - Add AI attribution fields to shapes
  - Test basic commands (create, move, color)

---

#### Day 7-8 (9 hours)
**PR #27: Advanced Commands & Layouts** (5 hours)
- **Task 27.1-27.4:** Layout Operations (2 hours)
  - Implement arrangeHorizontal/arrangeVertical
  - Implement arrangeGrid (rows × cols)
  - Implement alignShapes (6 types: left, right, top, bottom, center-h, center-v)
  - Test: "Arrange in a row", "Create 3x3 grid", "Align left"

- **Task 27.5:** Query Commands (0.5 hours)
  - getCanvasInfo (count, colors, types, summary)
  - Test: "How many shapes?", "What colors?"

- **Task 27.6:** Complex Command Templates (2 hours)
  - **Template 1:** Login Form (username + password + submit = 6 shapes)
  - **Template 2:** Nav Bar (background + 4 menu items = 5 shapes)
  - Test: "Create a login form", "Build a nav bar with 4 items"

- **Task 27.7-27.8:** Polish & Testing (0.5 hours)
  - Improve AI system prompt
  - Test all command types

**PR #28: Queue System & Multi-User** (4 hours)
- **Task 28.1-28.2:** Firestore Setup (0.5 hours)
  - Create `/canvases/main/aiCommands/` collection
  - Create `/canvases/main/aiRateLimits/` collection
  - Update Firestore security rules

- **Task 28.3:** Rate Limiting Hook (1.5 hours)
  - Create `src/hooks/useAIRateLimit.js`
  - Check user limit (1 per 5 seconds)
  - Check canvas limit (300 per minute)
  - Cooldown timer in UI

- **Task 28.4:** Queue Hook (1.5 hours)
  - Create `src/hooks/useAIQueue.js`
  - FIFO queue (max 10 pending)
  - 2-second timeout per command
  - Process in order

- **Task 28.5-28.8:** Integration & Testing (0.5 hours)
  - Connect rate limiting to command bar
  - Integrate queue with AI execution
  - Test with 2+ users submitting commands

**PR #29: Polish & Integration** (2 hours)
- **Task 29.1:** Undo/Redo Integration (1 hour)
  - Save canvas snapshot before AI command
  - Add AI commands to undo stack
  - Test: AI creates shapes → Ctrl+Z undoes all

- **Task 29.2:** Performance Optimization (0.5 hours)
  - Optimize OpenAI prompt (reduce tokens)
  - Use GPT-4-turbo
  - Temperature 0.2 for consistency

- **Task 29.3-29.10:** Error Handling & Testing (0.5 hours)
  - Improve error messages
  - Final multi-user testing
  - Verify all 6 command types work
  - Performance check (<2 second responses)

---

## 🎯 Feature Checklist for Rubric

### Section 2: Canvas Features (19/20 pts)
- ✅ Rectangle, Circle, Text (3+ shape types)
- ✅ Multi-select (drag-to-select)
- ✅ Transforms: Move, Resize, Rotate
- ✅ Text with basic formatting
- ✅ Layer management (via selection)
- ✅ Delete functionality
- ✅ Performance: 500+ objects at 60 FPS
- ✅ Supports 5+ concurrent users

### Section 3: Advanced Figma Features (12/15 pts)
**Tier 1 Features (6 pts):**
1. ✅ Undo/redo with Ctrl+Z/Ctrl+Shift+Z (PR21) - 2 pts
2. ✅ Keyboard shortcuts: Delete, Arrow keys (PR20) - 2 pts
3. ✅ Copy/paste: Ctrl+C/Ctrl+V (PR19) - 2 pts
**Max Tier 1: 6 pts** ✓

**Tier 2 Features (6 pts):**
1. ✅ Multi-select: Drag-to-select, lasso (PR18) - 3 pts
2. ✅ Alignment tools: Align, distribute (PR27) - 3 pts
**Max Tier 2: 6 pts** ✓

**Total: 12 pts = "Good"**
(Need 13-15 for "Excellent" - would require 1 Tier 3 feature)

### Section 4: AI Canvas Agent (24/25 pts)
**Command Types (10 pts):**
1. ✅ Creation: "Create red circle at 100, 200"
2. ✅ Manipulation: "Move blue rectangle to center"
3. ✅ Layout: "Arrange in a horizontal row"
4. ✅ Selection: "Select all red shapes"
5. ✅ Complex: "Create a login form"
6. ✅ Query: "How many shapes are there?"

**Complex Commands (8 pts):**
- ✅ Login form (6 shapes, properly arranged)
- ✅ Nav bar (5 shapes, menu items)

**Performance (7 pts):**
- ✅ <2 second responses
- ✅ 90%+ accuracy
- ✅ Natural UX with feedback
- ✅ Multi-user AI works
- ✅ Queue system prevents conflicts

---

## 🚨 Critical Success Factors

### Must Hit These Targets:
1. **Performance:** <2s AI responses, <100ms object sync, 60 FPS
2. **Multi-User:** 5+ users simultaneously without degradation
3. **AI Commands:** All 6 types working reliably
4. **Complex Commands:** Login form + Nav bar both work well
5. **Undo/Redo:** Works for both manual and AI operations

### Testing Requirements:
- **Continuous:** Test after each PR (2+ browsers)
- **Performance:** Measure latency, FPS with 50+ shapes
- **Multi-User:** Test with 3-5 simultaneous users
- **AI:** Test all 6 command types thoroughly
- **Edge Cases:** Locked shapes, rate limits, timeouts

---

## 📝 Documentation Requirements

### README.md Updates:
- Setup instructions (OpenAI API key)
- All supported AI commands with examples
- Architecture overview
- Deployment guide
- Multi-user testing instructions

### AI Development Log (Required for Pass):
Include 3 of 5 sections:
1. ✅ Tools & Workflow (Cursor + Claude Sonnet)
2. ✅ Prompting Strategies (3-5 examples)
3. ✅ Code Analysis (% AI-generated)
4. ✅ Strengths & Limitations
5. ✅ Key Learnings

### Demo Video (Required):
- 3-5 minutes
- Show 2+ users collaborating (both screens)
- Demonstrate all 6 AI command types
- Show complex commands (login form, nav bar)
- Architecture explanation
- Clear audio/video

---

## ⚡ Time-Saving Strategies

### PR #17 (Text Tool) - Simplified:
- ❌ Skip: Font selection, bold, underline, text decoration
- ✅ Keep: Basic text, font size, color, double-click edit
- **Saves:** 2 hours

### PR #27 (Complex Templates) - Focused:
- ❌ Skip: Card layout, dashboard, sidebar templates
- ✅ Keep: Login form, Nav bar (2 templates only)
- **Saves:** 1 hour

### PR #28 (Queue) - Essential:
- ❌ Skip: Advanced queue analytics, queue position UI
- ✅ Keep: Basic FIFO, rate limiting, timeout
- **Saves:** 2 hours

### PR #29 (Polish) - Targeted:
- ❌ Skip: Fancy animations, extensive error messages
- ✅ Keep: Undo integration, essential optimization
- **Saves:** 4 hours

---

## 🎯 Final Score Projection

### Best Case: 99/100
- Section 1: 30/30 (perfect sync, no issues)
- Section 2: 20/20 (all features + excellent performance)
- Section 3: 12/15 (Good - missing Tier 3)
- Section 4: 25/25 (perfect AI implementation)
- Section 5: 10/10 (clean architecture)
- Section 6: 5/5 (excellent docs + deployment)
- Bonus: +2 (polish)

### Expected Case: 97/100
- Section 1: 29/30 (minor sync edge case)
- Section 2: 19/20 (meets all targets)
- Section 3: 12/15 (Good - 3 Tier 1 + 2 Tier 2)
- Section 4: 24/25 (excellent AI, minor issues)
- Section 5: 9/10 (good architecture)
- Section 6: 4/5 (good docs)

### Worst Case: 92/100
- Section 1: 28/30
- Section 2: 18/20
- Section 3: 11/15
- Section 4: 23/25
- Section 5: 8/10
- Section 6: 4/5

**All cases = A Grade (90+)** ✓

---

## ✅ Pre-Flight Checklist

Before starting, verify:
- [ ] PRs 1-12 fully complete and tested
- [ ] OpenAI API key obtained with billing enabled
- [ ] Can test with 2+ browser windows (Responsively app)
- [ ] Git branches clean, up to date
- [ ] Local dev environment running smoothly
- [ ] Firebase project configured and deployed

---

## 🚀 Ready to Start!

**Next Step:** Begin PR #18 (Multi-Select)

**Estimated Completion:** 40 hours total
**Expected Grade:** 97/100 (A)
**Timeline:** 2 weeks at 20 hours/week

Let's build this! 🎉

