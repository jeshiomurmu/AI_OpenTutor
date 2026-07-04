"use client";

import { Search, Command, Bell, Settings } from 'lucide-react';
import { useAuthStore, useConversationStore, useUIStore } from '@/lib/stores';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const { user } = useAuthStore();
  const { openCommandPalette, openSettings } = useUIStore();
  const { activeConversationId, conversations } = useConversationStore();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Title / Search */}
        <div className="flex items-center gap-4">
          {activeConversation ? (
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">
                {activeConversation.title}
              </h1>
              {activeConversation.is_pinned && (
                <Badge variant="secondary" className="text-xs">Pinned</Badge>
              )}
            </div>
          ) : (
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-xs text-muted-foreground">
                <Command className="h-3 w-3" />
                K
              </kbd>
            </button>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={openCommandPalette}
            className="h-8 w-8"
          >
            <Search className="h-4 w-4" />
          </Button>

          <ThemeToggle className="hidden sm:flex" />

          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openSettings}>
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Avatar */}
          <Avatar className="h-8 w-8 cursor-pointer" onClick={openSettings}>
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
