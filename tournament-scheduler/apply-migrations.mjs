import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Connecting to Supabase...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('Starting migrations...\n')

  // Since we can't run DDL via the JS client easily, we'll just test the connection
  // and output instructions
  const { data: tables, error } = await supabase
    .from('tournaments')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error connecting to database:', error.message)
    process.exit(1)
  }

  console.log('✓ Database connection successful!')
  console.log('\nPlease run the following SQL in your Supabase SQL Editor:')
  console.log('https://havusghvdrtzcvxpffqg.supabase.co/project/_/sql')
  console.log('\n' + '='.repeat(80))
  console.log(`
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
  `)
  console.log('='.repeat(80))
  console.log('\nAfter running the SQL, execute the seed script:')
  console.log('  chmod +x seed-tournament.sh && ./seed-tournament.sh')
}

runMigration()
