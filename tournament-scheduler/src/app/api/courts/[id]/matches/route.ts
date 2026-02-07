import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/courts/{courtId}/matches
 *
 * Returns matches for a specific court:
 * - current_match: The active match (status='live') or next scheduled match
 * - next_match: The match after current
 * - upcoming_matches: Queue of future matches
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courtId } = await params

    // Verify court exists
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single()

    if (courtError || !court) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      )
    }

    // Get all matches for this court, ordered by round and created_at
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!matches_team_a_id_fkey(
          *,
          player1:players!teams_player1_id_fkey(*),
          player2:players!teams_player2_id_fkey(*)
        ),
        team_b:teams!matches_team_b_id_fkey(
          *,
          player1:players!teams_player1_id_fkey(*),
          player2:players!teams_player2_id_fkey(*)
        )
      `)
      .eq('court_id', courtId)
      .order('round', { ascending: true })
      .order('created_at', { ascending: true })

    if (matchesError) {
      return NextResponse.json(
        { error: matchesError.message },
        { status: 500 }
      )
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        court,
        current_match: null,
        next_match: null,
        upcoming_matches: [],
      })
    }

    // For singles matches, also fetch player info
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        let player_a = null
        let player_b = null

        if (match.slot_a) {
          const { data } = await supabase
            .from('players')
            .select('*')
            .eq('id', match.slot_a)
            .single()
          player_a = data
        }

        if (match.slot_b) {
          const { data } = await supabase
            .from('players')
            .select('*')
            .eq('id', match.slot_b)
            .single()
          player_b = data
        }

        return {
          ...match,
          player_a,
          player_b,
        }
      })
    )

    // Determine current match:
    // 1. If there's a 'live' match, that's current
    // 2. Otherwise, the first 'scheduled' match
    // 3. Otherwise, null
    let currentMatch = enrichedMatches.find((m) => m.status === 'live')

    if (!currentMatch) {
      currentMatch = enrichedMatches.find((m) => m.status === 'scheduled') || null
    }

    // Get remaining matches (not completed, not current)
    const remainingMatches = enrichedMatches.filter(
      (m) => m.status !== 'completed' && m.id !== currentMatch?.id
    )

    // Next match is first in remaining
    const nextMatch = remainingMatches[0] || null

    // Upcoming matches are the rest
    const upcomingMatches = remainingMatches.slice(1)

    return NextResponse.json({
      court,
      current_match: currentMatch,
      next_match: nextMatch,
      upcoming_matches: upcomingMatches,
    })
  } catch (error) {
    console.error('Error fetching court matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
