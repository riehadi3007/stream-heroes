import { getSupabase } from './supabase';
import { Category, CategoryInsert, CategoryUpdate } from './types';
import { getCurrentUserEmail } from './auth-service';

export const CategoryService = {
  async getAll(filterByCurrentUser = false): Promise<Category[]> {
    const supabase = getSupabase();
    
    try {
      // Get current user email if filtering is requested
      let userEmail = null;
      if (filterByCurrentUser) {
        userEmail = await getCurrentUserEmail();
        if (!userEmail) {
          throw new Error('User must be logged in to view their categories');
        }
      }
      
      // Build query
      let query = supabase
        .from('categories')
        .select('*');
      
      // Add filter for current user if requested
      if (filterByCurrentUser && userEmail) {
        query = query.eq('created_by', userEmail);
      }
      
      // Order by name
      query = query.order('name');
      
      // Execute query
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      return data as Category[];
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
  },
  
  async getById(id: string): Promise<Category | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
    
    return data as Category;
  },
  
  async create(category: CategoryInsert): Promise<Category> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      
      if (!userEmail) {
        throw new Error('User must be logged in to create a category');
      }
      
      // Ensure price is a number
      const price = typeof category.price === 'string' 
        ? parseFloat(category.price) 
        : category.price;
      
      // Add creator email to the category data
      const categoryWithUser = {
        ...category,
        price: price,
        created_by: userEmail,
        updated_by: userEmail
      };
      
      console.log('Creating category with data:', JSON.stringify(categoryWithUser, null, 2));
      
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryWithUser)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating category:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create category: ${error.message || 'Unknown error'}`);
      }
      
      if (!data) {
        throw new Error('No data returned after creating category');
      }
      
      return data as Category;
    } catch (error: any) {
      console.error('Category creation failed:', error);
      throw error;
    }
  },
  
  async update(id: string, category: CategoryUpdate): Promise<Category> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      
      if (!userEmail) {
        throw new Error('User must be logged in to update a category');
      }
      
      // Ensure price is a number if provided
      const processedCategory = { ...category };
      if (typeof processedCategory.price !== 'undefined') {
        processedCategory.price = typeof processedCategory.price === 'string'
          ? parseFloat(processedCategory.price)
          : processedCategory.price;
      }
      
      // Add updater email to the category data
      const categoryWithUser = {
        ...processedCategory,
        updated_by: userEmail
      };
      
      console.log('Updating category with data:', JSON.stringify(categoryWithUser, null, 2));
      
      const { data, error } = await supabase
        .from('categories')
        .update(categoryWithUser)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error(`Error updating category ${id}:`, error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update category: ${error.message || 'Unknown error'}`);
      }
      
      if (!data) {
        throw new Error('No data returned after updating category');
      }
      
      return data as Category;
    } catch (error: any) {
      console.error(`Category update failed for id ${id}:`, error);
      throw error;
    }
  },
  
  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    
    // Verify user is logged in before allowing delete
    const userEmail = await getCurrentUserEmail();
    
    if (!userEmail) {
      throw new Error('User must be logged in to delete a category');
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }
}; 