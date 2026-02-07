import { NextResponse } from 'next/server'

export async function GET() {
  const migrationSQL = `
-- Court Management Migration SQL
-- This SQL has already been applied to the database

-- 1. Create courts table
CREATE TABLE IF NOT EXISTS public.courts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  location_notes text,
  created_at timestamptz DEFAULT now()
);

-- 2. Add court_id to matches table
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS court_id uuid REFERENCES public.courts(id) ON DELETE SET NULL;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_courts_tournament_id ON public.courts(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_court_id ON public.matches(court_id);
CREATE INDEX IF NOT EXISTS idx_matches_court_status ON public.matches(court_id, status);
  `.trim()

  return NextResponse.json({
    message: 'Migration SQL (informational only - already applied)',
    sql: migrationSQL
  }, { status: 200 })
}
