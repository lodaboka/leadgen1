"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import Image from "next/image";
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Zap, ArrowRight, FolderPlus, FileSpreadsheet, Share2, Rocket, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data) setSession(data);
      })
      .catch(() => {});
  }, []);
  
  

  // Animation variants
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const fadeLeft: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const fadeRight: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <main className="min-h-dvh bg-background text-foreground pb-48 lg:pb-32 font-sans selection:bg-primary/20 overflow-x-hidden">
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
      {/* Hero Section */}
      <header className="pt-20 pb-16 lg:pt-24 lg:pb-20 px-5 sm:px-6 text-center max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "backOut" }}
          className="flex items-center justify-center gap-3 mb-6 lg:mb-8"
        >
          <BrandLogo size="lg" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 lg:mb-6 text-balance leading-tight"
        >
          The Catalysts Group
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 lg:mb-10 text-balance leading-relaxed"
        >
          Capturing Event Lead securely syncs captured leads directly to your Google Drive and Sheets. 
          Follow this 3-step guide to set up your private workspace in minutes.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {session ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {session.role === 'admin' ? (
                <button
                  onClick={() => router.push('/admin')}
                  className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground py-3.5 px-8 lg:py-4 lg:px-10 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Admin Panel <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              ) : (
                <button
                  onClick={() => router.push('/scanner')}
                  className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground py-3.5 px-8 lg:py-4 lg:px-10 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Go to Scanner <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground py-3.5 px-8 lg:py-4 lg:px-10 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Sign In to Workspace <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
          )}
        </motion.div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 space-y-24 lg:space-y-32">
        
        {/* Phase 1: Google Drive */}
        <section className="scroll-mt-20 overflow-hidden py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div 
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold text-sm mb-2">
                <FolderPlus className="w-4 h-4" /> Phase 1
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Prepare Google Drive</h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                Create a folder where all visitor photos will be securely stored.
              </p>
              
              <ul className="space-y-6 mt-8">
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Create a Folder</h3>
                    <p className="text-muted-foreground">In your Google Drive, create a new folder (e.g., "Event Leads 2026").</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Copy Folder Link</h3>
                    <p className="text-muted-foreground">Click "Share", copy the link, and save it for the final step.</p>
                  </div>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-7 relative"
            >
              <div className="absolute inset-0 bg-blue-500/5 rounded-3xl lg:rounded-[2rem] transform translate-x-3 translate-y-3 lg:translate-x-4 lg:translate-y-4 -z-10"></div>
              <div className="bg-card border-4 border-border rounded-3xl lg:rounded-[2rem] overflow-hidden shadow-xl lg:shadow-2xl aspect-[4/3] flex items-center justify-center bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/guide/drive-create.png" alt="Google Drive Folder Link" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Phase 2: Create Sheet */}
        <section className="scroll-mt-20 overflow-hidden py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div 
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-7 relative order-2 lg:order-1"
            >
              <div className="absolute inset-0 bg-green-500/5 rounded-3xl lg:rounded-[2rem] transform -translate-x-3 translate-y-3 lg:-translate-x-4 lg:translate-y-4 -z-10"></div>
              <div className="bg-card border-4 border-border rounded-3xl lg:rounded-[2rem] overflow-hidden shadow-xl lg:shadow-2xl aspect-[4/3] flex items-center justify-center bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/guide/sheet-create.png" alt="Create Blank Sheet" className="w-full h-full object-cover" />
              </div>
            </motion.div>

            <motion.div 
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-5 space-y-6 order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm mb-2">
                <FileSpreadsheet className="w-4 h-4" /> Phase 2
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Create your Database</h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                Set up a fresh Google Sheet. Our system will automatically format it and add the correct headers when you connect.
              </p>
              
              <ul className="space-y-6 mt-8">
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Start a Blank Sheet</h3>
                    <p className="text-muted-foreground">Go to Google Sheets and click the "Blank spreadsheet" template.</p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Phase 2: Share Sheet */}
        <section className="scroll-mt-20 overflow-hidden py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div 
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-5 space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm mb-2">
                <Share2 className="w-4 h-4" /> Phase 2
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Grant Bot Access</h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                Allow our AI processing bot to write leads into your spreadsheet securely.
              </p>
              
              <ul className="space-y-6 mt-8">
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Share as Editor</h3>
                    <p className="text-muted-foreground mb-3">Click Share, and invite our Service Account Email as an <strong>Editor</strong>.</p>
                    <div className="bg-muted border border-border rounded-xl p-3 flex items-center gap-2">
                      <code className="text-xs lg:text-sm text-foreground truncate flex-1 font-mono select-all">lead-retrieval-bot@***.iam.gserviceaccount.com</code>
                    </div>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">5</div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Copy Sheet Link</h3>
                    <p className="text-muted-foreground">Copy the Sheet link from the share dialog or your browser URL bar.</p>
                  </div>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-7 relative"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-3xl lg:rounded-[2rem] transform translate-x-3 translate-y-3 lg:translate-x-4 lg:translate-y-4 -z-10"></div>
              <div className="bg-card border-4 border-border rounded-3xl lg:rounded-[2rem] overflow-hidden shadow-xl lg:shadow-2xl aspect-[4/3] flex items-center justify-center bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/guide/sheet-share.png" alt="Share Sheet as Editor" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Phase 3: Launch (Login Link) */}
        <section id="setup-form" className="scroll-mt-20 overflow-hidden py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* The Login Card CTA */}
            <motion.div 
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-6 relative order-2 lg:order-1"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-3xl lg:rounded-[2.5rem] transform -translate-x-3 translate-y-3 lg:-translate-x-4 lg:translate-y-4 -z-10"></div>
              
              <div className="bg-card border-2 border-border rounded-3xl lg:rounded-[2.5rem] p-8 sm:p-10 shadow-xl lg:shadow-2xl relative z-10 flex flex-col items-center justify-center text-center space-y-6">
                <div className="mb-2">
                  <BrandLogo size="md" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Log in with your event credentials provided by the admin, or access the CRM portal.
                  </p>
                </div>
                
                <Link
                  href="/login"
                  className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-4"
                >
                  Go to Login <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>

            <motion.div 
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-6 space-y-8 order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm mb-2">
                <Rocket className="w-4 h-4" /> Phase 3
              </div>
              <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight">Connect & Launch</h2>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                You're all set! Just paste the links into this secure setup form and start scanning leads immediately. 
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <p className="text-muted-foreground font-medium">Automatic Column Formatting</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <p className="text-muted-foreground font-medium">End-to-End Encrypted Session Cookie</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <p className="text-muted-foreground font-medium">Multi-tenant Zero-DB Architecture</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border md:hidden z-50 flex justify-center">
        {session ? (
          <button
            onClick={() => router.push('/scanner')}
            className="flex items-center justify-center gap-2 w-full max-w-sm bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
          >
            Go to Scanner <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full max-w-sm bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
          >
            Go to Login <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </main>
  );
}
