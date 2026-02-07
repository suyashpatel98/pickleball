import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * PATCH /api/matches/{matchId}/court
 * Assign a match to a court
 *
 * Body: {
 *   court_id: string (uuid) - ID of the court to assign
 * }
 *
 * Or to unassign:
 * Body: {
 *   court_id: null
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const body = await request.json()
    const { court_id } = body

    // If court_id is provided (not null), verify it exists
    if (court_id !== null && court_id !== undefined) {
      const { data: court, error: courtError } = await supabase
        .from('courts')
        .select('id')
        .eq('id', court_id)
        .single()

      if (courtError || !court) {
        return NextResponse.json(
          { error: 'Court not found' },
          { status: 404 }
        )
      }
    }

    // Update match with court assignment
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .update({ court_id })
      .eq('id', matchId)
      .select()
      .single()

    if (matchError) {
      return NextResponse.json(
        { error: matchError.message },
        { status: 500 }
      )
    }

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error assigning court to match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
