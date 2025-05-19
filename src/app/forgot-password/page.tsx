"use client";

import { useState } from 'react';
import Link from 'next/link';
import { resetPasswordRequest } from '@/lib/auth-service';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await resetPasswordRequest(email);
      setResult(result);
      console.log('Password reset request result:', result);
      
      if (result.success) {
        // Clear the form on success
        setEmail('');
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'Unknown error' });
      console.error('Password reset request error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Forgot Password</h1>
      <p style={{ marginBottom: '20px' }}>
        Enter your email address below and we'll send you a link to reset your password.
      </p>
      
      <form onSubmit={handleResetRequest} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            placeholder="Enter your email address"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            background: '#0070f3', 
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: '10px',
            width: '100%'
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <Link 
            href="/signin" 
            style={{ 
              color: '#0070f3',
              textDecoration: 'none', 
            }}
          >
            Back to Sign In
          </Link>
        </div>
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
              If an account exists with this email, you will receive a password reset link.
              Please check your email inbox (and spam folder).
            </p>
          )}
        </div>
      )}
    </div>
  );
} 