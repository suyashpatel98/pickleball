# Project Details

## Database Schema

### Tables

#### `match_scores`
```sql
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
```

#### `matches`
```sql
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
  team_a_id uuid null,
  team_b_id uuid null,
  score_a integer null,
  score_b integer null,
  court_id uuid null,
  constraint matches_pkey primary key (id),
  constraint matches_slot_a_fkey foreign KEY (slot_a) references players (id),
  constraint matches_slot_b_fkey foreign KEY (slot_b) references players (id),
  constraint matches_team_a_id_fkey foreign KEY (team_a_id) references teams (id) on delete set null,
  constraint matches_team_b_id_fkey foreign KEY (team_b_id) references teams (id) on delete set null,
  constraint matches_tournament_id_fkey foreign KEY (tournament_id) references tournaments (id) on delete CASCADE,
  constraint matches_court_id_fkey foreign KEY (court_id) references courts (id) on delete set null,
  constraint matches_winner_fkey foreign KEY (winner) references players (id)
) TABLESPACE pg_default;

create index IF not exists idx_matches_pool on public.matches using btree (pool) TABLESPACE pg_default;

create index IF not exists idx_matches_team_a_id on public.matches using btree (team_a_id) TABLESPACE pg_default;

create index IF not exists idx_matches_team_b_id on public.matches using btree (team_b_id) TABLESPACE pg_default;

create index IF not exists idx_matches_court_id on public.matches using btree (court_id) TABLESPACE pg_default;

create index IF not exists idx_matches_court_status on public.matches using btree (court_id, status) TABLESPACE pg_default;
```

#### `players`
```sql
create table public.players (
  id uuid not null default gen_random_uuid (),
  name text not null,
  email text null,
  dupr numeric null,
  created_at timestamp with time zone null default now(),
  constraint players_pkey primary key (id)
) TABLESPACE pg_default;
```

#### `registrations`
```sql
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
```

#### `teams`
```sql
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
```

#### `tournaments`
```sql
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
```

#### `courts`
```sql
create table public.courts (
  id uuid not null default gen_random_uuid (),
  tournament_id uuid null,
  name text not null,
  location_notes text null,
  created_at timestamp with time zone null default now(),
  constraint courts_pkey primary key (id),
  constraint courts_tournament_id_fkey foreign key (tournament_id) references tournaments (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists idx_courts_tournament_id on public.courts using btree (tournament_id) TABLESPACE pg_default;
```

---

## All Exposed APIs

### Tournament Management

#### `GET /api/tournaments`
- **Purpose**: Retrieve all tournaments
- **Response**: Array of tournaments ordered by date (ascending)
- **Example Response**:
  ```json
  [
    {
      "id": "uuid",
      "name": "Tournament Name",
      "date": "2025-01-20",
      "format": "single-elim",
      "tournament_type": "singles",
      "location": null,
      "created_at": "timestamp"
    }
  ]
  ```
- **Status Codes**: 200 (success), 500 (error)

#### `POST /api/tournaments`
- **Purpose**: Create a new tournament
- **Request Body**:
  - `name` (string, required)
  - `date` (string, optional)
  - `format` (string, optional, defaults to 'single-elim')
  - `location` (string, optional)
  - `tournament_type` (string, optional, defaults to 'singles')
- **Response**: Created tournament object
- **Status Codes**: 201 (created), 400 (missing name), 500 (error)

#### `GET /api/tournaments/[id]`
- **Purpose**: Retrieve complete tournament details
- **URL Parameters**: `id` (tournament UUID)
- **Response**: Tournament data with registrations, matches, and teams
- **Status Codes**: 200 (success), 404 (not found), 500 (error)

#### `POST /api/tournaments/[id]/register`
- **Purpose**: Register a player in a tournament
- **URL Parameters**: `id` (tournament UUID)
- **Request Body** (either/or):
  - `player_id` (UUID) - Register existing player
  - OR `name` (string) - Create and register new player with optional `email` and `dupr`
- **Response**: Registration object
- **Status Codes**: 200 (success), 400 (missing required fields), 500 (error)

