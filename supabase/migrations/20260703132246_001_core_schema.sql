/*
# AI Tutor Platform - Core Schema

This migration establishes the foundational database schema for an enterprise-grade AI Tutor SaaS platform.

## Tables Created

### 1. profiles
- Stores user profile information synced from Clerk auth
- `id` (uuid) - Primary key, references auth.users
- `clerk_id` (text) - Clerk authentication ID, unique identifier
- `email` (text) - User email address, unique
- `username` (text) - Unique username
- `full_name` (text) - User's display name
- `avatar_url` (text) - Profile picture URL
- `subscription_tier` (text) - Free/pro/enterprise subscription level
- `role` (text) - User role: student/teacher/admin
- `bio` (text) - User biography
- `school` (text) - Educational institution
- `country` (text) - User's country
- `language` (text) - Preferred language
- `theme` (text) - UI theme preference
- `preferences` (jsonb) - User preferences object
- `created_at`, `updated_at` (timestamptz) - Timestamps

### 2. documents
- Stores uploaded document metadata
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner, references auth.users
- `title` (text) - Document title
- `filename` (text) - Original filename
- `mime_type` (text) - File MIME type
- `size` (bigint) - File size in bytes
- `storage_url` (text) - R2 storage URL
- `status` (text) - Processing status: pending/processing/completed/failed
- `page_count` (int) - Number of pages
- `word_count` (int) - Total word count
- `metadata` (jsonb) - Additional metadata
- `created_at`, `updated_at` (timestamptz) - Timestamps

### 3. document_chunks
- Stores text chunks for RAG processing
- `id` (uuid) - Primary key
- `document_id` (uuid) - References documents
- `user_id` (uuid) - Owner for RLS efficiency
- `chunk_index` (int) - Position in document
- `chunk_text` (text) - The actual text content
- `embedding` (vector(1536)) - OpenAI embedding vector
- `page_number` (int) - Source page number
- `metadata` (jsonb) - Chunk metadata
- `created_at` (timestamptz) - Timestamp

### 4. conversations
- Chat conversation threads
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner
- `document_id` (uuid) - Optional linked document
- `title` (text) - Conversation title
- `summary` (text) - AI-generated summary
- `is_pinned` (boolean) - Pinned status
- `is_archived` (boolean) - Archive status
- `folder_id` (uuid) - Optional folder reference
- `provider` (text) - AI provider used
- `model` (text) - Model used
- `created_at`, `updated_at` (timestamptz) - Timestamps

### 5. messages
- Individual chat messages
- `id` (uuid) - Primary key
- `conversation_id` (uuid) - References conversations
- `user_id` (uuid) - Owner for RLS
- `role` (text) - user/assistant/system
- `content` (text) - Message content
- `citations` (jsonb) - Source citations
- `provider` (text) - AI provider
- `model` (text) - Model used
- `tokens_used` (int) - Token count
- `metadata` (jsonb) - Additional metadata
- `created_at` (timestamptz) - Timestamp

### 6. folders
- Organization folders for conversations
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner
- `name` (text) - Folder name
- `parent_id` (uuid) - Parent folder for nesting
- `color` (text) - Folder color
- `icon` (text) - Icon identifier
- `sort_order` (int) - Display order
- `created_at`, `updated_at` (timestamptz) - Timestamps

### 7. flashcards
- Generated flashcards for studying
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner
- `document_id` (uuid) - Source document
- `conversation_id` (uuid) - Source conversation
- `question` (text) - Flashcard front
- `answer` (text) - Flashcard back
- `difficulty` (text) - easy/medium/hard
- `tags` (text[]) - Category tags
- `mastery_level` (int) - 0-5 mastery score
- `last_reviewed_at` (timestamptz) - Last review time
- `next_review_at` (timestamptz) - Spaced repetition
- `review_count` (int) - Times reviewed
- `created_at`, `updated_at` (timestamptz) - Timestamps

### 8. quizzes
- Generated quiz questions
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner
- `document_id` (uuid) - Source document
- `conversation_id` (uuid) - Source conversation
- `question` (text) - Question text
- `choices` (jsonb) - Answer choices
- `correct_answer` (text) - Correct answer
- `explanation` (text) - Answer explanation
- `difficulty` (text) - easy/medium/hard
- `tags` (text[]) - Category tags
- `created_at`, `updated_at` (timestamptz) - Timestamps

### 9. quiz_attempts
- User quiz attempt records
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner
- `quiz_id` (uuid) - References quizzes
- `answer` (text) - User's answer
- `is_correct` (boolean) - Correctness
- `time_taken_ms` (int) - Time to answer
- `created_at` (timestamptz) - Timestamp

### 10. api_keys
- Encrypted user API keys for BYOK
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner
- `provider` (text) - Provider name
- `encrypted_key` (text) - AES-256 encrypted key
- `key_hint` (text) - Last 4 chars for display
- `is_active` (boolean) - Active status
- `last_used_at` (timestamptz) - Last usage
- `created_at`, `updated_at` (timestamptz) - Timestamps

### 11. study_sessions
- Learning session tracking
- `id` (uuid) - Primary key
- `user_id` (uuid) - Owner
- `document_id` (uuid) - Optional document
- `session_type` (text) - read/quiz/flashcard/chat
- `duration_seconds` (int) - Session length
- `items_reviewed` (int) - Items covered
- `score` (decimal) - Performance score
- `metadata` (jsonb) - Additional data
- `started_at`, `ended_at` (timestamptz) - Time range
- `created_at` (timestamptz) - Timestamp

### 12. analytics_events
- Platform analytics tracking
- `id` (uuid) - Primary key
- `user_id` (uuid) - Optional user
- `event_type` (text) - Event name
- `event_data` (jsonb) - Event payload
- `session_id` (text) - Session identifier
- `ip_address` (text) - Client IP
- `user_agent` (text) - Browser info
- `created_at` (timestamptz) - Timestamp

## Security
- RLS enabled on all tables
- Owner-scoped policies for authenticated users
- Proper CASCADE rules on foreign keys

## Indexes
- Vector similarity search using ivfflat
- Full-text search on document content
- Performance indexes on foreign keys and common queries
*/

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    bio text,
    school text,
    country text,
    language text DEFAULT 'en',
    theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system', 'amoled')),
    preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    filename text NOT NULL,
    mime_type text NOT NULL,
    size bigint NOT NULL,
    storage_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'deleted')),
    page_count int,
    word_count int,
    metadata jsonb DEFAULT '{}'::jsonb,
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Document chunks for RAG
CREATE TABLE IF NOT EXISTS document_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    chunk_index int NOT NULL,
    chunk_text text NOT NULL,
    embedding vector(1536),
    page_number int,
    start_char int,
    end_char int,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Folders for organization
