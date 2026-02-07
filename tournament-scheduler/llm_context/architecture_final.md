# Final Multi-Actor Architecture

## ✅ Proper Separation of Concerns

### 1. **Spectator View** - `/tournaments/{id}` (PUBLIC)
**Who:** Anyone viewing the tournament
**Purpose:** Read-only tournament information

**Features:**
- View fixtures by pool/round
- See standings and rankings
- View table and statistics
- See match details (read-only)
- See court assignments on matches
- **NO management tools**
- **NO score submission**

**Navigation:**
- "Manage Tournament" button in header (links to director dashboard)
- "View Details" on matches (links to `/matches/{matchId}`)

---

### 2. **Tournament Director Dashboard** - `/tournaments/{id}/manage` (MANAGEMENT)
**Who:** Tournament organizer/director
**Purpose:** Setup and manage tournament

**Features:**
- **Court Management**
  - Create courts with name and location
  - Delete courts
  - View all courts
  - Direct links to referee views
- **Court Status Overview Grid**
  - See all courts at a glance
  - Current match on each court
  - Active/Idle status
  - Quick navigation to referee view
- **Quick Actions**
  - Back to tournament
  - Manage players
  - View fixtures

**Navigation:**
- "Back to Tournament" button (links to public view)
- Court cards link to referee views
- Quick action buttons for common tasks

---

### 3. **Referee View** - `/courts/{courtId}` (OPERATIONAL)
**Who:** Court referee/monitor
**Purpose:** Score submission for a specific court

**Features:**
- See current match auto-loaded
- Game-by-game score entry (best of 3)
- Complete match and submit score
- See next match preview (highlighted blue)
- See match queue (next 3 upcoming)
- Auto-refresh after completion
- Stay on ONE URL all day ✅

**Key Innovation:**
- Referee opens URL once at start of day
- All matches flow through automatically
- No navigation needed
- No manual court selection

---

### 4. **Match Detail View** - `/matches/{matchId}` (READ-ONLY)
**Who:** Spectators and players
**Purpose:** View match details

**Features:**
- Player/team information
- Game-by-game scores
- Winner highlighted
- Status (scheduled/live/completed)
- **NO score submission**

---

## 🎯 Key Architectural Principles

### Separation by Role
- **Viewing** (spectators) ≠ **Managing** (directors) ≠ **Operating** (referees)
- Each role has dedicated, optimized interface
- No mixed concerns

### Separation by Access
- Public pages: `/tournaments/{id}`, `/matches/{id}`
- Management pages: `/tournaments/{id}/manage`
- Operational pages: `/courts/{id}`

### Separation by Workflow
- **Spectators:** Browse → View matches → See scores
- **Directors:** Manage → Create courts → Generate bracket → Monitor
- **Referees:** Open court URL → Submit scores → Auto-load next

---

## 📂 File Structure

```
/src/app/
├── tournaments/[id]/
│   ├── page.tsx              → Spectator view (PUBLIC)
│   └── manage/
│       └── page.tsx          → Director dashboard (MANAGEMENT)
├── courts/[id]/
│   └── page.tsx              → Referee view (OPERATIONAL)
└── matches/[id]/
    └── page.tsx              → Match detail (READ-ONLY)

/src/components/
├── TournamentFixtures.tsx    → Spectator tabs (Fixtures, Standings, Table)
└── CourtManagement.tsx       → Court creation/deletion (used in manage page)
```

---

## 🔗 Navigation Flow

```
Spectator Journey:
/tournaments/{id}
  → View fixtures
  → Click "View Details"
  → /matches/{matchId} (read-only)

Director Journey:
/tournaments/{id}
  → Click "Manage Tournament"
  → /tournaments/{id}/manage
  → Create courts
  → Click court card
  → /courts/{courtId} (referee view)

Referee Journey:
/courts/{courtId}
  → Submit scores
  → Next match auto-loads
  → Stay on same page all day
```

---

## 🎨 UI Distinctions

### Spectator View
- Clean, minimal
- Information-focused
- No action buttons
- Read-only badges
- Blue/white color scheme

### Director Dashboard
- Information-rich
- Grid layouts
- Management controls
- Status indicators
- Action buttons
- Green/blue accents for active states

### Referee View
- Large touch targets
- Score input forms
- Big "Complete Match" button
- Next match preview (blue)
- Queue visibility
- Green success messages
- Red help button

### Match Detail
- Read-only
- Player information
- Game scores displayed
- Winner highlighted (green border)
- No forms or inputs

---

## ✅ Success Metrics

The architecture is correct when:
- ✅ Spectators can't access management tools
- ✅ Public page has NO court management
- ✅ Director dashboard is separate from public view
- ✅ Referees have dedicated court-centric interface
- ✅ Each role has optimized workflow
- ✅ No mixed concerns

---

## 🚫 Anti-Patterns (What We Fixed)

### ❌ WRONG: Mixed Actor Experience
```
/tournaments/{id}
├─ Fixtures tab (spectator)
├─ Standings tab (spectator)
├─ Courts tab (DIRECTOR TOOL) ← Mixed concern!
```

### ✅ CORRECT: Separated Experience
```
/tournaments/{id}              → Pure spectator
/tournaments/{id}/manage       → Pure director
/courts/{id}                   → Pure referee
```

---

## 🎓 Design Rationale

### Why Separate Pages?
1. **Security:** Directors can control access to `/manage` route
2. **UX:** Each actor sees only what they need
3. **Performance:** No loading unnecessary data
4. **Clarity:** No confusion about capabilities
5. **Scalability:** Easy to add permissions later

### Why Court-Centric Referee View?
1. **Workflow:** Referee works at one physical court all day
2. **Simplicity:** No navigation, no confusion
3. **Speed:** Auto-loading is faster than manual selection
4. **Reliability:** One URL, one workflow, no errors

### Why Read-Only Match View?
1. **Integrity:** Only referees at court can submit scores
2. **Audit:** Clear source of score data
3. **Simplicity:** Spectators can't accidentally submit
4. **Authority:** Referee is single source of truth

---

## 📝 Implementation Checklist

- [x] Remove "Courts" tab from spectator view
- [x] Create `/tournaments/{id}/manage` route
- [x] Add "Manage Tournament" button to header
- [x] Move CourtManagement to director dashboard
- [x] Add court status overview grid
- [x] Fetch current match for each court
- [x] Add quick actions to director dashboard
- [x] Keep referee view unchanged (already correct)
- [x] Keep match detail view read-only (already correct)
- [x] Document architecture

---

## 🎉 Conclusion

The multi-actor architecture is now properly implemented with clear separation between:
- **Viewing** (spectators)
- **Managing** (directors)
- **Operating** (referees)

Each actor has a dedicated, optimized interface aligned with their workflow and responsibilities.

**The vision is achieved.** ✨
