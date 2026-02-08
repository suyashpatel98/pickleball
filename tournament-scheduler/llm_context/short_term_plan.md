# Short-Term Demo Plan

**Goal:** Prepare customer demo showcasing all 4 user journeys WITHOUT implementing full authentication/multi-tenancy.

**Timeline:** ASAP (before customer demo)

**Strategy:** Use existing URL-based view separation. No auth needed for demo.

---

## ✅ Already Built (Complete)

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

### 4. Player Personal View (`/tournaments/{id}/players/{player_id}`)
- ✅ Player header with status badges
- ✅ Next match display with opponent and court
- ✅ Match history with results
- ✅ Win/loss statistics
- ✅ Auto-refresh every 30 seconds
- ✅ Mobile-responsive design

**Demo Script:**
> "Each player gets a personalized URL they can bookmark. They see their next match, opponent, and which court to go to. After each match, they see results and what's coming next. No login needed - the URL itself grants access."

---

## 🚧 Enhancement: Estimated Match Start Times

**Status:** PLANNED - Customer Requested Feature

**Goal:** Show players when their match is estimated to start, not just which round.

**Approach:** Simple Queue-Based Estimate (2-3 hours implementation)

### Problem
Currently players see:
```
Your Next Match
Opponent: John Doe
Court: Court 2
Round: 2
```

But they don't know **when** their match will start. Is it in 10 minutes or 2 hours?

### Solution
Show estimated start time based on queue:
```
Your Next Match
Opponent: John Doe
Court: Court 2
Estimated Start: 2:45 PM (in 35 minutes)

ℹ️ 2 matches ahead of you on this court
```

### How It Works

1. **Count matches ahead** on the same court
2. **Estimate duration**: Assume each match takes 25 minutes + 5 min buffer = 30 min total
3. **Calculate start time**: Current time + (matches_ahead × 30 minutes)
4. **Show countdown**: "in 35 minutes" or "starting soon!"

### Implementation Plan

#### Step 1: Add Estimation Logic to Player API

**File**: `/src/app/api/tournaments/[id]/players/[player_id]/route.ts`

**Add function** (before the main GET handler):
```typescript
interface MatchEstimate {
  estimated_start_time: Date
  minutes_until_start: number
  matches_ahead: number
  estimated_wait_minutes: number
}

async function estimateMatchStartTime(
  match: any,
  supabase: any
): Promise<MatchEstimate | null> {
  if (!match || !match.court_id) {
    return null
  }

  const now = new Date()

  // Get all scheduled/live matches on the same court that are ahead of this match
  // "Ahead" means: lower round number, OR same round but created earlier
  const { data: matchesAhead, error } = await supabase
    .from('matches')
    .select('id, round, created_at, status')
    .eq('court_id', match.court_id)
    .in('status', ['scheduled', 'live'])
    .or(`round.lt.${match.round},and(round.eq.${match.round},created_at.lt.${match.created_at})`)

  if (error) {
    console.error('Error fetching matches ahead:', error)
    return null
  }

  // Tournament settings (hardcoded for now)
  const AVG_MATCH_DURATION_MINUTES = 25
  const BUFFER_BETWEEN_MATCHES_MINUTES = 5
  const TOTAL_TIME_PER_MATCH = AVG_MATCH_DURATION_MINUTES + BUFFER_BETWEEN_MATCHES_MINUTES

  const matchesAheadCount = matchesAhead?.length || 0
  const estimatedWaitMinutes = matchesAheadCount * TOTAL_TIME_PER_MATCH

  const estimatedStartTime = new Date(now.getTime() + estimatedWaitMinutes * 60000)
  const minutesUntilStart = Math.max(0, Math.floor((estimatedStartTime.getTime() - now.getTime()) / 60000))

  return {
    estimated_start_time: estimatedStartTime,
    minutes_until_start: minutesUntilStart,
    matches_ahead: matchesAheadCount,
    estimated_wait_minutes: estimatedWaitMinutes
  }
}
```

