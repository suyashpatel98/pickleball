'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export default function TournamentManagePage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [courts, setCourts] = useState<Court[]>([])
  const [tournamentName, setTournamentName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTournamentAndCourts()
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
