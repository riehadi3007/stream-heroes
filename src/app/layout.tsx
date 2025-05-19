import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import SideMenu from "@/components/side-menu";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientBackground } from "@/components/client-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stream Heroes | Donation Tracking for Streamers",
  description: "Manage and track your stream donations like a hero. A gaming-style dashboard for streamers to organize supporter contributions.",
  icons: {
    icon: [
      {
        url: "/stream-heroes-icon.svg",
        type: "image/svg+xml",
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-background to-background/80`}
      >
        <ThemeProvider>
          <AuthProvider>
            <ClientBackground />
            <div className="flex min-h-screen">
              <SideMenu />
              <div 
                className="flex flex-col flex-1 w-full transition-all duration-300" 
                id="main-content"
                style={{ marginLeft: '0px' }} // Initial state (will be updated by SideMenu)
              >
                <Navbar />
                <main className="flex-1 p-6">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
