"use client";

import { useState } from 'react';
import { signUp } from '@/lib/auth-service';

export default function AuthTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signUp(email, password);
      setResult(result);
      console.log('Sign up result:', result);
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'Unknown error' });
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Auth Test Page</h1>
      
      <form onSubmit={handleSignUp} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
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
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Signing Up...' : 'Sign Up (Direct)'}
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
          {result.success && <p>Sign up successful! Check your email for verification.</p>}
          <pre style={{ overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 