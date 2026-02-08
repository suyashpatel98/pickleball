# Short-Term Demo Plan

**Goal:** Prepare customer demo showcasing all 4 user journeys WITHOUT implementing full authentication/multi-tenancy.

**Timeline:** ASAP (before customer demo)

**Strategy:** Use existing URL-based view separation. No auth needed for demo.

---

## ✅ Already Built (90% Complete)

### 1. Director View (`/tournaments/{id}/manage`)
- ✅ Court management (create, edit, delete)
- ✅ Tournament progress overview
- ✅ Round advancement controls
- ✅ Court status monitoring
- ✅ Match assignment visibility

**Demo Script:**
> "As a tournament director, you access the management dashboard to oversee the entire tournament. You can create courts, monitor progress, and advance rounds when all matches complete."

### 2. Referee View (`/courts/{id}`)
- ✅ Court-centric interface
- ✅ Current match display
- ✅ Score entry (game-by-game)
- ✅ Match completion
- ✅ Auto-loads next match
- ✅ Works on mobile (responsive)

**Demo Script:**
> "Each referee gets a unique court URL they open on their phone or tablet. They stay on this one page all day, scoring matches as they happen. When they complete a match, the next one automatically appears."

### 3. Spectator View (`/tournaments/{id}`)
- ✅ Public tournament page
- ✅ Multiple view modes (pool-wise, court-wise, status-wise)
- ✅ Live bracket visualization
- ✅ Match results
- ✅ Standings/tables
- ✅ No authentication required

**Demo Script:**
> "Anyone can view the tournament publicly - parents, friends, other players. They can see live scores, brackets, and standings. No login required."

---

## 🚧 Need to Build (10% Remaining)

### 4. Player Personal View (`/tournaments/{id}/players/{player_id}`)

**Priority:** HIGH - This is the missing piece for demo

**What to Build:**

#### Page: `/src/app/tournaments/[id]/players/[player_id]/page.tsx`

**Features to Include:**

1. **Player Header**
   - Player name
   - Tournament name
   - Status: "✅ Active", "⏸️ Waiting", "🏆 Champion", or "❌ Eliminated"

2. **Next Match Section** (if active)
   - "Your Next Match"
   - Opponent name(s)
   - Court assignment (e.g., "Court 2")
   - Match time/round
   - Big "View Court" button → links to `/courts/{court_id}`

3. **Match History**
   - List of completed matches
   - Score display
   - Result (Won/Lost)
   - Round indicator

4. **Tournament Progress**
   - Current round
   - Player's path through bracket (highlighted)
   - "You are here" indicator

5. **If Eliminated**
   - Show who eliminated them
   - Show that player's progress
   - "Follow Tournament" button → spectator view

**API Needed:**
```
GET /api/tournaments/[id]/players/[player_id]

Response:
{
  player: { id, name, tournament_id },
  status: "active" | "waiting" | "eliminated" | "champion",
  next_match: { id, opponent, court, round } | null,
  match_history: [{ id, opponent, score, result, round }],
  stats: { wins, losses, games_won, games_lost }
}
```

**Implementation Time:** ~2-3 hours

**Demo Script:**
> "Each player gets a personalized URL they can bookmark. They see their next match, opponent, and which court to go to. After each match, they see results and what's coming next. No login needed - the URL itself grants access."

---

## 🎬 Demo Preparation Checklist

### Technical Setup
- [ ] Build player personal view page
- [ ] Create player API endpoint
- [ ] Test all 4 views with sample data
- [ ] Seed database with realistic tournament
- [ ] Verify mobile responsiveness (test on phone)
- [ ] Check all views update after scoring

### Demo Data
- [ ] Create tournament: "Pickleball Demo Tournament"
- [ ] Add 8 players with realistic names
- [ ] Create 2 courts: "Court 1", "Court 2"
- [ ] Generate bracket (4 first-round matches)
- [ ] Complete 2 matches (show progression)
- [ ] Leave 2 matches active (show live scoring)

### Demo Materials
- [ ] Prepare 4 URLs on separate browser tabs
- [ ] Have QR codes ready for court URLs
- [ ] Screenshot each view for backup
- [ ] Write demo script with transitions
- [ ] Test end-to-end flow (5-minute rehearsal)

---

## 🎭 Demo Flow (Recommended Order)

### 1. Start with Problem (1 min)
"Running a tournament today means clipboards, paper brackets, and constantly updating whiteboards. Players don't know when they play, referees are confused about matches, and spectators can't follow along."

### 2. Director View (2 min)
- Show creating courts
- Show tournament overview
- Show advancing rounds
- Emphasize: "One dashboard to control everything"

