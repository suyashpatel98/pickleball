'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Match, Player, Team } from '@/types/db'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

type TeamWithPlayers = Team & {
  player1: Player
  player2?: Player | null
}

type MatchWithPlayers = Match & {
  player_a?: Player | null
  player_b?: Player | null
  team_a?: TeamWithPlayers | null
  team_b?: TeamWithPlayers | null
}

type GameScore = {
  a: number
  b: number
}

export default function CourtRefereePage() {
  const params = useParams()
  const router = useRouter()
  const courtNumber = params.id as string

  const [currentMatch, setCurrentMatch] = useState<MatchWithPlayers | null>(null)
  const [nextMatch, setNextMatch] = useState<MatchWithPlayers | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<MatchWithPlayers[]>([])
  const [courtName, setCourtName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [games, setGames] = useState<GameScore[]>([{ a: 0, b: 0 }])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch matches for this court
  const fetchCourtMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/courts/${courtNumber}/matches`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch court matches')
      }

      const data = await res.json()
      setCourtName(data.court?.name || `Court ${courtNumber}`)
      setCurrentMatch(data.current_match)
      setNextMatch(data.next_match)
      setUpcomingMatches(data.upcoming_matches || [])

      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch court matches:', err)
      setError(err instanceof Error ? err.message : 'Failed to load court matches')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourtMatches()
  }, [courtNumber])

  const handleAddGame = () => {
    if (games.length < 3) {
      setGames([...games, { a: 0, b: 0 }])
    }
  }

  const handleRemoveGame = (index: number) => {
    if (games.length > 1) {
      setGames(games.filter((_, i) => i !== index))
    }
  }

  const handleScoreChange = (index: number, player: 'a' | 'b', value: string) => {
    const newGames = [...games]
    const numValue = parseInt(value) || 0
    newGames[index][player] = numValue
    setGames(newGames)
  }

  const handleSubmitScore = async () => {
    if (!currentMatch) return

    // Validate that at least one game has been played
    if (games.every((g) => g.a === 0 && g.b === 0)) {
      setError('Please enter at least one game score')
      return
    }

    // Calculate winner (best of 3 - first to win 2 games)
    const gamesWonA = games.filter((g) => g.a > g.b).length
    const gamesWonB = games.filter((g) => g.b > g.a).length

    if (gamesWonA === gamesWonB) {
      setError('Match must have a clear winner (best of 3)')
      return
    }

    const winnerId = gamesWonA > gamesWonB ? currentMatch.slot_a : currentMatch.slot_b

    if (!winnerId) {
      setError('Cannot determine winner')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/matches/${currentMatch.id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          games,
          winner: winnerId,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to submit score')
      }

      // Show success message
      setSuccess('Match completed! Loading next match...')

      // Reset form
      setGames([{ a: 0, b: 0 }])

      // Wait a moment for database to update, then reload
      setTimeout(async () => {
        await fetchCourtMatches()
        setSuccess(null)
      }, 1000)
    } catch (err) {
      console.error('Failed to submit score:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit score')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading court...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Court Header */}
        <div className="bg-[#2c3e50] text-white px-6 py-4 rounded-lg">
          <h1 className="text-2xl font-bold">{courtName || `Court ${courtNumber}`}</h1>
          <p className="text-sm text-gray-300 mt-1">Referee View</p>
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* No Current Match - Info */}
        {!loading && !currentMatch && !error && (
          <Card className="mt-4 border-blue-500 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">No Matches Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                This court currently has no matches assigned. The tournament director needs to assign matches to this court.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Current Match (when implemented) */}
        {currentMatch && (
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Match</CardTitle>
                <Badge variant="destructive">Live</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Round {currentMatch.round} {currentMatch.pool && `- Pool ${currentMatch.pool}`}
              </p>
            </CardHeader>

            <CardContent>
              {/* Players */}
              <div className="mb-6 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg font-semibold">{currentMatch.player_a?.name || 'TBD'}</p>
                  {currentMatch.player_a?.dupr && (
                    <p className="text-sm text-muted-foreground">DUPR: {currentMatch.player_a.dupr}</p>
                  )}
                </div>

                <div className="text-center text-muted-foreground font-medium">vs</div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg font-semibold">{currentMatch.player_b?.name || 'TBD'}</p>
                  {currentMatch.player_b?.dupr && (
                    <p className="text-sm text-muted-foreground">DUPR: {currentMatch.player_b.dupr}</p>
                  )}
                </div>
              </div>

              {/* Score Entry */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Enter Score (Best of 3)</h3>

                <div className="space-y-3 mb-4">
                  {games.map((game, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-20">
                        Game {index + 1}:
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={game.a || ''}
                        onChange={(e) => handleScoreChange(index, 'a', e.target.value)}
                        className="w-20 text-center text-lg"
                        placeholder="0"
                      />
                      <span className="text-muted-foreground font-bold">-</span>
                      <Input
                        type="number"
                        min="0"
                        value={game.b || ''}
                        onChange={(e) => handleScoreChange(index, 'b', e.target.value)}
                        className="w-20 text-center text-lg"
                        placeholder="0"
                      />
                      {games.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveGame(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {games.length < 3 && (
                  <Button
                    variant="outline"
                    onClick={handleAddGame}
                    className="mb-4"
                  >
                    + Add Game {games.length + 1}
                  </Button>
                )}

                <Button
                  onClick={handleSubmitScore}
                  disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  {submitting ? 'Submitting...' : 'Complete Match'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Match Preview */}
        {nextMatch && (
          <Card className="mt-4 border-2 border-dashed border-blue-300 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-900">Up Next</CardTitle>
                <Badge variant="outline" className="bg-white">
                  Round {nextMatch.round}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-blue-900">
                    {nextMatch.player_a?.name || nextMatch.team_a?.player1?.name || 'TBD'}
                  </p>
                  <span className="text-xs text-blue-700">vs</span>
                  <p className="font-medium text-blue-900">
                    {nextMatch.player_b?.name || nextMatch.team_b?.player1?.name || 'TBD'}
                  </p>
                </div>
                {nextMatch.pool && (
                  <p className="text-xs text-blue-700">Pool {nextMatch.pool}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Matches Queue */}
        {upcomingMatches.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Match Queue ({upcomingMatches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingMatches.slice(0, 3).map((match, index) => (
                  <div key={match.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                    <Badge variant="outline" className="text-xs">
                      #{index + 2}
                    </Badge>
                    <span className="text-muted-foreground">
                      {match.player_a?.name || match.team_a?.player1?.name || 'TBD'} vs{' '}
                      {match.player_b?.name || match.team_b?.player1?.name || 'TBD'}
                    </span>
                  </div>
                ))}
                {upcomingMatches.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{upcomingMatches.length - 3} more matches
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Button */}
        <div className="mt-6 text-center">
          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            🚨 Need Help / Report Issue
          </Button>
        </div>
      </div>
    </div>
  )
}
