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
import { PlusCircle, Pencil, Trash2, GamepadIcon, Plus } from 'lucide-react'
import DonatorForm from './donator-form'
import { CurrentGameService } from '@/lib/current-game-service'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { DonationHistoryService } from '@/lib/donation-history-service'

type DonatorWithCategory = Donator & { 
  categories: Category 
}

export default function DonatorsPage() {
  const [donators, setDonators] = useState<DonatorWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openAddGamesDialog, setOpenAddGamesDialog] = useState(false)
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
      // Create the donator
      const newDonator = await DonatorService.create({
        name: formData.name,
        category_id: formData.category_id,
        total_game: formData.total_game
      }, categoryPrice)
      
      // Record in donation history
      await DonationHistoryService.addRecord({
        donator_id: newDonator.id,
        amount: categoryPrice * formData.total_game,
        event_type: 'new_donator',
        games_added: formData.total_game
      });
      
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

  // Schema for add games form
  const addGamesSchema = z.object({
    donator_id: z.string().min(1, "Please select a donator"),
    games_to_add: z.coerce.number().int().min(1, "Must add at least 1 game")
  })

  const addGamesForm = useForm<z.infer<typeof addGamesSchema>>({
    resolver: zodResolver(addGamesSchema),
    defaultValues: {
      donator_id: "",
      games_to_add: 1
    }
  })

  const handleAddGames = async (data: z.infer<typeof addGamesSchema>) => {
    try {
      console.log("handleAddGames called with data:", data); // Debug log
      const donator = donators.find(d => d.id === data.donator_id)
      if (!donator) {
        toast.error("Selected donator not found");
        return;
      }

      // Calculate new total games
      const newTotalGames = donator.total_game + data.games_to_add
      
      // Update the donator
      await DonatorService.update(donator.id, {
        name: donator.name,
        category_id: donator.category_id,
        total_game: newTotalGames
      }, donator.categories.price)
      
      // Record in donation history
      await DonationHistoryService.addRecord({
        donator_id: donator.id,
        amount: donator.categories.price * data.games_to_add,
        event_type: 'add_games',
        games_added: data.games_to_add
      });
      
      toast.success(`Added ${data.games_to_add} games to ${donator.name}`)
      setOpenAddGamesDialog(false)
      addGamesForm.reset()
      loadDonators()
    } catch (error: any) {
      console.error('Failed to add games', error)
      const errorMessage = error.message || 'Failed to add games'
      toast.error(errorMessage)
    }
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
          <div className="flex gap-2">
            <Dialog open={openAddGamesDialog} onOpenChange={setOpenAddGamesDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Games
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Games to Existing Donator</DialogTitle>
                </DialogHeader>
                <form onSubmit={addGamesForm.handleSubmit(handleAddGames)} className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="donator_id">Select Donator</Label>
                      <Select 
                        onValueChange={(value) => addGamesForm.setValue("donator_id", value)} 
                        defaultValue={addGamesForm.getValues("donator_id")}
                      >
                        <SelectTrigger id="donator_id">
                          <SelectValue placeholder="Select donator" />
                        </SelectTrigger>
                        <SelectContent>
                          {donators.map((donator) => (
                            <SelectItem key={donator.id} value={donator.id}>
                              {donator.name} ({donator.categories.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {addGamesForm.formState.errors.donator_id && (
                        <p className="text-sm text-red-500">{addGamesForm.formState.errors.donator_id.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="games_to_add">Number of Games to Add</Label>
                      <Input 
                        id="games_to_add"
                        type="number" 
                        min="1"
                        {...addGamesForm.register("games_to_add", { valueAsNumber: true })}
                      />
                      {addGamesForm.formState.errors.games_to_add && (
                        <p className="text-sm text-red-500">{addGamesForm.formState.errors.games_to_add.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setOpenAddGamesDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        Add Games
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

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
          </div>
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