**Modify the response** (in the main GET handler, before returning):
```typescript
// Before the return NextResponse.json() call, add:

// Add time estimate to next match
let nextMatchWithEstimate = nextMatchInfo
if (nextMatchInfo) {
  const estimate = await estimateMatchStartTime(nextMatch, supabase)
  if (estimate) {
    nextMatchWithEstimate = {
      ...nextMatchInfo,
      estimate: {
        start_time: estimate.estimated_start_time,
        minutes_until_start: estimate.minutes_until_start,
        matches_ahead: estimate.matches_ahead
      }
    }
  }
}

// Then update the return statement to use nextMatchWithEstimate instead of nextMatchInfo
return NextResponse.json({
  tournament,
  player,
  status,
  next_match: nextMatchWithEstimate,  // Changed from nextMatchInfo
  match_history: matchHistory,
  stats: {
    wins,
    losses,
    total_matches: completedMatches.length,
  },
})
```

#### Step 2: Update Player View UI

**File**: `/src/app/tournaments/[id]/players/[player_id]/page.tsx`

**Update types** (add to the type definitions at the top):
```typescript
type MatchEstimate = {
  start_time: string
  minutes_until_start: number
  matches_ahead: number
}

type NextMatch = {
  id: string
  round: number
  opponent: Player | TeamWithPlayers | null
  court: Court | null
  pool?: string | null
  estimate?: MatchEstimate  // Add this
}
```

