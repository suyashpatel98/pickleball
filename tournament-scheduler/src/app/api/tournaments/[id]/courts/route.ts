import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/tournaments/{id}/courts
 * Returns all courts for a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .eq('tournament_id', id)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(courts || [])
  } catch (error) {
    console.error('Error fetching courts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tournaments/{id}/courts
 * Create a new court for a tournament
 *
 * Body: {
 *   name: string (required) - e.g., "Court 1", "Court 2"
 *   location_notes?: string - optional physical location hints
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    const { name, location_notes } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Court name is required' },
        { status: 400 }
      )
    }

    // Check if tournament exists
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Create court
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .insert({
        tournament_id: tournamentId,
        name: name.trim(),
        location_notes: location_notes?.trim() || null,
      })
      .select()
      .single()

    if (courtError) {
      return NextResponse.json(
        { error: courtError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ court }, { status: 201 })
  } catch (error) {
    console.error('Error creating court:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
