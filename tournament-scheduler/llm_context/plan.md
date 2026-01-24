# Tournament Scheduler - Implementation Plan

## Gap Analysis

### What We Have (Current State)
- Basic CRUD for tournaments, players, registrations
- Single-elimination bracket generation with DUPR seeding
- Match scoring and automatic winner advancement
- Real-time updates via Supabase Realtime
- Basic match status: scheduled | live | finished
- Database: tournaments, matches, match_scores, players, registrations, teams

### What We Need (Vision State)
- Multi-actor views (Director, Referee, Player, Spectator)
- Court management and assignment
- Enhanced match status workflow
- Game-by-game scoring (not just final score)
- Player personal dashboard
- Notification system
- Offline capability for referees

---

## Implementation Phases

### Phase 1: Court Infrastructure
**Goal:** Enable court-based tournament management

#### 1.1 Database Schema
Add `courts` table:
```sql
create table public.courts (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,  -- "Court 1", "Court 2", etc.
  location_notes text, -- optional physical location hints
  created_at timestamptz default now()
);
```
Note: `matches.court` column already exists as integer - need to migrate to use `court_id` uuid reference.

#### 1.2 APIs to Build
- `POST /api/tournaments/[id]/courts` - Create court for tournament
- `GET /api/tournaments/[id]/courts` - List courts for tournament
- `PATCH /api/matches/[id]/court` - Assign/reassign match to court
- `GET /api/courts/[id]` - Get court with current & queued matches

#### 1.3 UI Components
- Court management section in tournament detail page
- Match-to-court assignment dropdown in director view

---

### Phase 2: Multi-View Architecture
**Goal:** Different UIs for different actors

#### 2.1 Route Structure
```
/tournaments/[id]              -> Public scoreboard (spectator view)
/tournaments/[id]/manage       -> Tournament director dashboard
/tournaments/[id]/players/[id] -> Player personal view
/courts/[id]                   -> Referee court view
```

#### 2.2 Tournament Director Dashboard (`/tournaments/[id]/manage`)
**Components:**
- Court overview grid (all courts with current match status)
- Match queue management
- Score override capability
- Player check-in status
- Quick actions (reassign match, mark issue)

#### 2.3 Referee Court View (`/courts/[id]`)
**Components:**
- Current match card (auto-loaded)
- Game-by-game score entry (not just final)
- "Match Complete" button -> auto-loads next match
- "Up Next" preview
- "Need Help" button -> alerts director

Key UX: Referee stays on one URL, matches flow through automatically.

#### 2.4 Player Personal View (`/tournaments/[id]/players/[id]`)
**Components:**
- "Your Next Match" hero card (court, opponent, time)
- Completed matches list with scores
- Future matches (conditional on winning)
- Bracket view with own path highlighted

---

### Phase 3: Enhanced Match Status & Game Scoring
**Goal:** Richer match lifecycle and game-by-game tracking

#### 3.1 Match Status Expansion
Current: `scheduled | live | finished`
New: `scheduled -> checked_in -> live -> finished -> confirmed`

- `checked_in`: Both players present at court
- `confirmed`: Director has verified result (prevents accidental changes)

Update `matches.status` check constraint.

#### 3.2 Game-by-Game Scoring
The `match_scores` table exists. Ensure workflow:
1. Referee submits Game 1 score -> stored in `match_scores.score_json`
2. UI immediately reflects Game 1 complete
3. Game 2 form appears, and so on
4. After deciding game, winner auto-calculated

**API Update:**
- `POST /api/matches/[id]/games` - Submit single game score
- Response includes updated match state and whether match is complete

#### 3.3 Score Correction
- Allow score edit within 2-minute window
- `PATCH /api/matches/[id]/games/[game-number]` - Edit game score
- If match already finished and winner changes -> update downstream bracket

---

### Phase 4: Public Live Scoreboard
**Goal:** Engaging spectator experience

#### 4.1 Enhanced Tournament Page (`/tournaments/[id]`)
**Components:**
- Tournament header (name, status badge: LIVE / Completed)
- Court grid showing:
  - Current match on each court
  - Live game scores
  - Status indicators (in progress, starting soon, complete)
