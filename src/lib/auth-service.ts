import { createClient } from '@supabase/supabase-js';

// Initialize with direct values for testing
const SUPABASE_URL = "https://orzkghsghdcupfbrayfn.supabase.co";
// Replace this with your exact key from the dashboard
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemtnaHNnaGRjdXBmYnJheWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjMwMjEsImV4cCI6MjA2MzAzOTAyMX0.tOH4sjCxrXZz0BG2vpTSwpTn_el0orWbIHp9BAg7Z7E";

// Create client with direct values instead of environment variables
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Gets the current user's email address
 * @returns The email of the current user or null if not logged in
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

export async function signUp(email: string, password: string) {
  try {
    console.log('Auth Service - Signing up with:', { email, password: '***' });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Auth Service - Sign up error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Auth Service - Unexpected error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function resetPasswordRequest(email: string, redirectTo?: string) {
  try {
    console.log('Auth Service - Password reset request for:', email);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      console.error('Auth Service - Password reset request error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Auth Service - Unexpected error in password reset:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    console.log('Auth Service - Updating password');
    
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Auth Service - Update password error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Auth Service - Unexpected error in password update:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
} 