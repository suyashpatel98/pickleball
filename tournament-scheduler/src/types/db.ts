export type Tournament = {
    id: string
    name: string
    date?: string
    location?: string
    format: 'single-elim' | 'round-robin' | 'pool-play'
    tournament_type?: 'singles' | 'doubles'
  }

  export type Player = {
    id: string
    name: string
    email?: string
    dupr?: number
  }

  export type Registration = {
    id: string
    tournament_id: string
    player_id: string
    seed?: number
  }

  export type Team = {
    id: string
    tournament_id: string
    team_name: string
    player1_id: string
    player2_id?: string | null
  }

  export type Match = {
    id: string
    tournament_id: string
    round: number
    pool?: string | null
    court?: number | null
    slot_a?: string | null
    slot_b?: string | null
    team_a_id?: string | null
    team_b_id?: string | null
    seed_a?: number | null
    seed_b?: number | null
    score_a?: number | null
    score_b?: number | null
    winner?: string | null
    status: 'scheduled'|'live'|'completed'
  }