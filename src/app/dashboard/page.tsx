"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ExternalLink, LogOut, ArrowLeft, RefreshCw, Search, Image as ImageIcon, Loader2, User
} from 'lucide-react';

interface Lead {
  ID: string;
  Name: string;
  Mobile: string;
  Email: string;
  Age: string;
  Gender: string;
  Company: string;
  Address: string;
  Photo_Drive_Link: string;
  Timestamp: string;
}

interface SessionData {
  username: string;
  sheetId: string;
  folderId: string;
  sheetTitle: string;
  folderName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Check session
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) { router.replace('/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setSession(data);
        setCheckingSession(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/get-leads');
      if (!res.ok) { if (res.status === 401) router.replace('/login'); return; }
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (!checkingSession && session) {
      fetchLeads();
    }
  }, [checkingSession, session, fetchLeads]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeads();
  };

  const handleDisconnect = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(lead).some(val => 
      String(val).toLowerCase().includes(q)
    );
  });

  if (checkingSession) {
    return (
      <main className="min-h-dvh bg-background flex items-center justify-center">
        <div className="spinner w-10 h-10" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/scanner')}
              className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-foreground truncate">Leads Dashboard</h1>
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
                  {session?.username}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://docs.google.com/spreadsheets/d/${session?.sheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              title="Open Google Sheet"
            >
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
            </a>
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="max-w-4xl mx-auto w-full px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Company, Email..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{leads.length}</span>
            <span className="text-xs text-muted-foreground">Total Leads</span>
          </div>
          {session?.sheetTitle && (
            <p className="text-xs text-muted-foreground truncate">
              Sheet: <span className="font-semibold text-foreground">{session.sheetTitle}</span>
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-lg font-bold text-foreground mb-2">
              {searchQuery ? 'No matches found' : 'No leads yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term.' : 'Start scanning cards to see leads here.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {filteredLeads.map((lead, idx) => (
                <motion.div
                  key={lead.ID || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Photo thumbnail */}
                    <div className="shrink-0">
                      {lead.Photo_Drive_Link && lead.Photo_Drive_Link !== 'N/A' ? (
                        <a
                          href={lead.Photo_Drive_Link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                          title="View photo on Drive"
                        >
                          <ImageIcon className="w-5 h-5 text-primary" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-foreground truncate">{lead.Name || 'N/A'}</h3>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                          #{lead.ID}
                        </span>
                      </div>
                      {lead.Company && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.Company}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {lead.Mobile && (
                          <a href={`tel:${lead.Mobile}`} className="text-xs text-primary font-medium hover:underline">
                            📞 {lead.Mobile}
                          </a>
                        )}
                        {lead.Email && (
                          <a href={`mailto:${lead.Email}`} className="text-xs text-primary font-medium hover:underline truncate">
                            ✉️ {lead.Email}
                          </a>
                        )}
                      </div>
                      {(lead.Age || lead.Gender) && (
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          {lead.Age && `Age: ${lead.Age}`} {lead.Age && lead.Gender !== 'N/A' && '·'} {lead.Gender !== 'N/A' && lead.Gender}
                        </p>
                      )}
                      {lead.Address && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">📍 {lead.Address}</p>
                      )}
                      {lead.Timestamp && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                          {new Date(lead.Timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
