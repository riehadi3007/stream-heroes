'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Category } from '@/lib/types'
import { CategoryService } from '@/lib/category-service'

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required',
  }),
  category_id: z.string().min(1, {
    message: 'Category is required',
  }),
  total_game: z.coerce.number().int().min(1, {
    message: 'Total game must be a positive integer',
  }),
})

type FormValues = z.infer<typeof formSchema>;

type DonatorFormProps = {
  onSubmit: (values: FormValues, categoryPrice: number) => void
  initialData: {
    name: string
    category_id: string
    total_game: number
  }
}

export default function DonatorForm({ onSubmit, initialData }: DonatorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryPrice, setSelectedCategoryPrice] = useState(0)
  const [calculatedDonation, setCalculatedDonation] = useState(0)

  // Load categories for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const data = await CategoryService.getAll(true)
        setCategories(data)
        
        // Set initial selected category price if we have a category_id
        if (initialData.category_id && data.length > 0) {
          const selectedCategory = data.find(c => c.id === initialData.category_id)
          if (selectedCategory) {
            setSelectedCategoryPrice(selectedCategory.price)
            setCalculatedDonation(initialData.total_game * selectedCategory.price)
          }
        }
      } catch (error) {
        console.error('Failed to load categories', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadCategories()
  }, [initialData.category_id])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      category_id: initialData.category_id,
      total_game: initialData.total_game,
    },
  })

  // Update calculated donation whenever total_game or category changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'total_game' || name === 'category_id') {
        const totalGame = value.total_game ? Number(value.total_game) : 0
        
        if (name === 'category_id' && value.category_id) {
          const selectedCategory = categories.find(c => c.id === value.category_id)
          if (selectedCategory) {
            setSelectedCategoryPrice(selectedCategory.price)
            setCalculatedDonation(totalGame * selectedCategory.price)
          }
        } else {
          setCalculatedDonation(totalGame * selectedCategoryPrice)
        }
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form.watch, categories, selectedCategoryPrice])

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(values, selectedCategoryPrice)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* First row: Name and Category side by side */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Donator name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select 
                    disabled={loading || categories.length === 0} 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} - Rp. {category.price.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Second row: Total Game and Total Donation side by side */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="total_game"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Game</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0)
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Total Donation (calculated)</FormLabel>
            <div className="p-2 border rounded bg-muted/20">
              Rp. {calculatedDonation.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
        
        {/* Formula explanation with proper alignment */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground border-t pt-1 mt-1">
            Total Game × Category Price
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting || loading} className="w-full">
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  )
} 