import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() // last segment is ID

  if (!id) {
    return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
  }

  const supabase = supabaseServer()

  // Fetch tournament
  const { data: tournament, error: tourError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()

  if (tourError || !tournament) {
    return NextResponse.json(
      { error: tourError?.message || 'Tournament not found' },
      { status: 404 }
    )
  }

  // Fetch registrations with player info
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select(`id, seed, player:players(id, name, email, dupr)`)
    .eq('tournament_id', id)

  if (regError) {
    return NextResponse.json({ error: regError.message }, { status: 500 })
  }

  // Fetch matches with teams AND players (for singles)
  const { data: matches, error: matchError } = await supabase
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
      ),
      player_a:players!matches_slot_a_fkey(*),
      player_b:players!matches_slot_b_fkey(*)
    `)
    .eq('tournament_id', id)
    .order('round', { ascending: true })

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  // Fetch teams for this tournament
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      *,
      player1:players!teams_player1_id_fkey(*),
      player2:players!teams_player2_id_fkey(*)
    `)
    .eq('tournament_id', id)

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 })
  }

  // Fetch courts for this tournament
  const { data: courts, error: courtsError } = await supabase
    .from('courts')
    .select('*')
    .eq('tournament_id', id)
    .order('name', { ascending: true })

  if (courtsError) {
    return NextResponse.json({ error: courtsError.message }, { status: 500 })
  }

  return NextResponse.json({
    tournament,
    registrations,
    matches,
    teams: teams || [],
    courts: courts || [],
  })
}
