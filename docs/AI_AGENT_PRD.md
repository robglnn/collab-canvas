# AI Canvas Agent - Product Requirements Document

## Project Overview
**Goal:** Build an AI agent that manipulates the canvas through natural language using OpenAI GPT-4 function calling. When a user types "Create a blue rectangle in the center," the AI calls canvas API functions, and shapes appear on everyone's canvas via real-time sync.

**Success Criteria:** Support 6+ distinct command types with <2 second latency, handle multi-user scenarios, and provide natural, reliable interaction.

**Integration:** Seamlessly integrate with existing CollabCanvas multiplayer infrastructure (PRs 1-25)

---

## User Stories

### Primary User: Any Authenticated User
- As a user, I want to **create shapes with natural language** so that I can design faster
- As a user, I want to **manipulate existing shapes by description** so that I can adjust layouts easily
- As a user, I want to **create complex layouts with one command** so that I can prototype rapidly
- As a user, I want to **see AI commands execute in real-time** so that I understand what happened
- As a user, I want to **undo AI actions** so that I can correct mistakes

### All Users (Multi-User Scenarios)
- As any user, I want to **see AI-generated shapes from all users** so that collaboration is seamless
- As any user, I want to **have fair access to the AI** so that no single user monopolizes it
- As any user, I want to **understand when AI is busy** so that I know when to wait

---

## Key Features

### 1. AI Command Input Interface

**Location:** Above Rectangle tool in left toolbar

**Visual Design:**
```
┌─────────────────────────────┐
│ 🤖 AI Assistant             │
├─────────────────────────────┤
│ [Type command here...     ] │  ← 200 char limit
│                    [Submit] │  ← Button (blue → green ✓)
└─────────────────────────────┘
```

**Interaction Flow:**
1. User types command (max 200 characters)
2. User clicks Submit or presses Enter
3. Submit button turns into loading spinner
4. AI processes and executes command
5. Submit button turns green with checkmark ✓ for 1 second
6. Returns to blue "Submit" when user starts typing again

**Input Validation:**
- Max 200 characters
- No empty submissions
- Trim whitespace
- Show character count (180/200) when >150 chars

### 2. AI Command Capabilities

**Minimum 6 Command Types (Required for MVP):**

#### Creation Commands (Type 1)
- "Create a red circle at position 100, 200"
- "Add a text layer that says 'Hello World'"
- "Make a 200x300 blue rectangle"
- "Add 5 squares in a row"

#### Manipulation Commands (Type 2)
- "Move the blue rectangle to the center"
- "Resize the circle to be twice as big"
- "Rotate the text 45 degrees"
- "Change the red square to green"

#### Layout Commands (Type 3)
- "Arrange these shapes in a horizontal row"
- "Create a grid of 3x3 squares"
- "Space these elements evenly"
- "Align selected shapes to the left"

#### Selection Commands (Type 4)
- "Select all red circles"
- "Select the largest rectangle"
- "Deselect everything"

#### Complex Commands (Type 5)
- "Create a login form with username and password fields"
- "Build a navigation bar with 4 menu items"
- "Make a card layout with title, image placeholder, and description"

#### Query Commands (Type 6)
- "How many shapes are on the canvas?"
- "What colors are being used?"
- "List all text elements"

### 3. AI Function Schema

**Core Canvas Functions Available to AI:**

