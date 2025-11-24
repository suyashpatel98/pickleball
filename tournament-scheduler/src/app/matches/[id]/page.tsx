'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Match, Player } from '@/types/db'

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
        <p className="text-gray-600">Loading match...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Match not found</p>
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
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tournament
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Match Complete</h1>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-lg font-medium">{player_a?.name || 'BYE'}</p>
                  {match.seed_a && <p className="text-sm text-gray-500">Seed #{match.seed_a}</p>}
                </div>
                {match.winner === match.slot_a && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Winner
                  </span>
                )}
              </div>

              <div className="text-center text-gray-400 font-medium">vs</div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-lg font-medium">{player_b?.name || 'BYE'}</p>
                  {match.seed_b && <p className="text-sm text-gray-500">Seed #{match.seed_b}</p>}
                </div>
                {match.winner === match.slot_b && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Winner
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/tournaments/${match.tournament_id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tournament
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Round {match.round} Match</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                match.status === 'live'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {match.status}
            </span>
          </div>

          {/* Players */}
          <div className="mb-8 space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-lg font-medium text-gray-900">{player_a?.name || 'BYE'}</p>
              {player_a?.dupr && (
                <p className="text-sm text-gray-600">DUPR: {player_a.dupr}</p>
              )}
              {match.seed_a && <p className="text-sm text-gray-500">Seed #{match.seed_a}</p>}
            </div>

            <div className="text-center text-gray-400 font-medium">vs</div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-lg font-medium text-gray-900">{player_b?.name || 'BYE'}</p>
              {player_b?.dupr && (
                <p className="text-sm text-gray-600">DUPR: {player_b.dupr}</p>
              )}
              {match.seed_b && <p className="text-sm text-gray-500">Seed #{match.seed_b}</p>}
            </div>
          </div>

          {/* Score Entry */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Score (Best of 3)</h2>

            <div className="space-y-3 mb-4">
              {games.map((game, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-16">
                    Game {index + 1}:
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={game.a}
                    onChange={(e) => handleScoreChange(index, 'a', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    value={game.b}
                    onChange={(e) => handleScoreChange(index, 'b', e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {games.length > 1 && (
                    <button
                      onClick={() => handleRemoveGame(index)}
                      className="ml-2 text-red-600 hover:text-red-700"
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
                    </button>
                  )}
                </div>
              ))}
            </div>

            {games.length < 3 && (
              <button
                onClick={handleAddGame}
                className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Game
              </button>
            )}

            <button
              onClick={handleSubmitScore}
              disabled={submitting}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Score'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
