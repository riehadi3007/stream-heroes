import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: 'build',
  env: {
    // Hardcode the Supabase URL and anon key temporarily to bypass .env.local loading issues
    NEXT_PUBLIC_SUPABASE_URL: "https://orzkghsghdcupfbrayfn.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemtnaHNnaGRjdXBmYnJheWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjMwMjEsImV4cCI6MjA2MzAzOTAyMX0.tOH4sjCxrXZz0BG2vpTSwpTn_el0orWbIHp9BAg7Z7E" // Add your complete anon key here
  }
};

export default nextConfig;
