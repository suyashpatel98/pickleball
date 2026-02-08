'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Player, Tournament, Team } from '@/types/db'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

type TeamWithPlayers = Team & {
  player1: Player
  player2?: Player | null
}

type Court = {
  id: string
  name: string
  location_notes?: string
}

type MatchHistoryItem = {
  id: string
  round: number
  opponent: Player | TeamWithPlayers | null
  result: 'won' | 'lost'
  score_a: number | null
  score_b: number | null
}

type MatchEstimate = {
  start_time: string
  minutes_until_start: number
  matches_ahead: number
}

type NextMatch = {
  id: string
  round: number
  opponent: Player | TeamWithPlayers | null
  court: Court | null
  pool?: string | null
  estimate?: MatchEstimate
}

type PlayerData = {
  tournament: Tournament
  player: Player
  status: 'active' | 'waiting' | 'eliminated' | 'champion'
  next_match: NextMatch | null
  match_history: MatchHistoryItem[]
  stats: {
    wins: number
    losses: number
    total_matches: number
  }
}

function formatEstimatedTime(timeString: string): string {
  const time = new Date(timeString)
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function getTimeUntilMessage(minutes: number): string {
  if (minutes < 5) return 'Starting soon!'
  if (minutes < 60) return `in ${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `in ${hours}h ${mins}m`
}

export default function PlayerPersonalView() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  const playerId = params.player_id as string

  const [data, setData] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/tournaments/${tournamentId}/players/${playerId}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch player data')
      }

      const playerData = await res.json()
      setData(playerData)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch player data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load player data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayerData()
    // Auto-refresh every 30 seconds to get live updates
    const interval = setInterval(fetchPlayerData, 30000)
    return () => clearInterval(interval)
  }, [tournamentId, playerId])

  const getStatusBadge = () => {
    if (!data) return null

    switch (data.status) {
      case 'champion':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">🏆 Champion</Badge>
      case 'active':
        return <Badge className="bg-green-600 hover:bg-green-700">✅ Active</Badge>
      case 'eliminated':
        return <Badge variant="destructive">❌ Eliminated</Badge>
      case 'waiting':
        return <Badge variant="outline">⏸️ Waiting</Badge>
      default:
        return null
    }
  }

  const getOpponentName = (opponent: Player | TeamWithPlayers | null) => {
    if (!opponent) return 'TBD'

    // Check if it's a team
    if ('player1' in opponent) {
      const team = opponent as TeamWithPlayers
      if (team.player2) {
        return `${team.player1.name} & ${team.player2.name}`
      }
      return team.player1.name
    }

    // It's a player
    return (opponent as Player).name
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading your tournament info...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{error || 'Failed to load player data'}</p>
            <Button
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="mt-4 w-full"
              variant="outline"
            >
              View Tournament
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Player Header */}
        <div className="bg-[#2c3e50] text-white px-6 py-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{data.player.name}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-300">{data.tournament.name}</p>
          {data.tournament.date && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(data.tournament.date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Champion Banner */}
        {data.status === 'champion' && (
          <Alert className="mt-4 bg-yellow-50 border-yellow-500">
            <AlertDescription className="text-yellow-900 text-center text-lg font-semibold">
              🏆 Congratulations! You are the Champion! 🏆
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Tournament Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">{data.stats.wins}</p>
                <p className="text-xs text-muted-foreground mt-1">Wins</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{data.stats.losses}</p>
                <p className="text-xs text-muted-foreground mt-1">Losses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{data.stats.total_matches}</p>
                <p className="text-xs text-muted-foreground mt-1">Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Match - Active Players */}
        {data.status === 'active' && data.next_match && (
          <Card className="mt-4 border-2 border-green-500">
            <CardHeader className="bg-green-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-900">Your Next Match</CardTitle>
                <Badge className="bg-green-600">Up Next</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Estimated Time */}
                {data.next_match.estimate && (
                  <div className="bg-blue-600 text-white p-4 rounded-lg text-center">
                    <p className="text-sm opacity-90 mb-1">Estimated Start Time</p>
                    <p className="text-3xl font-bold">
                      {formatEstimatedTime(data.next_match.estimate.start_time)}
                    </p>
                    <p className="text-sm mt-2">
                      {getTimeUntilMessage(data.next_match.estimate.minutes_until_start)}
                    </p>
                    {data.next_match.estimate.matches_ahead > 0 && (
                      <p className="text-xs mt-3 opacity-80">
                        ℹ️ {data.next_match.estimate.matches_ahead} match{data.next_match.estimate.matches_ahead > 1 ? 'es' : ''} ahead of you on this court
                      </p>
                    )}
                  </div>
                )}

                {/* Opponent */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">You will play against</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getOpponentName(data.next_match.opponent)}
                  </p>
                  {data.next_match.pool && (
                    <p className="text-sm text-muted-foreground mt-2">Pool {data.next_match.pool}</p>
                  )}
                </div>

                {/* Court Info */}
                {data.next_match.court && (
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Report to</p>
                    <p className="text-xl font-bold text-blue-900">
                      {data.next_match.court.name}
                    </p>
                    {data.next_match.court.location_notes && (
                      <p className="text-sm text-blue-700 mt-1">
                        {data.next_match.court.location_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Round */}
                <div className="text-center">
                  <Badge variant="outline" className="text-base px-4 py-1">
                    Round {data.next_match.round}
                  </Badge>
                </div>

                {/* View Court Button */}
                {data.next_match.court && (
                  <Button
                    onClick={() => router.push(`/courts/${data.next_match!.court!.id}`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                  >
                    View Court & Live Score
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting State */}
        {data.status === 'waiting' && (
          <Card className="mt-4 border-blue-500 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Waiting for Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                Your next match will be scheduled soon. Check back for updates or wait for notifications.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Eliminated State */}
        {data.status === 'eliminated' && (
          <Card className="mt-4 border-gray-400 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-gray-900">Tournament Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Thank you for participating! You can continue to follow the tournament or view your match history below.
              </p>
              <Button
                onClick={() => router.push(`/tournaments/${tournamentId}`)}
                variant="outline"
                className="w-full"
              >
                View Full Tournament Bracket
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Match History */}
        {data.match_history.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Match History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.match_history.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border-2 ${
                      match.result === 'won'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        Round {match.round}
                      </Badge>
                      <Badge
                        className={
                          match.result === 'won'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }
                      >
                        {match.result === 'won' ? 'Won' : 'Lost'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Opponent</p>
                        <p className="font-semibold text-gray-900">
                          {getOpponentName(match.opponent)}
                        </p>
                      </div>
                      {match.score_a !== null && match.score_b !== null && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="font-semibold text-gray-900">
                            {match.score_a} - {match.score_b}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Matches Yet */}
        {data.match_history.length === 0 && !data.next_match && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Match History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                No matches played yet. Your first match will appear here once scheduled.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            variant="outline"
            className="w-full"
          >
            View Full Tournament
          </Button>
          <Button
            onClick={() => fetchPlayerData()}
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Bookmark this page to quickly access your tournament info
          </p>
        </div>
      </div>
    </div>
  )
}
