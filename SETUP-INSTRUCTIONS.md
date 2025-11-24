# Tournament Fixtures UI - Setup Instructions

## Overview
I've created a KHELCLUB-style tournament fixtures UI with pool-based round-robin support for doubles matches.

## Step 1: Run Database Migrations

**IMPORTANT**: You must run these SQL migrations in your Supabase SQL Editor first.

Visit: https://havusghvdrtzcvxpffqg.supabase.co/project/_/sql

Copy and paste the following SQL:

```sql
-- Add new columns to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_type TEXT DEFAULT 'singles';

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  player1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pool TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS court INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS score_a INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS score_b INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_pool ON matches(pool);
CREATE INDEX IF NOT EXISTS idx_matches_team_a_id ON matches(team_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b_id ON matches(team_b_id);
```

## Step 2: Seed the Database with Dummy Data

After running the migrations, execute the following curl command to populate the database:

```bash
curl -X POST http://localhost:3000/api/dev/seed-full-tournament
```

This will create:
- 1 tournament: "Battle Under Lights - S2" (South Delhi, Round-Robin Doubles)
- 32 players with names from the reference image
- 16 teams (pairs of players)
- Pool-based matches (4 pools: A, B, C, D with 4 teams each)
- 5 completed matches in Pool A with scores

## Step 3: View the Fixtures UI

After seeding, you'll get a response with the tournament ID. Visit:

```
http://localhost:3000/tournaments/{tournament_id}/fixtures
```

Or use the tournament ID from the API response.

## What Was Created

### New Components
1. **TournamentFixtures** (`src/components/TournamentFixtures.tsx`)
   - KHELCLUB-style UI with navy header
   - Navigation tabs: Fixtures, Standings, Table, Stats, Details
   - Format selection: Round Robin / Knockouts
   - View modes: Court-wise, Pool-wise, Status-wise
   - Pool selection (A, B, C, D, etc.)
   - Match cards with team info, scores, and status

### New API Endpoints
1. **POST /api/teams** - Create a team
2. **GET /api/teams?tournament_id={id}** - Get teams for a tournament
3. **POST /api/tournaments/{id}/generate-pools** - Generate pool-based matches
4. **PATCH /api/matches/{id}** - Update match scores and status
5. **POST /api/dev/seed-full-tournament** - Seed complete tournament data

### New Page Routes
1. **/tournaments/{id}/fixtures** - Tournament fixtures page with KHELCLUB UI

### Updated Files
1. **src/types/db.ts** - Added Team type and updated Match/Tournament types
2. **src/app/api/tournaments/[id]/route.ts** - Now includes teams in response
3. **src/app/api/matches/[id]/route.ts** - Supports team-based matches and PATCH requests

## Features

### Pool-Based Round Robin
- Automatic pool assignments (A, B, C, D)
- Round-robin match generation within each pool
- Support for multiple pools

### Match Display
- Green card backgrounds (matching KHELCLUB style)
- Team information with both players
- Match ID, Team IDs displayed
- Scores prominently shown
- Status badges: Scheduled / Live / Completed
- Pool and court assignments

### Navigation
- Tab-based navigation
- Round selection
- View mode switching
- Pool filtering

## Database Schema Changes

### Teams Table
```
- id: UUID (PK)
- tournament_id: UUID (FK to tournaments)
- team_name: TEXT
- player1_id: UUID (FK to players)
- player2_id: UUID (FK to players, nullable)
- created_at: TIMESTAMP
```

### Matches Table (New Columns)
```
- pool: TEXT
- court: INTEGER
- team_a_id: UUID (FK to teams)
- team_b_id: UUID (FK to teams)
- score_a: INTEGER
- score_b: INTEGER
```

### Tournaments Table (New Columns)
```
- location: TEXT
- tournament_type: TEXT ('singles' or 'doubles')
```

## Testing

1. Visit http://localhost:3000/tournaments/{tournament_id}/fixtures
2. You should see:
   - Navy blue KHELCLUB header
   - Tournament info bar with name, location, format
   - Navigation tabs (Fixtures active)
   - Round Robin / Knockouts toggle
   - Round selector
   - Court-wise / Pool-wise / Status-wise views
   - Pool selector (A, B, C, D)
   - Match cards in green with team info and scores
   - 5 completed matches in Pool A

## Validation Commands

Check tournament was created:
```bash
curl http://localhost:3000/api/tournaments
```

Check teams were created:
```bash
curl "http://localhost:3000/api/teams?tournament_id={tournament_id}"
```

Check matches were created:
```bash
curl http://localhost:3000/api/tournaments/{tournament_id}
```

## Notes

- The UI matches the KHELCLUB screenshot style
- Uses navy blue (#2c3e50) header like the reference
- Green match cards (#f0fdf4) matching the screenshot
- All 32 players from the reference image are created
- Team names follow BLS_X_15 pattern from screenshot
- Real-time updates work via Supabase Realtime (inherited from existing code)

## Next Steps

If you want to extend this:
1. Implement Standings, Table, Stats tabs
2. Add court assignment functionality
3. Add live score updating
4. Implement knockout phase after pools
5. Add team management UI
6. Add player swapping between teams
