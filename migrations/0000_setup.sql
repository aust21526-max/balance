-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    vote_count_a INTEGER DEFAULT 0,
    vote_count_b INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Votes Table (for analytics/preventing double votes if we store user_id later, currently just logs)
CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    vote_side TEXT CHECK(vote_side IN ('A', 'B')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    vote_side TEXT CHECK(vote_side IN ('A', 'B')),
    nickname TEXT DEFAULT '익명',
    password TEXT, -- Simple password for deletion
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_questions_approved ON questions(is_approved);
CREATE INDEX IF NOT EXISTS idx_comments_question ON comments(question_id);

-- Seed Data
INSERT INTO questions (title, option_a, option_b, vote_count_a, vote_count_b, is_approved) VALUES
('평생 양치 안 하기 vs 평생 샤워 안 하기', '평생 양치 안 하기', '평생 샤워 안 하기', 154, 846, 1),
('토마토 맛 토 (토맛토) vs 토 맛 토마토', '토마토 맛 토', '토 맛 토마토', 420, 580, 1),
('50억 받고 바퀴벌레랑 살기 vs 그냥 살기', '50억 받고 바퀴벌레', '그냥 살기', 9800, 200, 1);
