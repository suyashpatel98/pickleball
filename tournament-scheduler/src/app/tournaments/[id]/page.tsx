'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TournamentFixtures from '@/components/TournamentFixtures'
import { Tournament, Match, Team, Player } from '@/types/db'

type TeamWithPlayers = Team & {
  player1: Player
  player2?: Player | null
}

type MatchWithTeams = Match & {
  team_a?: TeamWithPlayers | null
  team_b?: TeamWithPlayers | null
}

type Court = {
  id: string
  name: string
  location_notes?: string
}

type TournamentData = {
  tournament: Tournament
  matches: MatchWithTeams[]
  teams: TeamWithPlayers[]
  courts: Court[]
}

export default function TournamentDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/tournaments/${id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch tournament')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading tournament...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error || 'Tournament not found'}</p>
      </div>
    )
  }

  return (
    <TournamentFixtures
      matches={data.matches}
      tournamentName={data.tournament.name}
      location={data.tournament.location}
      tournamentId={id}
      courts={data.courts}
    />
  )
}