```typescript
// Shape Creation
createShape(type: 'rectangle' | 'circle' | 'text' | 'line', x: number, y: number, properties: ShapeProperties): string

// Shape Manipulation
moveShape(shapeId: string, x: number, y: number): void
resizeShape(shapeId: string, width: number, height: number): void
rotateShape(shapeId: string, degrees: number): void
changeShapeColor(shapeId: string, color: string): void
deleteShape(shapeId: string): void

// Text Operations
createText(text: string, x: number, y: number, fontSize: number, color: string): string
updateText(shapeId: string, newText: string): void

// Selection & Query
selectShapes(filter: ShapeFilter): string[]
deselectAll(): void
getCanvasState(): CanvasState
getSelectedShapes(): Shape[]
getShapesByProperty(property: string, value: any): Shape[]

// Layout Operations
arrangeHorizontal(shapeIds: string[], spacing: number): void
arrangeVertical(shapeIds: string[], spacing: number): void
arrangeGrid(shapeIds: string[], rows: number, cols: number, spacing: number): void
alignShapes(shapeIds: string[], alignment: 'left' | 'right' | 'top' | 'bottom' | 'center'): void

// Viewport Info
getViewport(): { x: number, y: number, scale: number, centerX: number, centerY: number }
```

**ShapeProperties Interface:**
```typescript
interface ShapeProperties {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;  // for circles
  text?: string;    // for text
  fontSize?: number; // for text
  fontFamily?: string;
  rotation?: number;
}
```

**CanvasState Interface:**
```typescript
interface CanvasState {
  shapes: Shape[];
  viewport: Viewport;
  selectedShapeIds: string[];
  totalShapes: number;
  usedColors: string[];
}
```

### 4. Rate Limiting & Queue System

**Per-User Limits:**
- 1 prompt per 5 seconds (12 prompts per minute)
- If user submits too fast: Show banner "Rate limit exceeded, wait 5 seconds"
- Timer resets after 5 seconds

**Per-Canvas Limits:**
- Maximum 300 prompts per minute across all users
- If canvas limit reached: Show banner "Canvas AI limit reached, try again in a moment"

**Queue System:**
- First-come, first-served queue
- Maximum queue length: 10 prompts
- Each prompt must complete within 2 seconds
- While waiting in queue: Show banner "Finishing previous agent prompt"
- Queue position indicator: "Your prompt is #3 in queue"

**Timeout Handling:**
- If AI takes >2 seconds: Cancel and show error "Command timed out, please try again"
- Return queue slot for next user

### 5. Permission & Access Control

