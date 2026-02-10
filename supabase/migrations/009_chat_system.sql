-- Migration 009: Chat System (Conversations & Messages)
-- Created: 2026-01-28
-- Description: Implements the messaging system with conversations, messages, and participants

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONVERSATION PARTICIPANTS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);

-- 5. ENABLE RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- CONVERSATIONS: Users can only see conversations they are part of
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (
    id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- CONVERSATIONS: Users can create conversations
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (true);

-- CONVERSATIONS: Users can update conversations they are part of
CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (
    id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- CONVERSATION_PARTICIPANTS: Users can view participants of their conversations
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- CONVERSATION_PARTICIPANTS: Users can add themselves to conversations
CREATE POLICY "Users can join conversations"
ON public.conversation_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

-- MESSAGES: Users can view messages from their conversations
CREATE POLICY "Users can view messages from their conversations"
ON public.messages FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- MESSAGES: Users can send messages to their conversations
CREATE POLICY "Users can send messages to their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- MESSAGES: Users can update their own messages (for read status)
CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
    conversation_id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- 7. FUNCTION: Update conversation timestamp on new message
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER: Auto-update conversation timestamp
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_timestamp();

-- 9. ADMIN POLICIES (View all conversations for moderation)
CREATE POLICY "Admins can view all conversations"
ON public.conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    )
);

CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    )
);

-- 10. COMMENTS
COMMENT ON TABLE public.conversations IS 'Stores conversation metadata';
COMMENT ON TABLE public.conversation_participants IS 'Many-to-many relationship between conversations and users';
COMMENT ON TABLE public.messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN public.messages.content IS 'Message content, max 2000 characters';
COMMENT ON COLUMN public.messages.is_read IS 'Whether the message has been read by the recipient';
