"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, RefreshCw, Loader2, User, FileSpreadsheet, FolderOpen, Calendar, Sparkles } from 'lucide-react';
import { useTypewriter } from '@/hooks/useTypewriter';

interface EventData {
  eventId: string;
  eventName: string;
  username: string;
  sheetId: string;
  driveId: string;
  createdAt: string;
  sheetTitle: string;
  folderTitle: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [totalNumbers, setTotalNumbers] = useState(0);
  const [summary, setSummary] = useState('');
  const { text: typedSummary } = useTypewriter(summary, 20);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => { if (!res.ok) { router.replace('/login'); return null; } return res.json(); })
      .then(data => { if (data && data.role !== 'admin') { router.replace('/login'); return; } fetchEventData(); })
      .catch(() => router.replace('/login'));
  }, [router, id]);

  const fetchEventData = async () => {
    setLoadingEvent(true);
    try {
      const res = await fetch('/api/admin/list-events');
      const data = await res.json();
      if (data.events) {
        const found = data.events.find((e: EventData) => e.eventId === id);
        if (found) { setEvent(found); generateSummary(id); }
        else { toast.error('Event not found.'); router.push('/admin'); }
      }
    } catch { toast.error('Failed to load event.'); }
    finally { setLoadingEvent(false); }
  };

  const generateSummary = async (eventId: string) => {
    setLoadingSummary(true);
    const minWaitTime = 5000; // 5 seconds fake loader
    const startTime = Date.now();
    try {
      const res = await fetch('/api/admin/event-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (data.totalNumbers !== undefined) setTotalNumbers(data.totalNumbers);
      if (data.summary) setSummary(data.summary);
      if (data.totalLeads) setTotalLeads(data.totalLeads);
    } catch { toast.error('Failed to load stats'); }
    finally { 
      const elapsed = Date.now() - startTime;
      if (elapsed < minWaitTime) {
         setTimeout(() => setLoadingSummary(false), minWaitTime - elapsed);
      } else {
         setLoadingSummary(false); 
      }
    }
  };

  if (loadingEvent) {
    return (<main className="min-h-dvh bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main>);
  }

  if (!event) return null;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="rounded-full hover:bg-muted gap-2 pr-4"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none truncate">{event.eventName}</h1>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Event Details</p>
            </div>
          </div>
          <a href={`https://docs.google.com/spreadsheets/d/${event.sheetId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border/50 bg-background hover:bg-accent hover:border-accent text-sm font-medium transition-all shadow-sm">
            <ExternalLink className="w-4 h-4 text-emerald-500" /> Open Sheet
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card className="bg-card/40 backdrop-blur-sm border-border/60 shadow-lg overflow-hidden">
          <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{event.eventName}</CardTitle>
              <Badge variant="outline" className="font-mono text-xs bg-background/50 border-border/50">{event.eventId}</Badge>
            </div>
            <CardDescription>Event configuration and workspace details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-background border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><User className="w-5 h-5 text-blue-500" /></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Username</p><p className="text-sm font-bold">{event.username}</p></div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Calendar className="w-5 h-5 text-purple-500" /></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Created</p><p className="text-sm font-bold">{event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><FileSpreadsheet className="w-5 h-5 text-emerald-500" /></div>
                <div className="min-w-0"><p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Google Sheet</p><p className="text-sm font-bold truncate">{event.sheetTitle || event.sheetId}</p></div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-background border border-border/40 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><FolderOpen className="w-5 h-5 text-amber-500" /></div>
                <div className="min-w-0"><p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-0.5">Drive Folder</p><p className="text-sm font-bold truncate">{event.folderTitle || event.driveId}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 shadow-sm mt-6">
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Event Statistics</CardTitle>
              <Button variant="outline" size="sm" onClick={() => generateSummary(event.eventId)} disabled={loadingSummary} className="gap-2 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${loadingSummary ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </CardHeader>
          <Separator className="opacity-50" />
          <CardContent className="pt-6 relative z-10">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col items-center justify-center gap-1.5">
                  <span className="text-3xl font-black text-foreground">{totalLeads}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Leads</span>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col items-center justify-center gap-1.5">
                  <span className="text-3xl font-black text-foreground">{totalNumbers}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Numbers Captured</span>
                </div>
              </div>
              
              {loadingSummary ? (
                <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 shadow-inner space-y-3 relative overflow-hidden">

                  <div className="h-3 bg-primary/10 rounded-md w-full animate-pulse" />
                  <div className="h-3 bg-primary/10 rounded-md w-11/12 animate-pulse" />
                  <div className="h-3 bg-primary/10 rounded-md w-4/5 animate-pulse" />
                  <div className="flex items-center gap-2 pt-2 text-xs text-primary/60 font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    Generating Insights...
                  </div>
                </div>
              ) : summary ? (
                <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 shadow-inner">
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">{typedSummary}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}