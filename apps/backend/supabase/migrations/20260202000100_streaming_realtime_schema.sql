-- Migration: 20260202000100_streaming_realtime_schema.sql
-- Description: Add streaming and realtime tables for enhanced video streaming and chat functionality

-- ============================================
-- STREAM SESSIONS TABLE
-- ============================================
CREATE TABLE public.stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auction_id UUID REFERENCES public.auctions(id) ON DELETE SET NULL,
  channel_id VARCHAR(255) NOT NULL UNIQUE,
  state VARCHAR(50) NOT NULL DEFAULT 'initializing' CHECK (state IN ('initializing', 'active', 'paused', 'ended', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- ============================================
-- STREAM VIEWERS TABLE
-- ============================================
CREATE TABLE public.stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.stream_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(session_id, user_id)
);

-- ============================================
-- ENHANCED CHAT MESSAGES TABLE
-- ============================================
-- First, check if we need to modify existing chat_messages table
-- Since the existing table references streams.id, we'll add session_id as nullable initially
ALTER TABLE public.chat_messages 
ADD COLUMN session_id UUID REFERENCES public.stream_sessions(id) ON DELETE CASCADE,
ADD COLUMN message_type VARCHAR(50) DEFAULT 'user_message' CHECK (message_type IN ('user_message', 'system_message', 'auction_update')),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Update existing chat messages to use new structure (if any exist)
-- This will be handled by the application layer during migration

-- ============================================
-- AGORA TOKENS TABLE
-- ============================================
CREATE TABLE public.agora_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.stream_sessions(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  uid INTEGER NOT NULL,
  privileges JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_stream_sessions_seller_id ON public.stream_sessions(seller_id);
CREATE INDEX idx_stream_sessions_state ON public.stream_sessions(state);
CREATE INDEX idx_stream_sessions_created_at ON public.stream_sessions(created_at);

CREATE INDEX idx_stream_viewers_session_id ON public.stream_viewers(session_id);
CREATE INDEX idx_stream_viewers_user_id ON public.stream_viewers(user_id);
CREATE INDEX idx_stream_viewers_active ON public.stream_viewers(session_id, is_active) WHERE is_active = true;

CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_messages_type ON public.chat_messages(message_type);

CREATE INDEX idx_agora_tokens_user_session ON public.agora_tokens(user_id, session_id);
CREATE INDEX idx_agora_tokens_channel_id ON public.agora_tokens(channel_id);
CREATE INDEX idx_agora_tokens_expires_at ON public.agora_tokens(expires_at);
CREATE INDEX idx_agora_tokens_active ON public.agora_tokens(is_active) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_tokens ENABLE ROW LEVEL SECURITY;

-- Stream Sessions Policies
CREATE POLICY "Anyone can view active stream sessions" 
  ON public.stream_sessions FOR SELECT 
  USING (state IN ('active', 'paused'));

CREATE POLICY "Sellers can manage their own stream sessions" 
  ON public.stream_sessions FOR ALL 
  USING (auth.uid() = seller_id);

-- Stream Viewers Policies
CREATE POLICY "Users can view stream viewers for sessions they have access to" 
  ON public.stream_viewers FOR SELECT 
  USING (
    session_id IN (
      SELECT id FROM public.stream_sessions 
      WHERE state IN ('active', 'paused')
    )
  );

CREATE POLICY "Users can manage their own viewer records" 
  ON public.stream_viewers FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Sellers can view viewers of their streams" 
  ON public.stream_viewers FOR SELECT 
  USING (
    session_id IN (
      SELECT id FROM public.stream_sessions 
      WHERE seller_id = auth.uid()
    )
  );

-- Agora Tokens Policies
CREATE POLICY "Users can view their own tokens" 
  ON public.agora_tokens FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tokens" 
  ON public.agora_tokens FOR ALL 
  USING (auth.uid() = user_id);

-- Enhanced Chat Messages Policies (update existing)
-- Note: Existing policies will be preserved, adding session-based access
CREATE POLICY "Users can view chat messages in sessions they joined" 
  ON public.chat_messages FOR SELECT 
  USING (
    session_id IS NULL OR -- Preserve existing stream-based messages
    session_id IN (
      SELECT session_id FROM public.stream_viewers 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    session_id IN (
      SELECT id FROM public.stream_sessions 
      WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in sessions they joined" 
  ON public.chat_messages FOR INSERT 
  WITH CHECK (
    session_id IS NULL OR -- Preserve existing functionality
    session_id IN (
      SELECT session_id FROM public.stream_viewers 
      WHERE user_id = auth.uid() AND is_active = true
    ) OR
    session_id IN (
      SELECT id FROM public.stream_sessions 
      WHERE seller_id = auth.uid()
    )
  );

-- ============================================
-- REALTIME SUBSCRIPTIONS SETUP
-- ============================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agora_tokens;

-- Chat messages should already be enabled for realtime, but ensure it's configured
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages; -- Usually already enabled

-- ============================================
-- FUNCTIONS FOR STREAM MANAGEMENT
-- ============================================

-- Function to update viewer count when viewers join/leave
CREATE OR REPLACE FUNCTION public.update_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- User joined
    UPDATE public.stream_sessions 
    SET viewer_count = viewer_count + 1 
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- User status changed
    IF OLD.is_active = true AND NEW.is_active = false THEN
      -- User left
      UPDATE public.stream_sessions 
      SET viewer_count = viewer_count - 1 
      WHERE id = NEW.session_id;
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      -- User rejoined
      UPDATE public.stream_sessions 
      SET viewer_count = viewer_count + 1 
      WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- User record deleted
    IF OLD.is_active = true THEN
      UPDATE public.stream_sessions 
      SET viewer_count = viewer_count - 1 
      WHERE id = OLD.session_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for viewer count updates
CREATE TRIGGER trigger_update_viewer_count_insert
  AFTER INSERT ON public.stream_viewers
  FOR EACH ROW EXECUTE FUNCTION public.update_stream_viewer_count();

CREATE TRIGGER trigger_update_viewer_count_update
  AFTER UPDATE ON public.stream_viewers
  FOR EACH ROW EXECUTE FUNCTION public.update_stream_viewer_count();

CREATE TRIGGER trigger_update_viewer_count_delete
  AFTER DELETE ON public.stream_viewers
  FOR EACH ROW EXECUTE FUNCTION public.update_stream_viewer_count();

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.agora_tokens 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.stream_sessions IS 'Manages live streaming sessions with state tracking';
COMMENT ON TABLE public.stream_viewers IS 'Tracks users viewing each stream session';
COMMENT ON TABLE public.agora_tokens IS 'Stores Agora SDK authentication tokens for streaming';

COMMENT ON COLUMN public.stream_sessions.state IS 'Current state: initializing, active, paused, ended, error';
COMMENT ON COLUMN public.stream_sessions.channel_id IS 'Unique Agora channel identifier for this session';
COMMENT ON COLUMN public.stream_viewers.is_active IS 'Whether the viewer is currently active in the stream';
COMMENT ON COLUMN public.agora_tokens.privileges IS 'JSON object containing Agora token privileges';
COMMENT ON COLUMN public.agora_tokens.uid IS 'Agora user ID for this token';