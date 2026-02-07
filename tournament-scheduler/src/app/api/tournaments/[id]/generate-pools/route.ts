import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const tournament_id = url.pathname.split('/')[3]

  if (!tournament_id) {
    return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
  }

  let body: { pools?: string[], teams_per_pool?: number } = {}
  try {
    body = await req.json()
  } catch (e) {
    // Empty body is ok, use defaults
  }
  const { pools = ['A', 'B', 'C', 'D'], teams_per_pool = 4 } = body

  const supabase = supabaseServer()

  // Get all teams for this tournament
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournament_id)

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 })
  }

  if (!teams || teams.length === 0) {
    return NextResponse.json({ error: 'No teams found for this tournament' }, { status: 400 })
  }

  // Distribute teams into pools
  const poolAssignments: { [key: string]: typeof teams } = {}
  pools.forEach(pool => {
    poolAssignments[pool] = []
  })

  teams.forEach((team, index) => {
    const poolIndex = index % pools.length
    poolAssignments[pools[poolIndex]].push(team)
  })

  // Fetch courts for assignment - REQUIRED
  const { data: courts, error: courtsError } = await supabase
    .from('courts')
    .select('id')
    .eq('tournament_id', tournament_id)

  if (courtsError) {
    return NextResponse.json({ error: courtsError.message }, { status: 500 })
  }

  if (!courts || courts.length === 0) {
    return NextResponse.json({
      error: 'No courts found. Please create courts before generating pools.',
      hint: 'Visit the tournament management page to create courts.'
    }, { status: 400 })
  }

  const courtIds = courts.map(c => c.id)

  // Generate round-robin matches for each pool
  const matches = []
  let matchIndex = 0

  for (const pool of pools) {
    const poolTeams = poolAssignments[pool]

    // Generate all possible matches in the pool (round-robin)
    for (let i = 0; i < poolTeams.length; i++) {
      for (let j = i + 1; j < poolTeams.length; j++) {
        matches.push({
          tournament_id,
          round: 1,
          pool,
          team_a_id: poolTeams[i].id,
          team_b_id: poolTeams[j].id,
          status: 'scheduled',
          court_id: courtIds[matchIndex % courtIds.length], // Round-robin distribution
          score_a: null,
          score_b: null,
          winner: null,
        })
        matchIndex++
      }
    }
  }

  // Insert all matches
  const { data: insertedMatches, error: matchesError } = await supabase
    .from('matches')
    .insert(matches)
    .select()

  if (matchesError) {
    return NextResponse.json({ error: matchesError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Pool matches generated successfully',
    matches: insertedMatches,
    pool_assignments: poolAssignments,
  })
}