#### `POST /api/tournaments/[id]/generate`
- **Purpose**: Generate single-elimination bracket
- **URL Parameters**: `id` (tournament UUID)
- **Functionality**:
  - Validates courts exist (required)
  - Seeds players by DUPR rating (highest first)
  - Generates bracket with BYE matches
  - Creates round 1 matches
  - Auto-assigns courts using round-robin distribution
- **Response**: Seeded matches and bracket structure
- **Status Codes**: 200 (success), 400 (no players or no courts), 500 (error)

#### `POST /api/tournaments/[id]/generate-pools`
- **Purpose**: Generate pool/group stage matches
- **URL Parameters**: `id` (tournament UUID)
- **Request Body** (optional):
  - `pools` (array, defaults to ['A', 'B', 'C', 'D'])
  - `teams_per_pool` (number, defaults to 4)
- **Functionality**: Distributes teams into pools and generates round-robin matches
- **Validation**: Requires courts to exist before generation
- **Response**: Generated matches and pool assignments
- **Status Codes**: 200 (success), 400 (no teams or no courts), 500 (error)

#### `POST /api/tournaments/[id]/advance-round`
- **Purpose**: Advance tournament to next round
- **URL Parameters**: `id` (tournament UUID)
- **Request Body**: Empty (no parameters)
- **Functionality**:
  - Finds current round (highest round number)
  - Validates all current round matches are completed
  - Extracts winners from completed matches
  - Pairs winners for next round
  - Creates new matches with round-robin court assignment
  - Detects tournament completion (1 winner remaining)
- **Response (Success - Advanced)**:
  ```json
  {
    "message": "Advanced to Round 2",
    "current_round": 1,
    "next_round": 2,
    "matches_created": 1,
    "winners_advanced": 2,
    "matches": [...]
  }
  ```
- **Response (Success - Complete)**:
  ```json
  {
    "message": "Tournament complete!",
    "champion": "uuid",
    "final_round": 2
  }
  ```
- **Status Codes**: 200 (success), 400 (incomplete matches or no courts), 500 (error)

---

### Team Management

#### `GET /api/teams`
- **Purpose**: Retrieve all teams for a tournament
- **Query Parameters**: `tournament_id` (UUID, required)
- **Response**: Array of teams with player details
- **Example Response**:
  ```json
  [
    {
      "id": "uuid",
      "tournament_id": "uuid",
      "team_name": "Team Name",
      "player1_id": "uuid",
      "player2_id": "uuid",
      "created_at": "timestamp",
      "player1": { "id": "uuid", "name": "Player 1" },
      "player2": { "id": "uuid", "name": "Player 2" }
    }
  ]
  ```
- **Status Codes**: 200 (success), 400 (missing tournament_id), 500 (error)

#### `POST /api/teams`
- **Purpose**: Create a new team
- **Request Body**:
  - `tournament_id` (UUID, required)
  - `team_name` (string, required)
  - `player1_id` (UUID, required)
  - `player2_id` (UUID, optional)
- **Response**: Created team object
- **Status Codes**: 201 (created), 400 (missing required fields), 500 (error)

---

### Court Management

#### `POST /api/tournaments/[id]/courts`
- **Purpose**: Create a new court for a tournament
- **URL Parameters**: `id` (tournament UUID)
- **Request Body**:
  - `name` (string, required) - Court name (e.g., "Court 1", "Main Court")
  - `location_notes` (string, optional) - Location details (e.g., "Near main entrance")
- **Response**: Created court object
- **Example Response**:
  ```json
  {
    "court": {
      "id": "uuid",
      "tournament_id": "uuid",
      "name": "Court 1",
      "location_notes": "Near main entrance",
      "created_at": "timestamp"
    }
  }
  ```
- **Status Codes**: 201 (created), 400 (missing name), 500 (error)

#### `GET /api/tournaments/[id]/courts`
- **Purpose**: Retrieve all courts for a tournament
- **URL Parameters**: `id` (tournament UUID)
- **Response**: Array of court objects
- **Example Response**:
  ```json
  [
    {
      "id": "uuid",
      "tournament_id": "uuid",
      "name": "Court 1",
      "location_notes": "Near main entrance",
      "created_at": "timestamp"
    }
  ]
  ```
- **Status Codes**: 200 (success), 500 (error)

