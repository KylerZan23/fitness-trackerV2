-- supabase/migrations/20251028000000_create_ai_conversations_table.sql

-- Create the table to store AI conversation histories
CREATE TABLE public.ai_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    title text,
    messages jsonb NOT NULL,
    CONSTRAINT ai_conversations_pkey PRIMARY KEY (id),
    CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX ix_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);

-- Create RLS policies
-- Users can select their own conversations
CREATE POLICY "Allow select for own conversations"
ON public.ai_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Allow insert for own conversations"
ON public.ai_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Allow update for own conversations"
ON public.ai_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Allow delete for own conversations"
ON public.ai_conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comments for clarity
COMMENT ON TABLE public.ai_conversations IS 'Stores the history of conversations between users and the AI coach.';
COMMENT ON COLUMN public.ai_conversations.messages IS 'JSONB array of Vercel AI SDK message objects.';
COMMENT ON COLUMN public.ai_conversations.title IS 'A short, AI-generated title for the conversation.';
