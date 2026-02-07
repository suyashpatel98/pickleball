# Court Management - Complete Implementation

## ✅ What's Been Built

### 1. **Court Management UI** (Tournament Page)
**Location:** `/tournaments/{id}` → "Courts" tab

**Features:**
- Create courts with name and location notes
- View all courts for the tournament
- Delete courts (matches get unassigned)
- Direct links to referee view for each court
- Info guide explaining how courts work

**Component:** `CourtManagement.tsx`

---

### 2. **Enhanced Referee Court View** (`/courts/{courtId}`)
**The Court-Centric Interface**

**Features:**
- Displays court name from database
- **Current Match** auto-loads (live or next scheduled)
  - Shows both players/teams
  - Game-by-game score entry
  - Add/remove games dynamically
  - Validation (clear winner required)
  - "Complete Match" button
- **Next Match Preview** (highlighted in blue)
  - Shows upcoming opponent
  - Round and pool info
- **Match Queue** shows next 3 upcoming matches
- **Auto-refresh** after score submission
  - Success message shown
  - Next match auto-loads after 1 second
  - Referee stays on same URL
- **Help Button** for reporting issues
- Clean, referee-optimized UI

**This achieves the vision:** Referee opens `/courts/3` once and works there all day!

---

### 3. **Automatic Court Assignment**
**When Brackets/Pools Are Generated**

**Single Elimination (`/api/tournaments/{id}/generate`):**
- Fetches all courts for the tournament
- Distributes matches round-robin across courts
- Match 1 → Court 1, Match 2 → Court 2, etc.
- Cycles back: If 3 courts, Match 4 → Court 1

**Pool Play (`/api/tournaments/{id}/generate-pools`):**
- Same round-robin distribution
- All pool matches get court assignments
- Balanced distribution across available courts

**No manual assignment needed!** Just create courts, then generate bracket.

---

### 4. **Complete Court APIs**

#### Court Management
- `POST /api/tournaments/{id}/courts` - Create court
- `GET /api/tournaments/{id}/courts` - List courts
- `GET /api/courts/{id}` - Get court details
- `PATCH /api/courts/{id}` - Update court
- `DELETE /api/courts/{id}` - Delete court

#### Match Assignment
- `PATCH /api/matches/{id}/court` - Assign/unassign court
  - Validates court exists
  - Can unassign with `court_id: null`

#### Court Matches Queue (Critical for Referee View)
- `GET /api/courts/{id}/matches`
  - Returns: `current_match`, `next_match`, `upcoming_matches`
  - Current = live match or first scheduled
  - Includes full player/team data
  - Ordered by round, created_at

---

## 🎯 Complete User Workflows

### Tournament Director Workflow
1. Create tournament
2. Go to "Courts" tab
3. Create courts (e.g., "Court 1", "Court 2", "Court 3")
4. Each court shows "Open Referee View" link
5. Register players
6. Generate bracket → matches auto-assigned to courts
7. Share referee links with court monitors

### Referee Workflow
1. Open `/courts/{courtId}` (one time, at start of day)
2. See current match loaded
3. Enter game scores: 11-9, 8-11, 11-7
4. Click "Complete Match"
5. Success message appears
6. Next match auto-loads
7. Repeat from step 3
8. **Stay on same URL all day** ✅

### Spectator Workflow
1. View tournament at `/tournaments/{id}`
2. See matches with court assignments
3. Click "View Details" to see full match info
4. See game-by-game scores
5. No access to score submission ✅

---

## 🧪 Testing the Full Flow

### End-to-End Test
```bash
# 1. Create tournament
POST /api/tournaments
{ "name": "Test Tournament" }
→ Get tournament_id

# 2. Create courts
POST /api/tournaments/{id}/courts
{ "name": "Court 1" }
POST /api/tournaments/{id}/courts
{ "name": "Court 2" }
→ Get court IDs

# 3. Register 4 players
POST /api/tournaments/{id}/register
{ "name": "Player 1", "dupr": 4.0 }
(repeat for 4 players)

# 4. Generate bracket
POST /api/tournaments/{id}/generate
→ Matches created with court_id assigned

# 5. Test referee view
GET /api/courts/{court1_id}/matches
→ Returns current_match, next_match

# 6. Submit score
POST /api/matches/{match_id}/score
{ "games": [{ "a": 11, "b": 9 }, { "a": 11, "b": 8 }] }
→ Match completed

# 7. Refresh referee view
GET /api/courts/{court1_id}/matches
→ Next match is now current_match
```

---

## 📊 Database Schema (Recap)

### Courts Table
```sql
create table public.courts (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  location_notes text,
  created_at timestamptz default now()
);
```

### Matches Table Update
```sql
-- Old 'court' integer column dropped
-- New court_id foreign key
ALTER TABLE matches ADD COLUMN court_id uuid REFERENCES courts(id) ON DELETE SET NULL;
CREATE INDEX idx_matches_court_id ON matches(court_id);
CREATE INDEX idx_matches_court_status ON matches(court_id, status);
```

---

## 🎨 UI/UX Highlights

### Referee View Design Choices
- **Large touch targets** - Easy to use on tablets
- **Big score inputs** - Centered, clear numbers
- **Color coding** - Blue for next match, green for success
- **Minimal navigation** - Everything on one page
- **Auto-refresh** - No manual reload needed
- **Match queue** - Shows what's coming
- **Help button** - Red alert style, always visible

### Court Management Design
- **Simple form** - Name + optional location
- **Immediate feedback** - Courts appear instantly
- **Direct links** - One click to referee view
- **Helpful guide** - Explains workflow
- **Clean layout** - Not overwhelming

