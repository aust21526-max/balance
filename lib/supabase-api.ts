import { supabase } from './supabase';
import { Question } from './mock-data'; // Keeping the interface, ignoring the mock array

// Map Supabase result to Question interface
const mapQuestion = (data: any): Question => ({
    id: data.id,
    title: data.title,
    option_a: data.option_a,
    option_b: data.option_b,
    vote_count_a: data.vote_count_a || 0,
    vote_count_b: data.vote_count_b || 0,
});

export const getOneRandomQuestion = async (excludedIds: string[] = []): Promise<Question | null> => {
    let query = supabase
        .from('questions')
        .select('*')
        .eq('is_approved', true);

    // If we have excluded IDs, filter them out
    if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    // Fetch a batch (limit 50 to pick random from)
    const { data, error } = await query.limit(50);

    if (error) {
        console.error('Error fetching questions:', error);
        return null;
    }

    if (!data || data.length === 0) return null;

    const randomItem = data[Math.floor(Math.random() * data.length)];
    return mapQuestion(randomItem);
};

export const incrementVote = async (questionId: string, side: 'A' | 'B') => {
    const { error } = await supabase.rpc('increment_vote', {
        question_id: questionId,
        side: side,
    });

    if (error) {
        console.error('Error voting:', error);
    }
};

export const submitQuestion = async (title: string, optionA: string, optionB: string) => {
    const { data, error } = await supabase
        .from('questions')
        .insert([
            {
                title: title || `${optionA} vs ${optionB}`,
                option_a: optionA,
                option_b: optionB,
                is_approved: true, // Auto-approve for now
            },
        ])
        .select();

    if (error) throw error;
    return data;
};

// Admin: Fetch ALL questions (including unapproved)
export const getAllQuestions = async () => {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(mapQuestion) : [];
};

// Admin: Delete a question
export const deleteQuestion = async (id: string) => {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// Admin: Toggle approval status (if needed)
export const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
        .from('questions')
        .update({ is_approved: !currentStatus })
        .eq('id', id);

    if (error) throw error;
};

export const getLeaderboard = async () => {
    // Fetch all approved questions
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_approved', true);

    if (error || !data) return [];

    // Calculate balance score (closer to 50:50 is better)
    return data
        .map(q => {
            const total = (q.vote_count_a || 0) + (q.vote_count_b || 0);
            if (total < 10) return null; // Lowered threshold to 10

            const percentA = (q.vote_count_a / total) * 100;
            const balanceScore = Math.abs(50 - percentA); // 0 is perfect
            return {
                ...mapQuestion(q),
                balance_score: balanceScore
            };
        })
        .filter(item => item !== null)
        .sort((a, b) => a!.balance_score - b!.balance_score)
        .slice(0, 10);
};

// Comments API

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
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('question_id', questionId)
        .order('like_count', { ascending: false }) // Best comments first
        .order('created_at', { ascending: false }); // Then newest

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
    return data || [];
};

export const postComment = async (questionId: string, content: string, voteSide: 'A' | 'B', nickname: string = '익명') => {
    const { data, error } = await supabase
        .from('comments')
        .insert([
            {
                question_id: questionId,
                content,
                vote_side: voteSide,
                nickname,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const likeComment = async (commentId: string) => {
    const { error } = await supabase.rpc('increment_comment_like', {
        comment_id: commentId
    });

    if (error) throw error;
};

export const deleteComment = async (commentId: string) => {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) throw error;
};
