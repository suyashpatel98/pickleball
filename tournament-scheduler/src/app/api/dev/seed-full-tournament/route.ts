import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

const PLAYER_NAMES = [
  'Sandipan Sandipan', 'Anirudh Anirudh', 'Harsh Sethi', 'Akshay Akshay',
  'Anuj Sharma', 'Krish Vohra', 'Prachi Prachi', 'Nikhil Nikhil',
  'Rahul Kumar', 'Priya Singh', 'Amit Verma', 'Sneha Patel',
  'Vikram Reddy', 'Pooja Gupta', 'Rohan Das', 'Kavya Iyer',
  'Arjun Mehta', 'Divya Nair', 'Karan Joshi', 'Simran Kaur',
  'Aditya Sharma', 'Meera Rao', 'Sanjay Pillai', 'Anjali Desai',
  'Manish Agarwal', 'Ritu Bansal', 'Varun Malhotra', 'Neha Kapoor',
  'Rajesh Mishra', 'Swati Chopra', 'Deepak Saxena', 'Tanvi Bhatia',
]

export async function POST() {
  const supabase = supabaseServer()

  try {
    // 1. Create tournament
    console.log('Creating tournament...')

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: 'Battle Under Lights - S2',
        date: '2025-01-20',
        format: 'round-robin',
      })
      .select()
      .single()

    if (tournamentError || !tournament) throw tournamentError || new Error('Failed to create tournament')

    console.log('Tournament created:', tournament.id)

    // 2. Create 32 players and register them
    console.log('Creating 32 players...')
    const playerIds: string[] = []

    for (let i = 0; i < 32; i++) {
      const dupr = 3.0 + (i % 5) * 0.5

      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          name: PLAYER_NAMES[i],
          email: `player${i}@example.com`,
          dupr,
        })
        .select()
        .single()

      if (playerError) {
        // Player might already exist, try to find them
        const { data: existing } = await supabase
          .from('players')
          .select('id')
          .eq('email', `player${i}@example.com`)
          .single()

        if (existing) {
          playerIds.push(existing.id)
        } else {
          throw playerError
        }
      } else {
        playerIds.push(player.id)

        // Register player to tournament
        await supabase.from('registrations').insert({
          tournament_id: tournament.id,
          player_id: player.id,
          seed: i + 1,
        })
      }
    }

    console.log(`${playerIds.length} players created/registered`)

    // 3. Create 16 teams (pairs of players)
    console.log('Creating 16 teams...')
    const teamIds: string[] = []

    for (let i = 0; i < 16; i++) {
      const player1Idx = i * 2
      const player2Idx = i * 2 + 1

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          tournament_id: tournament.id,
          team_name: `BLS_${i + 1}_15`,
          player1_id: playerIds[player1Idx],
          player2_id: playerIds[player2Idx],
        })
        .select()
        .single()

      if (teamError) throw teamError
      teamIds.push(team.id)
    }

    console.log('16 teams created')

    // 4. Generate pool matches (4 pools of 4 teams each)
    console.log('Generating pool matches...')
    const pools = ['A', 'B', 'C', 'D']
    const matches = []

    for (let poolIdx = 0; poolIdx < pools.length; poolIdx++) {
      const pool = pools[poolIdx]
      const poolTeamIds = teamIds.slice(poolIdx * 4, (poolIdx + 1) * 4)

      // Round-robin within pool
      for (let i = 0; i < poolTeamIds.length; i++) {
        for (let j = i + 1; j < poolTeamIds.length; j++) {
          matches.push({
            tournament_id: tournament.id,
            round: 1,
            pool,
            team_a_id: poolTeamIds[i],
            team_b_id: poolTeamIds[j],
            status: 'scheduled',
            court: null,
            score_a: null,
            score_b: null,
            winner: null,
          })
        }
      }
    }

    const { data: insertedMatches, error: matchesError } = await supabase
      .from('matches')
      .insert(matches)
      .select()

    if (matchesError) throw matchesError

    console.log(`${insertedMatches.length} matches created`)

    // 5. Complete some matches in Pool A with scores
    console.log('Completing 5 matches in Pool A...')
    const poolAMatches = insertedMatches.filter(m => m.pool === 'A').slice(0, 5)

    for (const match of poolAMatches) {
      let scoreA = 10 + Math.floor(Math.random() * 5)
      let scoreB = 10 + Math.floor(Math.random() * 5)

      // Ensure there's a winner
      if (scoreA === scoreB) scoreA += 2

      const winner = scoreA > scoreB ? match.team_a_id : match.team_b_id

      await supabase
        .from('matches')
        .update({
          score_a: scoreA,
          score_b: scoreB,
          status: 'completed',
          winner,
        })
        .eq('id', match.id)
    }

    console.log('Seeding complete!')

    return NextResponse.json({
      success: true,
      tournament_id: tournament.id,
      players_created: playerIds.length,
      teams_created: teamIds.length,
      matches_created: insertedMatches.length,
      completed_matches: poolAMatches.length,
      view_url: `/tournaments/${tournament.id}/fixtures`,
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Seeding failed',
        details: error,
      },
      { status: 500 }
    )
  }
}