CREATE TABLE IF NOT EXISTS folders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
    color text DEFAULT '#3b82f6',
    icon text DEFAULT 'folder',
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
    title text NOT NULL,
    summary text,
    is_pinned boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    provider text,
    model text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    citations jsonb DEFAULT '[]'::jsonb,
    provider text,
    model text,
    tokens_used int DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    parent_message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
    question text NOT NULL,
    answer text NOT NULL,
    difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags text[] DEFAULT '{}',
    mastery_level int DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
    last_reviewed_at timestamptz,
    next_review_at timestamptz,
    review_count int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
    question text NOT NULL,
    question_type text DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'fill_blank')),
    choices jsonb DEFAULT '[]'::jsonb,
    correct_answer text NOT NULL,
    explanation text,
    difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    answer text NOT NULL,
    is_correct boolean NOT NULL,
    time_taken_ms int,
    created_at timestamptz DEFAULT now()
);

-- API Keys (BYOK)
CREATE TABLE IF NOT EXISTS api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'groq', 'deepseek', 'openrouter', 'together', 'ollama', 'custom')),
    encrypted_key text NOT NULL,
    key_hint text,
    is_active boolean DEFAULT true,
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- Study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    session_type text NOT NULL CHECK (session_type IN ('reading', 'quiz', 'flashcard', 'chat', 'summary')),
    duration_seconds int DEFAULT 0,
    items_reviewed int DEFAULT 0,
    score decimal(5,2),
    metadata jsonb DEFAULT '{}'::jsonb,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    session_id text,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Documents policies
DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Document chunks policies
DROP POLICY IF EXISTS "select_own_chunks" ON document_chunks;
CREATE POLICY "select_own_chunks" ON document_chunks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chunks" ON document_chunks;
CREATE POLICY "insert_own_chunks" ON document_chunks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chunks" ON document_chunks;
CREATE POLICY "delete_own_chunks" ON document_chunks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Folders policies
DROP POLICY IF EXISTS "select_own_folders" ON folders;
CREATE POLICY "select_own_folders" ON folders FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_folders" ON folders;
CREATE POLICY "insert_own_folders" ON folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_folders" ON folders;
CREATE POLICY "update_own_folders" ON folders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_folders" ON folders;
CREATE POLICY "delete_own_folders" ON folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conversations policies
DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations" ON conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations" ON conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations" ON conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Flashcards policies
DROP POLICY IF EXISTS "select_own_flashcards" ON flashcards;
CREATE POLICY "select_own_flashcards" ON flashcards FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_flashcards" ON flashcards;
CREATE POLICY "insert_own_flashcards" ON flashcards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_flashcards" ON flashcards;
CREATE POLICY "update_own_flashcards" ON flashcards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_flashcards" ON flashcards;
CREATE POLICY "delete_own_flashcards" ON flashcards FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Quizzes policies
DROP POLICY IF EXISTS "select_own_quizzes" ON quizzes;
CREATE POLICY "select_own_quizzes" ON quizzes FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quizzes" ON quizzes;
CREATE POLICY "insert_own_quizzes" ON quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quizzes" ON quizzes;
CREATE POLICY "update_own_quizzes" ON quizzes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quizzes" ON quizzes;
CREATE POLICY "delete_own_quizzes" ON quizzes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Quiz attempts policies
DROP POLICY IF EXISTS "select_own_quiz_attempts" ON quiz_attempts;
CREATE POLICY "select_own_quiz_attempts" ON quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quiz_attempts" ON quiz_attempts;
CREATE POLICY "insert_own_quiz_attempts" ON quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quiz_attempts" ON quiz_attempts;
CREATE POLICY "delete_own_quiz_attempts" ON quiz_attempts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- API keys policies
DROP POLICY IF EXISTS "select_own_api_keys" ON api_keys;
CREATE POLICY "select_own_api_keys" ON api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_api_keys" ON api_keys;
CREATE POLICY "insert_own_api_keys" ON api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_api_keys" ON api_keys;
CREATE POLICY "update_own_api_keys" ON api_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_api_keys" ON api_keys;
CREATE POLICY "delete_own_api_keys" ON api_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Study sessions policies
DROP POLICY IF EXISTS "select_own_study_sessions" ON study_sessions;
CREATE POLICY "select_own_study_sessions" ON study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_sessions" ON study_sessions;
CREATE POLICY "insert_own_study_sessions" ON study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_sessions" ON study_sessions;
CREATE POLICY "update_own_study_sessions" ON study_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_sessions" ON study_sessions;
CREATE POLICY "delete_own_study_sessions" ON study_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Analytics events policies
DROP POLICY IF EXISTS "select_own_analytics" ON analytics_events;
CREATE POLICY "select_own_analytics" ON analytics_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analytics" ON analytics_events;
CREATE POLICY "insert_own_analytics" ON analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for performance

-- Vector similarity search index (IVFFlat for large datasets)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS document_chunks_text_idx ON document_chunks USING gin (to_tsvector('english', chunk_text));
CREATE INDEX IF NOT EXISTS document_chunks_text_trgm_idx ON document_chunks USING gin (chunk_text gin_trgm_ops);

