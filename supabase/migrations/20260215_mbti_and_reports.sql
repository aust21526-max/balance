-- Create votes table for detailed analytics
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    vote_side TEXT NOT NULL CHECK (vote_side IN ('A', 'B')),
    mbti TEXT, -- 'INTJ', 'ENFP', etc. Can be null if skipped.
    ip_address TEXT, -- Optional for duplicate prevention
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster analytics
CREATE INDEX IF NOT EXISTS idx_votes_question_id ON public.votes(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_mbti ON public.votes(mbti);

-- Trigger to update redundant counts in questions table (for faster read)
CREATE OR REPLACE FUNCTION update_question_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.vote_side = 'A' THEN
            UPDATE public.questions SET vote_count_a = vote_count_a + 1 WHERE id = NEW.question_id;
        ELSIF NEW.vote_side = 'B' THEN
            UPDATE public.questions SET vote_count_b = vote_count_b + 1 WHERE id = NEW.question_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_counts
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION update_question_vote_counts();

-- Create reports table for moderation
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type TEXT NOT NULL CHECK (target_type IN ('QUESTION', 'COMMENT')),
    target_id UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
