import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Conversation, Message, Document, Profile, AIProvider, Theme, UserPreferences } from './types';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

interface SidebarState {
  isCollapsed: boolean;
  activeFolderId: string | null;
  searchQuery: string;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setActiveFolder: (folderId: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      activeFolderId: null,
      searchQuery: '',
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      setActiveFolder: (folderId) => set({ activeFolderId: folderId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'sidebar-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoading: false,
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations],
    activeConversationId: conversation.id,
  })),
  updateConversation: (id, updates) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  })),
  deleteConversation: (id) => set((state) => ({
    conversations: state.conversations.filter((c) => c.id !== id),
    activeConversationId: state.activeConversationId === id
      ? (state.conversations.find((c) => c.id !== id)?.id || null)
      : state.activeConversationId,
    messages: (() => {
      const newMessages = { ...state.messages };
      delete newMessages[id];
      return newMessages;
    })(),
  })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (conversationId, messages) => set((state) => ({
    messages: { ...state.messages, [conversationId]: messages },
  })),
  addMessage: (conversationId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: [...(state.messages[conversationId] || []), message],
    },
  })),
  updateMessage: (conversationId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: (state.messages[conversationId] || []).map((m) =>
        m.id === messageId ? { ...m, ...updates } : m
      ),
    },
  })),
  deleteMessage: (conversationId, messageId) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: (state.messages[conversationId] || []).filter(
        (m) => m.id !== messageId
      ),
    },
  })),
  setLoading: (loading) => set({ isLoading: loading }),
}));

interface DocumentState {
  documents: Document[];
  activeDocumentId: string | null;
  isLoading: boolean;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setActiveDocument: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  activeDocumentId: null,
  isLoading: false,
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => set((state) => ({
    documents: [document, ...state.documents],
  })),
  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    ),
  })),
  deleteDocument: (id) => set((state) => ({
    documents: state.documents.filter((d) => d.id !== id),
    activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
  })),
  setActiveDocument: (id) => set({ activeDocumentId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

interface SettingsState {
  theme: Theme;
  preferences: UserPreferences;
  setTheme: (theme: Theme) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  resetSettings: () => void;
}

const defaultPreferences: UserPreferences = {
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
  language: 'en',
  fontSize: 'medium',
  sendOnEnter: true,
  showCitations: true,
  autoGenerateFlashcards: false,
  autoGenerateQuizzes: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      preferences: defaultPreferences,
      setTheme: (theme) => set({ theme }),
      setPreferences: (preferences) => set((state) => ({
        preferences: { ...state.preferences, ...preferences },
      })),
      resetSettings: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

interface UIState {
  isCommandPaletteOpen: boolean;
  isNewChatModalOpen: boolean;
  isSettingsOpen: boolean;
  isUploadModalOpen: boolean;
  isProfileOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openNewChatModal: () => void;
  closeNewChatModal: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  onClose: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  isNewChatModalOpen: false,
  isSettingsOpen: false,
  isUploadModalOpen: false,
  isProfileOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({
    isCommandPaletteOpen: !state.isCommandPaletteOpen
  })),
  openNewChatModal: () => set({ isNewChatModalOpen: true }),
  closeNewChatModal: () => set({ isNewChatModalOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openUploadModal: () => set({ isUploadModalOpen: true }),
  closeUploadModal: () => set({ isUploadModalOpen: false }),
  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false }),
  onClose: () => set({
    isCommandPaletteOpen: false,
    isNewChatModalOpen: false,
    isSettingsOpen: false,
    isUploadModalOpen: false,
    isProfileOpen: false,
  }),
}));

interface UploadState {
  files: Array<{
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
  }>;
  addFile: (file: File) => string;
  updateFileProgress: (id: string, progress: number) => void;
  updateFileStatus: (id: string, status: UploadState['files'][0]['status'], error?: string) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  addFile: (file) => {
    const id = crypto.randomUUID();
    set((state) => ({
      files: [...state.files, { id, file, progress: 0, status: 'pending' }],
    }));
    return id;
  },
  updateFileProgress: (id, progress) => set((state) => ({
    files: state.files.map((f) =>
      f.id === id
        ? { ...f, progress, status: progress > 0 && progress < 100 ? 'uploading' : f.status }
        : f
    ),
  })),
  updateFileStatus: (id, status, error) => set((state) => ({
    files: state.files.map((f) =>
      f.id === id ? { ...f, status, ...(error && { error }) } : f
    ),
  })),
  removeFile: (id) => set((state) => ({
    files: state.files.filter((f) => f.id !== id),
  })),
  clearFiles: () => set({ files: [] }),
}));
