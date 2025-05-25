import { getSupabase } from './supabase';
import { Donator, DonatorInsert, DonatorUpdate, Category } from './types';
import { getCurrentUserEmail } from './auth-service';
import { useAuth } from './auth-context';
import { supabase } from './supabase';

export const DonatorService = {
  async getAll(filterByCurrentUser = false): Promise<Donator[]> {
    const supabase = getSupabase();
    
    try {
      // Get current user email if filtering is requested
      let userEmail = null;
      if (filterByCurrentUser) {
        userEmail = await getCurrentUserEmail();
        if (!userEmail) {
          throw new Error('User must be logged in to view their donators');
        }
      }
      
      // Build query
      let query = supabase
        .from('donators')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            price
          )
        `);
      
      // Add filter for current user if requested
      if (filterByCurrentUser && userEmail) {
        query = query.eq('created_by', userEmail);
      }
      
      // Order by name
      query = query.order('name');
      
      // Execute query
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching donators:', error);
        throw error;
      }
      
      return data as unknown as (Donator & { categories: Category })[];
    } catch (error) {
      console.error('Failed to load donators:', error);
      throw error;
    }
  },
  
  async getById(id: string): Promise<Donator & { categories: Category }> {
    const supabase = getSupabase();
    
    try {
      const { data, error } = await supabase
        .from('donators')
        .select(`
          *,
          categories:category_id (
            id,
            name,
            price
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Error fetching donator ${id}:`, error);
        throw error;
      }
      
      if (!data) {
        throw new Error(`Donator with ID ${id} not found`);
      }
      
      return data as unknown as (Donator & { categories: Category });
    } catch (error) {
      console.error(`Error fetching donator ${id}:`, error);
      throw error;
    }
  },
  
  async create(donator: DonatorInsert, categoryPrice: number): Promise<Donator> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      
      if (!userEmail) {
        throw new Error('User must be logged in to create a donator');
      }
      
      // Calculate total donation based on total_game * category price
      const totalDonation = donator.total_game * categoryPrice;
      
      // Add creator email and calculated total donation to the donator data
      const donatorWithUser = {
        ...donator,
        total_donation: totalDonation,
        created_by: userEmail,
        updated_by: userEmail
      };
      
      console.log('Creating donator with data:', JSON.stringify(donatorWithUser, null, 2));
      
      const { data, error } = await supabase
        .from('donators')
        .insert(donatorWithUser)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating donator:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create donator: ${error.message || 'Unknown error'}`);
      }
      
      if (!data) {
        throw new Error('No data returned after creating donator');
      }
      
      return data as Donator;
    } catch (error: any) {
      console.error('Donator creation failed:', error);
      throw error;
    }
  },
  
  async update(id: string, donator: DonatorUpdate, categoryPrice: number): Promise<Donator> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      
      if (!userEmail) {
        throw new Error('User must be logged in to update a donator');
      }
      
      // Calculate total donation if total_game is provided
      const updatedDonator = { ...donator };
      if (donator.total_game !== undefined) {
        updatedDonator.total_donation = donator.total_game * categoryPrice;
      }
      
      // Add updater email to the donator data
      updatedDonator.updated_by = userEmail;
      
      console.log('Updating donator with data:', JSON.stringify(updatedDonator, null, 2));
      
      const { data, error } = await supabase
        .from('donators')
        .update(updatedDonator)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error(`Error updating donator ${id}:`, error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update donator: ${error.message || 'Unknown error'}`);
      }
      
      if (!data) {
        throw new Error('No data returned after updating donator');
      }
      
      return data as Donator;
    } catch (error: any) {
      console.error(`Donator update failed for id ${id}:`, error);
      throw error;
    }
  },
  
  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    
    try {
      // Verify user is logged in before allowing delete
      const userEmail = await getCurrentUserEmail();
      
      if (!userEmail) {
        throw new Error('User must be logged in to delete a donator');
      }
      
      const { error } = await supabase
        .from('donators')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting donator ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error deleting donator ${id}:`, error);
      throw error;
    }
  },

  async getDonationsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    // Get the current user ID
    const userEmail = await getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('Authentication required');
    }

    try {
      // Explicitly cast the data to any to avoid TypeScript errors with the complex join
      const { data, error } = await supabase
        .from('donators')
        .select('*, categories:category_id(*)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('created_by', userEmail);

      if (error) {
        throw error;
      }

      // Use the any type to work around TypeScript issues with Supabase joins
      const donators = data as any[] || [];
      
      // Transform the data to be suitable for chart display
      return donators.map((donator) => ({
        id: donator.id,
        amount: donator.total_donation,
        created_at: donator.created_at,
        donator_name: donator.name,
        category_name: donator.categories ? donator.categories.name : 'Unknown',
        created_by: donator.created_by
      }));
    } catch (error) {
      console.error('Error fetching donations by date range:', error);
      throw error;
    }
  }
}; 