- View toggles: Courts | Bracket | Pools

#### 4.2 Real-time Updates
Already using Supabase Realtime. Ensure subscriptions include:
- `matches` table (status, scores, court changes)
- `match_scores` table (game-by-game updates)

---

### Phase 5: Notification System
**Goal:** Keep players informed

#### 5.1 Notification Types (Priority Order)
1. **In-app notifications** (easiest)
   - Toast messages on player view
   - "Your match starts in 15 min"
   - Real-time via Supabase Realtime

2. **Email notifications** (medium)
   - Bracket published
   - Match assignments
   - Use a service like Resend or SendGrid

3. **Push notifications** (optional/later)
   - Requires service worker and user permission
   - Consider PWA approach

#### 5.2 Database Schema
```sql
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) on delete cascade,
  tournament_id uuid references tournaments(id),
  type text not null, -- 'match_soon', 'bracket_live', 'match_result'
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);
```

#### 5.3 APIs
- `POST /api/notifications` - Create notification (triggered by match events)
- `GET /api/players/[id]/notifications` - Get player's notifications
- `PATCH /api/notifications/[id]` - Mark as read

---

### Phase 6: Offline Capability (Referee)
**Goal:** Scores can be entered even with poor connectivity

#### 6.1 Approach
- Use service worker to cache referee view
- Store pending score submissions in IndexedDB
- Sync when connection returns
- Show "offline" indicator and "pending sync" queue

#### 6.2 Implementation
- Add service worker registration in `layout.tsx`
- Create offline queue utility (`lib/offlineQueue.ts`)
- Modify score submission to queue if offline
- Add sync logic on reconnection

---

## Recommended Implementation Order

| Order | Phase | Effort | Impact |
|-------|-------|--------|--------|
| 1 | Phase 1: Court Infrastructure | Medium | High |
| 2 | Phase 2.3: Referee Court View | Medium | Very High |
| 3 | Phase 3: Game-by-Game Scoring | Low | High |
| 4 | Phase 2.2: Director Dashboard | Medium | High |
| 5 | Phase 4: Live Scoreboard | Low | Medium |
| 6 | Phase 2.4: Player Personal View | Medium | Medium |
| 7 | Phase 5.1: In-App Notifications | Low | Medium |
| 8 | Phase 5.2: Email Notifications | Medium | Medium |
| 9 | Phase 6: Offline Capability | High | Medium |

---

## File Structure Preview

```
src/
  app/
    tournaments/
      [id]/
        page.tsx         # Public view (enhance for scoreboard)
        manage/
          page.tsx       # NEW: Director dashboard
        players/
          [playerId]/
            page.tsx     # NEW: Player personal view
    courts/
      [id]/
        page.tsx         # NEW: Referee court view
    api/
      courts/
        [id]/
          route.ts       # NEW: Get court with matches
      tournaments/
        [id]/
          courts/
            route.ts     # NEW: Create/list courts
      matches/
        [id]/
          games/
            route.ts     # NEW: Game-by-game scoring
          court/
            route.ts     # NEW: Assign court
  components/
    CourtCard.tsx        # NEW: Court status card
    GameScoreEntry.tsx   # NEW: Single game score input
    MatchQueue.tsx       # NEW: Upcoming matches list
    PlayerMatchCard.tsx  # NEW: Player's match preview
  lib/
    offlineQueue.ts      # NEW: Offline sync utility
```

---

## Quick Wins (Can Start Immediately)

1. **Add court dropdown to match detail page**
   - Uses existing `matches.court` integer column
   - Simple UI addition, no schema change

2. **Enhance match detail with game-by-game display**
   - Read from `match_scores.score_json`
   - Display individual games already stored

3. **Add "In Progress" status toggle for referee**
   - Already have `status` column
   - Add button to mark match as `live`

---

## Testing Milestones

After each phase, validate with end-to-end scenario:

- **After Phase 1:** Director can create courts and assign matches
- **After Phase 2.3:** Referee can complete matches from court view, next match auto-loads
- **After Phase 3:** Game-by-game scores visible in real-time to spectators
- **After Phase 4:** Two-tab test: referee submits, spectator sees live updates
- **After Phase 5:** Player receives in-app notification before match
