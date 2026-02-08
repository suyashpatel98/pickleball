'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Player, Tournament, Team } from '@/types/db'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FiShare2, FiTrendingUp, FiAward, FiClock, FiZap, FiTarget } from 'react-icons/fi'
import Image from 'next/image'

type TeamWithPlayers = Team & {
  player1: Player
  player2?: Player | null
}

type Court = {
  id: string
  name: string
  location_notes?: string
}

type MatchHistoryItem = {
  id: string
  round: number
  opponent: Player | TeamWithPlayers | null
  result: 'won' | 'lost'
  score_a: number | null
  score_b: number | null
}

type MatchEstimate = {
  start_time: string
  minutes_until_start: number
  matches_ahead: number
}

type NextMatch = {
  id: string
  round: number
  opponent: Player | TeamWithPlayers | null
  court: Court | null
  pool?: string | null
  estimate?: MatchEstimate
}

type PlayerData = {
  tournament: Tournament
  player: Player
  status: 'active' | 'waiting' | 'eliminated' | 'champion'
  next_match: NextMatch | null
  match_history: MatchHistoryItem[]
  stats: {
    wins: number
    losses: number
    total_matches: number
  }
}

// Mock DUPR rating data (same for all players for now)
const getMockDuprData = () => [
  { month: 'Jan', rating: 3.8 },
  { month: 'Feb', rating: 3.9 },
  { month: 'Mar', rating: 4.1 },
  { month: 'Apr', rating: 4.0 },
  { month: 'May', rating: 4.3 },
  { month: 'Jun', rating: 4.5 },
]

// Mock analytics (same for all players)
const getMockAnalytics = () => ({
  morningWinRate: 78,
  eveningWinRate: 65,
  bestCourt: 'Court 3',
  bestCourtWinRate: 82,
  currentStreak: 3,
  streakType: 'win' as 'win' | 'loss',
  clutchFactor: 71,
})

// Mock achievements
const getMockAchievements = () => [
  { id: 1, name: 'First Win', icon: '🎯', color: 'bg-primary', unlocked: true },
  { id: 2, name: 'Win Streak', icon: '🔥', color: 'bg-secondary', unlocked: true },
  { id: 3, name: 'Giant Slayer', icon: '⚔️', color: 'bg-accent', unlocked: true },
  { id: 4, name: 'Court Master', icon: '👑', color: 'bg-primary', unlocked: false },
]

