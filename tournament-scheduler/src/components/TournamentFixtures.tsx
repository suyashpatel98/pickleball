'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Match, Team, Player } from '@/types/db'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type TeamWithPlayers = Team & {
  player1: Player
  player2?: Player | null
}

type MatchWithTeams = Match & {
  team_a?: TeamWithPlayers | null
  team_b?: TeamWithPlayers | null
  player_a?: Player | null
  player_b?: Player | null
}

interface TournamentFixturesProps {
  matches: MatchWithTeams[]
  tournamentName: string
  location?: string
  tournamentId: string
}

export default function TournamentFixtures({
  matches,
  tournamentName,
  location,
  tournamentId
}: TournamentFixturesProps) {
  const [selectedTab, setSelectedTab] = useState<'fixtures' | 'standings' | 'table' | 'stats' | 'details'>('fixtures')
  const [formatView, setFormatView] = useState<'round-robin' | 'knockouts'>('round-robin')
  const [viewMode, setViewMode] = useState<'court-wise' | 'pool-wise' | 'status-wise'>('pool-wise')
  const [selectedPool, setSelectedPool] = useState<string>('A')
  const [selectedRound, setSelectedRound] = useState<number>(1)

  // Get unique pools and rounds
  const pools = Array.from(new Set(matches.map(m => m.pool).filter(Boolean))).sort() as string[]
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)

  // Filter matches based on current selections
  const filteredMatches = matches.filter(match => {
    if (viewMode === 'pool-wise' && selectedPool) {
      return match.pool === selectedPool && match.round === selectedRound
    }
    if (viewMode === 'court-wise' && match.court) {
      return match.round === selectedRound
    }
    if (viewMode === 'status-wise') {
      return match.round === selectedRound
    }
    return match.round === selectedRound
  })

  const getTeamDisplay = (team?: TeamWithPlayers | null, player?: Player | null) => {
    // For singles matches, display player name
    if (player) {
      return (
        <div className="text-sm">
          <div className="font-medium">{player.name || 'Unknown'}</div>
        </div>
      )
    }

    // For team matches, display team players
    if (!team) return 'TBD'
    const player1Name = team.player1?.name || 'Unknown'
    const player2Name = team.player2?.name || ''
    return (
      <div className="text-sm">
        <div className="font-medium">{player1Name}</div>
        {player2Name && <div className="font-medium">{player2Name}</div>}
      </div>
    )
  }

  const getTeamName = (team?: TeamWithPlayers | null, player?: Player | null) => {
    // For singles matches, return player name
    if (player) {
      return player.name || 'Unknown'
    }

    // For team matches, return team name
    if (!team) return 'TBD'
    const player1Name = team.player1?.name || 'Unknown'
    const player2Name = team.player2?.name || ''
    return player2Name ? `${player1Name} / ${player2Name}` : player1Name
  }

  // Calculate standings for each pool
  type TeamStanding = {
    teamId: string
    team: TeamWithPlayers | null | undefined
    played: number
    won: number
    lost: number
    pointsFor: number
    pointsAgainst: number
    pointsDiff: number
    points: number
  }

  const calculateStandings = () => {
    const standingsByPool: { [pool: string]: TeamStanding[] } = {}

    pools.forEach(pool => {
      const poolMatches = matches.filter(m => m.pool === pool && m.status === 'completed')
      const teamStats: { [teamId: string]: TeamStanding } = {}

      poolMatches.forEach(match => {
        // For singles matches, use slot IDs; for team matches, use team IDs
        const teamAId = match.slot_a || match.team_a_id || ''
        const teamBId = match.slot_b || match.team_b_id || ''

        // Initialize team A stats
        if (!teamStats[teamAId]) {
          teamStats[teamAId] = {
            teamId: teamAId,
            team: match.team_a || (match.player_a ? {
              id: match.slot_a || '',
              team_name: match.player_a.name,
              player1: match.player_a,
              player1_id: match.player_a.id,
              player2: null,
              tournament_id: '',
              created_at: ''
            } as TeamWithPlayers : null),
            played: 0,
            won: 0,
            lost: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointsDiff: 0,
            points: 0
          }
        }

        // Initialize team B stats
        if (!teamStats[teamBId]) {
          teamStats[teamBId] = {
            teamId: teamBId,
            team: match.team_b || (match.player_b ? {
              id: match.slot_b || '',
              team_name: match.player_b.name,
              player1: match.player_b,
              player1_id: match.player_b.id,
              player2: null,
              tournament_id: '',
              created_at: ''
            } as TeamWithPlayers : null),
            played: 0,
            won: 0,
            lost: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointsDiff: 0,
            points: 0
          }
        }

        const scoreA = match.score_a ?? 0
        const scoreB = match.score_b ?? 0

        // Update stats for team A
        teamStats[teamAId].played++
        teamStats[teamAId].pointsFor += scoreA
        teamStats[teamAId].pointsAgainst += scoreB
        if (scoreA > scoreB) {
          teamStats[teamAId].won++
          teamStats[teamAId].points += 2 // 2 points for a win
        } else {
          teamStats[teamAId].lost++
        }

        // Update stats for team B
        teamStats[teamBId].played++
        teamStats[teamBId].pointsFor += scoreB
        teamStats[teamBId].pointsAgainst += scoreA
        if (scoreB > scoreA) {
          teamStats[teamBId].won++
          teamStats[teamBId].points += 2 // 2 points for a win
        } else {
          teamStats[teamBId].lost++
        }
      })

      // Calculate point differentials and sort
      Object.values(teamStats).forEach(stat => {
        stat.pointsDiff = stat.pointsFor - stat.pointsAgainst
      })

      standingsByPool[pool] = Object.values(teamStats).sort((a, b) => {
        // Sort by points first, then by point differential
        if (b.points !== a.points) return b.points - a.points
        if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff
        return b.pointsFor - a.pointsFor
      })
    })

    return standingsByPool
  }

  const standingsByPool = calculateStandings()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#2c3e50] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Dinker's Pickleball Academy</h1>
          <Link href={`/tournaments/${tournamentId}/manage`}>
            <Button variant="outline" size="sm" className="bg-white text-[#2c3e50] hover:bg-gray-100">
              Manage Tournament
            </Button>
          </Link>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="bg-white border-b px-6 py-3">
        <div className="text-center text-sm text-gray-700">
          {tournamentName} {location && `• ${location}`} • doubles • ID: {tournamentId.slice(0, 8)} • elimination
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="bg-white">
        <div className="border-b">
          <div className="flex justify-center px-6 py-3">
            <TabsList>
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="fixtures">
          <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Format Selection */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={formatView === 'round-robin' ? 'default' : 'outline'}
              onClick={() => setFormatView('round-robin')}
            >
              Round Robin
            </Button>
            <Button
              variant={formatView === 'knockouts' ? 'default' : 'outline'}
              onClick={() => setFormatView('knockouts')}
            >
              Knockouts
            </Button>
          </div>

          {/* Round Navigation */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {rounds.map((round) => (
              <Button
                key={round}
                variant={selectedRound === round ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRound(round)}
              >
                Round {round}
              </Button>
            ))}
          </div>

          {/* View Mode Selection */}
          <div className="flex justify-center gap-4 mb-6">
            {(['court-wise', 'pool-wise', 'status-wise'] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'secondary'}
                onClick={() => setViewMode(mode)}
              >
                {mode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
              </Button>
            ))}
          </div>

          {/* Pool Selection (only for pool-wise view) */}
          {viewMode === 'pool-wise' && pools.length > 0 && (
            <div className="flex justify-center gap-2 mb-6">
              {pools.map((pool) => (
                <Button
                  key={pool}
                  variant={selectedPool === pool ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setSelectedPool(pool)}
                  className={selectedPool === pool ? 'bg-gray-800 hover:bg-gray-900' : ''}
                >
                  {pool}
                </Button>
              ))}
            </div>
          )}

          {/* Match Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-xs text-muted-foreground mb-3">Match ID: {match.id.slice(0, 8)}</div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Player/Team A */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {match.player_a ? `Player ID: ${match.slot_a?.slice(0, 8) || 'N/A'}` : `Team ID: ${match.team_a_id?.slice(0, 8) || 'N/A'}`}
                      </div>
                      {getTeamDisplay(match.team_a, match.player_a)}
                    </div>

                    {/* Player/Team B */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {match.player_b ? `Player ID: ${match.slot_b?.slice(0, 8) || 'N/A'}` : `Team ID: ${match.team_b_id?.slice(0, 8) || 'N/A'}`}
                      </div>
                      {getTeamDisplay(match.team_b, match.player_b)}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-2xl font-bold">{match.score_a ?? '-'}</div>
                    <div className="text-muted-foreground">vs</div>
                    <div className="text-2xl font-bold">{match.score_b ?? '-'}</div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs mb-4">
                    <div className="text-primary">
                      {match.pool && `Pool: ${match.pool}`}
                      {match.court && ` | Court ${match.court}`}
                    </div>
                    <Badge
                      variant={
                        match.status === 'completed' ? 'default' :
                        match.status === 'live' ? 'destructive' :
                        'secondary'
                      }
                      className={match.status === 'completed' ? 'bg-green-600' : ''}
                    >
                      {match.status === 'completed' ? 'Completed' : match.status}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <Link href={`/matches/${match.id}`} className="block w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No matches found for the selected filters.
            </div>
          )}
          </div>
        </TabsContent>

        <TabsContent value="standings">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Pool Standings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pools.map(pool => (
                <Card key={pool} className="overflow-hidden">
                  <div className="bg-primary text-primary-foreground px-4 py-3">
                    <h3 className="text-lg font-semibold">Pool {pool}</h3>
                  </div>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-left">Rank</TableHead>
                            <TableHead className="text-left">Team</TableHead>
                            <TableHead className="text-center">P</TableHead>
                            <TableHead className="text-center">W</TableHead>
                            <TableHead className="text-center">L</TableHead>
                            <TableHead className="text-center">PF</TableHead>
                            <TableHead className="text-center">PA</TableHead>
                            <TableHead className="text-center">Diff</TableHead>
                            <TableHead className="text-center">Pts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {standingsByPool[pool]?.length > 0 ? (
                            standingsByPool[pool].map((standing, index) => (
                              <TableRow key={standing.teamId} className={index === 0 ? 'bg-green-50' : ''}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{getTeamName(standing.team)}</div>
                                  {standing.team?.team_name && (
                                    <div className="text-xs text-muted-foreground">{standing.team.team_name}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">{standing.played}</TableCell>
                                <TableCell className="text-center text-green-600 font-medium">{standing.won}</TableCell>
                                <TableCell className="text-center text-red-600 font-medium">{standing.lost}</TableCell>
                                <TableCell className="text-center">{standing.pointsFor}</TableCell>
                                <TableCell className="text-center">{standing.pointsAgainst}</TableCell>
                                <TableCell className={`text-center font-medium ${
                                  standing.pointsDiff > 0 ? 'text-green-600' : standing.pointsDiff < 0 ? 'text-red-600' : ''
                                }`}>
                                  {standing.pointsDiff > 0 ? '+' : ''}{standing.pointsDiff}
                                </TableCell>
                                <TableCell className="text-center font-bold text-primary">{standing.points}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                                No completed matches in this pool yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Legend:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
                  <div><span className="font-semibold">P:</span> Played</div>
                  <div><span className="font-semibold">W:</span> Won</div>
                  <div><span className="font-semibold">L:</span> Lost</div>
                  <div><span className="font-semibold">PF:</span> Points For</div>
                  <div><span className="font-semibold">PA:</span> Points Against</div>
                  <div><span className="font-semibold">Diff:</span> Point Difference</div>
                  <div><span className="font-semibold">Pts:</span> League Points (2 for win)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Overall Standings</h2>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Rank</TableHead>
                        <TableHead className="text-left">Team</TableHead>
                        <TableHead className="text-center">Pool</TableHead>
                        <TableHead className="text-center">Played</TableHead>
                        <TableHead className="text-center">Won</TableHead>
                        <TableHead className="text-center">Lost</TableHead>
                        <TableHead className="text-center">Points For</TableHead>
                        <TableHead className="text-center">Points Against</TableHead>
                        <TableHead className="text-center">Difference</TableHead>
                        <TableHead className="text-center">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const allStandings = pools.flatMap(pool =>
                          (standingsByPool[pool] || []).map(s => ({ ...s, pool }))
                        ).sort((a, b) => {
                          if (b.points !== a.points) return b.points - a.points
                          if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff
                          return b.pointsFor - a.pointsFor
                        })

                        return allStandings.length > 0 ? allStandings.map((standing, index) => (
                          <TableRow key={standing.teamId} className={index < 4 ? 'bg-yellow-50' : ''}>
                            <TableCell className="font-medium">
                              {index + 1}
                              {index < 4 && <span className="ml-2 text-xs text-yellow-600">★</span>}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{getTeamName(standing.team)}</div>
                              {standing.team?.team_name && (
                                <div className="text-xs text-muted-foreground">{standing.team.team_name}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="w-8 h-8 rounded-full">
                                {standing.pool}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{standing.played}</TableCell>
                            <TableCell className="text-center text-green-600 font-medium">{standing.won}</TableCell>
                            <TableCell className="text-center text-red-600 font-medium">{standing.lost}</TableCell>
                            <TableCell className="text-center">{standing.pointsFor}</TableCell>
                            <TableCell className="text-center">{standing.pointsAgainst}</TableCell>
                            <TableCell className={`text-center font-medium ${
                              standing.pointsDiff > 0 ? 'text-green-600' : standing.pointsDiff < 0 ? 'text-red-600' : ''
                            }`}>
                              {standing.pointsDiff > 0 ? '+' : ''}{standing.pointsDiff}
                            </TableCell>
                            <TableCell className="text-center font-bold text-primary">{standing.points}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground h-24">
                              No completed matches yet
                            </TableCell>
                          </TableRow>
                        )
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">★ Top 4 teams</span> will advance to the knockout stage
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="text-center py-12 text-muted-foreground">
            Stats view coming soon...
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="text-center py-12 text-muted-foreground">
            Details view coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