**Add helper function** (before the component):
```typescript
function formatEstimatedTime(timeString: string): string {
  const time = new Date(timeString)
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function getTimeUntilMessage(minutes: number): string {
  if (minutes < 5) return 'Starting soon!'
  if (minutes < 60) return `in ${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `in ${hours}h ${mins}m`
}
```

**Update the "Next Match" section UI** (replace the existing next match card):
```tsx
{data.status === 'active' && data.next_match && (
  <Card className="mt-4 border-2 border-green-500">
    <CardHeader className="bg-green-50">
      <div className="flex items-center justify-between">
        <CardTitle className="text-green-900">Your Next Match</CardTitle>
        <Badge className="bg-green-600">Up Next</Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="space-y-4">
        {/* Estimated Time - NEW */}
        {data.next_match.estimate && (
          <div className="bg-blue-600 text-white p-4 rounded-lg text-center">
            <p className="text-sm opacity-90 mb-1">Estimated Start Time</p>
            <p className="text-3xl font-bold">
              {formatEstimatedTime(data.next_match.estimate.start_time)}
            </p>
            <p className="text-sm mt-2">
              {getTimeUntilMessage(data.next_match.estimate.minutes_until_start)}
            </p>
            {data.next_match.estimate.matches_ahead > 0 && (
              <p className="text-xs mt-3 opacity-80">
                ℹ️ {data.next_match.estimate.matches_ahead} match{data.next_match.estimate.matches_ahead > 1 ? 'es' : ''} ahead of you on this court
              </p>
            )}
          </div>
        )}

        {/* Opponent */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">You will play against</p>
          <p className="text-2xl font-bold text-gray-900">
            {getOpponentName(data.next_match.opponent)}
          </p>
          {data.next_match.pool && (
            <p className="text-sm text-muted-foreground mt-2">Pool {data.next_match.pool}</p>
          )}
        </div>

        {/* Court Info */}
        {data.next_match.court && (
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Report to</p>
            <p className="text-xl font-bold text-blue-900">
              {data.next_match.court.name}
            </p>
            {data.next_match.court.location_notes && (
              <p className="text-sm text-blue-700 mt-1">
                {data.next_match.court.location_notes}
              </p>
            )}
          </div>
        )}

        {/* Round */}
        <div className="text-center">
          <Badge variant="outline" className="text-base px-4 py-1">
            Round {data.next_match.round}
          </Badge>
        </div>

        {/* View Court Button */}
        {data.next_match.court && (
          <Button
            onClick={() => router.push(`/courts/${data.next_match!.court!.id}`)}
            className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
          >
            View Court & Live Score
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

#### Step 3: Add Tests

**File**: `/tests/api.test.ts`

**Add new test** (in the "Player Personal View" describe block):
```typescript
it('GET /api/tournaments/[id]/players/[player_id] - should include time estimates for next match', async () => {
  const response = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}/players/${playerId}`)
  const data = await response.json()

  if (data.status === 'active' && data.next_match) {
    expect(data.next_match).toHaveProperty('estimate')
    expect(data.next_match.estimate).toHaveProperty('start_time')
    expect(data.next_match.estimate).toHaveProperty('minutes_until_start')
    expect(data.next_match.estimate).toHaveProperty('matches_ahead')
    expect(typeof data.next_match.estimate.minutes_until_start).toBe('number')
    expect(data.next_match.estimate.matches_ahead).toBeGreaterThanOrEqual(0)
  }
})
```

### Success Criteria

- [ ] Player API returns `estimate` object with next match
- [ ] UI shows estimated start time (e.g., "2:45 PM")
- [ ] UI shows countdown (e.g., "in 35 minutes")
- [ ] UI shows matches ahead count (e.g., "2 matches ahead")
- [ ] Estimates update on page refresh/auto-refresh
- [ ] No errors when no matches ahead (shows "Starting soon!")
- [ ] Build succeeds with no TypeScript errors
- [ ] Test passes

### Configuration (Hardcoded for Demo)

```typescript
const AVG_MATCH_DURATION_MINUTES = 25  // Average pickleball match
const BUFFER_BETWEEN_MATCHES_MINUTES = 5  // Time to clear court and set up
```

**Later** (Phase 5): Move these to tournament settings table so directors can customize.

### Limitations (Acceptable for Demo)

⚠️ **Not Real-Time**: Estimates don't update if matches finish faster/slower than expected
- Solution: Auto-refresh every 30 seconds (already implemented)

⚠️ **Fixed Duration**: Assumes all matches take 25 minutes
- Solution: Track actual durations later (Phase 5)

⚠️ **No Court Delays**: Doesn't account for breaks, maintenance, disputes
- Solution: Add manual delay adjustments (Phase 5)

⚠️ **Queue Only**: Doesn't use actual scheduled timestamps
- Solution: Implement full scheduling system (Phase 5 - Optimal Scheduling)

### Demo Talking Points

**When showing player view:**
> "Notice the estimated start time? This is calculated by looking at how many matches are ahead of this player on their assigned court. If there are 2 matches ahead and each match takes about 25 minutes, we show 'Starting in approximately 50 minutes'. This helps players plan when to warm up and be ready."

> "The estimate updates automatically every 30 seconds as matches complete, so players always have current information."

> "In the full version, we'll track actual match durations and adjust estimates in real-time for even better accuracy."

### Implementation Time

**Estimated**: 2-3 hours
- API logic: 45 minutes
- UI updates: 1 hour
- Testing: 30 minutes
- Bug fixes: 30 minutes

### Files Modified

1. `/src/app/api/tournaments/[id]/players/[player_id]/route.ts` - Add estimation logic
2. `/src/app/tournaments/[id]/players/[player_id]/page.tsx` - Update UI
3. `/tests/api.test.ts` - Add test case

### Dependencies

- ✅ Player personal view (already built)
- ✅ Court assignments (already working)
- ✅ Match status tracking (already implemented)

### Future Enhancements (Not in Demo)

These would be Phase 5 features:
- Track actual match durations
- Learn average duration per tournament
- Allow directors to set custom durations
- Real-time estimate updates (WebSocket)
- Notifications when match is 15 minutes away
- Adjust for live delays/breaks

---

## 🎯 Demo Status

### Completed ✅
1. Director View
2. Referee View
3. Spectator View
4. Player Personal View

### Planned (Customer Request) 🚧
5. Estimated Match Start Times (2-3 hours)

### Future (Not for Demo) ❌
- Authentication & Multi-Tenancy (Phase 0.5)
- Real-time updates via WebSocket (Phase 1)
- Notifications (Phase 3)
- Optimal scheduling algorithm (Phase 5)

---

**Last Updated:** 2026-02-07 (Added Estimated Start Times plan)
