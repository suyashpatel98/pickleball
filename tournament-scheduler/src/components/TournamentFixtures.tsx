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
  court_id?: string | null
}

type Court = {
  id: string
  name: string
  location_notes?: string
}

interface TournamentFixturesProps {
  matches: MatchWithTeams[]
  tournamentName: string
  location?: string
  tournamentId: string
  courts: Court[]
}

export default function TournamentFixtures({
  matches,
  tournamentName,
  location,
  tournamentId,
  courts
}: TournamentFixturesProps) {
  const [selectedTab, setSelectedTab] = useState<'fixtures' | 'standings' | 'details'>('fixtures')
  const [selectedRound, setSelectedRound] = useState<number>(1)

  // Get unique pools and rounds
  const pools = Array.from(new Set(matches.map(m => m.pool).filter(Boolean))).sort() as string[]
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)

  // Filter matches based on current selections
  const filteredMatches = matches.filter(match => {
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

    // If team_name is just underscores or dashes, use player names
    const teamName = team.team_name
    if (teamName && teamName.trim() !== '' && teamName !== '_' && teamName !== '-') {
      return teamName
    }

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
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="fixtures">
          <div className="max-w-7xl mx-auto px-6 py-6">
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

                  {/* Score or VS */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {match.status === 'completed' ? (
                      <>
                        <div className="text-2xl font-bold">{match.score_a ?? '-'}</div>
                        <div className="text-muted-foreground">vs</div>
                        <div className="text-2xl font-bold">{match.score_b ?? '-'}</div>
                      </>
                    ) : (
                      <div className="text-muted-foreground text-sm">vs</div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-primary font-medium">
                      {match.court_id && courts.find(c => c.id === match.court_id)?.name}
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
            <h2 className="text-2xl font-bold mb-6 text-center">Tournament Standings</h2>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Rank</TableHead>
                        <TableHead className="text-left">Player</TableHead>
                        <TableHead className="text-center">Played</TableHead>
                        <TableHead className="text-center">Won</TableHead>
                        <TableHead className="text-center">Lost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // Calculate overall standings from all matches
                        const playerStats: { [playerId: string]: { name: string, played: number, won: number, lost: number } } = {}

                        matches.filter(m => m.status === 'completed').forEach(match => {
                          const playerAId = match.slot_a || ''
                          const playerBId = match.slot_b || ''
                          const playerAName = match.player_a?.name || 'Unknown'
                          const playerBName = match.player_b?.name || 'Unknown'

                          if (!playerStats[playerAId]) {
                            playerStats[playerAId] = { name: playerAName, played: 0, won: 0, lost: 0 }
                          }
                          if (!playerStats[playerBId]) {
                            playerStats[playerBId] = { name: playerBName, played: 0, won: 0, lost: 0 }
                          }

                          playerStats[playerAId].played++
                          playerStats[playerBId].played++

                          if (match.winner === playerAId) {
                            playerStats[playerAId].won++
                            playerStats[playerBId].lost++
                          } else if (match.winner === playerBId) {
                            playerStats[playerBId].won++
                            playerStats[playerAId].lost++
                          }
                        })

                        const standings = Object.entries(playerStats)
                          .map(([id, stats]) => ({ id, ...stats }))
                          .sort((a, b) => {
                            if (b.won !== a.won) return b.won - a.won
                            return a.lost - b.lost
                          })

                        return standings.length > 0 ? standings.map((standing, index) => (
                          <TableRow key={standing.id} className={index === 0 ? 'bg-green-50' : ''}>
                            <TableCell className="font-medium">
                              {index + 1}
                              {index === 0 && <span className="ml-2 text-xs text-green-600">🏆</span>}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{standing.name}</div>
                            </TableCell>
                            <TableCell className="text-center">{standing.played}</TableCell>
                            <TableCell className="text-center text-green-600 font-medium">{standing.won}</TableCell>
                            <TableCell className="text-center text-red-600 font-medium">{standing.lost}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
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
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Tournament Details</h2>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tournament Name</h3>
                      <p className="text-lg">{tournamentName}</p>
                    </div>

                    {location && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Location</h3>
                        <p className="text-lg">{location}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Format</h3>
                      <p className="text-lg">Single Elimination (Knockout)</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Total Matches</h3>
                      <p className="text-lg">{matches.length} matches</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Total Rounds</h3>
                      <p className="text-lg">{rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Organizer</h3>
                      <p className="text-lg">Dinker's Pickleball Academy</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">About</h3>
                    <p className="text-gray-700 leading-relaxed">
                      This knockout tournament is organized by Dinker's Pickleball Academy{location ? ` in ${location}` : ''}.
                      The tournament features {matches.filter((m, i, arr) => arr.findIndex(m2 => m2.slot_a === m.slot_a || m2.slot_b === m.slot_a) === i).length} players
                      competing across {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}
                      in a single-elimination format. Each match is played as best of 3 games,
                      and winners advance to the next round until a champion is crowned.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
