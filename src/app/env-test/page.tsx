export default function EnvTestPage() {
  // This code runs on the server
  const envVars = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Exists (not showing for security)' : 'Not found'
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Variable Test (Server Component)</h1>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
    </div>
  );
} 