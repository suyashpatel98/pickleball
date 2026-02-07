import { NextResponse } from 'next/server'

const PLAYER_NAMES = ['player_1', 'player_2', 'player_3', 'player_4']

// Helper to get base URL for internal API calls
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  return 'http://localhost:3000'
}

export async function POST() {
  const baseUrl = getBaseUrl()

  try {
    // 1. Create tournament using POST /api/tournaments
    console.log('Creating tournament...')

    const tournamentResponse = await fetch(`${baseUrl}/api/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Battle Under Lights - S2',
        date: '2025-01-20',
        format: 'single-elim',
        tournament_type: 'singles',
      }),
    })

    if (!tournamentResponse.ok) {
      const error = await tournamentResponse.json()
      throw new Error(`Failed to create tournament: ${error.error}`)
    }

    const { tournament } = await tournamentResponse.json()
    console.log('Tournament created:', tournament.id)

    // 2. Register 4 players using POST /api/tournaments/[id]/register
    console.log('Registering 4 players...')

    for (let i = 0; i < 4; i++) {
      const dupr = 3.0 + i * 0.5 // DUPR: 3.0, 3.5, 4.0, 4.5

      const registerResponse = await fetch(
        `${baseUrl}/api/tournaments/${tournament.id}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: PLAYER_NAMES[i],
            email: `player${i}@example.com`,
            dupr,
          }),
        }
      )

      if (!registerResponse.ok) {
        const error = await registerResponse.json()
        throw new Error(`Failed to register player ${i}: ${error.error}`)
      }
    }

    console.log('4 players registered')

    // 3. Generate knockout bracket using POST /api/tournaments/[id]/generate
    console.log('Generating knockout bracket...')

    const generateResponse = await fetch(
      `${baseUrl}/api/tournaments/${tournament.id}/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!generateResponse.ok) {
      const error = await generateResponse.json()
      throw new Error(`Failed to generate bracket: ${error.error}`)
    }

    const { matches } = await generateResponse.json()
    console.log(`${matches.length} matches created`)

    console.log('Seeding complete!')

    return NextResponse.json({
      success: true,
      tournament_id: tournament.id,
      players_created: 4,
      matches_created: matches.length,
      format: 'knockout (single-elimination)',
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
