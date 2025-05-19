'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Donator, Category } from '@/lib/types'
import { DonatorService } from '@/lib/donator-service'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { PlusCircle, Pencil, Trash2, GamepadIcon } from 'lucide-react'
import DonatorForm from './donator-form'
import { CurrentGameService } from '@/lib/current-game-service'

type DonatorWithCategory = Donator & { 
  categories: Category 
}

export default function DonatorsPage() {
  const [donators, setDonators] = useState<DonatorWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedDonator, setSelectedDonator] = useState<DonatorWithCategory | null>(null)
  const [donatorToDelete, setDonatorToDelete] = useState<Donator | null>(null)
  const [addingToGame, setAddingToGame] = useState<string | null>(null)
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadDonators()
    }
  }, [user])

  const loadDonators = async () => {
    try {
      setLoading(true)
      // Always filter by current user - passing true
      const data = await DonatorService.getAll(true)
      setDonators(data as DonatorWithCategory[])
    } catch (error) {
      console.error('Failed to load donators', error)
      toast.error('Failed to load donators')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDonator = async (
    formData: { name: string, category_id: string, total_game: number },
    categoryPrice: number
  ) => {
    try {
      await DonatorService.create({
        name: formData.name,
        category_id: formData.category_id,
        total_game: formData.total_game
      }, categoryPrice)
      
      toast.success('Donator created successfully')
      setOpenCreateDialog(false)
      loadDonators()
    } catch (error: any) {
      console.error('Failed to create donator', error)
      const errorMessage = error.message || 'Failed to create donator'
      toast.error(errorMessage)
    }
  }

  const handleEditDonator = async (
    formData: { name: string, category_id: string, total_game: number },
    categoryPrice: number
  ) => {
    if (!selectedDonator) return

    try {
      await DonatorService.update(selectedDonator.id, {
        name: formData.name,
        category_id: formData.category_id,
        total_game: formData.total_game
      }, categoryPrice)
      
      toast.success('Donator updated successfully')
      setOpenEditDialog(false)
      loadDonators()
    } catch (error: any) {
      console.error('Failed to update donator', error)
      const errorMessage = error.message || 'Failed to update donator'
      toast.error(errorMessage)
    }
  }

  const handleDeleteDonator = async (donator: Donator) => {
    try {
      await DonatorService.delete(donator.id)
      toast.success('Donator deleted successfully')
      setOpenDeleteDialog(false)
      setDonatorToDelete(null)
      loadDonators()
    } catch (error: any) {
      console.error('Failed to delete donator', error)
      const errorMessage = error.message || 'Failed to delete donator'
      toast.error(errorMessage)
    }
  }

  const handleAddToGame = async (donator: DonatorWithCategory, position: number) => {
    try {
      setAddingToGame(donator.id)
      await CurrentGameService.addDonator(donator.id, position)
      toast.success(`${donator.name} added to position ${position}`)
    } catch (error) {
      console.error('Failed to add donator to game', error)
      toast.error('Failed to add donator to game')
    } finally {
      setAddingToGame(null)
    }
  }

  const openEdit = (donator: DonatorWithCategory) => {
    setSelectedDonator(donator)
    setOpenEditDialog(true)
  }

  const openDelete = (donator: Donator) => {
    setDonatorToDelete(donator)
    setOpenDeleteDialog(true)
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Donators</CardTitle>
            <CardDescription>Manage your donators and their donations</CardDescription>
          </div>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Donator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Donator</DialogTitle>
              </DialogHeader>
              <DonatorForm 
                onSubmit={handleCreateDonator} 
                initialData={{ name: '', category_id: '', total_game: 1 }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Total Game</TableHead>
                  <TableHead>Total Donation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No donators found
                    </TableCell>
                  </TableRow>
                ) : (
                  donators.map((donator) => (
                    <TableRow key={donator.id}>
                      <TableCell className="font-medium">{donator.name}</TableCell>
                      <TableCell>{donator.categories?.name || 'Unknown'}</TableCell>
                      <TableCell>{donator.total_game}</TableCell>
                      <TableCell>Rp. {donator.total_donation.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEdit(donator)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openDelete(donator)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        {/* Add to Game Dropdown */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={addingToGame === donator.id || donator.total_game <= 0}
                            >
                              <GamepadIcon className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Add to Current Game</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="mb-4">Select a position for {donator.name}:</p>
                              <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(position => (
                                  <Button
                                    key={position}
                                    onClick={() => {
                                      handleAddToGame(donator, position);
                                      (document.querySelector('button[data-state="open"]') as HTMLButtonElement)?.click();
                                    }}
                                    className="w-full"
                                  >
                                    Position {position}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Donator</DialogTitle>
          </DialogHeader>
          {selectedDonator && (
            <DonatorForm 
              onSubmit={handleEditDonator} 
              initialData={{ 
                name: selectedDonator.name, 
                category_id: selectedDonator.category_id,
                total_game: selectedDonator.total_game
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete {donatorToDelete?.name} donator?
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => donatorToDelete && handleDeleteDonator(donatorToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 