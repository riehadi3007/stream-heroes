import { getSupabase } from './supabase';
import { supabase } from './supabase';
import { DonationHistory, DonationHistoryInsert } from './types';
import { getCurrentUserEmail } from './auth-service';

export const DonationHistoryService = {
  // Add a new donation history record
  async addRecord(record: DonationHistoryInsert): Promise<DonationHistory> {
    const supabase = getSupabase();
    
    // Get current user email
    const userEmail = await getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('User must be logged in to add donation history');
    }
    
    try {
      // Add creator email to the record
      const recordWithUser = {
        ...record,
        created_by: userEmail
      };
      
      const { data, error } = await supabase
        .from('donations_history')
        .insert(recordWithUser)
        .select()
        .single();
        
      if (error) {
        console.error('Error adding donation history:', error);
        throw error;
      }
      
      return data as unknown as DonationHistory;
    } catch (error) {
      console.error('Failed to add donation history:', error);
      throw error;
    }
  },
  
  // Get donation history by date range
  async getByDateRange(startDate: string, endDate: string): Promise<DonationHistory[]> {
    const supabase = getSupabase();
    
    // Get current user email
    const userEmail = await getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('User must be logged in to view donation history');
    }
    
    try {
      const { data, error } = await supabase
        .from('donations_history')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('created_by', userEmail)
        .order('created_at');
        
      if (error) {
        console.error('Error fetching donation history:', error);
        throw error;
      }
      
      return data as unknown as DonationHistory[];
    } catch (error) {
      console.error('Failed to fetch donation history:', error);
      throw error;
    }
  }
}; 