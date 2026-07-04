"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EnhancedTutorChat } from '@/components/enhanced-tutor-chat';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { CommandPalette } from '@/components/command-palette';
import { UploadModal } from '@/components/upload-modal';
import { SettingsModal } from '@/components/settings-modal';
import { ProfileModal } from '@/components/profile-modal';
import { useAuthStore } from '@/lib/stores';
import { Brain, Sparkles, Loader2, Puzzle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-8 w-8 border-2 border-white border-t-transparent rounded-full"
          />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
          Loading AI Tutor...
        </motion.p>
      </div>
    </div>
  );
}

function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { setUser } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      id: 'dev-user-' + Date.now(),
      clerk_id: 'dev-clerk-id',
      email,
      username: email.split('@')[0],
      full_name: name || email.split('@')[0],
      avatar_url: null,
      subscription_tier: 'free',
      role: 'student',
      bio: null,
      school: null,
      country: null,
      language: 'en',
      theme: 'system',
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-xl">AI Tutor</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 p-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Learn Smarter with <span className="text-gradient">AI</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              The only AI tutor that asks YOU questions, detects knowledge gaps, and breaks down complex problems into simple steps.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Sparkles, title: "Socratic Learning", desc: "Discover answers through guided questions" },
              { icon: Brain, title: "Knowledge Gap Detection", desc: "Identifies what you don't know you don't know" },
              { icon: Puzzle, title: "Problem Breakdown", desc: "Complex problems become simple steps" },
              { icon: Shield, title: "Misconception Detection", desc: "Corrects misunderstandings before they stick" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="shadow-2xl border-border/50">
            <CardHeader className="pb-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin" onClick={() => setMode('signin')}>Sign In</TabsTrigger>
                <TabsTrigger value="signup" onClick={() => setMode('signup')}>Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="p-6 text-center text-sm text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </footer>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <EnhancedTutorChat />
        </main>
      </div>
      <CommandPalette />
      <UploadModal />
      <SettingsModal />
      <ProfileModal />
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Dashboard />;
}