**User Permissions:**
- All authenticated users (owner + collaborators) can use AI
- AI-generated shapes are attributed to requesting user (`createdBy: userId`)
- AI respects existing shape locks (from PR #8)
- AI cannot manipulate shapes locked by other users
- AI can only manipulate shapes the requesting user has access to

**Shape Locking Integration:**
- Before modifying a shape, check if `lockedBy === null` or `lockedBy === currentUserId`
- If shape is locked by another user: Skip that shape, include in error message
- Owner can use AI to override locks (same priority as manual override)

### 6. Real-Time Sync

**Multi-User Behavior:**
- AI-generated shapes sync to all users immediately via existing Firestore listeners
- All users see AI actions from any user in real-time
- No special handling needed - uses existing shape sync infrastructure

**Attribution:**
- Every AI-generated shape includes `createdBy: userId` field
- Every AI modification includes `updatedBy: userId` field
- Shapes appear in all users' canvases with proper attribution

### 7. Undo/Redo Integration

**Undo Support:**
- Each AI command creates one undo snapshot before execution
- User can press Ctrl+Z / Cmd+Z to undo entire AI command
- Undo reverses all shapes created/modified by that command
- Integrates with existing PR #21 Undo/Redo system

**Undo Behavior Examples:**
- AI creates 5 shapes → Undo removes all 5
- AI moves 3 shapes → Undo moves them back to original positions
- AI creates login form (6 shapes) → Undo removes entire form

### 8. Error Handling & Feedback

**Error Banner Display:**
- Show errors in temporary banner at top of screen
- Auto-hide after 3 seconds
- Red background for errors, yellow for warnings

**Error Types:**
```typescript
// Rate Limiting
"Rate limit exceeded, wait X seconds"

// Queue Issues
"AI queue is full, try again shortly"
"Command timed out, please try again"

// Permission Issues
"Cannot modify shape (locked by [username])"
"No shapes found matching that description"

// Invalid Commands
"Could not understand command, please rephrase"
"Invalid color specified"
"Shape type not supported"

// Canvas State Issues
"Selected shapes required for this command"
"Command requires at least 2 shapes"
```

**Success Feedback:**
- Green checkmark on submit button (1 second)
- Optional: Subtle green flash on created/modified shapes
- Return count in banner: "Created 3 shapes" (2 second display)

### 9. Context Awareness

**AI Has Access To:**
- **Canvas State:** All shapes (id, type, x, y, width, height, fill, stroke, rotation, etc.)
- **Viewport Info:** Current pan (x, y) and zoom (scale), center point of viewport
- **Selection State:** Currently selected shape IDs
- **User Info:** Current user ID, role (owner/collaborator)
- **Shape Locks:** Which shapes are locked and by whom

**AI Context Prompt:**
```
You are an AI assistant for a collaborative canvas application. 

Current Canvas State:
- Total Shapes: {count}
- Viewport Center: ({x}, {y})
- Zoom Level: {scale}x
- Selected Shapes: {selectedIds}
- Available Colors: {colorList}

User Request: "{userCommand}"

Execute the user's request using the available canvas functions. Be concise and accurate.
If the request is ambiguous, make reasonable assumptions based on context.
```

### 10. OpenAI Integration

**Model:** GPT-4 (latest version)

**Function Calling Setup:**
- Use OpenAI's function calling feature
- Define all canvas functions as OpenAI function schemas
- AI decides which functions to call and in what order

**API Configuration:**
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userCommand }
  ],
  functions: canvasFunctionSchemas,
  function_call: "auto",
  temperature: 0.2, // Low temperature for consistency
  max_tokens: 500,
  timeout: 2000 // 2 second timeout
});
```

**Security:**
- API key stored in `.env.local` (never committed)
- Server-side validation of function calls
- Sanitize all AI outputs before execution

---

## Data Model Changes

### New Firestore Collections

#### AI Commands Collection
```
/canvases/main/aiCommands/{commandId}
{
  id: string,
  userId: string,
  userName: string,
  command: string,          // User's input text
  status: 'pending' | 'processing' | 'completed' | 'failed',
  createdShapeIds: string[], // IDs of shapes created by this command
  modifiedShapeIds: string[], // IDs of shapes modified
  error: string | null,
  timestamp: timestamp,
  executionTime: number,    // milliseconds
  queuePosition: number
}
```

#### AI Rate Limits Collection
```
/canvases/main/aiRateLimits/{userId}
{
  userId: string,
  lastCommandTime: timestamp,
  commandCount: number,      // Rolling count per minute
  resetAt: timestamp
}

/canvases/main/aiRateLimits/canvas
{
  totalCommands: number,     // Rolling count per minute
  resetAt: timestamp
}
```

### Shape Model Updates

**Add AI Attribution Fields:**
```javascript
{
  // ... existing fields
  createdBy: string,         // userId (already exists)
  createdByAI: boolean,      // NEW: true if AI-generated
  aiCommandId: string | null, // NEW: Reference to AI command
  updatedBy: string,         // NEW: userId of last modifier
  updatedByAI: boolean,      // NEW: true if AI-modified
}
```

---

## Technical Architecture

### Component Structure

```
src/
├── components/
│   ├── AICommandBar.jsx       # NEW: AI input interface
│   ├── AICommandBar.css       # NEW: Styles
│   ├── AIBanner.jsx           # NEW: Status/error banner
│   └── ... existing components
├── hooks/
│   ├── useAI.js               # NEW: AI command execution
│   ├── useAIQueue.js          # NEW: Queue management
│   ├── useAIRateLimit.js      # NEW: Rate limiting logic
│   └── ... existing hooks
├── lib/
│   ├── openai.js              # NEW: OpenAI API client
│   ├── aiTools.js             # NEW: Canvas function schemas
│   ├── aiExecutor.js          # NEW: Function execution engine
│   └── ... existing libs
└── ... existing files
```

### Execution Flow

```
1. User types command → AICommandBar component
2. User submits → Validate rate limit (useAIRateLimit)
3. Add to queue → useAIQueue
4. When ready, send to OpenAI → lib/openai.js
5. Receive function calls → Parse response
6. Execute functions → aiExecutor.js
7. Create/modify shapes → Firestore sync
8. Update UI → Success checkmark
9. Sync to all users → Existing listeners
```

### Rate Limit Implementation

```javascript
// Per-user rate limit check
function checkUserRateLimit(userId) {
  const lastCommand = getUserLastCommand(userId);
  const timeSinceLastCommand = Date.now() - lastCommand;
  
  if (timeSinceLastCommand < 5000) {
    const waitTime = 5000 - timeSinceLastCommand;
    throw new Error(`Rate limit exceeded, wait ${Math.ceil(waitTime / 1000)} seconds`);
  }
}

