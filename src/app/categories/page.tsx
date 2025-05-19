'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Category } from '@/lib/types'
import { CategoryService } from '@/lib/category-service'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { PlusCircle, Pencil, Trash2, InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import CategoryForm from './category-form'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
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
      loadCategories()
    }
  }, [user])

  const loadCategories = async () => {
    try {
      setLoading(true)
      // Always filter by current user - passing true
      const data = await CategoryService.getAll(true)
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (formData: { name: string, price: number }) => {
    try {
      // Ensure price is a number before sending to service
      const categoryData = {
        name: formData.name,
        price: Number(formData.price)
      };
      
      await CategoryService.create(categoryData);
      toast.success('Category created successfully')
      setOpenCreateDialog(false)
      loadCategories()
    } catch (error: any) {
      console.error('Failed to create category', error)
      // Show more specific error message if available
      const errorMessage = error.message || 'Failed to create category'
      toast.error(errorMessage)
    }
  }

  const handleEditCategory = async (formData: { name: string, price: number }) => {
    if (!selectedCategory) return

    try {
      // Ensure price is a number before sending to service
      const categoryData = {
        name: formData.name,
        price: Number(formData.price)
      };
      
      await CategoryService.update(selectedCategory.id, categoryData);
      toast.success('Category updated successfully')
      setOpenEditDialog(false)
      loadCategories()
    } catch (error: any) {
      console.error('Failed to update category', error)
      // Show more specific error message if available
      const errorMessage = error.message || 'Failed to update category'
      toast.error(errorMessage)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    try {
      await CategoryService.delete(category.id)
      toast.success('Category deleted successfully')
      setOpenDeleteDialog(false)
      setCategoryToDelete(null)
      loadCategories()
    } catch (error: any) {
      console.error('Failed to delete category', error)
      const errorMessage = error.message || 'Failed to delete category'
      toast.error(errorMessage)
    }
  }

  const openDelete = (category: Category) => {
    setCategoryToDelete(category)
    setOpenDeleteDialog(true)
  }

  const openEdit = (category: Category) => {
    setSelectedCategory(category)
    setOpenEditDialog(true)
  }

  // Format date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
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
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage your categories and their prices</CardDescription>
          </div>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <CategoryForm 
                onSubmit={handleCreateCategory} 
                initialData={{ name: '', price: 0 }}
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
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>Rp. {category.price.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <CategoryForm 
              onSubmit={handleEditCategory} 
              initialData={{ 
                name: selectedCategory.name, 
                price: selectedCategory.price 
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete {categoryToDelete?.name} category?
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
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 