'use server';

import {
    submitQuestion as d1SubmitQuestion,
    incrementVote as d1IncrementVote,
    getComments as d1GetComments,
    postComment as d1PostComment,
    likeComment as d1LikeComment,
    getOneRandomQuestion as d1GetOneRandomQuestion,
    Env
} from '@/lib/d1-api';

export async function moderateContent(text: string) {
    if (!text) {
        return { approved: false, reason: 'Text is required' };
    }

    // Keyword-based safety check (Free Tier Logic 1)
    const forbiddenKeywords = ['욕설', '비하', '정치', '혐오', 'murder', 'kill', 'hate', 'sex', 'porn'];
    const hasForbiddenKeyword = forbiddenKeywords.some(keyword => text.includes(keyword));

    if (hasForbiddenKeyword) {
        return {
            approved: false,
            reason: 'Contains forbidden keywords'
        };
    }

    // Random check to simulate "AI uncertainty" (Free Tier Logic 2)
    // For now, approve almost everything for testing
    const approved = true;

    return {
        approved,
        reason: approved ? 'Safe' : 'AI flagged as potential issue'
    };
}

// --- D1 Server Actions Wrapper ---

export async function submitQuestionAction(title: string, optionA: string, optionB: string) {
    try {
        const result = await d1SubmitQuestion(title, optionA, optionB);
        return { success: true, data: result };
    } catch (e) {
        console.error("Action Error:", e);
        return { success: false, error: 'Failed' };
    }
}

export async function incrementVoteAction(questionId: string, side: 'A' | 'B') {
    await d1IncrementVote(questionId, side);
}

export async function getCommentsAction(questionId: string) {
    return await d1GetComments(questionId);
}

export async function postCommentAction(questionId: string, content: string, voteSide: 'A' | 'B') {
    return await d1PostComment(questionId, content, voteSide);
}

export async function likeCommentAction(commentId: string) {
    await d1LikeComment(commentId);
}

export async function getNextQuestionAction(excludedIds: string[]) {
    return await d1GetOneRandomQuestion(excludedIds);
}
