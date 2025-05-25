import { getSupabase } from './supabase';
import { CurrentGame, CurrentGameInsert, CurrentGameUpdate, Donator, Category } from './types';
import { getCurrentUserEmail } from './auth-service';

export const CurrentGameService = {
  async getAll(): Promise<(CurrentGame & { donators: Donator & { categories: Category } })[]> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        throw new Error('User must be logged in to view current game');
      }
      
      // Build query with donator and category information
      const { data, error } = await supabase
        .from('current_game')
        .select(`
          *,
          donators:donator_id (
            *,
            categories:category_id (
              id, 
              name, 
              price
            )
          )
        `)
        .eq('created_by', userEmail)
        .order('position');
        
      if (error) {
        console.error('Error fetching current game:', error);
        throw error;
      }
      
      return data as unknown as (CurrentGame & { donators: Donator & { categories: Category } })[];
    } catch (error) {
      console.error('Failed to load current game:', error);
      throw error;
    }
  },
  
  async addDonator(donatorId: string, position: number): Promise<CurrentGame> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        throw new Error('User must be logged in to add donator to current game');
      }
      
      // Check if position is already taken
      const { data: existingPosition, error: positionError } = await supabase
        .from('current_game')
        .select('*')
        .eq('position', position)
        .eq('created_by', userEmail);
        
      if (positionError) {
        console.error('Error checking position:', positionError);
        throw positionError;
      }
      
      if (existingPosition && existingPosition.length > 0) {
        // Remove donator in this position
        await supabase
          .from('current_game')
          .delete()
          .eq('id', (existingPosition[0] as CurrentGame).id);
      }
      
      // Check if donator is already in another position
      const { data: existingDonator, error: donatorError } = await supabase
        .from('current_game')
        .select('*')
        .eq('donator_id', donatorId)
        .eq('created_by', userEmail);
        
      if (donatorError) {
        console.error('Error checking donator:', donatorError);
        throw donatorError;
      }
      
      if (existingDonator && existingDonator.length > 0) {
        // Remove donator from previous position
        await supabase
          .from('current_game')
          .delete()
          .eq('id', (existingDonator[0] as CurrentGame).id);
      }
      
      // Add donator to current game
      const currentGameData: CurrentGameInsert = {
        donator_id: donatorId,
        position: position,
        created_by: userEmail
      };
      
      const { data, error } = await supabase
        .from('current_game')
        .insert(currentGameData)
        .select()
        .single();
        
      if (error) {
        console.error('Error adding donator to current game:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data returned after adding donator to current game');
      }
      
      return data as CurrentGame;
    } catch (error) {
      console.error('Failed to add donator to current game:', error);
      throw error;
    }
  },
  
  async removeDonator(id: string): Promise<void> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        throw new Error('User must be logged in to remove donator from current game');
      }
      
      const { error } = await supabase
        .from('current_game')
        .delete()
        .eq('id', id)
        .eq('created_by', userEmail);
        
      if (error) {
        console.error('Error removing donator from current game:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to remove donator from current game:', error);
      throw error;
    }
  },
  
  async clearAll(): Promise<void> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        throw new Error('User must be logged in to clear current game');
      }
      
      const { error } = await supabase
        .from('current_game')
        .delete()
        .eq('created_by', userEmail);
        
      if (error) {
        console.error('Error clearing current game:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to clear current game:', error);
      throw error;
    }
  }
}; 