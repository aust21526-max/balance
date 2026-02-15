-- 댓글 테이블 생성
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_side TEXT CHECK (vote_side IN ('A', 'B')), -- 글쓴이가 투표한 진영
    nickname TEXT DEFAULT '익명',
    like_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (질문별 조회, 좋아요순 정렬)
CREATE INDEX comments_question_id_idx ON comments (question_id);
CREATE INDEX comments_like_count_idx ON comments (like_count DESC);

-- 댓글 좋아요 증가 함수 (RPC)
CREATE OR REPLACE FUNCTION increment_comment_like(comment_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE comments SET like_count = like_count + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- 보안 정책 (누구나 읽기/쓰기 가능)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Public insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update comments" ON comments FOR UPDATE USING (true);
