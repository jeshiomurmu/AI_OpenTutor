"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MessageSquare,
  Settings,
  User,
  Search,
  BookOpen,
  Brain,
  GraduationCap,
  Upload,
  Folder,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useUIStore, useConversationStore, useSettingsStore } from '@/lib/stores';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette, openSettings, openProfile, openUploadModal } = useUIStore();
  const { conversations, setActiveConversation } = useConversationStore();
  const { setTheme } = useSettingsStore();
  const router = useRouter();

  const commands: CommandItem[] = [
    {
      id: 'new-chat',
      title: 'New Chat',
      description: 'Start a new conversation',
      icon: MessageSquare,
      shortcut: 'N',
      action: () => {
        closeCommandPalette();
        // Create new chat
      },
    },
    {
      id: 'upload',
      title: 'Upload Document',
      description: 'Upload a PDF, DOCX, or other file',
      icon: Upload,
      shortcut: 'U',
      action: () => {
        closeCommandPalette();
        openUploadModal();
      },
    },
    {
      id: 'flashcards',
      title: 'Review Flashcards',
      description: 'Study your flashcard deck',
      icon: BookOpen,
      shortcut: 'F',
      action: () => {
        closeCommandPalette();
        router.push('/flashcards');
      },
    },
    {
      id: 'quiz',
      title: 'Take Quiz',
      description: 'Test your knowledge',
      icon: GraduationCap,
      shortcut: 'Q',
      action: () => {
        closeCommandPalette();
        router.push('/quiz');
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure your preferences',
      icon: Settings,
      shortcut: ',',
      action: () => {
        closeCommandPalette();
        openSettings();
      },
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'View your profile',
      icon: User,
      action: () => {
        closeCommandPalette();
        openProfile();
      },
    },
  ];

  const themeCommands: CommandItem[] = [
    {
      id: 'theme-light',
      title: 'Light Theme',
      icon: Sun,
      action: () => {
        setTheme('light');
        closeCommandPalette();
      },
    },
    {
      id: 'theme-dark',
      title: 'Dark Theme',
      icon: Moon,
      action: () => {
        setTheme('dark');
        closeCommandPalette();
      },
    },
    {
      id: 'theme-system',
      title: 'System Theme',
      icon: Monitor,
      action: () => {
        setTheme('system');
        closeCommandPalette();
      },
    },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          useUIStore.getState().openCommandPalette();
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCommandPaletteOpen, closeCommandPalette]);

  const runCommand = useCallback((command: CommandItem) => {
    command.action();
  }, []);

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={(open) => {
      if (!open) closeCommandPalette();
    }}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          {commands.map((command) => (
            <CommandItem
              key={command.id}
              value={command.title}
              onSelect={() => runCommand(command)}
            >
              <command.icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{command.title}</span>
                {command.description && (
                  <span className="text-xs text-muted-foreground">{command.description}</span>
                )}
              </div>
              {command.shortcut && (
                <CommandShortcut>{command.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          {themeCommands.map((command) => (
            <CommandItem
              key={command.id}
              value={command.title}
              onSelect={() => runCommand(command)}
            >
              <command.icon className="mr-2 h-4 w-4" />
              <span>{command.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {conversations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Conversations">
              {conversations.slice(0, 5).map((conv) => (
                <CommandItem
                  key={conv.id}
                  value={conv.title}
                  onSelect={() => {
                    setActiveConversation(conv.id);
                    closeCommandPalette();
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{conv.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
