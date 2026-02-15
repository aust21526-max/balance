import VoteInterface from '@/components/VoteInterface';
import { getRandomQuestion } from '@/lib/mock-data';

export default function Home() {
  // Server-side fetch (mocked for now)
  const initialQuestion = getRandomQuestion();

  return (
    <main className="min-h-screen bg-black">
      <VoteInterface initialQuestion={initialQuestion} />
    </main>
  );
}
