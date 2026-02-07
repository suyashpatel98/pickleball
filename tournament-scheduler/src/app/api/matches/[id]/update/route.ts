import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
  const url = new URL(req.url)
  const match_id = url.pathname.split('/')[3]

  if (!match_id) {
    return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
  }

  const body = await req.json()
  const { score_a, score_b, status, winner } = body

  const supabase = supabaseServer()

  const updateData: any = {}

  if (score_a !== undefined) updateData.score_a = score_a
  if (score_b !== undefined) updateData.score_b = score_b
  if (status) updateData.status = status

  // Determine winner based on scores
  if (score_a !== undefined && score_b !== undefined) {
    const { data: match } = await supabase
      .from('matches')
      .select('team_a_id, team_b_id')
      .eq('id', match_id)
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
    .eq('id', match_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
