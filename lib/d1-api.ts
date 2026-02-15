import { Question } from './mock-data';

// D1 Interface for TypeScript
export interface Env {
    DB: D1Database;
}

// Helper to get D1 database from Edge Runtime Context
export const getDB = async (): Promise<D1Database | null> => {
    try {
        // In Next.js Edge Runtime, we can't easily access `context.env` globally.
        // We rely on passing `process.env` or using a specific pattern.
        // However, @cloudflare/next-on-pages exposes `getRequestContext`
        const { getRequestContext } = await import('@cloudflare/next-on-pages');
        const context = getRequestContext();
        if (!context || !context.env || !context.env.DB) {
            console.warn("D1 DB not found in context. Are you running with 'wrangler pages dev'? Falling back to Mock.");
            return null;
        }
        return context.env.DB;
    } catch (e) {
        console.warn("Failed to get D1 context:", e);
        return null;
    }
};

// Map D1 result to Question interface
const mapQuestion = (data: any): Question => ({
    id: String(data.id),
    title: data.title,
    option_a: data.option_a,
    option_b: data.option_b,
    vote_count_a: data.vote_count_a || 0,
    vote_count_b: data.vote_count_b || 0,
    // D1 doesn't have is_approved in Question interface but we fetch only approved
});

export const getOneRandomQuestion = async (excludedIds: string[] = []): Promise<Question | null> => {
    try {
        const db = await getDB();
        if (!db) {
            // Fallback for local dev without wrangler
            const { MOCK_QUESTION } = await import('./mock-data');
            return { ...MOCK_QUESTION, id: 'mock-local-' + Date.now() };
        }

        let query = "SELECT * FROM questions WHERE is_approved = 1";

        // Exclude IDs logic (simple implementation)
        if (excludedIds.length > 0) {
            const placeholders = excludedIds.map(() => '?').join(',');
            query += ` AND id NOT IN (${placeholders})`;
        }

        query += " ORDER BY RANDOM() LIMIT 1";

        const stmt = db.prepare(query);
        const result = excludedIds.length > 0
            ? await stmt.bind(...excludedIds).first()
            : await stmt.first();

        if (!result) return null;
        return mapQuestion(result);
    } catch (e) {
        console.error("D1 Error (getOneRandomQuestion):", e);
        return null;
    }
};

export const incrementVote = async (questionId: string, side: 'A' | 'B') => {
    try {
        const db = await getDB();
        const column = side === 'A' ? 'vote_count_a' : 'vote_count_b';
        // Atomic increment
        await db.prepare(`UPDATE questions SET ${column} = ${column} + 1 WHERE id = ?`).bind(questionId).run();

        // Log vote (optional)
        await db.prepare("INSERT INTO votes (question_id, vote_side) VALUES (?, ?)").bind(questionId, side).run();
    } catch (e) {
        console.error("D1 Error (incrementVote):", e);
    }
};

export const submitQuestion = async (title: string, optionA: string, optionB: string) => {
    try {
        const db = await getDB();
        const result = await db.prepare(
            "INSERT INTO questions (title, option_a, option_b, is_approved) VALUES (?, ?, ?, 1) RETURNING *"
        ).bind(title || `${optionA} vs ${optionB}`, optionA, optionB).first();
        return result;
    } catch (e) {
        console.error("D1 Error (submitQuestion):", e);
        throw e;
    }
};

// Admin: Fetch ALL questions
export const getAllQuestions = async (): Promise<Question[]> => {
    try {
        const db = await getDB();
        const { results } = await db.prepare("SELECT * FROM questions ORDER BY created_at DESC").all();
        return results.map(mapQuestion);
    } catch (e) {
        console.error("D1 Error (getAllQuestions):", e);
        return [];
    }
};

// Admin: Delete a question
export const deleteQuestion = async (id: string) => {
    try {
        const db = await getDB();
        await db.prepare("DELETE FROM questions WHERE id = ?").bind(id).run();
    } catch (e) {
        console.error("D1 Error (deleteQuestion):", e);
        throw e;
    }
};

export const getLeaderboard = async () => {
    try {
        const db = await getDB();
        // Fetch approved questions
        const { results } = await db.prepare("SELECT * FROM questions WHERE is_approved = 1").all();

        return results
            .map((q: any) => {
                const total = (q.vote_count_a || 0) + (q.vote_count_b || 0);
                if (total < 10) return null;

                const percentA = (q.vote_count_a / total) * 100;
                const balanceScore = Math.abs(50 - percentA);
                return {
                    ...mapQuestion(q),
                    balance_score: balanceScore
                };
            })
            .filter((item: any) => item !== null)
            .sort((a: any, b: any) => a.balance_score - b.balance_score)
            .slice(0, 10);
    } catch (e) {
        console.error("D1 Error (getLeaderboard):", e);
        return [];
    }
};

// Comments
export interface Comment {
    id: string;
    question_id: string;
    content: string;
    vote_side: 'A' | 'B';
    nickname: string;
    like_count: number;
    created_at: string;
}

export const getComments = async (questionId: string): Promise<Comment[]> => {
    try {
        const db = await getDB();
        const { results } = await db.prepare(
            "SELECT * FROM comments WHERE question_id = ? ORDER BY like_count DESC, created_at DESC"
        ).bind(questionId).all();

        return results.map((c: any) => ({
            id: String(c.id),
            question_id: String(c.question_id),
            content: c.content,
            vote_side: c.vote_side,
            nickname: c.nickname,
            like_count: c.like_count,
            created_at: c.created_at
        }));
    } catch (e) {
        console.error("D1 Error (getComments):", e);
        return [];
    }
};

export const postComment = async (questionId: string, content: string, voteSide: 'A' | 'B', nickname: string = '익명') => {
    try {
        const db = await getDB();
        const result = await db.prepare(
            "INSERT INTO comments (question_id, content, vote_side, nickname) VALUES (?, ?, ?, ?) RETURNING *"
        ).bind(questionId, content, voteSide, nickname).first();
        return result;
    } catch (e) {
        throw e;
    }
};

export const likeComment = async (commentId: string) => {
    try {
        const db = await getDB();
        await db.prepare("UPDATE comments SET like_count = like_count + 1 WHERE id = ?").bind(commentId).run();
    } catch (e) {
        throw e;
    }
};

export const deleteComment = async (commentId: string) => {
    try {
        const db = await getDB();
        await db.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
    } catch (e) {
        throw e;
    }
};