// Per-canvas rate limit check
function checkCanvasRateLimit() {
  const commandsInLastMinute = getCanvasCommandsInLastMinute();
  
  if (commandsInLastMinute >= 300) {
    throw new Error('Canvas AI limit reached, try again in a moment');
  }
}
```

### Queue Implementation

```javascript
class AICommandQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxSize = 10;
  }

  async add(command) {
    if (this.queue.length >= this.maxSize) {
      throw new Error('AI queue is full, try again shortly');
    }

    const queueItem = {
      id: generateId(),
      userId: command.userId,
      command: command.text,
      addedAt: Date.now(),
      position: this.queue.length + 1
    };

    this.queue.push(queueItem);
    this.processNext();

    return queueItem;
  }

  async processNext() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const command = this.queue.shift();

    try {
      await executeAICommand(command);
    } finally {
      this.processing = false;
      this.processNext(); // Process next in queue
    }
  }
}
```

---

## Performance Targets

**Latency:**
- Single-step commands: <2 seconds (REQUIRED)
- Multi-step commands: <2 seconds per step
- Function call overhead: <100ms
- Total timeout: 2 seconds (hard limit)

**Breadth:**
- Minimum 6 command types (REQUIRED)
- Target: 10+ command types
- Support for natural language variations

**Complexity:**
- Multi-step operations (e.g., "create login form" = 6+ shapes)
- Layout arrangements (grids, rows, columns)
- Batch operations (modify multiple shapes)

**Reliability:**
- 95%+ command success rate
- Graceful error handling for edge cases
- Consistent execution across users

**UX:**
- Natural language processing
- Immediate visual feedback
- Clear error messages
- Smooth integration with existing canvas

---

## Development Phases

### Phase 1: Core AI Infrastructure (PR #26)
- OpenAI integration
- Basic command parsing
- Single-step commands (create, move, color)
- Simple rate limiting

### Phase 2: Advanced Commands (PR #27)
- Multi-step operations
- Layout commands (grid, align, distribute)
- Selection commands
- Query commands

### Phase 3: Queue & Multi-User (PR #28)
- Queue system implementation
- Multi-user coordination
- Advanced rate limiting (per-user + per-canvas)
- Banner notifications

### Phase 4: Polish & Optimization (PR #29)
- Undo/Redo integration
- Error handling improvements
- Performance optimization
- Complex command templates (login form, nav bar, etc.)

---

## Success Metrics

### Must Have (Pass/Fail)
- ✅ Users can submit natural language commands via UI
- ✅ AI creates shapes that sync to all users
- ✅ Supports 6+ distinct command types
- ✅ Commands complete within 2 seconds
- ✅ Rate limiting works (per-user and per-canvas)
- ✅ Queue prevents conflicts
- ✅ Respects shape locks and permissions
- ✅ Integrates with Undo/Redo
- ✅ Shows clear error messages
- ✅ Multi-user AI works without conflicts

### Nice to Have (Extra Credit)
- 🎯 Natural language understanding (handles variations)
- 🎯 Smart defaults for ambiguous commands
- 🎯 Smooth animations for multi-step operations
- 🎯 AI suggests corrections for failed commands
- 🎯 Command history and re-run (future)
- 🎯 Voice input support (future)

### Explicitly Out of Scope for MVP
- ❌ Command history / re-run
- ❌ AI conversation / chat
- ❌ Preview / confirmation dialogs
- ❌ Planning phase for complex commands
- ❌ AI learning from user corrections
- ❌ Custom command templates
- ❌ Voice input

---

## Testing Requirements

### Unit Tests
- Function schema generation
- Rate limit logic
- Queue management
- Command parsing

### Integration Tests
- OpenAI API calls
- Canvas function execution
- Firestore sync
- Multi-user scenarios

### Manual Testing Scenarios
1. **Single User:**
   - Create shapes with various commands
   - Test all 6 command types
   - Verify undo works
   - Test rate limiting

2. **Multi-User (2+ browsers):**
   - Both users submit commands
   - Verify queue works
   - Test canvas rate limit
   - Check real-time sync

3. **Edge Cases:**
   - Submit empty command
   - Submit 200+ character command
   - Submit ambiguous command
   - Submit impossible command
   - Rapid submissions (rate limit test)
   - 10+ queued commands
   - Locked shapes interaction

4. **Performance:**
   - Measure command latency
   - Test with 50+ shapes on canvas
   - Test complex commands
   - Test timeout handling

---

## Security Considerations

**API Key Protection:**
- Store in `.env.local` (never commit)
- Use environment variables only
- No client-side exposure

**Input Sanitization:**
- Validate command length (max 200 chars)
- Strip HTML/scripts from input
- Validate function parameters

**Permission Checks:**
- Verify user is authenticated
- Check shape lock permissions
- Validate shape ownership for modifications

**Rate Limiting:**
- Prevent API abuse
- Protect against spam
- Fair usage across users

**Firestore Security Rules:**
```javascript
// Only authenticated users can create AI commands
match /canvases/{canvasId}/aiCommands/{commandId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null;
  allow update, delete: if request.auth.uid == resource.data.userId;
}

