import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

type RegistrationWithPlayer = {
    player: {
      id: string
      dupr?: number
    }[] // player is an array with 1 element
  }

// Simple seeding + bracket generation
function seedPlayers(players: { id: string; dupr: number }[]) {
return [...players].sort((a, b) => (b.dupr ?? 0) - (a.dupr ?? 0))
}

function generateBracketSeeds(seededPlayers: { id: string }[]) {
const n = seededPlayers.length
let size = 1
while (size < n) size <<= 1
const byes = size - n

const seeds: (string | null)[] = new Array(size).fill(null)
for (let i = 0; i < n; i++) seeds[i] = seededPlayers[i].id

const matches: { slot_a: string | null; slot_b: string | null }[] = []
for (let i = 0; i < size / 2; i++) {
    const a = seeds[i] ?? null
    const b = seeds[size - 1 - i] ?? null
    matches.push({ slot_a: a, slot_b: b })
}

return { size, byes, matches }
}

export async function POST(req: Request) {
const url = new URL(req.url)
const tournament_id = url.pathname.split('/')[3] // /api/tournaments/[id]/generate

if (!tournament_id) {
    return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
}

const supabase = supabaseServer()

// Fetch registered players
const { data: regs, error: regError } = await supabase
  .from('registrations')
  .select('player_id')
  .eq('tournament_id', tournament_id)


if (regError || !regs) {
  return NextResponse.json({ error: regError?.message || 'Failed to fetch registrations' }, { status: 500 })
}

// Get player_ids from registrations
const playerIds = regs.map(r => r.player_id)

// Fetch player details
const { data: playersData, error: playerError } = await supabase
  .from('players')
  .select('id, dupr')
  .in('id', playerIds)

if (playerError || !playersData || playersData.length === 0) {
  return NextResponse.json({ error: 'No players found' }, { status: 400 })
}

// Map to seeding array
const players = playersData.map(p => ({ id: p.id, dupr: p.dupr ?? 0 }))


const seeded = seedPlayers(players)
const { matches } = generateBracketSeeds(seeded)

// Fetch courts for random assignment
const { data: courts } = await supabase
  .from('courts')
  .select('id')
  .eq('tournament_id', tournament_id)

const courtIds = courts?.map(c => c.id) || []

// Insert matches for round 1 with random court assignment
const insertMatches = matches.map((m, index) => ({
    tournament_id,
    round: 1,
    slot_a: m.slot_a,
    slot_b: m.slot_b,
    status: m.slot_b ? 'scheduled' : 'finished', // BYE automatically finished
    winner: m.slot_b ? null : m.slot_a, // auto-advance BYE
    court_id: courtIds.length > 0 ? courtIds[index % courtIds.length] : null, // Randomly distribute
}))

const { data: insertedMatches, error: matchError } = await supabase
    .from('matches')
    .insert(insertMatches)
    .select()

if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
}

return NextResponse.json({
    message: 'Bracket generated',
    matches: insertedMatches,
})
}
