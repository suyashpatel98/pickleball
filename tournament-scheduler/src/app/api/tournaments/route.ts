// app/api/tournaments/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()

  const { name, date, format } = body

  if (!name) {
    return NextResponse.json(
      { error: 'Tournament name is required' },
      { status: 400 }
    )
  }

  const supabase = supabaseServer()

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name,
      date,
      format: format ?? 'single-elim',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ tournament: data }, { status: 201 })
}

export async function GET() {
    const supabase = supabaseServer()
  
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: true })
  
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  
    return NextResponse.json({ tournaments: data })
  }