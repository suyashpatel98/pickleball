import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch match with teams
    const { data: match, error: matchError } = await supabase
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
      .eq('id', id)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Also fetch player info for single-elim format (backwards compatibility)
    let player_a = null
    if (match.slot_a) {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('id', match.slot_a)
        .single()
      player_a = data
    }

    let player_b = null
    if (match.slot_b) {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('id', match.slot_b)
        .single()
      player_b = data
    }

    return NextResponse.json({
      ...match,
      player_a,
      player_b,
    })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { score_a, score_b, status, winner } = body

    const updateData: any = {}

    if (score_a !== undefined) updateData.score_a = score_a
    if (score_b !== undefined) updateData.score_b = score_b
    if (status) updateData.status = status

    // Determine winner based on scores
    if (score_a !== undefined && score_b !== undefined && !winner) {
      const { data: match } = await supabase
        .from('matches')
        .select('team_a_id, team_b_id')
        .eq('id', id)
        .single()

      if (match) {
        if (score_a > score_b) {
          updateData.winner = match.team_a_id
        } else if (score_b > score_a) {
          updateData.winner = match.team_b_id
        }
      }
    }

    if (winner) updateData.winner = winner

    const { data, error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
