# Tournament Scheduling App - Complete Vision & UX Guide

## Product Overview

**TournamentPro** is a multi-tenant SaaS platform for running professional pickleball (and other sport) tournaments. Tournament directors pay for the service, while players, referees, and spectators get free access to track and view tournament progress.

### Business Model
- **Paying Customers:** Tournament directors/organizers
- **Free Users:** Players, referees, spectators
- **Revenue Model:** Subscription tiers (Free/Pro/Enterprise)

---

## Key Actors & Their Roles

### 1. Tournament Director/Organizer (PAYING CUSTOMER)
The person who creates and manages the tournament.
- **Must have account** to create/manage tournaments
- **Pays subscription** for platform access
- **Gets management dashboard** with full control

### 2. Referee/Court Monitor (FREE ACCESS)
The person physically present at a court who records match scores.
- **No account needed** - accesses via court URL
- **Given access by director** via link or QR code
- **Single-court focused** workflow

### 3. Player (FREE ACCESS)
Participant in the tournament who wants to track their matches.
- **No account needed** - accesses via unique link
- **Receives personalized URL** upon registration
- **Optional account** to track history across tournaments

### 4. Spectator/Public (FREE ACCESS)
Anyone watching or following the tournament progress.
- **Completely public** - no barriers
- **Can view any published tournament**
- **No account needed**

---

## Access Control & User Experience

### Multi-Tier Access Strategy

#### **Tier 1: Public Access (No Authentication)**
**Who:** Spectators, general public
**Access:** Any published tournament page
**URLs:** `/tournaments/{id}`
**Features:**
- View fixtures, standings, tables
- See live scores (when real-time implemented)
- Click match details
- Share tournament links

#### **Tier 2: Magic Links (Token-Based Access)**
**Who:** Players and Referees
**Access:** Unique URLs with embedded tokens
**URLs:**
- Players: `/tournaments/{id}/players/{player-token}`
- Referees: `/courts/{court-id}`

**Features:**
- **Security through obscurity** - hard-to-guess tokens
- **No passwords needed** - low friction
- **Links work indefinitely** - bookmark and return
- **Revocable by director** if needed

**Player Example:**
```
Email received:
"You're registered for Battle Under Lights S2!
Track your matches: https://app.com/tournaments/abc/players/xyz789"
```

**Referee Example:**
```
Director message:
"You're assigned to Court 1. Access here:
https://app.com/courts/court-123
[QR Code]"
```

#### **Tier 3: Account-Based (Directors & Power Users)**
**Who:** Tournament directors (required), Players (optional)
**Access:** Email/password or OAuth (Google, GitHub)
**URLs:** `/dashboard`, `/tournaments/{id}/manage`

**Directors (Required):**
- Must create account to create tournaments
- Get personal dashboard showing all their tournaments
- Can invite co-organizers (future)
- Subscription/billing tied to account

**Players (Optional):**
- Can create account to link multiple tournaments
- See history across all tournaments participated
- Manage notification preferences
- Track statistics over time

---

## User Journey Flows

### Tournament Director Journey

**First Time (New Director):**
```
1. Visit homepage
   ↓
2. Click "Create Tournament"
   ↓
3. Sign up (email/password or OAuth)
   ↓
4. Choose plan (Free trial / Pro / Enterprise)
   ↓
5. Create first tournament
   ↓
6. Access /tournaments/{id}/manage
   ↓
7. Share registration link with players
   ↓
8. Share court URLs with referees
```

**Returning Director:**
```
1. Login
   ↓
2. Dashboard shows "My Tournaments"
   ↓
3. Select tournament → Manage view
   ↓
4. Monitor progress, advance rounds
```

### Player Journey

**Registration:**
```
1. Receive registration link from director
   ↓
2. Fill form (name, email, skill level)
   ↓
3. [Optional] Create account
   ↓
4. Receive email with personalized link
```

