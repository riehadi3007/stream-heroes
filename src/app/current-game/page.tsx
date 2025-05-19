'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { CurrentGameService } from '@/lib/current-game-service'
import { GameSessionService } from '@/lib/game-session-service'
import { Donator, Category } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { User, PlayCircle, XCircle, History } from 'lucide-react'

type CurrentGamePlayer = {
  id: string
  donator_id: string
  position: number
  donator: {
    id: string
    name: string
    total_game: number
    category: {
      id: string
      name: string
      price: number
    }
  }
}

export default function CurrentGamePage() {
  const [players, setPlayers] = useState<CurrentGamePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false)
  const [gameHistory, setGameHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  // Load current game data
  useEffect(() => {
    if (user) {
      loadCurrentGame()
    }
  }, [user])

  const loadCurrentGame = async () => {
    try {
      setLoading(true)
      const data = await CurrentGameService.getAll()
      
      // Create an array with 4 positions
      const positionedPlayers: CurrentGamePlayer[] = []
      
      // Find players for each position
      for (let i = 1; i <= 4; i++) {
        const player = data.find(p => p.position === i)
        if (player) {
          positionedPlayers.push({
            id: player.id,
            donator_id: player.donator_id,
            position: player.position,
            donator: {
              id: player.donators.id,
              name: player.donators.name,
              total_game: player.donators.total_game,
              category: {
                id: player.donators.categories.id,
                name: player.donators.categories.name,
                price: player.donators.categories.price
              }
            }
          })
        }
      }
      
      setPlayers(positionedPlayers)
    } catch (error) {
      console.error('Failed to load current game', error)
      toast.error('Failed to load current game')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayGame = async () => {
    try {
      // Check if there's at least one player
      if (players.length === 0) {
        toast.error('Add at least one player to play a game')
        return
      }
      
      // Check if all players have games remaining
      const invalidPlayers = players.filter(p => p.donator.total_game <= 0)
      if (invalidPlayers.length > 0) {
        toast.error(`${invalidPlayers[0].donator.name} has no games remaining`)
        return
      }
      
      setIsPlaying(true)
      
      // Create a game session with all current players
      const donatorIds = players.map(p => p.donator_id)
      await GameSessionService.createSession(donatorIds)
      
      // Reload the current game
      await loadCurrentGame()
      
      toast.success('Game played successfully')
    } catch (error: any) {
      console.error('Failed to play game', error)
      toast.error(error.message || 'Failed to play game')
    } finally {
      setIsPlaying(false)
    }
  }

  const handleClearAll = async () => {
    try {
      await CurrentGameService.clearAll()
      setPlayers([])
      toast.success('Current game cleared')
    } catch (error) {
      console.error('Failed to clear current game', error)
      toast.error('Failed to clear current game')
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await CurrentGameService.removeDonator(playerId)
      setPlayers(players.filter(p => p.id !== playerId))
      toast.success('Player removed')
    } catch (error) {
      console.error('Failed to remove player', error)
      toast.error('Failed to remove player')
    }
  }

  const loadGameHistory = async () => {
    try {
      setHistoryLoading(true)
      const history = await GameSessionService.getRecentSessions(10)
      setGameHistory(history)
    } catch (error) {
      console.error('Failed to load game history', error)
      toast.error('Failed to load game history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleOpenHistory = () => {
    setOpenHistoryDialog(true)
    loadGameHistory()
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Build player slots
  const playerSlots = []
  for (let i = 1; i <= 4; i++) {
    const player = players.find(p => p.position === i)
    playerSlots.push(
      <Card key={`player-${i}`} className="mb-4">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center">
            <User className="mr-2 h-4 w-4" />
            Player {i}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : player ? (
            <div className="space-y-2">
              <div className="font-semibold">{player.donator.name}</div>
              <div className="text-sm text-muted-foreground">
                {player.donator.category.name} - Rp. {player.donator.category.price.toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-muted-foreground">
                Games remaining: {player.donator.total_game}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => handleRemovePlayer(player.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Empty Slot
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show loading or redirect when not authenticated
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <Toaster />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Game</CardTitle>
          <CardDescription>Manage the current game and players</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap md:flex-nowrap gap-4">
            <div className="w-full md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {playerSlots}
            </div>
            <div className="w-full md:w-1/4 space-y-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePlayGame}
                disabled={isPlaying || players.length === 0}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                {isPlaying ? 'Playing...' : 'Play Game'}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleClearAll}
                disabled={players.length === 0}
              >
                Clear All
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleOpenHistory}
              >
                <History className="mr-2 h-4 w-4" />
                Game History
              </Button>
              
              <div className="p-3 bg-muted/20 rounded-lg mt-4">
                <h3 className="font-medium mb-2">How to use:</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>Add players from the Donators page</li>
                  <li>Up to 4 players can be added</li>
                  <li>Click "Play Game" to start a game</li>
                  <li>Each player's remaining games will decrease by 1</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Game History Dialog */}
      <Dialog open={openHistoryDialog} onOpenChange={setOpenHistoryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Recent Game History</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No game history found
            </div>
          ) : (
            <div className="space-y-4">
              {gameHistory.map((session) => (
                <Card key={session.session_id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">
                      Game played at {formatDate(session.played_at)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {session.donators.map((donator: any) => (
                        <div key={donator.id} className="flex items-center p-2 border rounded-md">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{donator.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {donator.category_name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 