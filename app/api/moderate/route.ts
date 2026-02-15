import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Mock AI implementation for now (free/safe default)
// In production, this would call Gemini Flash API
export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Keyword-based safety check (Free Tier Logic 1)
        const forbiddenKeywords = ['욕설', '비하', '정치', '혐오', 'murder', 'kill', 'hate'];
        const hasForbiddenKeyword = forbiddenKeywords.some(keyword => text.includes(keyword));

        if (hasForbiddenKeyword) {
            return NextResponse.json({
                approved: false,
                reason: 'Contains forbidden keywords'
            });
        }

        // Random check to simulate "AI uncertainty" (Free Tier Logic 2)
        // In real app, this would use a free tier LLM API response
        const moderationScore = Math.random(); // 0.0 to 1.0 (Higher is safer)

        // safe > 0.3 (70% approval rate for demo)
        const approved = moderationScore > 0.3;

        return NextResponse.json({
            approved,
            reason: approved ? 'Safe' : 'AI flagged as potential issue'
        });

    } catch (error) {
        console.error('Moderation API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