**During Tournament:**
```
1. Click link from email (or bookmark)
   ↓
2. See personal view (next match, history, bracket path)
   ↓
3. No login needed (token in URL)
```

**With Account (Optional):**
```
1. Login
   ↓
2. Dashboard shows all tournaments participated
   ↓
3. See statistics, history, upcoming matches
```

### Referee Journey

**Setup:**
```
1. Director creates courts
   ↓
2. Director shares court URL or QR code
   ↓
3. Referee opens link and bookmarks
```

**All Day Usage:**
```
1. Open bookmarked court URL
   ↓
2. Current match auto-loaded
   ↓
3. Enter scores, complete match
   ↓
4. Next match auto-loads
   ↓
5. Repeat (stay on same URL all day)
```

### Spectator Journey

**Discovery:**
```
1. Google search or social media link
   ↓
2. Click tournament page
   ↓
3. View fixtures, scores, standings
   ↓
4. No barriers, no signup
```

---

## Monetization & Pricing Tiers

### Free Tier (Trial/Hobby)
**Price:** $0/month
**Limits:**
- 1 active tournament at a time
- Up to 16 players
- 2 courts maximum
- Basic features only
- Community support

**Target:** Individual organizers, small clubs

### Pro Tier (Recommended)
**Price:** $29/month (or $290/year)
**Features:**
- Unlimited concurrent tournaments
- Unlimited players and courts
- Real-time updates (Phase 1)
- Email notifications (Phase 3)
- Priority support
- Custom branding

**Target:** Clubs, recreation centers, regular organizers

### Enterprise Tier
**Price:** $99/month (custom pricing for large orgs)
**Features:**
- Everything in Pro
- Custom domain (tournaments.yourclub.com)
- White-label option
- Advanced analytics
- API access
- Dedicated support
- Team accounts

**Target:** Large organizations, tournament series

---

## Multi-Tenant Architecture

### Tournament Ownership
```
Organization/Director
  └── Tournaments
      ├── Courts
      ├── Matches
      ├── Players (registrations)
      └── Teams
```

### Data Isolation
- Directors only see/edit their tournaments
- Players only see their matches
- Public can view published tournaments
- Secure separation via Row-Level Security (RLS)

### URL Structure
**Director URLs (Private - Auth Required):**
- `/dashboard` - My tournaments
- `/tournaments/{id}/manage` - Management view

**Public URLs (No Auth):**
- `/tournaments/{id}` - Spectator view
- `/discover` - Browse public tournaments

**Token URLs (Magic Link Access):**
- `/courts/{court-id}` - Referee view
- `/tournaments/{id}/players/{token}` - Player view

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
**Dashboard view (`/tournaments/{id}/manage`)** showing:
- **Court Status Overview Grid** - All courts with current match status
- Active/Idle badges for each court
- Current match displayed on each court
- Direct links to referee views
- **Tournament Progress Card**:
  - Current round number
  - Match completion progress
  - "Advance to Round X" button (when ready)

**✅ Implemented Capabilities:**
- Create and delete courts
- View court status at a glance
- Advance rounds when matches complete
- Monitor tournament progression
- Access referee views

**Future Enhancements:**
- Manually reassign matches to different courts
- Override scores if there's a dispute
- Receive notifications when matches finish
- See which referees are at which courts
- Real-time updates without refresh

#### Post-Tournament (FUTURE ENHANCEMENT)
- View final results and statistics
- Export bracket/results as PDF
- Archive tournament
- Generate reports

---

### Referee Experience ✅ IMPLEMENTED (The Critical Innovation)

#### Court-Centric View

Instead of navigating match-by-match, referees have a **court dashboard** at `/courts/{id}`:

