"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { Button } from '@/components/ui/button';
import Image from "next/image";
import { BrandLogo } from '@/components/BrandLogo';
import { Zap, LayoutDashboard, LogOut, User, FileSpreadsheet, FolderOpen, Loader2, History, HomeIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTypewriter } from '@/hooks/useTypewriter';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from '@/components/ui/drawer';

interface SessionData {
  username: string;
  sheetTitle: string;
  folderName: string;
  eventName?: string;
  role?: string;
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
    
  const { text: typedEventName } = useTypewriter(session?.eventName || 'Capturing Event Lead', 50);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) { router.replace('/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) {
          setSession(data);
          
        }
        setCheckingSession(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  
  const handleDisconnect = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  if (checkingSession) {
    return (<main className="min-h-dvh bg-background flex items-center justify-center"><div className="spinner w-10 h-10" /></main>);
  }

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-md border border-green-500/20">
                  <User className="w-2.5 h-2.5" />
                  <p className="text-[9px] font-bold uppercase tracking-wider truncate">
                    {session?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => router.push('/scanner/dashboard')} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {session?.role === 'admin' && (
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-colors gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-10 text-xs sm:text-sm">
                <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleDisconnect} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="w-full max-w-md mx-auto px-5 pt-6 pb-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            {typedEventName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2 text-primary/80">
            The Catalysts Group
          </p>
        </div>
        <LeadCaptureForm />
      </div>
    </main>
  );
}


