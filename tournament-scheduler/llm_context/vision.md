# Tournament Scheduling App - Complete Vision & UX Guide

## Key Actors & Their Roles

### 1. Tournament Director/Organizer
The person who creates and manages the tournament.

### 2. Referee/Court Monitor
The person physically present at a court who records match scores.

### 3. Player
Participant in the tournament who wants to track their matches.

### 4. Spectator/Public
Anyone watching or following the tournament progress.

---

## Complete User Experience Vision

### Tournament Director Experience

#### Tournament Setup Phase
- Creates tournament with details (name, date, format, number of courts)
- Shares registration link with players
- Monitors registration list
- Once registration closes, clicks "Generate Bracket"
- Reviews seeding, can manually adjust if needed
- Publishes bracket to make it live

#### During Tournament
**Dashboard view** showing:
- All courts with current match status
- Queue of upcoming matches per court
- Live score updates as they happen

**Capabilities:**
- Can reassign matches to different courts if needed
- Can manually override scores if there's a dispute
- Receives notifications when matches finish
- Can see which referees are at which courts

#### Post-Tournament
- Views final results and statistics
- Exports bracket/results as PDF
- Archives tournament

---

### Referee Experience (The Critical Innovation)

#### Court-Centric View

Instead of navigating match-by-match, referees need a **court dashboard**:

```
┌─────────────────────────────────────────┐
│  COURT 3 - Referee View                 │
├─────────────────────────────────────────┤
│  Current Match: Round 2, Match #5       │
│  Alice Chen (Seed #1) vs Bob Smith (#4) │
│                                          │
│  [Quick Score Entry]                    │
│  Game 1:  11  -  8   ✓                  │
│  Game 2:  [  ] - [  ]  [Submit Game]    │
│                                          │
│  [Match Complete] [Need Help]           │
├─────────────────────────────────────────┤
│  Up Next (Auto-loads after current):    │
│  → Winner vs Charlie Davis             │
│  → Estimated in 15 minutes              │
└─────────────────────────────────────────┘
```

#### Referee Flow
1. Opens unique URL: `/courts/3` (QR code posted at physical court)
2. Sees current match auto-loaded
3. **Game-by-game scoring:**
   - Enters score for Game 1, clicks "Submit Game"
   - Immediately shows in UI, players can see on their phones
   - Enters Game 2, submits
   - If split (1-1), Game 3 form appears
4. After final game submission:
   - Winner auto-calculated
   - Big "Match Complete" button appears
   - Clicks it → match marked finished
   - **Next match auto-loads** (if scheduled for this court)
5. During match, can mark it as "In Progress" so tournament director knows

#### Key Referee Features
- **Offline capability** - scores sync when connection returns
- **Error correction** - Can edit last game score within 2 minutes
- **Call for help** button - Alerts tournament director of issue

---

### Player Experience

Players need their **personal tournament view**:

```
┌─────────────────────────────────────────┐
│  Your Matches - Alice Chen              │
├─────────────────────────────────────────┤
│  ⚡ NEXT MATCH - Court 2 (in 5 min)     │
│  You vs Charlie Davis                   │
│  Round 2, Match #5                      │
│  [Get Directions to Court 2]            │
├─────────────────────────────────────────┤
│  Completed:                              │
│  ✓ Round 1: You def. Frank (11-6, 11-8) │
├─────────────────────────────────────────┤
│  Future:                                 │
│  Round 3: TBD (if you win)              │
│  Semifinals: TBD                         │
└─────────────────────────────────────────┘
```

#### Player Flow
1. Receives email after registration: "You're registered! Track your bracket: [link]"
2. Opens personalized link: `/tournaments/{id}/players/{player-id}`
3. Gets notifications:
   - "Bracket is live! You're playing Bob in Round 1"
   - "Your match starts in 15 minutes - Court 3"
   - "Match starting now!" (when ref marks it live)
   - Real-time score updates during their match
   - "You won! Next opponent: Charlie on Court 1"
4. Can view full bracket but their path is highlighted
5. After elimination, can still follow tournament

---

### Public/Spectator Experience

The main tournament page becomes a **live scoreboard**:

```
┌─────────────────────────────────────────────────────────────┐
│  Battle Under Lights - S2 Doubles                           │
│  🔴 LIVE  •  Round 2 of 4  •  4 matches in progress        │
├─────────────────────────────────────────────────────────────┤
│  Courts:                                                     │
│  Court 1: 🟢 Harsh/Akshay vs Anuj/Krish  [11-8, 9-7]       │
│  Court 2: 🟢 Alice/Bob vs Charlie/Diana  [11-6, 5-5] 🔴LIVE│
│  Court 3: ⏳ Next: Eve/Frank vs ...      [Starting soon]    │
│  Court 4: ✓ Match complete - Winner: Prachi/Nikhil         │
├─────────────────────────────────────────────────────────────┤
│  [View Full Bracket] [Switch to: Pool View | Status View]  │
└─────────────────────────────────────────────────────────────┘
```

#### Spectator Features
- Real-time updates with WebSocket/Supabase Realtime
- Click any match to see detailed scoring history
- Filter by pool (for round-robin phases)
- Automatic page refresh keeps scores current
- Shows court locations/names
- Projected finish time

---

## Critical UI/UX Improvements Needed

### 1. Court Assignment System
**Currently missing but essential:**
- Tournament director assigns matches to specific courts
- Courts have names/numbers (Court 1, Court 2, etc.)
- Queue system shows what's "on deck" for each court
- Database schema needs: `matches.court_id` and `courts` table

### 2. Match Status States
**Expand beyond `scheduled | live | finished`:**

```
scheduled → checked_in → live → finished → confirmed
                ↓
           players_ready (both players present)
```

### 3. Notification System
- Email/SMS when bracket is published
- Push notifications for "your match in 15 min"
- Tournament director alerts for issues
- Real-time score updates

### 4. Multi-View Architecture
**Different URLs for different actors:**

```
/tournaments/{id}              → Public view (spectator)
/tournaments/{id}/manage       → Director dashboard
/courts/{court-id}             → Referee view
/tournaments/{id}/players/{id} → Player personal view
```
---

## Key URLs & Routing

### Public URLs
- `/` - Tournament list (home)
- `/tournaments/{id}` - Public tournament view (live scoreboard)
- `/tournaments/{id}/bracket` - Full bracket view

### Actor-Specific URLs
- `/tournaments/{id}/manage` - Tournament director dashboard
- `/tournaments/{id}/players/{player-id}` - Player personal view
- `/courts/{court-id}` - Referee court view
- `/matches/{id}` - Match detail page

### API Endpoints (Additional)
- `POST /api/tournaments/{id}/courts` - Create court
- `PATCH /api/matches/{id}/court` - Assign match to court
- `POST /api/matches/{id}/start` - Mark match as started
- `POST /api/matches/{id}/games` - Submit individual game score
- `GET /api/tournaments/{id}/live` - Get all live match data
- `POST /api/notifications` - Send notification to player

---

## Testing Checklist

### End-to-End Scenarios

#### Scenario 1: Single Court Tournament
1. Create 8-player single-elimination tournament
2. Assign all matches to Court 1
3. Referee completes matches sequentially
4. Verify automatic advancement works
5. Crown champion

#### Scenario 2: Multi-Court Tournament
1. Create 16-player tournament with 4 courts
2. Assign Round 1 matches to all courts
3. Multiple referees score simultaneously
4. Verify no race conditions in advancement
5. Test court reassignment mid-tournament

#### Scenario 3: Player Journey
1. Player registers via email link
2. Receives bracket notification
3. Gets "match starting soon" alert
4. Views live score updates
5. Receives next match assignment
6. Eventually loses and continues spectating

#### Scenario 4: Referee Error Correction
1. Referee enters incorrect score
2. Within 2 minutes, edits the score
3. Verify match outcome updates correctly
4. Verify downstream matches update if winner changed

#### Scenario 5: Real-Time Sync
1. Open director dashboard, referee view, and player view
2. Submit score from referee view
3. Verify all views update within 1 second
4. Test with poor network conditions


---

## Conclusion

This vision creates a complete ecosystem where:
- **Directors** have full control and visibility
- **Referees** can quickly score without friction
- **Players** stay informed and engaged
- **Spectators** enjoy live updates