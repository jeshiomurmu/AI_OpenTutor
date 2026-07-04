"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Search,
  Folder,
  MoreHorizontal,
  Trash2,
  Pin,
  Archive,
  ChevronDown,
  ChevronRight,
  Settings,
  Upload,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore, useConversationStore, useUIStore } from '@/lib/stores';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Conversation, Folder as FolderType } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

function ConversationItem({ conversation }: { conversation: Conversation }) {
  const { activeConversationId, setActiveConversation, updateConversation } = useConversationStore();
  const isActive = activeConversationId === conversation.id;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id);

      if (error) throw error;
      useConversationStore.getState().deleteConversation(conversation.id);
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleTogglePin = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: !conversation.is_pinned })
        .eq('id', conversation.id);

      if (error) throw error;
      updateConversation(conversation.id, { is_pinned: !conversation.is_pinned });
    } catch {
      toast.error('Failed to update conversation');
    }
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: !conversation.is_archived })
        .eq('id', conversation.id);

      if (error) throw error;
      updateConversation(conversation.id, { is_archived: !conversation.is_archived });
    } catch {
      toast.error('Failed to archive conversation');
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      )}
      onClick={() => setActiveConversation(conversation.id)}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-sm">{conversation.title}</span>
      {conversation.is_pinned && (
        <Pin className="h-3 w-3 text-primary shrink-0" />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleTogglePin}>
            <Pin className="mr-2 h-4 w-4" />
            {conversation.is_pinned ? 'Unpin' : 'Pin'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            {conversation.is_archived ? 'Unarchive' : 'Archive'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FolderItem({ folder, conversations }: { folder: FolderType; conversations: Conversation[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const { activeFolderId, setActiveFolder } = useSidebarStore();

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveFolder(folder.id);
        }}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <Folder className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
        <span className="flex-1 truncate">{folder.name}</span>
        <span className="text-xs text-muted-foreground">
          {conversations.length}
        </span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pl-4 overflow-hidden"
          >
            {conversations.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, searchQuery, toggleCollapse, setSearchQuery } = useSidebarStore();
  const { conversations, setConversations, setActiveConversation, activeConversationId, isLoading, setLoading } = useConversationStore();
  const { openUploadModal, openSettings } = useUIStore();
  const [folders, setFolders] = useState<FolderType[]>([]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) {
        setConversations(data);
        if (data.length > 0 && !activeConversationId) {
          setActiveConversation(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [setConversations, setLoading, setActiveConversation, activeConversationId]);

  const fetchFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchFolders();
  }, [fetchConversations, fetchFolders]);

  const handleNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title: 'New Chat' })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        useConversationStore.getState().addConversation(data);
        toast.success('New chat created');
      }
    } catch {
      toast.error('Failed to create chat');
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !conv.is_archived
  );

  const pinnedConversations = filteredConversations.filter((c) => c.is_pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.is_pinned);
  const archivedConversations = conversations.filter((c) => c.is_archived);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 0 : 'var(--sidebar-width)' }}
      className="relative flex flex-col border-r border-border bg-card overflow-hidden"
    >
      <div className={cn("flex-shrink-0 flex flex-col", isCollapsed && "hidden")}>
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">AI Tutor</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <Button onClick={handleNewChat} size="sm" className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
          <Button onClick={openUploadModal} variant="outline" size="icon" className="h-9 w-9">
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1 px-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {pinnedConversations.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pinned
                  </div>
                  {pinnedConversations.map((conv) => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              )}

              {folders.map((folder) => {
                const folderConvs = unpinnedConversations.filter(
                  (c) => c.folder_id === folder.id
                );
                if (folderConvs.length === 0) return null;
                return (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    conversations={folderConvs}
                  />
                );
              })}

              {(() => {
                const uncategorized = unpinnedConversations.filter(
                  (c) => !c.folder_id || !folders.find((f) => f.id === c.folder_id)
                );
                if (uncategorized.length === 0) return null;
                return (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Recent
                    </div>
                    {uncategorized.slice(0, 10).map((conv) => (
                      <ConversationItem key={conv.id} conversation={conv} />
                    ))}
                  </div>
                );
              })()}

              {archivedConversations.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Archived
                  </div>
                  {archivedConversations.slice(0, 5).map((conv) => (
                    <ConversationItem key={conv.id} conversation={conv} />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          <button
            onClick={openSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Collapsed state */}
      {isCollapsed && (
        <div className="absolute top-4 left-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.aside>
  );
}
