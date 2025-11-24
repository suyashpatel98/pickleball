'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Tournament } from '@/types/db'
import CreateTournamentModal from '@/components/CreateTournamentModal'

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments')
      const data = await res.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTournaments()
  }, [])

  const handleTournamentCreated = () => {
    setIsModalOpen(false)
    fetchTournaments()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading tournaments...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dinkers Pickleball Academy Tournaments</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Tournament
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tournaments yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {tournament.name}
                </h2>
                <div className="space-y-1 text-sm text-gray-600">
                  {tournament.date && (
                    <p>Date: {new Date(tournament.date).toLocaleDateString()}</p>
                  )}
                  <p className="capitalize">Format: {tournament.format.replace('-', ' ')}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateTournamentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTournamentCreated}
      />
    </div>
  )
}
