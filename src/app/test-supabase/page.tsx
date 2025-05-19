"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TestSupabase() {
  const [result, setResult] = useState<any>({ status: 'Loading...' });

  useEffect(() => {
    async function testConnection() {
      try {
        // Create client inline to test direct connection
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        // Show what we're using (but hide full key for security)
        console.log("Testing with:", {
          url: supabaseUrl,
          key: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'missing'
        });
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Simple health check
        const { data, error } = await supabase.from('_config').select('*').limit(1);
        
        if (error) throw error;
        
        setResult({
          status: 'Connected successfully!',
          data,
        });
      } catch (error: any) {
        console.error('Test error:', error);
        setResult({
          status: 'Error',
          error: error.message || 'Unknown error',
          fullError: error
        });
      }
    }
    
    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Supabase Connection Test</h1>
      
      <h2>Connection Status</h2>
      <div style={{ 
        padding: '10px', 
        background: result.status === 'Error' ? '#ffeded' : '#efffed',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}>
        <p><strong>Status:</strong> {result.status}</p>
        {result.error && <p><strong>Error:</strong> {result.error}</p>}
      </div>
      
      <h2>Debug Info</h2>
      <div style={{ 
        padding: '10px', 
        background: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflowX: 'auto'
      }}>
        <pre>{JSON.stringify({
          env: {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
          result
        }, null, 2)}</pre>
      </div>
    </div>
  );
} 