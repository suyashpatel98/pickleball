import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/courts/{courtId}/matches
 *
 * Returns matches assigned to a specific court.
 * This endpoint is needed for the court-centric referee view at /courts/{courtId}
 *
 * Expected response:
 * {
 *   court: { id: string, name: string, tournament_id: string },
 *   current_match: Match | null,  // The active or next scheduled match for this court
 *   next_match: Match | null,      // The match after current
 *   upcoming_matches: Match[]      // Queue of future matches
 * }
 *
 * TODO: Implement this endpoint once courts table is created
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // TODO: Implement court-based match retrieval
  // 1. Get court details from courts table
  // 2. Find matches assigned to this court
  // 3. Determine current match (status = 'live' or earliest 'scheduled')
  // 4. Get next match in queue
  // 5. Get upcoming matches

  return NextResponse.json(
    {
      error: 'Court-based match retrieval not yet implemented',
      message: 'This endpoint requires: (1) courts table in database, (2) matches.court_id foreign key, (3) court assignment logic',
      court_id: id,
    },
    { status: 501 } // 501 Not Implemented
  )
}
