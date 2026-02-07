'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Match, Player } from '@/types/db'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type MatchScore = {
  id: string
  match_id: string
  scorer_id: string
  score_json: {
    games: GameScore[]
  }
  created_at: string
}

type MatchWithPlayers = Match & {
  player_a: Player | null
  player_b: Player | null
  match_scores?: MatchScore[]
}

type GameScore = {
  a: number
  b: number
}

export default function MatchDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<MatchWithPlayers | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading match...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    )
  }

  const { player_a, player_b, match_scores, status, tournament_id, round, pool, court, seed_a, seed_b, winner, slot_a, slot_b } = data

  // Extract game-by-game scores if available
  const submittedGames = match_scores && match_scores.length > 0
    ? match_scores[0].score_json?.games || []
    : []

  const gamesWonA = submittedGames.filter(g => g.a > g.b).length
  const gamesWonB = submittedGames.filter(g => g.b > g.a).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href={`/tournaments/${tournament_id}`}
          className="inline-flex items-center text-primary hover:underline mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tournament
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                Round {round} Match {pool && `- Pool ${pool}`}
              </CardTitle>
              <Badge
                variant={status === 'completed' ? 'default' : status === 'live' ? 'destructive' : 'secondary'}
                className={status === 'completed' ? 'bg-green-600' : ''}
              >
                {status}
              </Badge>
            </div>
            {court && (
              <p className="text-sm text-muted-foreground mt-2">
                Court {court}
              </p>
            )}
          </CardHeader>

          <CardContent>
            {/* Players */}
            <div className="space-y-6 mb-8">
              {/* Player A */}
              <Card className={winner === slot_a ? 'border-green-500 border-2' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{player_a?.name || 'TBD'}</h3>
                      <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                        {player_a?.dupr && <span>DUPR: {player_a.dupr}</span>}
                        {seed_a && <span>Seed #{seed_a}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {status === 'completed' && (
                        <div className="text-3xl font-bold">{gamesWonA}</div>
                      )}
                      {winner === slot_a && (
                        <Badge className="bg-green-600 mt-2">Winner</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <span className="text-lg font-medium text-muted-foreground">vs</span>
              </div>

              {/* Player B */}
              <Card className={winner === slot_b ? 'border-green-500 border-2' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{player_b?.name || 'TBD'}</h3>
                      <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                        {player_b?.dupr && <span>DUPR: {player_b.dupr}</span>}
                        {seed_b && <span>Seed #{seed_b}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {status === 'completed' && (
                        <div className="text-3xl font-bold">{gamesWonB}</div>
                      )}
                      {winner === slot_b && (
                        <Badge className="bg-green-600 mt-2">Winner</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Game-by-Game Scores */}
            {submittedGames.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">Game Scores</h2>
                <div className="space-y-3">
                  {submittedGames.map((game, index) => {
                    const isWinnerA = game.a > game.b
                    return (
                      <Card key={index} className="bg-gray-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Game {index + 1}
                            </span>
                            <div className="flex items-center gap-6">
                              <div className={`text-3xl font-bold ${isWinnerA ? 'text-green-600' : 'text-gray-600'}`}>
                                {game.a}
                              </div>
                              <span className="text-xl text-muted-foreground">-</span>
                              <div className={`text-3xl font-bold ${!isWinnerA ? 'text-green-600' : 'text-gray-600'}`}>
                                {game.b}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Match Summary */}
                <Card className="mt-6 bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-900">
                        Match Result
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {gamesWonA} - {gamesWonB}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Match Not Yet Played */}
            {status === 'scheduled' && submittedGames.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  This match has not been played yet.
                </p>
              </div>
            )}

            {/* Match In Progress */}
            {status === 'live' && submittedGames.length === 0 && (
              <div className="text-center py-8">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Match in Progress
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
