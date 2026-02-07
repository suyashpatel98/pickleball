import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

type ScoreGame = { a: number; b: number }

export async function POST(req: Request) {
  const url = new URL(req.url)
  const match_id = url.pathname.split('/')[3] // /api/matches/[id]/score

  if (!match_id) {
    return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
  }

  const { games, winner: submittedWinner } = await req.json()

  if (!games || !Array.isArray(games) || games.length === 0) {
    return NextResponse.json({ error: 'games (non-empty array) is required' }, { status: 400 })
  }

  const supabase = supabaseServer()

  // Fetch the match
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', match_id)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: matchError?.message || 'Match not found' }, { status: 404 })
  }

  // Determine winner (simple: sum games won)
  let scoreA: number = 0;
  let scoreB: number = 0;

  (games as ScoreGame[]).forEach(g => {
    if (g.a > g.b) scoreA++
    else if (g.b > g.a) scoreB++
  })

  // Verify submitted winner matches calculated winner
  let calculatedWinner: string | null = null
  if (scoreA > scoreB) calculatedWinner = match.slot_a
  else if (scoreB > scoreA) calculatedWinner = match.slot_b
  else return NextResponse.json({ error: 'Tie detected. Cannot determine winner.' }, { status: 400 })

  // Use submitted winner if provided and valid, otherwise use calculated
  const winner = submittedWinner && submittedWinner === calculatedWinner ? submittedWinner : calculatedWinner

  // Save score to match_scores table
  const { error: scoreInsertError } = await supabase
    .from('match_scores')
    .insert({
      match_id,
      scorer_id: winner, // Use winner as scorer for now (MVP - no auth)
      score_json: { games }
    })

  if (scoreInsertError) {
    return NextResponse.json({ error: scoreInsertError.message }, { status: 500 })
  }

  // Update match with winner
  const { data: updatedMatch, error: matchUpdateError } = await supabase
    .from('matches')
    .update({ winner, status: 'finished' })
    .eq('id', match_id)
    .select()
    .single()

  if (matchUpdateError) {
    return NextResponse.json({ error: matchUpdateError.message }, { status: 500 })
  }

  // TODO: advance winner to next round (if you pre-created next-round matches)

  return NextResponse.json(updatedMatch)
}