```
┌─────────────────────────────────────────┐
│  COURT 3 - Referee View                 │
├─────────────────────────────────────────┤
│  Current Match: Round 2                 │
│  Alice Chen vs Bob Smith                │
│                                          │
│  Enter Score (Best of 3):               │
│  Game 1:  [11] - [8]                    │
│  Game 2:  [11] - [9]                    │
│                                          │
│  [+ Add Game 3]                         │
│  [Complete Match]                       │
├─────────────────────────────────────────┤
│  ⭐ Up Next (Auto-loads after current): │
│  → Charlie Davis vs Diana Evans         │
│  → Round 2, Pool A                      │
├─────────────────────────────────────────┤
│  Match Queue (3 upcoming)               │
│  #2: Eve vs Frank                       │
│  #3: ...                                │
└─────────────────────────────────────────┘
```

#### Implemented Referee Flow
1. Opens unique URL: `/courts/3` (provided by tournament director)
2. **Current match auto-loaded** - First 'live' or next 'scheduled' match
3. **Game-by-game scoring (Best of 3):**
   - Enter Game 1 score
   - Enter Game 2 score
   - If needed, click "+ Add Game 3" and enter score
   - Can remove games if added by mistake
4. **Validation:**
   - At least one game required
   - Must have clear winner (can't tie)
5. Click **"Complete Match"** button
6. **Auto-refresh:**
   - Success message shown
   - Next match auto-loads after 1 second
   - **Referee stays on same URL all day** ✨
7. **Match Queue** - See next 3 upcoming matches
8. **Help Button** - Red alert button for issues

#### Current Features
- ✅ Court-centric workflow (stay on one URL)
- ✅ Current match auto-loading
- ✅ Game-by-game score entry
- ✅ Best of 3 validation
- ✅ Auto-refresh after completion
- ✅ Next match preview (highlighted)
- ✅ Match queue visibility
- ✅ Help button

#### Future Enhancements
- **Offline capability** - scores sync when connection returns
- **Error correction** - Edit last score within 2 minutes
- **Mark as "In Progress"** - Alert director match has started
- **Individual game submission** - Submit after each game
- **Real-time sync** - Instant updates without page refresh
- **QR code generation** - Easy access to court URL

---

### Player Experience (FUTURE ENHANCEMENT)

**Not yet implemented.** Players currently use the public spectator view.

**Future vision:** Players need their **personal tournament view**:

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

### Public/Spectator Experience ✅ IMPLEMENTED

The main tournament page at `/tournaments/{id}` provides multiple views:

**✅ Current Implementation:**
```
┌─────────────────────────────────────────────────────────────┐
│  Battle Under Lights - S2                                   │
│  Tournament Details • Manage Tournament (button)             │
├─────────────────────────────────────────────────────────────┤
│  Tabs: [Fixtures] [Standings] [Table] [Stats] [Details]    │
├─────────────────────────────────────────────────────────────┤
│  View Mode: [Pool-wise] [Court-wise] [Status-wise]         │
│  Round Selection: [Round 1] [Round 2] [Round 3]            │
├─────────────────────────────────────────────────────────────┤
│  Fixtures (Pool A, Round 1):                                │
│  Alice vs Bob         Court 1    [View Details]             │
│  Charlie vs Diana     Court 2    [View Details]             │
│                                                              │
│  Standings (Pool A):                                         │
│  1. Alice      2-0  (4 pts)                                 │
│  2. Bob        1-1  (2 pts)                                 │
└─────────────────────────────────────────────────────────────┘
```

#### Implemented Features
- ✅ **Fixtures Tab** - View matches by pool/round/court
- ✅ **Standings Tab** - Pool rankings and win/loss records
- ✅ **Table Tab** - Head-to-head results
- ✅ **Multiple View Modes:**
  - Pool-wise: Filter by pool
  - Court-wise: Group by court
  - Status-wise: Group by match status
- ✅ **Round Navigation** - Switch between rounds
- ✅ **Match Details** - Click "View Details" to see game scores
- ✅ **Court Information** - Shows which court each match is on
- ✅ **"Manage Tournament" button** - Directors can access dashboard

#### Future Enhancements
- Real-time updates with WebSocket/Supabase Realtime
- Live match indicators (🔴 LIVE badge)
- Auto-refresh without manual reload
- Projected finish time
- Court location maps
- Live scoreboard mode (auto-cycling through courts)

---

## Automatic Features ✅ IMPLEMENTED

These automations are core to the current implementation:

### 1. **Automatic Court Assignment**
When generating bracket or pools:
- System distributes matches evenly across all courts
- Uses round-robin algorithm: Match 1→Court 1, Match 2→Court 2, etc.
- No manual assignment needed
- Ensures balanced load across courts

### 2. **Automatic Winner Pairing**
When advancing rounds:
- System extracts all winners from current round
- Pairs them sequentially for next round
- Creates new matches automatically
- Assigns courts to new matches

### 3. **Automatic Match Loading**
In referee view:
- Current match auto-loads (first 'live' or next 'scheduled')
- After completion, next match auto-loads after 1 second
- Referee never needs to navigate away
- Queue shows upcoming matches

### 4. **Automatic Tournament Completion**
- Detects when only 1 winner remains
- Announces champion
- Prevents further round advancement
- Clear tournament conclusion

### 5. **Automatic Validation**
- Court requirement before bracket generation
- All matches must complete before round advancement
- Best of 3 scoring validation (must have winner)
- Prevents incomplete or tied matches

---

## Critical Features Summary

### ✅ Implemented (Core MVP)
1. Multi-actor architecture (Director, Referee, Spectator views)
2. Court management system
3. Automatic court assignment
4. Round advancement workflow
5. Court-centric referee view
6. Game-by-game scoring (best of 3)
7. Match detail view (read-only)
8. Tournament progression tracking
9. Pool and bracket generation
10. Auto-loading matches for referees

### 🔮 Future Enhancements

### 1. Court Assignment System ✅ IMPLEMENTED
**Core workflow:**
- Tournament director creates courts before generating bracket
- Courts have names/numbers (Court 1, Court 2, etc.)
- Matches are **automatically** assigned to courts using round-robin distribution
- Queue system shows upcoming matches for each court
- Court-centric referee view at `/courts/{id}`

**Automatic Assignment:**
- When bracket/pools are generated, matches are distributed evenly across all courts
- Match 1 → Court 1, Match 2 → Court 2, Match 3 → Court 1, etc.
- No manual assignment needed

**Future Enhancement:**
- Manual court reassignment during tournament

### 2. Round Advancement Workflow ✅ IMPLEMENTED
**Critical feature for tournament progression:**

**Director Dashboard shows:**
- Current round number
- Match completion progress (e.g., 2/2 matches complete)
- "Ready to Advance" badge when all matches in round are complete
- "Advance to Round X" button

**Advancement Process:**
1. All current round matches must be completed
2. Director clicks "Advance to Next Round"
3. System automatically:
   - Extracts winners from completed matches
   - Pairs winners for next round
   - Creates new matches
   - Assigns courts automatically (round-robin)
   - Detects tournament completion (1 winner = champion)

**Tournament Completion:**
- When only one winner remains, system displays champion
- No more rounds can be advanced

### 3. Match Status States
**Current Implementation:** `scheduled | live | completed`

**Future Enhancement - Expanded States:**
```
scheduled → checked_in → live → completed → confirmed
                ↓
           players_ready (both players present)
```

### 4. Notification System (FUTURE ENHANCEMENT)
**Not yet implemented:**
- Email/SMS when bracket is published
- Push notifications for "your match in 15 min"
- Tournament director alerts for issues
- Real-time score updates via push

### 5. Multi-View Architecture
**Different URLs for different actors:**

**✅ Implemented:**
```
/tournaments/{id}              → Public view (spectator)
                                  - Fixtures tab (with court info)
                                  - Standings tab
                                  - Table tab

/tournaments/{id}/manage       → Director dashboard
                                  - Court Management
                                  - Court Status Overview Grid
                                  - Round Advancement
                                  - Quick Actions

/courts/{court-id}             → Referee view (court-centric)
                                  - Current match auto-loads
                                  - Game-by-game score entry
                                  - Next match preview
                                  - Match queue

/matches/{id}                  → Match detail (read-only)
                                  - Game scores
                                  - Player info
                                  - Winner display
```

**Future Enhancement:**
```
/tournaments/{id}/players/{id} → Player personal view
                                  - Personal match schedule
                                  - Notifications
                                  - Highlighted bracket path
```
### 🔮 Future Enhancements
1. Player personal view (`/tournaments/{id}/players/{id}`)
2. Notification system (email/SMS/push)
3. Real-time updates (WebSocket/Supabase Realtime)
4. Offline referee capability
5. Score error correction (2-minute window)
6. Advanced match states (checked_in, players_ready, etc.)
7. Manual court reassignment
8. Director score override
9. PDF bracket export
10. QR code generation for court URLs
11. Match timing and projections
12. Live scoreboard mode

---

## Smart URL Routing

The app automatically detects user intent based on URL structure:

### Public URLs (No Auth)
- `/` - Homepage with role selection
- `/discover` - Browse public tournaments
- `/tournaments/{id}` - Spectator view (fixtures, standings)
- `/matches/{id}` - Match detail (read-only)

### Token-Based URLs (Magic Link)
- `/courts/{court-id}` - Referee view (auto-loads matches)
- `/tournaments/{id}/players/{token}` - Player personal view

### Authenticated URLs (Login Required)
- `/dashboard` - Director's tournament list
- `/tournaments/{id}/manage` - Management dashboard (creators only)
- `/settings` - Account settings

### Smart Redirects
- Visiting `/tournaments/{id}/manage` without auth → Login page
- After login → Return to intended page
- Invalid token → Friendly error message

---

## Security & Privacy

### Director Data Protection
- Email verification required
- Optional 2FA for paid plans
- API rate limiting
- Only see own tournaments

### Player Privacy
- Unique tokens (UUID-based, hard to guess)
- Tokens scoped to single tournament
- Director can revoke tokens
- Optional: Create account to control data

### Referee Access
- Public court URLs by default
- Optional: 4-digit PIN for court access
- Audit log of all score submissions
- Director can disable court access

### Public Data
- Published tournaments are public
- Directors can mark tournament as private
- Private tournaments don't appear in discovery
- Direct link still works if shared

---

## Testing Checklist

### End-to-End Scenarios

#### ✅ Scenario 1: Single Court Tournament (TESTABLE NOW)
1. Create 4-player single-elimination tournament
2. Create 1 court
3. Generate bracket (matches auto-assigned)
4. Referee completes Round 1 matches sequentially at `/courts/{id}`
5. Director advances to Round 2 via dashboard
6. Referee completes finals
7. Verify tournament completion and champion detection

**Status:** Fully implemented and tested

#### ✅ Scenario 2: Multi-Court Tournament (TESTABLE NOW)
1. Create 4-player tournament with 2 courts
2. Generate bracket (automatic round-robin assignment)
3. Multiple referees can score simultaneously at different `/courts/{id}` URLs
4. Director monitors via court status overview
5. Director advances round when all matches complete
6. Verify automatic court assignment for next round

**Status:** Fully implemented (except manual court reassignment)

#### ❌ Scenario 3: Player Journey (NOT TESTABLE - Future)
1. Player registers via email link
2. Receives bracket notification
3. Gets "match starting soon" alert
4. Views live score updates
5. Receives next match assignment
6. Eventually loses and continues spectating

**Status:** Requires player personal view, notification system - not implemented

#### ❌ Scenario 4: Referee Error Correction (NOT TESTABLE - Future)
1. Referee enters incorrect score
2. Within 2 minutes, edits the score
3. Verify match outcome updates correctly
4. Verify downstream matches update if winner changed

**Status:** Requires score edit capability - not implemented

#### ❌ Scenario 5: Real-Time Sync (NOT TESTABLE - Future)
1. Open director dashboard, referee view, and spectator view
2. Submit score from referee view
3. Verify all views update within 1 second
4. Test with poor network conditions

**Status:** Requires WebSocket/Realtime - not implemented (manual refresh works)


---

## Homepage & Discovery

### Landing Page Design
```
┌─────────────────────────────────────────────────────┐
│  🏓 TournamentPro              [Login]  [Sign Up]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│    Run Better Tournaments, Delight Your Players     │
│                                                      │
│         [Start Free Trial]  ← For Directors         │
│                                                      │
├─────────────────────────────────────────────────────┤
│  What brings you here?                              │
│                                                      │
│  🎯 Create a Tournament                             │
│     → Sign up and get started                       │
│                                                      │
│  🔍 Find a Tournament                               │
│     → Browse or search public tournaments           │
│                                                      │
│  📧 I'm a Player                                    │
│     → Check your email for your personal link       │
│                                                      │
│  📱 I'm a Referee                                   │
│     → Scan the QR code at your court                │
└─────────────────────────────────────────────────────┘
```

### Director Dashboard (After Login)
```
/dashboard

┌─────────────────────────────────────────────────────┐
│  My Tournaments                    [+ New]          │
├─────────────────────────────────────────────────────┤
│  📅 Battle Under Lights S2          [Manage]       │
│     🔴 Live • 4 players • 2 courts • Round 2       │
│     Public link: app.com/tournaments/abc123         │
│                                                      │
│  📅 Summer Smash 2026               [Manage]       │
│     Scheduled Aug 15 • 16 registered                │
│                                                      │
│  📊 Your Plan: Pro ($29/mo)        [Upgrade]       │
│     Unlimited tournaments • Real-time • Email       │
│                                                      │
│  📜 Past Tournaments (3 archived)                   │
└─────────────────────────────────────────────────────┘
```

### Public Discovery Page
```
/discover

┌─────────────────────────────────────────────────────┐
│  Discover Tournaments                               │
│  [Search by name, location, date...]                │
├─────────────────────────────────────────────────────┤
│  🔴 Live Now                                        │
│  - Battle Under Lights S2 (Chicago)                │
│  - Spring Smash (Austin)                            │
│                                                      │
│  📅 Upcoming                                        │
│  - Summer Championship (Miami) - Aug 15             │
│  - Weekend Warriors (Denver) - Aug 20               │
│                                                      │
│  ✓ Recently Completed                              │
│  - March Madness (NYC) - Mar 15                     │
└─────────────────────────────────────────────────────┘
```

---

## Conclusion

### Current State (Core MVP)
The implemented system provides:
- ✅ **Directors** have court management, status overview, and round advancement control
- ✅ **Referees** have frictionless court-centric scoring with auto-loading matches
- ✅ **Spectators** have comprehensive fixture views with multiple modes and court information
- ✅ **Automatic workflows** for court assignment, winner pairing, and tournament progression

### Next Phase (Multi-Tenant SaaS)
Before adding features, establish business foundation:
- 🎯 **Authentication** for directors (NextAuth.js)
- 🎯 **Multi-tenancy** with data isolation (RLS policies)
- 🎯 **Dashboard** for tournament management
- 🎯 **Public discovery** page
- 🎯 **Token-based access** for players/referees

### Future Vision
The complete ecosystem will include:
- 🔮 **Real-time updates** across all views without refresh
- 🔮 **Player personal views** with notifications and match tracking
- 🔮 **Notification system** via email/SMS/push
- 🔮 **Advanced features** like offline scoring, error correction, and projections
- 🔮 **Enterprise features** for large organizations

**The foundation is solid. The core workflows are battle-tested. The SaaS transformation will unlock monetization and scale.**