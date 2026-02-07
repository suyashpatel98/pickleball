'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Court = {
  id: string
  tournament_id: string
  name: string
  location_notes?: string | null
  created_at: string
}

interface CourtManagementProps {
  tournamentId: string
  onCourtsUpdated?: () => void
}

export default function CourtManagement({ tournamentId, onCourtsUpdated }: CourtManagementProps) {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newCourtName, setNewCourtName] = useState('')
  const [newCourtLocation, setNewCourtLocation] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchCourts = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/courts`)
      if (!res.ok) throw new Error('Failed to fetch courts')
      const data = await res.json()
      setCourts(data)
    } catch (err) {
      console.error('Error fetching courts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load courts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourts()
  }, [tournamentId])

  const handleCreateCourt = async () => {
    if (!newCourtName.trim()) {
      setError('Court name is required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/courts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCourtName.trim(),
          location_notes: newCourtLocation.trim() || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create court')
      }

      // Reset form and refresh list
      setNewCourtName('')
      setNewCourtLocation('')
      await fetchCourts()
      onCourtsUpdated?.() // Notify parent
    } catch (err) {
      console.error('Error creating court:', err)
      setError(err instanceof Error ? err.message : 'Failed to create court')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteCourt = async (courtId: string) => {
    if (!confirm('Are you sure you want to delete this court? Matches will be unassigned.')) {
      return
    }

    try {
      const res = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete court')
      }

      await fetchCourts()
      onCourtsUpdated?.() // Notify parent
    } catch (err) {
      console.error('Error deleting court:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete court')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading courts...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Court Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Court</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Court Name</label>
              <Input
                placeholder="e.g., Court 1, Court A, Main Court"
                value={newCourtName}
                onChange={(e) => setNewCourtName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCourt()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Location Notes (optional)
              </label>
              <Input
                placeholder="e.g., Near main entrance, By the parking lot"
                value={newCourtLocation}
                onChange={(e) => setNewCourtLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCourt()}
              />
            </div>
            <Button
              onClick={handleCreateCourt}
              disabled={creating || !newCourtName.trim()}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Court'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Courts List */}
      {courts.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Courts ({courts.length})
          </h3>
          {courts.map((court) => (
            <Card key={court.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{court.name}</h4>
                    {court.location_notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {court.location_notes}
                      </p>
                    )}
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        ID: {court.id.slice(0, 8)}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <a
                        href={`/courts/${court.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Open Referee View →
                      </a>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCourt(court.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No courts created yet. Create courts to enable referee workflow.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">How Courts Work</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Create courts before generating matches</li>
            <li>Matches will be randomly assigned to courts</li>
            <li>Each court gets a referee view at <code>/courts/{'{courtId}'}</code></li>
            <li>Referees stay on one URL, matches auto-load</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
