// app/api/dev/seed-players/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

const FIRST_NAMES = [
  'Aiden', 'Liam', 'Noah', 'Mason', 'Lucas', 'Ethan', 'James', 'Leo', 'Kai', 'Jayden',
  'Olivia', 'Emma', 'Ava', 'Sophia', 'Mia', 'Amelia', 'Harper', 'Luna', 'Ella', 'Aria'
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Brown', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
  'Martinez', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
]

function randomPlayer() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  const name = `${first} ${last}`

  const email = `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(
    Math.random() * 1000
  )}@example.com`

  const dupr = Number((Math.random() * 5).toFixed(2)) // 0.00–5.00

  return { name, email, dupr }
}

export async function POST() {
  const supabase = supabaseServer()

  const players = Array.from({ length: 50 }, () => randomPlayer())

  const { data, error } = await supabase
    .from('players')
    .insert(players)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: '50 players created successfully',
    players_created: data.length,
  })
}
