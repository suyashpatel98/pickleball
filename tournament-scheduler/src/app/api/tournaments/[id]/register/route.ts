import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const tournament_id = url.pathname.split('/')[3] // /api/tournaments/[id]/register

  if (!tournament_id) {
    return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
  }

  const body = await req.json()
  const { player_id, name, email, dupr } = body

  if (!player_id && !name) {
    return NextResponse.json(
      { error: 'Either player_id or name is required to register' },
      { status: 400 }
    )
  }

  const supabase = supabaseServer()

  let actualPlayerId = player_id

  // Create new player if no player_id is provided
  if (!player_id) {
    const { data: newPlayer, error: createError } = await supabase
      .from('players')
      .insert({ name, email, dupr })
      .select()
      .single()

    if (createError || !newPlayer) {
      return NextResponse.json({ error: createError?.message || 'Failed to create player' }, { status: 500 })
    }

    actualPlayerId = newPlayer.id
  }

  // Register player in tournament
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .insert({ tournament_id, player_id: actualPlayerId })
    .select()
    .single()

  if (regError || !registration) {
    return NextResponse.json({ error: regError?.message || 'Failed to register player' }, { status: 500 })
  }

  return NextResponse.json({ registration })
}
