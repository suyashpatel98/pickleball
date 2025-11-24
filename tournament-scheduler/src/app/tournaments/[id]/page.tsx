'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Tournament, Match, Player } from '@/types/db'
import RegisterPlayerModal from '@/components/RegisterPlayerModal'
import { supabase } from '@/lib/supabase'

type RegistrationWithPlayer = {
  id: string
  seed?: number
  player: Player
}

type TournamentDetail = {
  tournament: Tournament
  registrations: RegistrationWithPlayer[]
  matches: Match[]
}

export default function TournamentDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<TournamentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchTournamentDetail = async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTournamentDetail()

    // Setup real-time subscription for matches
    const channel = supabase
      .channel(`tournament-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${id}`,
        },
        (payload) => {
          console.log('Match change received:', payload)
          // Refetch tournament detail when matches change
          fetchTournamentDetail()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
          filter: `tournament_id=eq.${id}`,
        },
        (payload) => {
          console.log('Registration change received:', payload)
          // Refetch tournament detail when registrations change
          fetchTournamentDetail()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const handleGenerateBracket = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/tournaments/${id}/generate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate bracket')
      }

      await fetchTournamentDetail()
    } catch (error) {
      console.error('Failed to generate bracket:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate bracket')
    } finally {
      setGenerating(false)
    }
  }

  const handlePlayerRegistered = () => {
    setIsRegisterModalOpen(false)
    fetchTournamentDetail()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading tournament...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Tournament not found</p>
      </div>
    )
  }

  const { tournament, registrations, matches } = data

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = []
    }
    acc[match.round].push(match)
    return acc
  }, {} as Record<number, Match[]>)

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)

  // Helper to get player name by ID
  const getPlayerName = (playerId: string | null | undefined): string => {
    if (!playerId) return 'BYE'
    const reg = registrations.find((r) => r.player.id === playerId)
    return reg ? reg.player.name : 'Unknown'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tournaments
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
          {tournament.date && (
            <p className="text-gray-600 mt-1">
              {new Date(tournament.date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Bracket */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bracket</h2>

              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No bracket generated yet. Register players and click Generate Bracket.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {rounds.map((round) => (
                    <div key={round}>
                      <h3 className="text-lg font-medium text-gray-700 mb-3">
                        Round {round}
                      </h3>
                      <div className="space-y-3">
                        {matchesByRound[round].map((match) => (
                          <Link
                            key={match.id}
                            href={`/matches/${match.id}`}
                            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`${match.winner === match.slot_a ? 'font-bold text-green-600' : 'text-gray-700'}`}>
                                    {getPlayerName(match.slot_a)}
                                  </span>
                                  {match.seed_a && (
                                    <span className="text-xs text-gray-500">#{match.seed_a}</span>
                                  )}
                                </div>
                                <div className="text-gray-400 my-1">vs</div>
                                <div className="flex items-center gap-2">
                                  <span className={`${match.winner === match.slot_b ? 'font-bold text-green-600' : 'text-gray-700'}`}>
                                    {getPlayerName(match.slot_b)}
                                  </span>
                                  {match.seed_b && (
                                    <span className="text-xs text-gray-500">#{match.seed_b}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                    match.status === 'finished'
                                      ? 'bg-green-100 text-green-800'
                                      : match.status === 'live'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {match.status}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Registrations */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Players ({registrations.length})
                </h2>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  + Add
                </button>
              </div>

              {registrations.length === 0 ? (
                <p className="text-gray-500 text-sm">No players registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {registrations
                    .sort((a, b) => (a.seed || 999) - (b.seed || 999))
                    .map((reg) => (
                      <div
                        key={reg.id}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {reg.player.name}
                            </div>
                            {reg.player.dupr && (
                              <div className="text-sm text-gray-600">
                                DUPR: {reg.player.dupr}
                              </div>
                            )}
                          </div>
                          {reg.seed && (
                            <div className="text-sm font-medium text-blue-600">
                              Seed #{reg.seed}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {registrations.length > 0 && matches.length === 0 && (
                <button
                  onClick={handleGenerateBracket}
                  disabled={generating}
                  className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Bracket'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <RegisterPlayerModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handlePlayerRegistered}
        tournamentId={id}
      />
    </div>
  )
}
