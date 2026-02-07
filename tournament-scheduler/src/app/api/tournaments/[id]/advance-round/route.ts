import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

/**
 * POST /api/tournaments/{id}/advance-round
 *
 * Advances the tournament to the next round:
 * 1. Finds all completed matches from the current round
 * 2. Extracts winners
 * 3. Creates next round matches
 * 4. Auto-assigns courts using round-robin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournament_id } = await params
    const supabase = supabaseServer()

    // Get current max round number
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('round, status, winner, slot_a, slot_b')
      .eq('tournament_id', tournament_id)
      .order('round', { ascending: false })

    if (matchesError) {
      return NextResponse.json({ error: matchesError.message }, { status: 500 })
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        error: 'No matches found for this tournament'
      }, { status: 400 })
    }

    // Find current round (highest round number)
    const currentRound = matches[0].round
    const currentRoundMatches = matches.filter(m => m.round === currentRound)

    // Check if all current round matches are completed
    const incompleteMatches = currentRoundMatches.filter(
      m => m.status !== 'completed' && m.status !== 'finished'
    )

    if (incompleteMatches.length > 0) {
      return NextResponse.json({
        error: `Cannot advance round. ${incompleteMatches.length} match(es) still incomplete.`,
        incomplete_count: incompleteMatches.length,
        current_round: currentRound
      }, { status: 400 })
    }

    // Extract winners from current round
    const winners = currentRoundMatches
      .map(m => m.winner)
      .filter(Boolean) as string[]

    if (winners.length === 0) {
      return NextResponse.json({
        error: 'No winners found in current round'
      }, { status: 400 })
    }

    // Check if tournament is complete (only 1 winner left)
    if (winners.length === 1) {
      return NextResponse.json({
        message: 'Tournament complete!',
        champion: winners[0],
        final_round: currentRound
      })
    }

    // Fetch courts for assignment
    const { data: courts, error: courtsError } = await supabase
      .from('courts')
      .select('id')
      .eq('tournament_id', tournament_id)

    if (courtsError) {
      return NextResponse.json({ error: courtsError.message }, { status: 500 })
    }

    if (!courts || courts.length === 0) {
      return NextResponse.json({
        error: 'No courts found. Please create courts before advancing.',
        hint: 'Visit the tournament management page to create courts.'
      }, { status: 400 })
    }

    const courtIds = courts.map(c => c.id)

    // Create next round matches by pairing winners
    const nextRound = currentRound + 1
    const nextRoundMatches = []

    for (let i = 0; i < winners.length; i += 2) {
      const matchIndex = Math.floor(i / 2)

      nextRoundMatches.push({
        tournament_id,
        round: nextRound,
        slot_a: winners[i],
        slot_b: winners[i + 1] || null, // Handle odd number of winners (bye)
        status: winners[i + 1] ? 'scheduled' : 'completed',
        winner: winners[i + 1] ? null : winners[i], // Auto-advance bye
        court_id: courtIds[matchIndex % courtIds.length], // Round-robin assignment
      })
    }

    // Insert next round matches
    const { data: insertedMatches, error: insertError } = await supabase
      .from('matches')
      .insert(nextRoundMatches)
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Advanced to Round ${nextRound}`,
      current_round: currentRound,
      next_round: nextRound,
      matches_created: insertedMatches?.length || 0,
      winners_advanced: winners.length,
      matches: insertedMatches,
    })
  } catch (error) {
    console.error('Advance round error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to advance round',
      },
      { status: 500 }
    )
  }
}
