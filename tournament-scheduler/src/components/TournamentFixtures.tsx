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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#2c3e50] text-white px-6 py-4">
        <h1 className="text-xl font-bold">KHELCLUB</h1>
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

      {selectedTab !== 'fixtures' && (
        <div className="text-center py-12 text-gray-500">
          {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} view coming soon...
        </div>
      )}
    </div>
  )
}