### 3. Referee View (2 min)
- Show scoring interface
- Complete a match
- Show next match auto-loading
- Emphasize: "Simple, one URL per court, works on any device"

### 4. Player View (2 min)
- Show personalized dashboard
- Show next match details
- Show match history
- Emphasize: "Every player knows exactly when and where they play"

### 5. Spectator View (2 min)
- Show live brackets
- Show different view modes
- Show standings
- Emphasize: "Anyone can follow along in real-time"

### 6. Tie it Together (1 min)
"Four different experiences, one platform. No apps to download, just open a link."

---

## 🚀 Post-Demo: Transition to Full Product

After successful demo, explain next steps:

### What's Missing (Authentication Phase 0.5)
- "Right now this is a single tournament demo"
- "For production, we need:"
  - Director accounts (you sign up, manage YOUR tournaments)
  - Multi-tenancy (your data stays private)
  - Player tokens (secure access to personal views)
  - Discovery page (public tournament browsing)

### Timeline
- "We can have the full authenticated version ready in 2-3 weeks"
- "Then you can start using it for real tournaments"

---

## 📝 Technical Notes

### No Authentication = Simplified Demo
For the demo, anyone with the URL can access any view. This is FINE because:
- It's a controlled demo environment
- Makes it easy to show all perspectives
- Matches the final architecture (just without auth layer)

### After Demo: Add Auth Layer
The URL structure stays the same, just add:
- `/tournaments/{id}/manage` → requires director login
- `/tournaments/{id}/players/{token}` → validates token (UUID, not player_id)
- `/courts/{id}` → optional PIN protection
- `/tournaments/{id}` → stays public

### Data Isolation
Demo uses single database. Production will use:
- Row-Level Security (RLS) in Supabase
- `created_by` column to filter tournaments
- Token validation for player access

---

## ⚡ Quick Implementation Guide

### Build Player View (Step by Step)

1. **Create API Route** (`/src/app/api/tournaments/[id]/players/[player_id]/route.ts`)
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string; player_id: string } }
) {
  const { id: tournament_id, player_id } = params

  // Get player info
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', player_id)
    .single()

  // Get matches where player participated
  const { data: matches } = await supabase
    .from('matches')
    .select('*, player_a(*), player_b(*)')
    .eq('tournament_id', tournament_id)
    .or(`slot_a.eq.${player_id},slot_b.eq.${player_id}`)
    .order('round', { ascending: true })

  // Find next match (not completed)
  const nextMatch = matches.find(m =>
    m.status !== 'completed' && m.status !== 'finished'
  )

  // Calculate stats
  const completedMatches = matches.filter(m =>
    m.status === 'completed' || m.status === 'finished'
  )
  const wins = completedMatches.filter(m => m.winner === player_id).length
  const losses = completedMatches.length - wins

  return NextResponse.json({
    player,
    status: nextMatch ? 'active' : (wins > 0 ? 'eliminated' : 'waiting'),
    next_match: nextMatch,
    match_history: completedMatches,
    stats: { wins, losses }
  })
}
```

2. **Create Page Component** (`/src/app/tournaments/[id]/players/[player_id]/page.tsx`)
```typescript
export default async function PlayerPersonalView({
  params
}: {
  params: { id: string; player_id: string }
}) {
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/tournaments/${params.id}/players/${params.player_id}`
  ).then(res => res.json())

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <PlayerHeader player={data.player} status={data.status} />

      {data.next_match && (
        <NextMatchCard match={data.next_match} />
      )}

      <MatchHistory matches={data.match_history} />

      <PlayerStats stats={data.stats} />
    </div>
  )
}
```

3. **Test with URL**
```
http://localhost:3000/tournaments/123/players/abc-player-id
```

---

## ✅ Success Criteria

Demo is ready when:
- [ ] All 4 views work on localhost
- [ ] Can score a match in referee view → see it update in spectator view
- [ ] Can advance round in director view → see next matches appear
- [ ] Player view shows correct next match and history
- [ ] Mobile responsive (test on phone)
- [ ] Can run through demo in 10 minutes
- [ ] No errors in console
- [ ] Data is realistic and professional

---

## 🎯 Bottom Line

**You're 90% done.** Just build the player personal view (~2-3 hours) and you have a complete demo.

**No need for:**
- ❌ Runtime config
- ❌ Authentication
- ❌ Multi-tenancy
- ❌ Backend permission changes

**Just use:**
- ✅ Different URLs for different views
- ✅ Open multiple browser tabs
- ✅ Show customer the full experience

After the demo succeeds, THEN implement Phase 0.5 for production.

---

**Last Updated:** 2026-02-07
