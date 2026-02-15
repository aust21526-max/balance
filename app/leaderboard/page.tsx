'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { getLeaderboard } from '@/lib/d1-api';
import { Question } from '@/lib/mock-data';
import CommentModal from '@/components/CommentModal';

interface LeaderboardItem extends Question {
    balance_score: number;
}

export default function LeaderboardPage() {
    const [items, setItems] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getLeaderboard();
                setItems(data as LeaderboardItem[]);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-20 overflow-y-auto">
            <div className="max-w-md mx-auto">
                <header className="flex items-center gap-4 mb-8 pt-4">
                    <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Trophy className="text-[#FEE500] fill-current" />
                        <h1 className="text-xl font-bold">황금 밸런스의 전당</h1>
                    </div>
                </header>

                {loading ? (
                    <div className="text-center text-white/50 py-10">로딩 중...</div>
                ) : items.length === 0 ? (
                    <div className="text-center text-white/50 py-10">
                        아직 기록된 황금 밸런스가 없습니다! <br />
                        첫 번째 주인공이 되어보세요.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, index) => {
                            const total = item.vote_count_a + item.vote_count_b;
                            const percentA = ((item.vote_count_a / total) * 100).toFixed(1);
                            const percentB = ((item.vote_count_b / total) * 100).toFixed(1);

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-[#1E1E1E] border border-white/10 rounded-xl p-4 relative overflow-hidden cursor-pointer group"
                                    onClick={() => setSelectedQuestionId(item.id)}
                                >
                                    {/* Rank Badge */}
                                    <div className="absolute top-0 left-0 bg-[#FEE500] text-black font-bold px-3 py-1 rounded-br-lg text-sm z-10">
                                        {index + 1}위
                                    </div>

                                    <div className="absolute top-3 right-3 text-white/20 group-hover:text-white/80 transition-colors">
                                        <MessageSquare size={16} />
                                    </div>

                                    <div className="mt-8 flex flex-col gap-3">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-balance-red w-1/2 truncate pr-2">{item.option_a}</span>
                                            <span className="text-balance-blue w-1/2 truncate pl-2 text-right">{item.option_b}</span>
                                        </div>

                                        {/* Bar */}
                                        <div className="h-4 w-full flex rounded-full overflow-hidden bg-gray-800">
                                            <div className="bg-balance-red h-full" style={{ width: `${percentA}%` }} />
                                            <div className="bg-balance-blue h-full" style={{ width: `${percentB}%` }} />
                                        </div>

                                        <div className="flex justify-between text-xs text-white/50 font-mono">
                                            <span>{percentA}%</span>
                                            <span className="text-[#FEE500] font-bold">오차 {item.balance_score.toFixed(2)}%</span>
                                            <span>{percentB}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Comment Modal for Leaderboard */}
            {selectedQuestionId && (
                <CommentModal
                    isOpen={!!selectedQuestionId}
                    onClose={() => setSelectedQuestionId(null)}
                    questionId={selectedQuestionId}
                    userVoteSide={null} // Read-only mode for voting
                />
            )}
        </div>
    );
}
