import { getSupabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { GameSession, GameSessionInsert, Donator } from './types';
import { getCurrentUserEmail } from './auth-service';
import { DonatorService } from './donator-service';

export const GameSessionService = {
  async createSession(donatorIds: string[]): Promise<GameSession[]> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        throw new Error('User must be logged in to create a game session');
      }
      
      // Generate a unique session ID
      const sessionId = uuidv4();
      
      // Start transaction to update donators and create game session
      const now = new Date().toISOString();
      
      // Create session records for each donator
      const sessionData: GameSessionInsert[] = donatorIds.map(donatorId => ({
        session_id: sessionId,
        donator_id: donatorId,
        played_at: now,
        created_by: userEmail
      }));
      
      // Insert session records
      const { data, error } = await supabase
        .from('game_sessions')
        .insert(sessionData)
        .select();
        
      if (error) {
        console.error('Error creating game session:', error);
        throw error;
      }
      
      // Update each donator's total_game (decrement by 1) without updating total_donation
      for (const donatorId of donatorIds) {
        // Get donator to check if they have games remaining
        const donator = await DonatorService.getById(donatorId);
        
        if (donator.total_game <= 0) {
          throw new Error(`Donator ${donator.name} has no remaining games`);
        }
        
        // Update donator's game count directly in the database without recalculating total_donation
        const { error: updateError } = await supabase
          .from('donators')
          .update({
            total_game: donator.total_game - 1,
            updated_by: userEmail
          })
          .eq('id', donatorId);
          
        if (updateError) {
          console.error(`Error updating donator ${donatorId}:`, updateError);
          throw updateError;
        }
      }
      
      return data as GameSession[];
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  },
  
  async getRecentSessions(limit: number = 10): Promise<{
    session_id: string;
    played_at: string;
    donators: (Donator & { category_name: string })[];
  }[]> {
    const supabase = getSupabase();
    
    try {
      // Get current user email
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        throw new Error('User must be logged in to view game sessions');
      }
      
      // Get unique session IDs ordered by played_at
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('session_id, played_at')
        .eq('created_by', userEmail)
        .order('played_at', { ascending: false })
        .limit(limit);
        
      if (sessionsError) {
        console.error('Error fetching game sessions:', sessionsError);
        throw sessionsError;
      }
      
      // Get unique session IDs
      const uniqueSessionIds = [...new Set(sessionsData.map(session => session.session_id))];
      
      // Build result with donators for each session
      const result = [];
      
      for (const sessionId of uniqueSessionIds) {
        const { data: donatorData, error: donatorError } = await supabase
          .from('game_sessions')
          .select(`
            *,
            donator:donator_id (
              *,
              category:category_id (
                name
              )
            )
          `)
          .eq('session_id', sessionId as string)
          .eq('created_by', userEmail);
          
        if (donatorError) {
          console.error(`Error fetching donators for session ${sessionId}:`, donatorError);
          continue;
        }
        
        // Find the played_at time from sessionsData
        const sessionInfo = sessionsData.find(s => s.session_id === sessionId);
        
        // Format donators data
        const formattedDonators = donatorData.map((record: any) => ({
          ...record.donator,
          category_name: record.donator.category?.name || 'Unknown'
        }));
        
        result.push({
          session_id: sessionId as string,
          played_at: sessionInfo?.played_at?.toString() || '',
          donators: formattedDonators
        });
      }
      
      return result as {
        session_id: string;
        played_at: string;
        donators: (Donator & { category_name: string })[];
      }[];
    } catch (error) {
      console.error('Failed to load game sessions:', error);
      throw error;
    }
  }
}; 