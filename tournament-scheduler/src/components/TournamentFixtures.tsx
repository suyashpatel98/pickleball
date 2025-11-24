'use client'

import { useState } from 'react'
import { Match, Team, Player } from '@/types/db'

type TeamWithPlayers = Team & {
  player1: Player
  player2?: Player | null
}

type MatchWithTeams = Match & {
  team_a?: TeamWithPlayers | null
  team_b?: TeamWithPlayers | null
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

  const getTeamDisplay = (team?: TeamWithPlayers | null) => {
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

  const getTeamName = (team?: TeamWithPlayers | null) => {
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
        const teamAId = match.team_a_id || ''
        const teamBId = match.team_b_id || ''

        // Initialize team A stats
        if (!teamStats[teamAId]) {
          teamStats[teamAId] = {
            teamId: teamAId,
            team: match.team_a,
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
            team: match.team_b,
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
        <h1 className="text-xl font-bold">Dinker's Pickleball Academy</h1>
      </div>

      {/* Tournament Info */}
      <div className="bg-white border-b px-6 py-3">
        <div className="text-center text-sm text-gray-700">
          {tournamentName} {location && `• ${location}`} • doubles • ID: {tournamentId.slice(0, 8)} • elimination
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="flex justify-center gap-2 px-6 py-3">
          {(['fixtures', 'standings', 'table', 'stats', 'details'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedTab === 'fixtures' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Format Selection */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setFormatView('round-robin')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                formatView === 'round-robin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Round Robin
            </button>
            <button
              onClick={() => setFormatView('knockouts')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                formatView === 'knockouts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Knockouts
            </button>
          </div>

          {/* Round Navigation */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {rounds.map((round) => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedRound === round
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Round {round}
              </button>
            ))}
          </div>

          {/* View Mode Selection */}
          <div className="flex justify-center gap-4 mb-6">
            {(['court-wise', 'pool-wise', 'status-wise'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {mode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
              </button>
            ))}
          </div>

          {/* Pool Selection (only for pool-wise view) */}
          {viewMode === 'pool-wise' && pools.length > 0 && (
            <div className="flex justify-center gap-2 mb-6">
              {pools.map((pool) => (
                <button
                  key={pool}
                  onClick={() => setSelectedPool(pool)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    selectedPool === pool
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pool}
                </button>
              ))}
            </div>
          )}

          {/* Match Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="text-xs text-gray-600 mb-3">Match ID: {match.id.slice(0, 8)}</div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Team A */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Team ID: {match.team_a_id?.slice(0, 8) || 'N/A'}
                    </div>
                    {getTeamDisplay(match.team_a)}
                  </div>

                  {/* Team B */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Team ID: {match.team_b_id?.slice(0, 8) || 'N/A'}
                    </div>
                    {getTeamDisplay(match.team_b)}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-2xl font-bold">{match.score_a ?? '-'}</div>
                  <div className="text-gray-400">vs</div>
                  <div className="text-2xl font-bold">{match.score_b ?? '-'}</div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="text-blue-600">
                    {match.pool && `Pool: ${match.pool}`}
                    {match.court && ` | Court ${match.court}`}
                  </div>
                  <div className={`px-2 py-1 rounded ${
                    match.status === 'completed'
                      ? 'bg-green-200 text-green-800'
                      : match.status === 'live'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {match.status === 'completed' ? 'Completed' : match.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMatches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No matches found for the selected filters.
            </div>
          )}
        </div>
      )}

      {selectedTab === 'standings' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pool Standings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pools.map(pool => (
              <div key={pool} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-blue-600 text-white px-4 py-3">
                  <h3 className="text-lg font-semibold">Pool {pool}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PF</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PA</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Diff</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {standingsByPool[pool]?.length > 0 ? (
                        standingsByPool[pool].map((standing, index) => (
                          <tr key={standing.teamId} className={index === 0 ? 'bg-green-50' : ''}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">{getTeamName(standing.team)}</div>
                              {standing.team?.team_name && (
                                <div className="text-xs text-gray-500">{standing.team.team_name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{standing.played}</td>
                            <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{standing.won}</td>
                            <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{standing.lost}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{standing.pointsFor}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">{standing.pointsAgainst}</td>
                            <td className={`px-4 py-3 text-sm text-center font-medium ${
                              standing.pointsDiff > 0 ? 'text-green-600' : standing.pointsDiff < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {standing.pointsDiff > 0 ? '+' : ''}{standing.pointsDiff}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-bold text-blue-600">{standing.points}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                            No completed matches in this pool yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
          </div>
        </div>
      )}

      {selectedTab === 'table' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Overall Standings</h2>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Played</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Won</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lost</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points For</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points Against</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const allStandings = pools.flatMap(pool =>
                      (standingsByPool[pool] || []).map(s => ({ ...s, pool }))
                    ).sort((a, b) => {
                      if (b.points !== a.points) return b.points - a.points
                      if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff
                      return b.pointsFor - a.pointsFor
                    })

                    return allStandings.length > 0 ? allStandings.map((standing, index) => (
                      <tr key={standing.teamId} className={index < 4 ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {index + 1}
                          {index < 4 && <span className="ml-2 text-xs text-yellow-600">★</span>}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{getTeamName(standing.team)}</div>
                          {standing.team?.team_name && (
                            <div className="text-xs text-gray-500">{standing.team.team_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
                            {standing.pool}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.played}</td>
                        <td className="px-6 py-4 text-sm text-center text-green-600 font-medium">{standing.won}</td>
                        <td className="px-6 py-4 text-sm text-center text-red-600 font-medium">{standing.lost}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.pointsFor}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.pointsAgainst}</td>
                        <td className={`px-6 py-4 text-sm text-center font-medium ${
                          standing.pointsDiff > 0 ? 'text-green-600' : standing.pointsDiff < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {standing.pointsDiff > 0 ? '+' : ''}{standing.pointsDiff}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-blue-600">{standing.points}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                          No completed matches yet
                        </td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">★ Top 4 teams</span> will advance to the knockout stage
            </p>
          </div>
        </div>
      )}

      {(selectedTab === 'stats' || selectedTab === 'details') && (
        <div className="text-center py-12 text-gray-500">
          {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} view coming soon...
        </div>
      )}
    </div>
  )
}
