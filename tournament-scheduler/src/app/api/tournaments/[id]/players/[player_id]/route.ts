import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

interface MatchEstimate {
  estimated_start_time: Date
  minutes_until_start: number
  matches_ahead: number
  estimated_wait_minutes: number
}

async function estimateMatchStartTime(
  match: any,
  supabase: any
): Promise<MatchEstimate | null> {
  if (!match || !match.court_id) {
    return null
  }

  const now = new Date()

  // Get all scheduled/live matches on the same court that are ahead of this match
  // "Ahead" means: lower round number, OR same round but created earlier
  const { data: matchesAhead, error } = await supabase
    .from('matches')
    .select('id, round, created_at, status')
    .eq('court_id', match.court_id)
    .in('status', ['scheduled', 'live'])
    .or(`round.lt.${match.round},and(round.eq.${match.round},created_at.lt.${match.created_at})`)

  if (error) {
    console.error('Error fetching matches ahead:', error)
    return null
  }

  // Tournament settings (hardcoded for now)
  const AVG_MATCH_DURATION_MINUTES = 25
  const BUFFER_BETWEEN_MATCHES_MINUTES = 5
  const TOTAL_TIME_PER_MATCH = AVG_MATCH_DURATION_MINUTES + BUFFER_BETWEEN_MATCHES_MINUTES

  const matchesAheadCount = matchesAhead?.length || 0
  const estimatedWaitMinutes = matchesAheadCount * TOTAL_TIME_PER_MATCH

  const estimatedStartTime = new Date(now.getTime() + estimatedWaitMinutes * 60000)
  const minutesUntilStart = Math.max(0, Math.floor((estimatedStartTime.getTime() - now.getTime()) / 60000))

  return {
    estimated_start_time: estimatedStartTime,
    minutes_until_start: minutesUntilStart,
    matches_ahead: matchesAheadCount,
    estimated_wait_minutes: estimatedWaitMinutes
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; player_id: string }> }
) {
  const { id: tournament_id, player_id } = await params

  if (!tournament_id || !player_id) {
    return NextResponse.json(
      { error: 'Tournament ID and Player ID are required' },
      { status: 400 }
    )
  }

  const supabase = supabaseServer()

  try {
    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournament_id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Get player info
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', player_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Verify player is registered in this tournament
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('tournament_id', tournament_id)
      .eq('player_id', player_id)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Player is not registered in this tournament' },
        { status: 403 }
      )
    }

    // Get all matches where player participated (singles or doubles)
    // For singles: player is in slot_a or slot_b
    // For doubles: player is in a team (team_a_id or team_b_id)

    // First, check if player is in any team for this tournament
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .eq('tournament_id', tournament_id)
      .or(`player1_id.eq.${player_id},player2_id.eq.${player_id}`)

    const teamIds = teams?.map(t => t.id) || []

    // Build the filter for matches
    let matchesQuery = supabase
      .from('matches')
      .select(`
        *,
        player_a:players!matches_slot_a_fkey(*),
        player_b:players!matches_slot_b_fkey(*),
        team_a:teams!matches_team_a_id_fkey(
          *,
          player1:players!teams_player1_id_fkey(*),
          player2:players!teams_player2_id_fkey(*)
        ),
        team_b:teams!matches_team_b_id_fkey(
          *,
          player1:players!teams_player1_id_fkey(*),
          player2:players!teams_player2_id_fkey(*)
        ),
        court:courts(id, name, location_notes)
      `)
      .eq('tournament_id', tournament_id)
      .order('round', { ascending: true })

    // Filter for matches where player is involved (singles or doubles)
    if (teamIds.length > 0) {
      // Doubles: player is in team_a or team_b
      matchesQuery = matchesQuery.or(
        `slot_a.eq.${player_id},slot_b.eq.${player_id},team_a_id.in.(${teamIds.join(',')}),team_b_id.in.(${teamIds.join(',')})`
      )
    } else {
      // Singles: player is in slot_a or slot_b
      matchesQuery = matchesQuery.or(`slot_a.eq.${player_id},slot_b.eq.${player_id}`)
    }

    const { data: matches, error: matchesError } = await matchesQuery

    if (matchesError) {
      return NextResponse.json(
        { error: matchesError.message },
        { status: 500 }
      )
    }

    // Separate matches into completed and not completed
    const completedMatches = matches?.filter(
      (m) => m.status === 'completed' || m.status === 'finished'
    ) || []

    const activeMatches = matches?.filter(
      (m) => m.status !== 'completed' && m.status !== 'finished'
    ) || []

    // Find next match (first non-completed match)
    const nextMatch = activeMatches[0] || null

    // Calculate stats
    const wins = completedMatches.filter((m) => {
      // Check if player won (either in singles or as part of team)
      if (m.slot_a === player_id || m.slot_b === player_id) {
        return m.winner === player_id
      }
      // Check if player's team won
      const playerTeamId = teamIds.find(tid => tid === m.team_a_id || tid === m.team_b_id)
      if (playerTeamId) {
        // Winner is stored as player_id, need to check if winner is part of the team
        if (m.team_a_id === playerTeamId) {
          return m.team_a?.player1_id === m.winner || m.team_a?.player2_id === m.winner
        }
        if (m.team_b_id === playerTeamId) {
          return m.team_b?.player1_id === m.winner || m.team_b?.player2_id === m.winner
        }
      }
      return false
    }).length

    const losses = completedMatches.length - wins

    // Determine player status
    let status: 'active' | 'waiting' | 'eliminated' | 'champion' = 'waiting'

    if (completedMatches.length > 0 && activeMatches.length === 0) {
      // Check if player won the last match (might be champion)
      const lastMatch = completedMatches[completedMatches.length - 1]
      const isWinner = lastMatch.slot_a === player_id || lastMatch.slot_b === player_id
        ? lastMatch.winner === player_id
        : teamIds.some(tid =>
            (tid === lastMatch.team_a_id && (lastMatch.team_a?.player1_id === lastMatch.winner || lastMatch.team_a?.player2_id === lastMatch.winner)) ||
            (tid === lastMatch.team_b_id && (lastMatch.team_b?.player1_id === lastMatch.winner || lastMatch.team_b?.player2_id === lastMatch.winner))
          )

      if (isWinner && lastMatch.round === Math.max(...(matches?.map(m => m.round) || [0]))) {
        status = 'champion'
      } else {
        status = 'eliminated'
      }
    } else if (nextMatch) {
      status = 'active'
    }

    // Format match history with opponent info
    const matchHistory = completedMatches.map((m) => {
      let opponent = null
      let isWin = false

      // Singles match
      if (m.slot_a === player_id) {
        opponent = m.player_b
        isWin = m.winner === player_id
      } else if (m.slot_b === player_id) {
        opponent = m.player_a
        isWin = m.winner === player_id
      } else {
        // Doubles match - find opponent team
        const playerTeamId = teamIds.find(tid => tid === m.team_a_id || tid === m.team_b_id)
        if (playerTeamId === m.team_a_id) {
          opponent = m.team_b
          isWin = m.team_a?.player1_id === m.winner || m.team_a?.player2_id === m.winner
        } else if (playerTeamId === m.team_b_id) {
          opponent = m.team_a
          isWin = m.team_b?.player1_id === m.winner || m.team_b?.player2_id === m.winner
        }
      }

      return {
        id: m.id,
        round: m.round,
        opponent,
        result: isWin ? 'won' : 'lost',
        score_a: m.score_a,
        score_b: m.score_b,
      }
    })

    // Format next match info
    let nextMatchInfo = null
    if (nextMatch) {
      let opponent = null

      // Singles match
      if (nextMatch.slot_a === player_id) {
        opponent = nextMatch.player_b
      } else if (nextMatch.slot_b === player_id) {
        opponent = nextMatch.player_a
      } else {
        // Doubles match
        const playerTeamId = teamIds.find(tid => tid === nextMatch.team_a_id || tid === nextMatch.team_b_id)
        if (playerTeamId === nextMatch.team_a_id) {
          opponent = nextMatch.team_b
        } else if (playerTeamId === nextMatch.team_b_id) {
          opponent = nextMatch.team_a
        }
      }

      nextMatchInfo = {
        id: nextMatch.id,
        round: nextMatch.round,
        opponent,
        court: nextMatch.court,
        pool: nextMatch.pool,
      }
    }

    // Add time estimate to next match
    let nextMatchWithEstimate: any = nextMatchInfo
    if (nextMatchInfo && nextMatch) {
      const estimate = await estimateMatchStartTime(nextMatch, supabase)
      if (estimate) {
        nextMatchWithEstimate = {
          ...nextMatchInfo,
          estimate: {
            start_time: estimate.estimated_start_time,
            minutes_until_start: estimate.minutes_until_start,
            matches_ahead: estimate.matches_ahead
          }
        }
      }
    }

    return NextResponse.json({
      tournament,
      player,
      status,
      next_match: nextMatchWithEstimate,
      match_history: matchHistory,
      stats: {
        wins,
        losses,
        total_matches: completedMatches.length,
      },
    })
  } catch (error) {
    console.error('Error fetching player data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