---

## 🚀 What This Enables

### Real Tournament Operation
1. **Setup (5 minutes):**
   - Create tournament
   - Create 4 courts
   - Register players
   - Generate bracket

2. **During Tournament:**
   - 4 referees each open their court URL
   - Matches flow through automatically
   - No navigation, no confusion
   - Director watches live scoreboard

3. **Spectator Experience:**
   - View matches by pool/round
   - See court assignments
   - Watch live updates
   - No clutter from referee tools

---

## 📝 Key Implementation Details

### Random Court Assignment Algorithm
```typescript
// Round-robin distribution
matches.map((m, index) => ({
  ...m,
  court_id: courtIds[index % courtIds.length]
}))
```
- Simple modulo distribution
- Ensures even load across courts
- No fancy optimization needed
- Works for any number of courts

### Current Match Logic
```typescript
// 1. Find 'live' match
let current = matches.find(m => m.status === 'live')

// 2. If none, find first 'scheduled'
if (!current) {
  current = matches.find(m => m.status === 'scheduled')
}

// 3. Otherwise null (no matches)
```

### Auto-refresh Pattern
```typescript
// After score submission
setSuccess('Match completed! Loading next match...')
setTimeout(async () => {
  await fetchCourtMatches() // Reload
  setSuccess(null)
}, 1000)
```
Small delay ensures database has updated.

---

## ✨ Vision Alignment

### From vision.md:
> "The critical innovation is the court-centric view at /courts/{court-id} where:
> - Matches auto-load for that specific court
> - Game-by-game scoring happens inline
> - Next match auto-loads after completion
> - Stays on ONE URL throughout the day"

### ✅ Achieved:
- ✅ Court-centric view exists
- ✅ Matches auto-load
- ✅ Game-by-game scoring inline
- ✅ Auto-loads next match
- ✅ Single URL workflow
- ✅ Next match preview
- ✅ Match queue visible
- ✅ Clean separation: viewing vs submitting

---

## 🎯 Success Metrics

The implementation is complete when:
- ✅ Referee can work entire tournament without leaving court URL
- ✅ No manual court assignment needed
- ✅ Spectators can't submit scores
- ✅ Next match visible before current finishes
- ✅ Court creation is simple (< 30 seconds)
- ✅ APIs tested and working
- ✅ Auto-refresh works

**All metrics achieved!** 🎉

---

## 🔜 Future Enhancements (Not Required)

### Nice-to-Haves
- QR code generation for court URLs
- Real-time score updates (WebSocket)
- Offline scoring with sync
- Score edit within 2-minute window
- "Mark as Live" button
- Director override for scores
- Player check-in status
- Estimated match time

### Not Implemented (By Design)
- Manual court assignment UI (auto-assignment works fine)
- Court reordering (name-based sorting is sufficient)
- Court capacity/availability (all courts assumed available)
- Court-specific rules (all courts equal)

---

## 📂 Files Modified/Created

### New Components
- `/src/components/CourtManagement.tsx`

### Updated Components
- `/src/components/TournamentFixtures.tsx` - Added Courts tab
- `/src/app/courts/[id]/page.tsx` - Enhanced with next/upcoming matches

### New APIs
- `/src/app/api/tournaments/[id]/courts/route.ts`
- `/src/app/api/courts/[id]/route.ts`
- `/src/app/api/courts/[id]/matches/route.ts`
- `/src/app/api/matches/[id]/court/route.ts`

### Updated APIs
- `/src/app/api/tournaments/[id]/generate/route.ts` - Auto court assignment
- `/src/app/api/tournaments/[id]/generate-pools/route.ts` - Auto court assignment

### Tests
- `/tests/api.test.ts` - Added Court Management section

### Documentation
- `/llm_context/court_implementation_complete.md` (this file)
- `/llm_context/match_management_implementation.md` (previous)

---

## 🎓 How to Use

### For Developers
1. Courts must be created before generating brackets
2. Court assignment happens automatically during generation
3. Referee view fetches from `/api/courts/{id}/matches`
4. Match completion triggers auto-refresh

### For Tournament Directors
1. Create tournament
2. Add courts in "Courts" tab
3. Register players
4. Generate bracket
5. Share court URLs with referees
6. Watch scoreboard

### For Referees
1. Open your court URL (provided by director)
2. Bookmark it
3. Enter scores as matches happen
4. Don't refresh or navigate away
5. Matches flow automatically

---

## ✅ Checklist

Backend:
- [x] Courts table created
- [x] Matches table updated (court_id)
- [x] Court management APIs
- [x] Court matches queue API
- [x] Auto court assignment in bracket generation
- [x] Auto court assignment in pool generation
- [x] API tests added

Frontend:
- [x] Court management UI
- [x] Enhanced referee court view
- [x] Next match preview
- [x] Match queue display
- [x] Auto-refresh after submission
- [x] Success/error messaging
- [x] Courts tab in tournament view
- [x] Direct links to referee views

Testing:
- [x] Can create courts
- [x] Can generate bracket with court assignment
- [x] Referee view loads current match
- [x] Score submission works
- [x] Next match auto-loads
- [x] All APIs return expected data

Documentation:
- [x] Implementation guide
- [x] API documentation
- [x] User workflows
- [x] Testing instructions

---

## 🎉 Conclusion

The court-centric referee workflow is **fully implemented and functional**. The system now supports the complete tournament lifecycle from setup through execution, with automatic court assignment and a streamlined referee experience.

**The vision is achieved.** ✨
