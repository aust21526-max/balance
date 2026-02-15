import { getOneRandomQuestion } from '@/lib/d1-api';
import VoteInterface from '@/components/VoteInterface';
import { MOCK_QUESTION } from '@/lib/mock-data';

export const runtime = 'edge'; // For Cloudflare Pages
export const dynamic = 'force-dynamic';

export default async function VotePage() {
  const question = await getOneRandomQuestion();
  return <VoteInterface initialQuestion={question || MOCK_QUESTION} />;
}
