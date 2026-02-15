-- Create questions table
CREATE TABLE public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL, -- Short title if needed, or just use option_a/b
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    vote_count_a BIGINT DEFAULT 0,
    vote_count_b BIGINT DEFAULT 0,
    author_id UUID REFERENCES auth.users(id), -- Optional, can be null for anonymous
    is_approved BOOLEAN DEFAULT FALSE, -- Moderation flag
    created_at TIMESTAMPTZ DEFAULT NOW(),
    similarity_hash TEXT -- Future use for duplicate detection
);

-- Search index for similarity (Trigram or simple text search later)
CREATE INDEX questions_created_at_idx ON public.questions(created_at DESC);
CREATE INDEX questions_is_approved_idx ON public.questions(is_approved);

-- Comments table
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 300), -- Limit length
    vote_side TEXT CHECK (vote_side IN ('A', 'B')), -- User must vote to comment
    author_id UUID REFERENCES auth.users(id),
    like_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX comments_question_id_idx ON public.comments(question_id);

-- Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read approved questions
CREATE POLICY "Public questions are viewable by everyone" 
ON public.questions FOR SELECT 
USING (is_approved = TRUE);

-- Everyone can insert questions (but needs approval)
CREATE POLICY "Anyone can submit questions" 
ON public.questions FOR INSERT 
WITH CHECK (true);

-- Everyone can read comments
CREATE POLICY "Public comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

-- Everyone can insert comments
CREATE POLICY "Anyone can comment" 
ON public.comments FOR INSERT 
WITH CHECK (true);

-- Function to increment votes atomically
CREATE OR REPLACE FUNCTION increment_vote(question_id UUID, side TEXT)
RETURNS VOID AS $$
BEGIN
    IF side = 'A' THEN
        UPDATE public.questions SET vote_count_a = vote_count_a + 1 WHERE id = question_id;
    ELSIF side = 'B' THEN
        UPDATE public.questions SET vote_count_b = vote_count_b + 1 WHERE id = question_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