// Only users can update their own rate limits
match /canvases/{canvasId}/aiRateLimits/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

## Next Steps - Ready to Build!

All decisions have been made. Time to start building:

1. ✅ **PRD Approved** - All technical decisions locked in
2. **Set Up OpenAI** - Get API key, test basic integration
3. **Build AI Command Bar** - Create UI component
4. **Implement Core Functions** - Canvas function schemas
5. **Add Queue System** - Multi-user coordination
6. **Integrate Undo/Redo** - Connect with existing system
7. **Test & Polish** - Multi-user testing, error handling

**Build Order Priority:**
PR #26 → PR #27 → PR #28 → PR #29

---

## Appendix: Example Commands

### Creation Examples
- "Create a red circle at 100, 200"
- "Add 5 blue squares in a row"
- "Make a text that says 'Hello World' in the center"
- "Create a 300x200 green rectangle"

### Manipulation Examples
- "Move the blue rectangle to the center"
- "Resize the circle to 200px"
- "Change the red square to purple"
- "Rotate the text 45 degrees"
- "Delete all yellow circles"

### Layout Examples
- "Arrange selected shapes in a grid"
- "Space these shapes evenly"
- "Align all rectangles to the left"
- "Create a 3x3 grid of 50px squares"

### Selection Examples
- "Select all red shapes"
- "Select the largest rectangle"
- "Deselect everything"

### Complex Examples
- "Create a login form" → Username field, password field, submit button
- "Make a nav bar with 4 items" → 4 text elements + background rectangle
- "Build a card layout" → Title text, image placeholder, description text

### Query Examples
- "How many shapes are there?"
- "What colors are being used?"
- "List all text elements"