#### `GET /api/courts/[id]`
- **Purpose**: Retrieve court details
- **URL Parameters**: `id` (court UUID)
- **Response**: Court object
- **Example Response**:
  ```json
  {
    "id": "uuid",
    "tournament_id": "uuid",
    "name": "Court 1",
    "location_notes": "Near main entrance",
    "created_at": "timestamp"
  }
  ```
- **Status Codes**: 200 (success), 404 (not found), 500 (error)

#### `PATCH /api/courts/[id]`
- **Purpose**: Update court details
- **URL Parameters**: `id` (court UUID)
- **Request Body** (all optional):
  - `name` (string)
  - `location_notes` (string)
- **Response**: Updated court object
- **Example Response**:
  ```json
  {
    "court": {
      "id": "uuid",
      "name": "Court 1 - Updated",
      "location_notes": "New location"
    }
  }
  ```
- **Status Codes**: 200 (success), 404 (not found), 500 (error)

#### `DELETE /api/courts/[id]`
- **Purpose**: Delete a court
- **URL Parameters**: `id` (court UUID)
- **Functionality**: Deletes court and unassigns matches (sets court_id to null)
- **Response**: Success message
- **Example Response**:
  ```json
  {
    "message": "Court deleted successfully"
  }
  ```
- **Status Codes**: 200 (success), 404 (not found), 500 (error)

#### `GET /api/courts/[id]/matches`
- **Purpose**: Retrieve match queue for a specific court (referee view)
- **URL Parameters**: `id` (court UUID)
- **Response**: Court details with current, next, and upcoming matches
- **Example Response**:
  ```json
  {
    "court": {
      "id": "uuid",
      "name": "Court 1"
    },
    "current_match": {
      "id": "uuid",
      "round": 1,
      "status": "live",
      "player_a": { "id": "uuid", "name": "Player 1" },
      "player_b": { "id": "uuid", "name": "Player 2" }
    },
    "next_match": {
      "id": "uuid",
      "round": 1,
      "status": "scheduled",
      "player_a": { "id": "uuid", "name": "Player 3" },
      "player_b": { "id": "uuid", "name": "Player 4" }
    },
    "upcoming_matches": [...]
  }
  ```
- **Functionality**:
  - `current_match`: First 'live' match, or first 'scheduled' if none live, or null
  - `next_match`: First scheduled match after current
  - `upcoming_matches`: Queue of future matches (up to next 3)
  - Includes full player/team data
  - Ordered by round, created_at
- **Status Codes**: 200 (success), 404 (court not found), 500 (error)

---

### Match Management

#### `GET /api/matches/[id]`
- **Purpose**: Retrieve detailed match information
- **URL Parameters**: `id` (match UUID)
- **Response**: Match object with team/player info (supports both singles and doubles)
- **Example Response**:
  ```json
  {
    "id": "uuid",
    "tournament_id": "uuid",
    "round": 1,
    "slot_a": "uuid",
    "slot_b": "uuid",
    "team_a": { "id": "uuid", "team_name": "..." },
    "team_b": { "id": "uuid", "team_name": "..." },
    "player_a": { "id": "uuid", "name": "..." },
    "player_b": { "id": "uuid", "name": "..." },
    "score_a": 15,
    "score_b": 12,
    "winner": "uuid",
    "status": "completed"
  }
  ```
- **Status Codes**: 200 (success), 404 (not found)

#### `PATCH /api/matches/[id]`
- **Purpose**: Update match scores and status
- **URL Parameters**: `id` (match UUID)
- **Request Body** (all optional):
  - `score_a` (number)
  - `score_b` (number)
  - `status` (string)
  - `winner` (UUID)
- **Functionality**: Auto-calculates winner if both scores provided
- **Response**: Updated match object directly
- **Example Response**:
  ```json
  {
    "id": "uuid",
    "score_a": 15,
    "score_b": 12,
    "winner": "uuid",
    "status": "completed"
  }
  ```
- **Status Codes**: 200 (success), 500 (error)

#### `PATCH /api/matches/[id]/update`
- **Purpose**: Update match scores and status (alternative endpoint)
- **URL Parameters**: `id` (match UUID)
- **Request Body**: Same as `PATCH /api/matches/[id]`
- **Response**: Updated match object directly
- **Example Response**:
  ```json
  {
    "id": "uuid",
    "score_a": 12,
    "score_b": 14,
    "winner": "uuid",
    "status": "completed"
  }
  ```
