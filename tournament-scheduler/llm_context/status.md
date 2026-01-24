# Tournament Scheduler - Implementation Status & Testing Guide

## COMPLETED FEATURES ✓

### Backend APIs (All Implemented)
1. ✓ `GET /api/tournaments` - List all tournaments
2. ✓ `POST /api/tournaments` - Create new tournament
3. ✓ `GET /api/tournaments/[id]` - Get tournament details with matches & registrations
4. ✓ `POST /api/tournaments/[id]/register` - Register player to tournament
5. ✓ `POST /api/tournaments/[id]/generate` - Generate bracket with DUPR seeding
6. ✓ `GET /api/matches/[id]` - Get match details with player info
7. ✓ `POST /api/matches/[id]/score` - Submit match score and advance winner

### Frontend Pages & Components
1. ✓ **Tournament List (Home)** - `src/app/page.tsx`
   - Lists all tournaments
   - Create tournament button
   - Links to tournament details

2. ✓ **Create Tournament Modal** - `src/components/CreateTournamentModal.tsx`
   - Form: name, date, format
   - Creates tournament via API

3. ✓ **Tournament Detail Page** - `src/app/tournaments/[id]/page.tsx`
   - Left: Bracket visualization (matches grouped by round)
   - Right: Player registrations with seeds
   - Generate bracket button
   - Add player button
   - Real-time updates via Supabase Realtime

4. ✓ **Register Player Modal** - `src/components/RegisterPlayerModal.tsx`
   - Form: name, email, DUPR rating
   - Registers player to tournament

5. ✓ **Match Detail / Referee Page** - `src/app/matches/[id]/page.tsx`
   - Shows match players with DUPR & seeds
   - Score entry form (best of 3 games)
   - Submit score functionality
   - Auto-calculates winner
   - Read-only view for finished matches

### Core Features
1. ✓ **DUPR-based Seeding** - Players sorted by DUPR rating (descending)
2. ✓ **Single-Elimination Bracket** - Supports power-of-2 brackets with BYEs
3. ✓ **Automatic BYE Handling** - Top seeds get BYEs, auto-advance
4. ✓ **Match Progression** - Winners automatically advance to next round
5. ✓ **Real-time Updates** - Tournament page updates live when scores submitted
6. ✓ **Status Tracking** - Matches show: scheduled | live | finished

---

## END-TO-END TESTING GUIDE

### Prerequisites
1. Ensure Supabase project is running with all tables created
2. Run `npm run dev` in the tournament-scheduler directory
3. Open http://localhost:3000

### Test Workflow

#### Step 1: Create Tournament
1. Go to http://localhost:3000
2. Click "Create Tournament" button
3. Fill in:
   - Name: "Test Tournament"
   - Date: Select any future date
   - Format: "single-elim" (default)
4. Click "Create Tournament"
5. **Expected:** Modal closes, new tournament appears in list

#### Step 2: Register Players
1. Click on the tournament you just created
2. Click "+ Add" button in the Players section
3. Register multiple players (suggest 5-8 for testing):
   - Player 1: Name: "Alice", DUPR: 5.5
   - Player 2: Name: "Bob", DUPR: 4.2
   - Player 3: Name: "Charlie", DUPR: 5.0
   - Player 4: Name: "Diana", DUPR: 3.8
   - Player 5: Name: "Eve", DUPR: 4.8
   - Player 6: Name: "Frank", DUPR: 3.5
4. **Expected:** Each player appears in the Players list immediately after registration

