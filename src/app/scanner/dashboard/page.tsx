"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileSpreadsheet, FolderOpen, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ScannerDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) { router.replace('/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) {
          if (data.role === 'admin') {
             router.replace('/admin');
             return;
          }
          setSession(data);
          fetchRecentLeads();
        }
        setCheckingSession(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const fetchRecentLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/get-leads');
      const data = await res.json();
      if (data.leads) {
        setRecentLeads(data.leads.reverse().slice(0, 10)); // fetch more for dashboard
      }
    } catch (error) {
      console.error("Failed to fetch leads", error);
      toast.error("Failed to refresh leads");
    } finally {
      setLoadingLeads(false);
    }
  };

  if (checkingSession) {
    return (<main className="min-h-dvh bg-background flex items-center justify-center"><div className="spinner w-10 h-10" /></main>);
  }

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col max-w-md mx-auto relative">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 px-5 h-16 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/scanner')} className="shrink-0 -ml-2 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground truncate">Event Dashboard</h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Workspace details</p>
        </div>
      </header>

      <div className="p-5 space-y-8 flex-1 pb-10">
        
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Workspace Storage</h2>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 p-5 rounded-xl bg-muted/40 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-500">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Sheet Name</span>
                </div>
                {session?.sheetId && (
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0 gap-1 rounded border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600 transition-colors" onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${session.sheetId}`, '_blank')}>
                    <FileSpreadsheet className="w-3 h-3" />
                    Open Sheet
                  </Button>
                )}
              </div>
              <span className="text-base font-medium text-foreground font-sans truncate">{session?.sheetTitle || 'Loading...'}</span>
            </div>
            
            <div className="flex flex-col gap-1.5 p-5 rounded-xl bg-muted/40 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-500">
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Folder Name</span>
                </div>
                {session?.folderId && (
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0 gap-1 rounded border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 transition-colors" onClick={() => window.open(`https://drive.google.com/drive/folders/${session.folderId}`, '_blank')}>
                    <FolderOpen className="w-3 h-3" />
                    Open Drive
                  </Button>
                )}
              </div>
              <span className="text-base font-medium text-foreground font-sans truncate">{session?.folderName || 'Loading...'}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Leads Captured</h2>
            <Button variant="outline" size="sm" onClick={fetchRecentLeads} disabled={loadingLeads} className="h-8 gap-1.5 rounded-full px-3 text-xs shadow-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loadingLeads ? (
                <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : recentLeads.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {recentLeads.map((lead, idx) => (
                    <div key={idx} className="p-5 flex flex-col gap-1.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-foreground">{lead.Name || lead.name || 'Unknown'}</span>
                        <Badge variant="secondary" className="bg-background/50 border-border/50 text-[9px] uppercase tracking-wider shadow-sm truncate max-w-[120px]">
                          {lead.Company || lead.company || 'No Company'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{lead.Email || lead.email || lead.Mobile || lead.mobile || 'No contact info'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No leads captured yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
