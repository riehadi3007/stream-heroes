"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updatePassword } from '@/lib/auth-service';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if the user has a valid session from the reset link
  useEffect(() => {
    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        setValidSession(!!data.session);
        
        if (!data.session) {
          console.error('No valid session for password reset');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setValidSession(false);
      }
    }
    
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setResult({ success: false, error: 'Passwords do not match' });
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await updatePassword(password);
      setResult(result);
      
      if (result.success) {
        // Clear the form on success
        setPassword('');
        setConfirmPassword('');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/signin?message=Password has been reset successfully');
        }, 2000);
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  // If we've checked and there's no valid session
  if (validSession === false) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
        <h1>Invalid Reset Link</h1>
        <p>
          This password reset link is invalid or has expired. Please request a new password reset link.
        </p>
        <Link 
          href="/forgot-password" 
          style={{ 
            display: 'inline-block',
            marginTop: '15px',
            color: '#0070f3',
            textDecoration: 'none'
          }}
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  // Calculate button state based on session and loading
  const isButtonDisabled = loading || validSession !== true;
  const buttonOpacity = isButtonDisabled ? 0.7 : 1;
  const buttonCursor = isButtonDisabled ? 'not-allowed' : 'pointer';

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Reset Your Password</h1>
      <p style={{ marginBottom: '20px' }}>
        Please enter a new password for your account.
      </p>
      
      <form onSubmit={handleResetPassword} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>New Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            placeholder="Enter new password"
            minLength={6}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Confirm New Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            placeholder="Confirm new password"
            minLength={6}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isButtonDisabled}
          style={{ 
            background: '#0070f3', 
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '4px',
            cursor: buttonCursor,
            opacity: buttonOpacity,
            width: '100%'
          }}
        >
          {loading ? 'Updating...' : 'Reset Password'}
        </button>
      </form>
      
      {result && (
        <div style={{ 
          padding: '15px', 
          background: result.success ? '#efffed' : '#ffeded',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3>{result.success ? 'Success!' : 'Error!'}</h3>
          {result.error && <p><strong>Error:</strong> {result.error}</p>}
          {result.success && (
            <p>
              Your password has been reset successfully. You will be redirected to the sign in page shortly.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 