- **Status Codes**: 200 (success), 400 (missing ID), 500 (error)

#### `POST /api/matches/[id]/score`
- **Purpose**: Submit detailed game-by-game scores
- **URL Parameters**: `id` (match UUID)
- **Request Body**:
  - `games` (array of objects with `a` and `b` score properties, required)
  - `winner` (UUID, optional, for verification)
- **Request Example**:
  ```json
  {
    "games": [
      { "a": 11, "b": 9 },
      { "a": 8, "b": 11 },
      { "a": 11, "b": 7 }
    ]
  }
  ```
- **Functionality**:
  - Accepts array of game scores
  - Determines winner based on games won (best of 3)
  - Stores detailed score in `match_scores` table
  - Updates match status to 'completed'
- **Response**: Updated match object directly
- **Example Response**:
  ```json
  {
    "id": "uuid",
    "winner": "uuid",
    "status": "completed"
  }
  ```
- **Status Codes**: 200 (success), 400 (no games/tie), 404 (not found), 500 (error)

#### `PATCH /api/matches/[id]/court`
- **Purpose**: Assign or unassign a match to a court
- **URL Parameters**: `id` (match UUID)
- **Request Body**:
  - `court_id` (UUID or null, required)
- **Request Example (Assign)**:
  ```json
  {
    "court_id": "court-uuid"
  }
  ```
- **Request Example (Unassign)**:
  ```json
  {
    "court_id": null
  }
  ```
- **Functionality**:
  - Validates court exists before assignment
  - Allows unassigning by passing null
- **Response**: Updated match object
- **Example Response**:
  ```json
  {
    "match": {
      "id": "uuid",
      "court_id": "court-uuid"
    }
  }
  ```
- **Status Codes**: 200 (success), 400 (court not found), 404 (match not found), 500 (error)

---

## Development & Testing

### Data Seeding API

#### `POST /api/dev/seed`
- **Purpose**: Create a complete singles knockout tournament using only exposed APIs
- **Request Body**: Empty (no parameters)
- **Response**:
  ```json
  {
    "success": true,
    "tournament_id": "uuid-string",
    "courts_created": 2,
    "players_created": 4,
    "matches_created": 2,
    "format": "knockout (single-elimination)",
    "view_url": "/tournaments/{tournament_id}",
    "manage_url": "/tournaments/{tournament_id}/manage"
  }
  ```
- **Created Data**:
  - **Tournament**: "Battle Under Lights - S2" (date: 2025-01-20, format: single-elim, type: singles)
  - **2 Courts**:
    - Court 1 (Main Court)
    - Court 2 (Side Court)
  - **4 Players**: player_1 through player_4 with emails `player0@example.com` through `player3@example.com`
    - player_1: DUPR 3.0
    - player_2: DUPR 3.5
    - player_3: DUPR 4.0
    - player_4: DUPR 4.5
  - **2 Semi-Final Matches** (Round 1):
    - Seeded by DUPR rating (highest vs lowest)
    - Automatically assigned to courts (round-robin)
    - Automatically generated by the bracket API
- **Uses Following APIs**:
  - `POST /api/tournaments` - Creates the tournament
  - `POST /api/tournaments/[id]/courts` - Creates courts (x2)
  - `POST /api/tournaments/[id]/register` - Registers each player (creates player if needed)
  - `POST /api/tournaments/[id]/generate` - Generates single-elimination bracket matches with court assignments
- **Tournament Structure**:
  - 2 courts → 4 players → 2 semi-finals → 1 final (created when semis complete via advance-round)
- **Status Codes**: 200 (success), 500 (error)

---

### Quick Setup Guide

To set up a complete test tournament:

1. **Clear existing data** (optional, if needed):
   ```sql
   delete from tournaments;
   delete from match_scores;
   delete from matches;
   delete from players;
   delete from registrations;
   delete from teams;
   ```

2. **Seed tournament data**:
   ```bash
   curl -X POST http://localhost:3000/api/dev/seed
   ```

3. **Access the tournament**:
   - Navigate to the URL returned in `view_url`
   - Or visit `/tournaments` to see all tournaments


