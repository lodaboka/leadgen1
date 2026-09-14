"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import Image from "next/image";
import { BrandLogo } from '@/components/BrandLogo';
import { Zap, Loader2, ArrowRight, ShieldCheck, UserCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => { if (res.ok) return res.json(); setCheckingSession(false); return null; })
      .then(data => { if (data) { if (data.role === 'admin') router.replace('/admin'); else router.replace('/scanner'); } })
      .catch(() => setCheckingSession(false));
  }, [router]);

  const handleStaffLogin = async () => {
    if (!staffUsername.trim() || !staffPassword) { toast.error('Username and password are required.'); return; }
    setStaffLoading(true);
    try {
      const res = await fetch('/api/auth/event-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: staffUsername, password: staffPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      toast.success('Login successful!');
      router.push(data.redirectTo || '/scanner');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Login failed.'); }
    finally { setStaffLoading(false); }
  };

  const handleAdminLogin = async () => {
    if (!adminUsername.trim() || !adminPassword) { toast.error('Username and password are required.'); return; }
    setAdminLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: adminUsername, password: adminPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      toast.success('Welcome, Admin!');
      router.push(data.redirectTo || '/admin');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Login failed.'); }
    finally { setAdminLoading(false); }
  };

  if (checkingSession) return (<main className="min-h-dvh bg-background flex items-center justify-center"><div className="spinner w-10 h-10" /></main>);

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col p-5 relative overflow-y-auto">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md mx-auto my-auto space-y-8 py-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }} className="text-center">
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4 px-2 leading-tight">Capturing Event Lead</h1>
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" />
          </div>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <Card className="shadow-2xl border-border/60 backdrop-blur-md w-full overflow-visible">
            <CardContent className="p-6 sm:p-8">
              <Tabs defaultValue="staff" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl p-1 bg-transparent">
                  <TabsTrigger value="staff" className="gap-2 py-2.5 rounded-lg text-sm font-semibold "><UserCircle className="w-4 h-4" /> Staff Login</TabsTrigger>
                  <TabsTrigger value="admin" className="gap-2 py-2.5 rounded-lg text-sm font-semibold "><ShieldCheck className="w-4 h-4" /> Admin Login</TabsTrigger>
                </TabsList>

                
                  <TabsContent value="staff" className="space-y-6" key="staff-tab">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                      <div className="mb-6">
                        <h2 className="text-xl font-bold mb-1.5">Staff Login</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">Enter your event credentials provided by the admin.</p>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="staff-username" className="text-sm font-semibold">Username</Label>
                          <Input id="staff-username" placeholder="Enter your username" value={staffUsername} onChange={e => setStaffUsername(e.target.value)} className="h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base" onKeyDown={e => e.key === 'Enter' && handleStaffLogin()} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-password" className="text-sm font-semibold">Password</Label>
                          <Input id="staff-password" type="password" placeholder="Enter your password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} className="h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base" onKeyDown={e => e.key === 'Enter' && handleStaffLogin()} />
                        </div>
                        <Button onClick={handleStaffLogin} disabled={staffLoading} className="w-full h-12 mt-2 text-base font-bold gap-2 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/20">
                          {staffLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                        </Button>
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-6" key="admin-tab">
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                      <div className="mb-6">
                        <h2 className="text-xl font-bold mb-1.5">Admin Login</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">Access the CRM portal to manage events.</p>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="admin-username" className="text-sm font-semibold">Admin Username</Label>
                          <Input id="admin-username" placeholder="Enter admin username" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base" onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-password" className="text-sm font-semibold">Admin Password</Label>
                          <Input id="admin-password" type="password" placeholder="Enter admin password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base" onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
                        </div>
                        <Button onClick={handleAdminLogin} disabled={adminLoading} className="w-full h-12 mt-2 text-base font-bold gap-2 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/20">
                          {adminLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : <>Access Admin Portal <ShieldCheck className="w-5 h-5" /></>}
                        </Button>
                      </div>
                    </motion.div>
                  </TabsContent>
                
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </main>
  );
}
