'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Match, Player } from '@/types/db'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type MatchWithPlayers = {
  match: Match
  player_a: Player | null
  player_b: Player | null
}

type GameScore = {
  a: number
  b: number
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<MatchWithPlayers | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [games, setGames] = useState<GameScore[]>([{ a: 0, b: 0 }])

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/matches/${id}`)
        if (!res.ok) throw new Error('Failed to fetch match')
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error('Failed to fetch match:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatch()
  }, [id])

  const handleAddGame = () => {
    setGames([...games, { a: 0, b: 0 }])
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
    if (!data) return

    // Validate that at least one game has been played
    if (games.every((g) => g.a === 0 && g.b === 0)) {
      alert('Please enter at least one game score')
      return
    }

    // Calculate winner (best of 3 - first to win 2 games)
    const gamesWonA = games.filter((g) => g.a > g.b).length
    const gamesWonB = games.filter((g) => g.b > g.a).length

    if (gamesWonA === gamesWonB) {
      alert('Match must have a clear winner (best of 3)')
      return
    }

    const winnerId = gamesWonA > gamesWonB ? data.match.slot_a : data.match.slot_b

    if (!winnerId) {
      alert('Cannot determine winner')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/matches/${id}/score`, {
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

      // Redirect back to tournament page
      router.push(`/tournaments/${data.match.tournament_id}`)
    } catch (error) {
      console.error('Failed to submit score:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit score')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading match...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    )
  }

  const { match, player_a, player_b } = data

  // If match is finished, show read-only view
  if (match.status === 'finished') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href={`/tournaments/${match.tournament_id}`}
            className="inline-flex items-center text-primary hover:underline mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tournament
          </Link>

          <Card>
            <CardContent className="pt-6">
              <h1 className="text-2xl font-bold mb-6">Match Complete</h1>

              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-medium">{player_a?.name || 'BYE'}</p>
                        {match.seed_a && <p className="text-sm text-muted-foreground">Seed #{match.seed_a}</p>}
                      </div>
                      {match.winner === match.slot_a && (
                        <Badge className="bg-green-600">Winner</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center text-muted-foreground font-medium">vs</div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-medium">{player_b?.name || 'BYE'}</p>
                        {match.seed_b && <p className="text-sm text-muted-foreground">Seed #{match.seed_b}</p>}
                      </div>
                      {match.winner === match.slot_b && (
                        <Badge className="bg-green-600">Winner</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/tournaments/${match.tournament_id}`}
          className="inline-flex items-center text-primary hover:underline mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tournament
        </Link>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Round {match.round} Match</h1>
              <Badge variant={match.status === 'live' ? 'default' : 'secondary'}>
                {match.status}
              </Badge>
            </div>

            {/* Players */}
            <div className="mb-8 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-lg font-medium">{player_a?.name || 'BYE'}</p>
                  {player_a?.dupr && (
                    <p className="text-sm text-muted-foreground">DUPR: {player_a.dupr}</p>
                  )}
                  {match.seed_a && <p className="text-sm text-muted-foreground">Seed #{match.seed_a}</p>}
                </CardContent>
              </Card>

              <div className="text-center text-muted-foreground font-medium">vs</div>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-lg font-medium">{player_b?.name || 'BYE'}</p>
                  {player_b?.dupr && (
                    <p className="text-sm text-muted-foreground">DUPR: {player_b.dupr}</p>
                  )}
                  {match.seed_b && <p className="text-sm text-muted-foreground">Seed #{match.seed_b}</p>}
                </CardContent>
              </Card>
            </div>

            {/* Score Entry */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Enter Score (Best of 3)</h2>

              <div className="space-y-3 mb-4">
                {games.map((game, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-16">
                      Game {index + 1}:
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={game.a}
                      onChange={(e) => handleScoreChange(index, 'a', e.target.value)}
                      className="w-20"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      min="0"
                      value={game.b}
                      onChange={(e) => handleScoreChange(index, 'b', e.target.value)}
                      className="w-20"
                      placeholder="0"
                    />
                    {games.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGame(index)}
                        className="ml-2 text-destructive hover:text-destructive"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {games.length < 3 && (
                <Button
                  variant="link"
                  onClick={handleAddGame}
                  className="mb-4 text-sm"
                >
                  + Add Game
                </Button>
              )}

              <Button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : 'Submit Score'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