#### Step 3: Generate Bracket
1. Click "Generate Bracket" button
2. **Expected:**
   - Button shows "Generating..."
   - Bracket appears on the left side
   - Players are seeded by DUPR (Alice #1, Charlie #2, Eve #3, Bob #4, Diana #5, Frank #6)
   - Round 1 shows matches with proper seeding
   - BYEs appear for top seeds if player count isn't power of 2

#### Step 4: Submit Match Scores (Single Tab)
1. Click on any Round 1 match
2. You'll be taken to `/matches/{match-id}`
3. Enter game scores:
   - Game 1: 11 - 8
   - Game 2: 9 - 11
   - Click "+ Add Game"
   - Game 3: 11 - 7
4. Click "Submit Score"
5. **Expected:**
   - Redirected back to tournament detail page
   - Match shows "finished" status
   - Winner is highlighted in green
   - Next round match is updated with winner

#### Step 5: Test Real-time Updates (Two Tabs)
1. Open tournament detail page in TWO browser tabs/windows side-by-side
2. In Tab 1: Click on a match → submit score
3. **Watch Tab 2:** Should automatically update without refresh
   - Match status changes to "finished"
   - Winner appears in green
   - Next round updates with winner
4. **Expected:** Real-time updates work instantly

#### Step 6: Complete Tournament
1. Submit scores for all Round 1 matches
2. **Expected:** Round 2 matches populate with winners
3. Submit scores for Round 2 matches
4. **Expected:** Continue until tournament completes
5. Final match winner is the tournament champion

#### Step 7: View Finished Match
1. Click on any finished match
2. **Expected:**
   - Shows read-only view
   - Winner badge displayed
   - No score entry form (match is complete)

---

## API TESTING (Using curl or Postman)

### Create Tournament
```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test Tournament","date":"2025-01-20","format":"single-elim"}'
```

### Register Player
```bash
curl -X POST http://localhost:3000/api/tournaments/{tournament-id}/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Player","email":"test@example.com","dupr":4.5}'
```

### Generate Bracket
```bash
curl -X POST http://localhost:3000/api/tournaments/{tournament-id}/generate
```

### Get Match Details
```bash
curl http://localhost:3000/api/matches/{match-id}
```

### Submit Score
```bash
curl -X POST http://localhost:3000/api/matches/{match-id}/score \
  -H "Content-Type: application/json" \
  -d '{
    "games": [{"a":11,"b":8},{"a":9,"b":11},{"a":11,"b":7}],
    "winner": "{player-uuid}"
  }'
```

---

## Tables that exist in DB

### match_scores table

create table public.match_scores (
  id uuid not null default gen_random_uuid (),
  match_id uuid null,
  scorer_id uuid null,
  score_json jsonb null,
  created_at timestamp with time zone null default now(),
  constraint match_scores_pkey primary key (id),
  constraint match_scores_match_id_fkey foreign KEY (match_id) references matches (id) on delete CASCADE,
  constraint match_scores_scorer_id_fkey foreign KEY (scorer_id) references players (id)
) TABLESPACE pg_default;

### matches table

create table public.matches (
  id uuid not null default gen_random_uuid (),
  tournament_id uuid null,
  round integer not null,
  slot_a uuid null,
  slot_b uuid null,
  seed_a integer null,
  seed_b integer null,
  winner uuid null,
  status text null default 'scheduled'::text,
  scheduled_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  pool text null,
  court integer null,
  team_a_id uuid null,
  team_b_id uuid null,
  score_a integer null,
  score_b integer null,
  constraint matches_pkey primary key (id),
  constraint matches_slot_a_fkey foreign KEY (slot_a) references players (id),
  constraint matches_slot_b_fkey foreign KEY (slot_b) references players (id),
  constraint matches_team_a_id_fkey foreign KEY (team_a_id) references teams (id) on delete set null,
  constraint matches_team_b_id_fkey foreign KEY (team_b_id) references teams (id) on delete set null,
  constraint matches_tournament_id_fkey foreign KEY (tournament_id) references tournaments (id) on delete CASCADE,
  constraint matches_winner_fkey foreign KEY (winner) references players (id)
) TABLESPACE pg_default;

create index IF not exists idx_matches_pool on public.matches using btree (pool) TABLESPACE pg_default;

create index IF not exists idx_matches_team_a_id on public.matches using btree (team_a_id) TABLESPACE pg_default;

create index IF not exists idx_matches_team_b_id on public.matches using btree (team_b_id) TABLESPACE pg_default;

### players table

create table public.players (
  id uuid not null default gen_random_uuid (),
  name text not null,
  email text null,
  dupr numeric null,
  created_at timestamp with time zone null default now(),
  constraint players_pkey primary key (id)
) TABLESPACE pg_default;

### registrations table
create table public.registrations (
  id uuid not null default gen_random_uuid (),
  tournament_id uuid null,
  player_id uuid null,
  seed integer null,
  created_at timestamp with time zone null default now(),
  constraint registrations_pkey primary key (id),
  constraint registrations_player_id_fkey foreign KEY (player_id) references players (id) on delete CASCADE,
  constraint registrations_tournament_id_fkey foreign KEY (tournament_id) references tournaments (id) on delete CASCADE
) TABLESPACE pg_default;

### teams table
create table public.teams (
  id uuid not null default gen_random_uuid (),
  tournament_id uuid not null,
  team_name text not null,
  player1_id uuid not null,
  player2_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint teams_pkey primary key (id),
  constraint teams_player1_id_fkey foreign KEY (player1_id) references players (id) on delete CASCADE,
  constraint teams_player2_id_fkey foreign KEY (player2_id) references players (id) on delete CASCADE,
  constraint teams_tournament_id_fkey foreign KEY (tournament_id) references tournaments (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_teams_tournament_id on public.teams using btree (tournament_id) TABLESPACE pg_default;

### tournaments table
create table public.tournaments (
  id uuid not null default gen_random_uuid (),
  name text not null,
  date timestamp with time zone null,
  format text not null default 'single-elim'::text,
  created_at timestamp with time zone null default now(),
  location text null,
  tournament_type text null default 'singles'::text,
  constraint tournaments_pkey primary key (id)
) TABLESPACE pg_default;

---