function formatEstimatedTime(timeString: string): string {
  const time = new Date(timeString)
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function getTimeUntilMessage(minutes: number): string {
  if (minutes < 5) return 'Starting soon!'
  if (minutes < 60) return `in ${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `in ${hours}h ${mins}m`
}

// Generate player initials for avatar
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get color for avatar based on name
function getAvatarColor(name: string): string {
  const colors = [
    'hsl(158, 45%, 70%)', // mint
    'hsl(260, 60%, 85%)', // lilac
    'hsl(45, 100%, 85%)', // yellow
  ]
  const index = name.length % colors.length
  return colors[index]
}

export default function PlayerPersonalView() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string
  const playerId = params.player_id as string

  const [data, setData] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const duprData = getMockDuprData()
  const analytics = getMockAnalytics()
  const achievements = getMockAchievements()

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/tournaments/${tournamentId}/players/${playerId}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch player data')
      }

      const playerData = await res.json()
      setData(playerData)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch player data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load player data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayerData()
    const interval = setInterval(fetchPlayerData, 30000)
    return () => clearInterval(interval)
  }, [tournamentId, playerId])

  const handleShare = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = () => {
    if (!data) return null

    switch (data.status) {
      case 'champion':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">🏆 Champion</Badge>
      case 'active':
        return <Badge className="bg-green-600 hover:bg-green-700">✅ Active</Badge>
      case 'eliminated':
        return <Badge variant="destructive">❌ Eliminated</Badge>
      case 'waiting':
        return <Badge variant="outline">⏸️ Waiting</Badge>
      default:
        return null
    }
  }

  const getOpponentName = (opponent: Player | TeamWithPlayers | null) => {
    if (!opponent) return 'TBD'

    if ('player1' in opponent) {
      const team = opponent as TeamWithPlayers
      if (team.player2) {
        return `${team.player1.name} & ${team.player2.name}`
      }
      return team.player1.name
    }

    return (opponent as Player).name
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your tournament info...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{error || 'Failed to load player data'}</p>
            <Button
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="mt-4 w-full"
              variant="outline"
            >
              View Tournament
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentRating = duprData[duprData.length - 1].rating
  const previousRating = duprData[duprData.length - 2].rating
  const ratingChange = currentRating - previousRating

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Enhanced Player Header with Profile Photo */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Profile Photo */}
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-full border-4 border-black shadow-[6px_6px_0px_black] overflow-hidden flex items-center justify-center text-4xl font-bold"
                  style={{ backgroundColor: getAvatarColor(data.player.name) }}
                >
                  {/* Try to load profile image, fallback to initials */}
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/profile.jpg"
                      alt={data.player.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-4xl font-bold text-foreground">${getInitials(data.player.name)}</span>`
                          parent.className = 'flex items-center justify-center w-full h-full'
                        }
                      }}
                    />
                  </div>
                </div>
                {/* Champion Ring Animation */}
                {data.status === 'champion' && (
                  <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-75" />
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{data.player.name}</h1>
                    <p className="text-lg text-muted-foreground">{data.tournament.name}</p>
                    {data.tournament.date && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(data.tournament.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge()}
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <FiShare2 className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Share Profile'}
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-green-50 p-3 rounded-lg border-2 border-black">
                    <p className="text-2xl font-bold text-green-600">{data.stats.wins}</p>
                    <p className="text-xs uppercase font-medium">Wins</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border-2 border-black">
                    <p className="text-2xl font-bold text-red-600">{data.stats.losses}</p>
                    <p className="text-xs uppercase font-medium">Losses</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border-2 border-black">
                    <p className="text-2xl font-bold text-blue-600">{data.stats.total_matches}</p>
                    <p className="text-xs uppercase font-medium">Matches</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Champion Banner */}
        {data.status === 'champion' && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-500 border-3">
            <AlertDescription className="text-yellow-900 text-center text-lg font-semibold">
              🏆 Congratulations! You are the Champion! 🏆
            </AlertDescription>
          </Alert>
        )}

        {/* DUPR Rating Graph */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5" />
                DUPR Rating Progress
              </CardTitle>
              <div className="text-right">
                <p className="text-3xl font-bold">{currentRating.toFixed(1)}</p>
                <p className={`text-sm font-medium ${ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ratingChange >= 0 ? '↑' : '↓'} {Math.abs(ratingChange).toFixed(1)} this month
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={duprData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 80%)" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(0, 0%, 40%)"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <YAxis
                  stroke="hsl(0, 0%, 40%)"
                  domain={[3.5, 5.0]}
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '3px solid black',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="hsl(158, 45%, 70%)"
                  strokeWidth={4}
                  dot={{ fill: 'hsl(158, 45%, 70%)', strokeWidth: 3, stroke: 'black', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Time of Day Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiClock className="w-5 h-5" />
                Performance by Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">☀️ Morning (Before Noon)</span>
                    <span className="text-lg font-bold text-primary">{analytics.morningWinRate}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-black">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${analytics.morningWinRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">🌙 Evening (After 6pm)</span>
                    <span className="text-lg font-bold text-accent">{analytics.eveningWinRate}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-black">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${analytics.eveningWinRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Court */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiTarget className="w-5 h-5" />
                Best Court
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold mb-2">{analytics.bestCourt}</p>
                <p className="text-2xl font-bold text-primary mb-1">{analytics.bestCourtWinRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Streak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiZap className="w-5 h-5" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-6xl mb-2">
                  {analytics.streakType === 'win' ? '🔥' : '❄️'}
                </p>
                <p className={`text-4xl font-bold mb-1 ${analytics.streakType === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.currentStreak} {analytics.streakType === 'win' ? 'Wins' : 'Losses'}
                </p>
                <p className="text-sm text-muted-foreground uppercase font-medium">
                  {analytics.streakType === 'win' ? 'On Fire!' : 'Keep Pushing!'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Clutch Factor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiAward className="w-5 h-5" />
                Clutch Factor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Win rate in close games</p>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(0, 0%, 90%)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(45, 100%, 85%)"
                      strokeWidth="8"
                      strokeDasharray={`${analytics.clutchFactor * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ stroke: 'black', strokeWidth: 10 }}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(45, 100%, 85%)"
                      strokeWidth="7"
                      strokeDasharray={`${analytics.clutchFactor * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{analytics.clutchFactor}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiAward className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-3 border-black text-center transition-all ${
                    achievement.unlocked
                      ? `${achievement.color} shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-y-0.5`
                      : 'bg-muted opacity-50 grayscale'
                  }`}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <p className="text-sm font-bold uppercase">{achievement.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Match - Active Players */}
        {data.status === 'active' && data.next_match && (
          <Card className="mb-6 border-3 border-green-500">
            <CardHeader className="bg-green-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-900">Your Next Match</CardTitle>
                <Badge className="bg-green-600">Up Next</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {data.next_match.estimate && (
                  <div className="bg-blue-600 text-white p-4 rounded-lg text-center border-3 border-black">
                    <p className="text-sm opacity-90 mb-1">Estimated Start Time</p>
                    <p className="text-3xl font-bold">
                      {formatEstimatedTime(data.next_match.estimate.start_time)}
                    </p>
                    <p className="text-sm mt-2">
                      {getTimeUntilMessage(data.next_match.estimate.minutes_until_start)}
                    </p>
                    {data.next_match.estimate.matches_ahead > 0 && (
                      <p className="text-xs mt-3 opacity-80">
                        ℹ️ {data.next_match.estimate.matches_ahead} match{data.next_match.estimate.matches_ahead > 1 ? 'es' : ''} ahead
                      </p>
                    )}
                  </div>
                )}

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">You will play against</p>
                  <p className="text-2xl font-bold">
                    {getOpponentName(data.next_match.opponent)}
                  </p>
                  {data.next_match.pool && (
                    <p className="text-sm text-muted-foreground mt-2">Pool {data.next_match.pool}</p>
                  )}
                </div>

                {data.next_match.court && (
                  <div className="bg-blue-50 p-4 rounded-lg text-center border-2 border-black">
                    <p className="text-sm text-muted-foreground mb-1">Report to</p>
                    <p className="text-xl font-bold text-blue-900">
                      {data.next_match.court.name}
                    </p>
                    {data.next_match.court.location_notes && (
                      <p className="text-sm text-blue-700 mt-1">
                        {data.next_match.court.location_notes}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-center">
                  <Badge variant="outline" className="text-base px-4 py-1">
                    Round {data.next_match.round}
                  </Badge>
                </div>

                {data.next_match.court && (
                  <Button
                    onClick={() => router.push(`/courts/${data.next_match!.court!.id}`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                  >
                    View Court & Live Score
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting State */}
        {data.status === 'waiting' && (
          <Card className="mb-6 border-blue-500 bg-blue-50 border-3">
            <CardHeader>
              <CardTitle className="text-blue-900">Waiting for Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                Your next match will be scheduled soon. Check back for updates!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Eliminated State */}
        {data.status === 'eliminated' && (
          <Card className="mb-6 border-gray-400 bg-gray-50 border-3">
            <CardHeader>
              <CardTitle className="text-gray-900">Tournament Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Thank you for participating! You can continue to follow the tournament or view your match history below.
              </p>
              <Button
                onClick={() => router.push(`/tournaments/${tournamentId}`)}
                variant="outline"
                className="w-full"
              >
                View Full Tournament Bracket
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Match History */}
        {data.match_history.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Match History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.match_history.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border-3 ${
                      match.result === 'won'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        Round {match.round}
                      </Badge>
                      <Badge
                        className={
                          match.result === 'won'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }
                      >
                        {match.result === 'won' ? 'Won' : 'Lost'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Opponent</p>
                        <p className="font-semibold">
                          {getOpponentName(match.opponent)}
                        </p>
                      </div>
                      {match.score_a !== null && match.score_b !== null && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="font-semibold">
                            {match.score_a} - {match.score_b}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            variant="outline"
            className="w-full"
          >
            View Full Tournament
          </Button>
          <Button
            onClick={() => fetchPlayerData()}
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
