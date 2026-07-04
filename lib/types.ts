export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro' | 'enterprise';
          role: 'student' | 'teacher' | 'admin';
          bio: string | null;
          school: string | null;
          country: string | null;
          language: string;
          theme: 'light' | 'dark' | 'system' | 'amoled';
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          role?: 'student' | 'teacher' | 'admin';
          bio?: string | null;
          school?: string | null;
          country?: string | null;
          language?: string;
          theme?: 'light' | 'dark' | 'system' | 'amoled';
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          role?: 'student' | 'teacher' | 'admin';
          bio?: string | null;
          school?: string | null;
          country?: string | null;
          language?: string;
          theme?: 'light' | 'dark' | 'system' | 'amoled';
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          filename: string;
          mime_type: string;
          size: number;
          storage_url: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
          page_count: number | null;
          word_count: number | null;
          metadata: Json;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          filename: string;
          mime_type: string;
          size: number;
          storage_url?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
          page_count?: number | null;
          word_count?: number | null;
          metadata?: Json;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          filename?: string;
          mime_type?: string;
          size?: number;
          storage_url?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
          page_count?: number | null;
          word_count?: number | null;
          metadata?: Json;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          chunk_index: number;
          chunk_text: string;
          embedding: number[] | null;
          page_number: number | null;
          start_char: number | null;
          end_char: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id?: string;
          chunk_index: number;
          chunk_text: string;
          embedding?: number[] | null;
          page_number?: number | null;
          start_char?: number | null;
          end_char?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          chunk_index?: number;
          chunk_text?: string;
          embedding?: number[] | null;
          page_number?: number | null;
          start_char?: number | null;
          end_char?: number | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          color: string;
          icon: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          parent_id?: string | null;
          color?: string;
          icon?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          color?: string;
          icon?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          folder_id: string | null;
          title: string;
          summary: string | null;
          is_pinned: boolean;
          is_archived: boolean;
          provider: string | null;
          model: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          folder_id?: string | null;
          title: string;
          summary?: string | null;
          is_pinned?: boolean;
          is_archived?: boolean;
          provider?: string | null;
          model?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          folder_id?: string | null;
          title?: string;
          summary?: string | null;
          is_pinned?: boolean;
          is_archived?: boolean;
          provider?: string | null;
          model?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          citations: Json;
          provider: string | null;
          model: string | null;
          tokens_used: number;
          metadata: Json;
          parent_message_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id?: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          citations?: Json;
          provider?: string | null;
          model?: string | null;
          tokens_used?: number;
          metadata?: Json;
          parent_message_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          citations?: Json;
          provider?: string | null;
          model?: string | null;
          tokens_used?: number;
          metadata?: Json;
          parent_message_id?: string | null;
          created_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          conversation_id: string | null;
          question: string;
          answer: string;
          difficulty: 'easy' | 'medium' | 'hard';
          tags: string[];
          mastery_level: number;
          last_reviewed_at: string | null;
          next_review_at: string | null;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          conversation_id?: string | null;
          question: string;
          answer: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          tags?: string[];
          mastery_level?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          conversation_id?: string | null;
          question?: string;
          answer?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          tags?: string[];
          mastery_level?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string | null;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          conversation_id: string | null;
          question: string;
          question_type: 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
          choices: Json;
          correct_answer: string;
          explanation: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          conversation_id?: string | null;
          question: string;
          question_type?: 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
          choices?: Json;
          correct_answer: string;
          explanation?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          conversation_id?: string | null;
          question?: string;
          question_type?: 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
          choices?: Json;
          correct_answer?: string;
          explanation?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          answer: string;
          is_correct: boolean;
          time_taken_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          quiz_id: string;
          answer: string;
          is_correct: boolean;
          time_taken_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          answer?: string;
          is_correct?: boolean;
          time_taken_ms?: number | null;
          created_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: 'openai' | 'anthropic' | 'google' | 'groq' | 'deepseek' | 'openrouter' | 'together' | 'ollama' | 'custom';
          encrypted_key: string;
          key_hint: string | null;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          provider: 'openai' | 'anthropic' | 'google' | 'groq' | 'deepseek' | 'openrouter' | 'together' | 'ollama' | 'custom';
          encrypted_key: string;
          key_hint?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: 'openai' | 'anthropic' | 'google' | 'groq' | 'deepseek' | 'openrouter' | 'together' | 'ollama' | 'custom';
          encrypted_key?: string;
          key_hint?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          session_type: 'reading' | 'quiz' | 'flashcard' | 'chat' | 'summary';
          duration_seconds: number;
          items_reviewed: number;
          score: number | null;
          metadata: Json;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          session_type: 'reading' | 'quiz' | 'flashcard' | 'chat' | 'summary';
          duration_seconds?: number;
          items_reviewed?: number;
          score?: number | null;
          metadata?: Json;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          session_type?: 'reading' | 'quiz' | 'flashcard' | 'chat' | 'summary';
          duration_seconds?: number;
          items_reviewed?: number;
          score?: number | null;
          metadata?: Json;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          event_data: Json;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          event_data?: Json;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          event_data?: Json;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_document_id?: string;
          filter_user_id?: string;
        };
        Returns: {
          id: string;
          document_id: string;
          chunk_text: string;
          page_number: number | null;
          similarity: number;
        }[];
      };
      hybrid_search_chunks: {
        Args: {
          query_text: string;
          query_embedding: number[];
          match_count?: number;
          filter_document_id?: string;
          filter_user_id?: string;
          semantic_weight?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          chunk_text: string;
          page_number: number | null;
          semantic_score: number;
          text_score: number;
          combined_score: number;
        }[];
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentChunk = Database['public']['Tables']['document_chunks']['Row'];
export type Folder = Database['public']['Tables']['folders']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Flashcard = Database['public']['Tables']['flashcards']['Row'];
export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
export type ApiKey = Database['public']['Tables']['api_keys']['Row'];
export type StudySession = Database['public']['Tables']['study_sessions']['Row'];
export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type UserRole = 'student' | 'teacher' | 'admin';
export type Theme = 'light' | 'dark' | 'system' | 'amoled';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MessageRole = 'user' | 'assistant' | 'system';
export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
export type SessionType = 'reading' | 'quiz' | 'flashcard' | 'chat' | 'summary';
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'deepseek' | 'openrouter' | 'together' | 'ollama' | 'custom';

export interface Citation {
  document_id: string;
  document_title: string;
  chunk_id: string;
  page_number: number | null;
  text: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  createdAt: Date;
  isStreaming?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UserPreferences {
  defaultProvider: AIProvider;
  defaultModel: string;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  sendOnEnter: boolean;
  showCitations: boolean;
  autoGenerateFlashcards: boolean;
  autoGenerateQuizzes: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable GPT-4 model, optimized for speed',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Affordable and intelligent small model',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most intelligent Claude model',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fastest and most compact Claude model',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Fast and efficient multimodal model',
    maxTokens: 1000000,
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Best for complex reasoning tasks',
    maxTokens: 2000000,
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    description: 'Fast inference with Llama 3.3',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    description: 'Advanced reasoning model',
    maxTokens: 64000,
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
  },
];

export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'tex'],
  presentations: ['ppt', 'pptx'],
  spreadsheets: ['xls', 'xlsx', 'csv', 'tsv'],
  images: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
  books: ['epub'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, {
  documentsPerMonth: number;
  storageBytes: number;
  messagesPerDay: number;
  flashcardsPerMonth: number;
  quizzesPerMonth: number;
}> = {
  free: {
    documentsPerMonth: 10,
    storageBytes: 100 * 1024 * 1024, // 100MB
    messagesPerDay: 50,
    flashcardsPerMonth: 50,
    quizzesPerMonth: 20,
  },
  pro: {
    documentsPerMonth: 100,
    storageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    messagesPerDay: 500,
    flashcardsPerMonth: 500,
    quizzesPerMonth: 100,
  },
  enterprise: {
    documentsPerMonth: -1, // unlimited
    storageBytes: -1,
    messagesPerDay: -1,
    flashcardsPerMonth: -1,
    quizzesPerMonth: -1,
  },
};
