import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'http://localhost:3000'

// Initialize Supabase client for cleanup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Store IDs for testing
let tournamentId: string
let playerId: string
let matchId: string
let newTournamentId: string

// Cleanup function to delete all data
async function cleanupDatabase() {
  // Delete in reverse order of foreign key dependencies
  await supabase.from('match_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('tournaments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

describe('API Tests', () => {
  // Setup: Clean database and seed test data
  beforeAll(async () => {
    // Clean database before tests
    await cleanupDatabase()

    // Seed test data
    const response = await fetch(`${BASE_URL}/api/dev/seed`, {
      method: 'POST',
    })
    const data = await response.json()
    tournamentId = data.tournament_id

    // Get player and match IDs
    const tournamentData = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}`)
    const tournament = await tournamentData.json()
    playerId = tournament.registrations[0]?.player?.id
    matchId = tournament.matches[0]?.id
  })

  // Cleanup: Delete all test data after tests complete
  afterAll(async () => {
    await cleanupDatabase()
  })

  describe('Tournament Management', () => {
    it('GET /api/tournaments - should return tournaments', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments`)
      expect(response.status).toBe(200)

      const data = await response.json()
      // Doc says: "Response: Array of tournaments"
      expect(Array.isArray(data)).toBe(true)
    })

    it('POST /api/tournaments - should create tournament with valid data', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Tournament',
          format: 'single-elim',
          tournament_type: 'singles',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('tournament')
      expect(data.tournament).toHaveProperty('id')
      newTournamentId = data.tournament.id
    })

    it('POST /api/tournaments - should return 400 when name is missing', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('GET /api/tournaments/[id] - should return tournament details', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('tournament')
      expect(data).toHaveProperty('matches')
      expect(data).toHaveProperty('registrations')
      expect(data).toHaveProperty('teams')
      expect(data.tournament.id).toBe(tournamentId)
    })

    it('GET /api/tournaments/[id] - should return 404 for invalid ID', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments/invalid-id`)
      expect(response.status).toBe(404)
    })

    it('POST /api/tournaments/[id]/register - should register new player', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments/${newTournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Player',
          email: 'test@example.com',
          dupr: 3.5,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('registration')
      expect(data.registration).toHaveProperty('player_id')
    })

    it('POST /api/tournaments/[id]/register - should register existing player', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments/${newTournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('registration')
    })

    it('POST /api/tournaments/[id]/register - should return 400 when both player_id and name missing', async () => {
      const response = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('POST /api/tournaments/[id]/generate - should generate bracket', async () => {
      // Create tournament and register players
      const createResp = await fetch(`${BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bracket Test' }),
      })
      const { tournament } = await createResp.json()

      // Register 4 players
      for (let i = 1; i <= 4; i++) {
        await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Player${i}`, dupr: i }),
        })
      }

      // Generate bracket
      const response = await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/generate`, {
        method: 'POST',
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('matches')
      expect(Array.isArray(data.matches)).toBe(true)
      expect(data.matches.length).toBeGreaterThan(0)
    })

    it('POST /api/tournaments/[id]/generate - should return 400 when no players', async () => {
      const createResp = await fetch(`${BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Empty Tournament' }),
      })
      const { tournament } = await createResp.json()

      const response = await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/generate`, {
        method: 'POST',
      })

      expect(response.status).toBe(400)
    })

    it('POST /api/tournaments/[id]/generate-pools - should generate pool matches', async () => {
      // Create tournament, teams, and players
      const createResp = await fetch(`${BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Pool Test', tournament_type: 'doubles' }),
      })
      const { tournament } = await createResp.json()

      // Create 8 players
      const playerIds = []
      for (let i = 1; i <= 8; i++) {
        const regResp = await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `PoolPlayer${i}`, dupr: i }),
        })
        const { registration } = await regResp.json()
        playerIds.push(registration.player_id)
      }

      // Create 4 teams
      for (let i = 0; i < 4; i++) {
        await fetch(`${BASE_URL}/api/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournament_id: tournament.id,
            team_name: `Team${i + 1}`,
            player1_id: playerIds[i * 2],
            player2_id: playerIds[i * 2 + 1],
          }),
        })
      }

      // Generate pools
      const response = await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/generate-pools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pools: ['A'], teams_per_pool: 4 }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('matches')
      expect(Array.isArray(data.matches)).toBe(true)
    })

    it('POST /api/tournaments/[id]/generate-pools - should return 400 when no teams', async () => {
      const createResp = await fetch(`${BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Teams Tournament' }),
      })
      const { tournament } = await createResp.json()

      const response = await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/generate-pools`, {
        method: 'POST',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Team Management', () => {
    it('POST /api/teams - should create team', async () => {
      // Create tournament and players first
      const tournResp = await fetch(`${BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Team Test' }),
      })
      const { tournament } = await tournResp.json()

      // Register 2 players
      const player1Resp = await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'TeamPlayer1' }),
      })
      const { registration: reg1 } = await player1Resp.json()

      const player2Resp = await fetch(`${BASE_URL}/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'TeamPlayer2' }),
      })
      const { registration: reg2 } = await player2Resp.json()

      // Create team
      const response = await fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournament.id,
          team_name: 'Test Team',
          player1_id: reg1.player_id,
          player2_id: reg2.player_id,
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('team')
      expect(data.team).toHaveProperty('id')
    })

    it('POST /api/teams - should return 400 when required fields missing', async () => {
      const response = await fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
    })

    it('GET /api/teams - should return teams for tournament', async () => {
      const response = await fetch(`${BASE_URL}/api/teams?tournament_id=${tournamentId}`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('GET /api/teams - should return 400 when tournament_id missing', async () => {
      const response = await fetch(`${BASE_URL}/api/teams`)
      expect(response.status).toBe(400)
    })
  })

  describe('Match Management', () => {
    it('GET /api/matches/[id] - should return match details', async () => {
      const response = await fetch(`${BASE_URL}/api/matches/${matchId}`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.id).toBe(matchId)
    })

    it('GET /api/matches/[id] - should return 404 for invalid ID', async () => {
      const response = await fetch(`${BASE_URL}/api/matches/invalid-id`)
      expect(response.status).toBe(404)
    })

    it('PATCH /api/matches/[id] - should update match scores', async () => {
      const response = await fetch(`${BASE_URL}/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_a: 15,
          score_b: 10,
          status: 'completed',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.score_a).toBe(15)
      expect(data.score_b).toBe(10)
    })

    it('PATCH /api/matches/[id]/update - should update match scores', async () => {
      const response = await fetch(`${BASE_URL}/api/matches/${matchId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_a: 12,
          score_b: 14,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.score_a).toBe(12)
      expect(data.score_b).toBe(14)
    })

    it('POST /api/matches/[id]/score - should submit game-by-game scores', async () => {
      // Get a fresh match
      const tournData = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}`)
      const { matches } = await tournData.json()
      const freshMatch = matches.find((m: any) => m.status === 'scheduled')

      if (!freshMatch) {
        console.log('No scheduled match available for game scoring test')
        return
      }

      const response = await fetch(`${BASE_URL}/api/matches/${freshMatch.id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          games: [
            { a: 11, b: 9 },
            { a: 8, b: 11 },
            { a: 11, b: 7 },
          ],
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('finished')
    })

    it('POST /api/matches/[id]/score - should return 400 for tie', async () => {
      // Create new tournament with matches
      const seedResp = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST' })
      const { tournament_id } = await seedResp.json()
      const tournData = await fetch(`${BASE_URL}/api/tournaments/${tournament_id}`)
      const { matches } = await tournData.json()

      const response = await fetch(`${BASE_URL}/api/matches/${matches[0].id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          games: [
            { a: 11, b: 9 },
            { a: 9, b: 11 },
          ],
        }),
      })

      expect(response.status).toBe(400)
    })

    it('POST /api/matches/[id]/score - should return 400 when games array empty', async () => {
      const response = await fetch(`${BASE_URL}/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          games: [],
        }),
      })

      expect(response.status).toBe(400)
    })
  })
})
