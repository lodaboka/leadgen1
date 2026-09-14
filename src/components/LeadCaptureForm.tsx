"use client";

import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle, ScanLine, ArrowLeft, Loader2, ImagePlus, Save, ArrowRight, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';

interface TargetData {
  name: string;
  mobile: string;
  email: string;
  age: string;
  gender: string;
  address: string;
  company: string;
  inquiry: string;
}

const emptyData: TargetData = { name: '', mobile: '', email: '', age: '', gender: 'N/A', address: '', company: '', inquiry: '' };

function TypewriterInput({ name, label, targetValue, type = "text", required = false, as = "input" }: { name: string, label: string, targetValue: string, type?: string, required?: boolean, as?: 'input' | 'textarea' }) {
  const { text, handleManualChange } = useTypewriter(targetValue, 15);

  const sharedClasses = "h-12 w-full px-4 rounded-lg bg-transparent border border-border/50 focus:bg-background focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-all text-sm font-medium";

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-muted-foreground mb-1.5">{label}</label>
      {as === 'textarea' ? (
        <textarea
          name={name}
          value={text}
          onChange={(e) => handleManualChange(e.target.value)}
          required={required}
          className={`${sharedClasses} resize-none`}
          placeholder={`Enter ${label.toLowerCase()}`}
          rows={2}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={text}
          onChange={(e) => handleManualChange(e.target.value)}
          required={required}
          className={sharedClasses}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
    </div>
  );
}

export function LeadCaptureForm() {
  const [mode, setMode] = useState<'idle' | 'processing' | 'form' | 'saving' | 'success'>('idle');
  const [targetData, setTargetData] = useState<TargetData>(emptyData);
  const [cardImageBase64, setCardImageBase64] = useState<string | null>(null);
  const [liveImageBase64, setLiveImageBase64] = useState<string | null>(null);
  const [livePhotoPreview, setLivePhotoPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsPhoto, setNeedsPhoto] = useState(false);

  const cardInputRef = useRef<HTMLInputElement>(null);
  const liveInputRef = useRef<HTMLInputElement>(null);

  const handleCompressAndBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

  const handleCardCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage("");
    setMode('processing');
    setNeedsPhoto(false);

    try {
      const base64 = await handleCompressAndBase64(file);
      setCardImageBase64(base64);

      const res = await fetch('/api/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process card");

      let genderValue = data.result.gender;
      if (!["Male", "Female", "Other", "N/A"].includes(genderValue)) genderValue = "N/A";

      setTargetData({
        name: data.result.name || '',
        mobile: data.result.mobile || '',
        email: data.result.email || '',
        age: data.result.age || '',
        gender: genderValue,
        address: data.result.address || '',
        company: data.result.company || '',
        inquiry: ''
      });

      if (!data.result.face_detected) {
        setNeedsPhoto(true);
        // Card image kept for reference
      }

      setMode('form');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setTargetData(emptyData);
      setMode('idle');
    }
  };

  const handleManualEntry = () => {
    setTargetData(emptyData);
    setCardImageBase64(null);
    setLiveImageBase64(null);
    setLivePhotoPreview(null);
    setNeedsPhoto(true);
    setMode('form');
  };

  const handleLiveCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await handleCompressAndBase64(file);
      setLiveImageBase64(base64);
      setLivePhotoPreview(base64);
      setNeedsPhoto(false);
      if (mode === 'idle') {
        setTargetData(emptyData);
        setMode('form');
      }
    } catch (error) { console.error(error); }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMode('saving');
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const finalData = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: finalData,
          imageToSave: liveImageBase64 || cardImageBase64,
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save lead");

      setMode('success');
      setTimeout(() => resetForm(), 2500);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setTargetData(emptyData);
      setMode('form');
    }
  };

  const resetForm = () => {
    setTargetData(emptyData);
    setCardImageBase64(null);
    setLiveImageBase64(null);
    setLivePhotoPreview(null);
    setNeedsPhoto(false);
    setMode('idle');
    setErrorMessage("");
    if (cardInputRef.current) cardInputRef.current.value = "";
    if (liveInputRef.current) liveInputRef.current.value = "";
  };

  const BackBtn = () => (
    <button type="button" onClick={resetForm} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-6 pb-6 flex flex-col">

      {/* Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Inputs */}
      <input type="file" accept="image/*" capture="environment" ref={cardInputRef} onChange={handleCardCapture} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={liveInputRef} onChange={handleLiveCapture} className="hidden" />

      <AnimatePresence mode="wait">
        {/* IDLE */}
        {mode === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">

            <button
              onClick={() => cardInputRef.current?.click()}
              className="group relative flex flex-col items-center justify-center p-8 bg-card/60 backdrop-blur-md rounded-3xl shadow-lg border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(var(--primary),0.15)] group-hover:shadow-[0_0_25px_rgba(var(--primary),0.3)] border border-primary/20">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Scan Card</h2>
              <p className="text-sm text-muted-foreground mt-1 relative z-10">AI auto-extracts data instantly</p>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">or</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <button
              onClick={handleManualEntry}
              className="group flex items-center justify-center gap-4 p-5 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-muted/80 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-border/50 group-hover:border-primary/20">
                <Keyboard className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Manual Entry</h3>
                <p className="text-xs text-muted-foreground">Type details & snap photo</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* PROCESSING */}
        {mode === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 py-12">
            <div className="spinner w-12 h-12 mb-6" />
            <h2 className="text-xl font-bold text-foreground">Analyzing Card...</h2>
            <p className="text-muted-foreground text-sm mt-2 text-center">Using AI to extract details. This takes a few seconds.</p>
          </motion.div>
        )}

        {/* FORM (Framer Motion Slide Down) */}
        {(mode === 'form' || mode === 'saving') && (
          <motion.div
            key="form"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex flex-col mt-auto"
          >
            {mode !== 'saving' && <BackBtn />}
            <form onSubmit={handleSave} className="bg-card/90 backdrop-blur-xl rounded-t-[2rem] sm:rounded-3xl p-6 sm:p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-border/50 relative">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full sm:hidden" />
              <div className="flex items-center justify-between mb-8 mt-2 sm:mt-0">
                <h2 className="text-xl font-bold text-foreground">Enter Details</h2>
                {livePhotoPreview && (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={livePhotoPreview} alt="Visitor" className="w-full h-full object-cover" />
                  </div>
                )}
                {!livePhotoPreview && !needsPhoto && cardImageBase64 === null && (
                   <button type="button" onClick={() => liveInputRef.current?.click()} className="text-primary hover:text-primary/80 transition-colors bg-primary/10 p-2 rounded-xl">
                     <ImagePlus className="w-5 h-5" />
                   </button>
                )}
              </div>

              <TypewriterInput name="name" label="Full Name" targetValue={targetData.name} />
              <TypewriterInput name="mobile" label="Mobile" targetValue={targetData.mobile} type="tel" />
              <TypewriterInput name="email" label="Email" targetValue={targetData.email} type="email" />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <TypewriterInput name="age" label="Age" targetValue={targetData.age} />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Gender</label>
                  <select
                    name="gender"
                    defaultValue={targetData.gender}
                    className="h-12 w-full px-4 rounded-lg bg-transparent border border-border/50 focus:bg-background focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-all text-sm font-medium appearance-none"
                  >
                    <option value="N/A">N/A</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <TypewriterInput name="company" label="Company" targetValue={targetData.company} as="textarea" />
              <TypewriterInput name="address" label="Address" targetValue={targetData.address} as="textarea" />
              <TypewriterInput name="inquiry" label="Inquiry / Notes" targetValue={targetData.inquiry} as="textarea" />

              {/* Path 2 Smart Action Banner */}
              {needsPhoto && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-sm">
                   <div className="flex items-center gap-2 text-foreground mb-3">
                     <Camera className="w-5 h-5 text-primary" />
                     <p className="font-semibold text-sm">Want to capture a visitor photo?</p>
                   </div>
                   <div className="flex flex-col gap-2">
                     <button type="button" onClick={() => liveInputRef.current?.click()} className="w-full bg-background border border-border/50 text-foreground py-3 rounded-xl font-bold text-sm hover:bg-accent hover:text-primary transition-colors shadow-sm">
                       Capture Visitor Photo
                     </button>
                     <button type="submit" disabled={mode === 'saving'} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-xs font-semibold py-2 transition-colors disabled:opacity-50">
                       {mode === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit without photo'} <ArrowRight className="w-3 h-3" />
                     </button>
                   </div>
                </motion.div>
              )}

              {/* Default Save Button */}
              {!needsPhoto && (
                <button type="submit" disabled={mode === 'saving'} className="w-full mt-8 bg-primary text-primary-foreground h-12 rounded-lg font-bold text-base transition-transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
                  {mode === 'saving' ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Lead'}
                </button>
              )}
            </form>
          </motion.div>
        )}

        {/* SUCCESS */}
        {mode === 'success' && (
          <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center flex-1">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Lead Saved!</h2>
            <p className="text-muted-foreground">Ready for the next scan.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}





