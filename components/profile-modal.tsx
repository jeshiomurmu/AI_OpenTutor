"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  School,
  MapPin,
  BookOpen,
  Trophy,
  Flame,
  Calendar,
  Edit2,
  Camera,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '@/lib/stores';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileOverview() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Documents"
          value={12}
          color="bg-blue-500"
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={7}
          color="bg-orange-500"
        />
        <StatCard
          icon={Trophy}
          label="Achievements"
          value={8}
          color="bg-yellow-500"
        />
        <StatCard
          icon={Calendar}
          label="Study Hours"
          value={24}
          color="bg-green-500"
        />
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const height = Math.random() * 80 + 20;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/40"
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {[
              { icon: '🎓', label: 'First Lesson', unlocked: true },
              { icon: '📚', label: 'Bookworm', unlocked: true },
              { icon: '🔥', label: '7 Day Streak', unlocked: true },
              { icon: '🎯', label: 'Perfect Score', unlocked: true },
              { icon: '🧠', label: 'Quiz Master', unlocked: false },
              { icon: '⚡', label: 'Quick Learner', unlocked: false },
              { icon: '🏆', label: 'Top Student', unlocked: false },
              { icon: '💎', label: 'Expert', unlocked: false },
            ].map((achievement, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                  achievement.unlocked
                    ? 'bg-muted'
                    : 'bg-muted/50 opacity-50'
                }`}
              >
                <span className="text-2xl">{achievement.icon}</span>
                <span className="text-xs text-center">{achievement.label}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [school, setSchool] = useState(user?.school || '');
  const [country, setCountry] = useState(user?.country || '');
  const [bio, setBio] = useState(user?.bio || '');

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-chart-2 text-primary-foreground text-2xl">
              {user?.full_name?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Camera className="h-3 w-3" />
          </button>
        </div>
        <div>
          <h3 className="font-medium">{fullName || 'Your Name'}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Badge variant="secondary" className="mt-1">
            {user?.subscription_tier || 'Free'} Plan
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Form Fields */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Your school"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Your country"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Input
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}

export function ProfileModal() {
  const { isProfileOpen, closeProfile } = useUIStore();
  const { user } = useAuthStore();

  return (
    <Dialog open={isProfileOpen} onOpenChange={(open) => {
      if (!open) closeProfile();
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-[200px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[55vh]">
            <TabsContent value="overview" className="mt-0">
              <ProfileOverview />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <ProfileSettings />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
