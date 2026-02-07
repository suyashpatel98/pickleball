import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { tournament_id, team_name, player1_id, player2_id } = body

  if (!tournament_id || !team_name || !player1_id) {
    return NextResponse.json(
      { error: 'tournament_id, team_name, and player1_id are required' },
      { status: 400 }
    )
  }

  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('teams')
    .insert({
      tournament_id,
      team_name,
      player1_id,
      player2_id: player2_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ team: data }, { status: 201 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tournament_id = searchParams.get('tournament_id')

  if (!tournament_id) {
    return NextResponse.json(
      { error: 'tournament_id query parameter is required' },
      { status: 400 }
    )
  }

  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      player1:players!teams_player1_id_fkey(*),
      player2:players!teams_player2_id_fkey(*)
    `)
    .eq('tournament_id', tournament_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