-- Document indexes
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents (user_id);
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents (status);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents (created_at DESC);

-- Document chunks indexes
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS document_chunks_user_id_idx ON document_chunks (user_id);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations (user_id);
CREATE INDEX IF NOT EXISTS conversations_folder_id_idx ON conversations (folder_id);
CREATE INDEX IF NOT EXISTS conversations_document_id_idx ON conversations (document_id);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations (created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations (updated_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages (user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at);

-- Flashcards indexes
CREATE INDEX IF NOT EXISTS flashcards_user_id_idx ON flashcards (user_id);
CREATE INDEX IF NOT EXISTS flashcards_document_id_idx ON flashcards (document_id);
CREATE INDEX IF NOT EXISTS flashcards_next_review_idx ON flashcards (next_review_at) WHERE next_review_at IS NOT NULL;

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS quizzes_user_id_idx ON quizzes (user_id);
CREATE INDEX IF NOT EXISTS quizzes_document_id_idx ON quizzes (document_id);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON quiz_attempts (quiz_id);

-- Study sessions indexes
CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON study_sessions (user_id);
CREATE INDEX IF NOT EXISTS study_sessions_started_at_idx ON study_sessions (started_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at DESC);

-- Folders indexes
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders (user_id);
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders (parent_id);

-- API keys indexes
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys (user_id);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_clerk_id_idx ON profiles (clerk_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_document_id uuid DEFAULT NULL,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_text text,
    page_number int,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_text,
        dc.page_number,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE
        (filter_document_id IS NULL OR dc.document_id = filter_document_id)
        AND (filter_user_id IS NULL OR dc.user_id = filter_user_id)
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function for hybrid search (vector + full-text)
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
    query_text text,
    query_embedding vector(1536),
    match_count int DEFAULT 10,
    filter_document_id uuid DEFAULT NULL,
    filter_user_id uuid DEFAULT NULL,
    semantic_weight float DEFAULT 0.7
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_text text,
    page_number int,
    semantic_score float,
    text_score float,
    combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH semantic_results AS (
        SELECT
            dc.id,
            dc.document_id,
            dc.chunk_text,
            dc.page_number,
            1 - (dc.embedding <=> query_embedding) AS semantic_score
        FROM document_chunks dc
        WHERE
            (filter_document_id IS NULL OR dc.document_id = filter_document_id)
            AND (filter_user_id IS NULL OR dc.user_id = filter_user_id)
        ORDER BY dc.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    text_results AS (
        SELECT
            dc.id,
            dc.document_id,
            dc.chunk_text,
            dc.page_number,
            ts_rank_cd(to_tsvector('english', dc.chunk_text), plainto_tsquery('english', query_text)) AS text_score
        FROM document_chunks dc
        WHERE
            (filter_document_id IS NULL OR dc.document_id = filter_document_id)
            AND (filter_user_id IS NULL OR dc.user_id = filter_user_id)
            AND to_tsvector('english', dc.chunk_text) @@ plainto_tsquery('english', query_text)
        ORDER BY ts_rank_cd(to_tsvector('english', dc.chunk_text), plainto_tsquery('english', query_text)) DESC
        LIMIT match_count * 2
    ),
    combined AS (
        SELECT id, document_id, chunk_text, page_number, semantic_score, 0.0::float AS text_score
        FROM semantic_results
        UNION
        SELECT id, document_id, chunk_text, page_number, 0.0::float AS semantic_score, text_score
        FROM text_results
    )
    SELECT
        c.id,
        c.document_id,
        c.chunk_text,
        c.page_number,
        c.semantic_score,
        c.text_score,
        (c.semantic_score * semantic_weight + c.text_score * (1 - semantic_weight)) AS combined_score
    FROM combined c
    ORDER BY (c.semantic_score * semantic_weight + c.text_score * (1 - semantic_weight)) DESC
    LIMIT match_count;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['profiles', 'documents', 'folders', 'conversations', 'flashcards', 'quizzes', 'api_keys', 'study_sessions'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;