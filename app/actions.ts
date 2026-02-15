'use server';

export async function moderateContent(text: string) {
    if (!text) {
        return { approved: false, reason: 'Text is required' };
    }

    // Keyword-based safety check (Free Tier Logic 1)
    const forbiddenKeywords = ['욕설', '비하', '정치', '혐오', 'murder', 'kill', 'hate'];
    const hasForbiddenKeyword = forbiddenKeywords.some(keyword => text.includes(keyword));

    if (hasForbiddenKeyword) {
        return {
            approved: false,
            reason: 'Contains forbidden keywords'
        };
    }

    // Random check to simulate "AI uncertainty" (Free Tier Logic 2)
    const moderationScore = Math.random();
    const approved = moderationScore > 0.3;

    return {
        approved,
        reason: approved ? 'Safe' : 'AI flagged as potential issue'
    };
}
