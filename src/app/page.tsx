import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to ML Project</h1>
        <p className="text-lg max-w-md mx-auto">
          A Next.js application with Supabase authentication.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
