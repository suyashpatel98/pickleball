'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CourtManagement from '@/components/CourtManagement'

type Court = {
  id: string
  name: string
  location_notes: string | null
  current_match?: {
    player_a_name: string
    player_b_name: string
    status: string
  } | null
}

type RoundStatus = {
  current_round: number
  total_matches: number
  completed_matches: number
  can_advance: boolean
}

export default function TournamentManagePage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [courts, setCourts] = useState<Court[]>([])
  const [tournamentName, setTournamentName] = useState<string>('')
  const [roundStatus, setRoundStatus] = useState<RoundStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [advanceMessage, setAdvanceMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchTournamentAndCourts()
    fetchRoundStatus()
  }, [tournamentId])

  const fetchTournamentAndCourts = async () => {
    try {
      setLoading(true)

      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`)
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json()
        setTournamentName(tournamentData.tournament?.name || 'Tournament')
      }

      // Fetch courts
      const courtsRes = await fetch(`/api/tournaments/${tournamentId}/courts`)
      if (courtsRes.ok) {
        const courtsData = await courtsRes.json()
        const courtsList = courtsData.courts || []

        // For each court, fetch current match
        const courtsWithMatches = await Promise.all(
          courtsList.map(async (court: Court) => {
            try {
              const matchesRes = await fetch(`/api/courts/${court.id}/matches`)
              if (matchesRes.ok) {
                const matchesData = await matchesRes.json()
                const currentMatch = matchesData.current_match

                if (currentMatch) {
                  return {
                    ...court,
                    current_match: {
                      player_a_name: currentMatch.player_a?.name || currentMatch.team_a?.player1?.name || 'TBD',
                      player_b_name: currentMatch.player_b?.name || currentMatch.team_b?.player1?.name || 'TBD',
                      status: currentMatch.status
                    }
                  }
                }
              }
              return court
            } catch {
              return court
            }
          })
        )

        setCourts(courtsWithMatches)
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setLoading(false)
    }
  }

  const fetchRoundStatus = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`)
      if (res.ok) {
        const data = await res.json()
        const matches = data.matches || []

        if (matches.length > 0) {
          const maxRound = Math.max(...matches.map((m: any) => m.round))
          const currentRoundMatches = matches.filter((m: any) => m.round === maxRound)
          const completedMatches = currentRoundMatches.filter(
            (m: any) => m.status === 'completed' || m.status === 'finished'
          )

          setRoundStatus({
            current_round: maxRound,
            total_matches: currentRoundMatches.length,
            completed_matches: completedMatches.length,
            can_advance: completedMatches.length === currentRoundMatches.length && currentRoundMatches.length > 0
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch round status:', error)
    }
  }

  const handleAdvanceRound = async () => {
    setAdvancing(true)
    setAdvanceMessage(null)

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/advance-round`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setAdvanceMessage({ type: 'error', text: data.error || 'Failed to advance round' })
      } else {
        if (data.champion) {
          setAdvanceMessage({ type: 'success', text: `🏆 Tournament Complete! Champion: ${data.champion}` })
        } else {
          setAdvanceMessage({
            type: 'success',
            text: `✓ Advanced to Round ${data.next_round}. ${data.matches_created} matches created.`
          })
        }

        // Refresh data
        await fetchTournamentAndCourts()
        await fetchRoundStatus()
      }
    } catch (error) {
      setAdvanceMessage({ type: 'error', text: 'Failed to advance round' })
    } finally {
      setAdvancing(false)
    }
  }

  const handleCourtsUpdated = () => {
    fetchTournamentAndCourts()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading tournament management...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tournamentName}</h1>
              <p className="text-sm text-muted-foreground mt-1">Tournament Director Dashboard</p>
            </div>
            <Link href={`/tournaments/${tournamentId}`}>
              <Button variant="outline">
                ← Back to Tournament
              </Button>
            </Link>
          </div>
        </div>

        {/* Advance Message */}
        {advanceMessage && (
          <Alert variant={advanceMessage.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{advanceMessage.text}</AlertDescription>
          </Alert>
        )}

        {/* Round Status & Advancement */}
        {roundStatus && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tournament Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Round</p>
                    <p className="text-2xl font-bold">Round {roundStatus.current_round}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Match Progress</p>
                    <p className="text-2xl font-bold">
                      {roundStatus.completed_matches}/{roundStatus.total_matches}
                    </p>
                  </div>
                  <div>
                    <Badge variant={roundStatus.can_advance ? 'default' : 'secondary'}>
                      {roundStatus.can_advance ? 'Ready to Advance' : 'In Progress'}
                    </Badge>
                  </div>
                </div>

                {roundStatus.can_advance && (
                  <Button
                    onClick={handleAdvanceRound}
                    disabled={advancing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {advancing ? 'Advancing...' : `Advance to Round ${roundStatus.current_round + 1}`}
                  </Button>
                )}

                {!roundStatus.can_advance && roundStatus.total_matches > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Complete all Round {roundStatus.current_round} matches to advance
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Court Overview Grid */}
        {courts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Court Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courts.map((court) => (
                  <Link
                    key={court.id}
                    href={`/courts/${court.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{court.name}</CardTitle>
                          <Badge variant={court.current_match ? "default" : "secondary"}>
                            {court.current_match ? "Active" : "Idle"}
                          </Badge>
                        </div>
                        {court.location_notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {court.location_notes}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        {court.current_match ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Current Match:</p>
                            <p className="text-xs text-muted-foreground">
                              {court.current_match.player_a_name} vs {court.current_match.player_b_name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {court.current_match.status}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No active match</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Court Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Court Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create and manage courts for this tournament
            </p>
          </CardHeader>
          <CardContent>
            <CourtManagement
              tournamentId={tournamentId}
              onCourtsUpdated={handleCourtsUpdated}
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href={`/tournaments/${tournamentId}`}>
                <Button variant="outline" className="w-full">
                  View Public Tournament Page
                </Button>
              </Link>
              <Link href={`/tournaments/${tournamentId}#players`}>
                <Button variant="outline" className="w-full">
                  Manage Players
                </Button>
              </Link>
              <Link href={`/tournaments/${tournamentId}#fixtures`}>
                <Button variant="outline" className="w-full">
                  View Fixtures
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
