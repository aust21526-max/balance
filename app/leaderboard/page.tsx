'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardItem {
    id: string;
    title: string;
    option_a: string;
    option_b: string;
    vote_count_a: number;
    vote_count_b: number;
    balance_score: number; // Lower is better (0 = perfect 50:50)
}

// Mock data generator for leaderboard
const generateMockLeaderboard = (): LeaderboardItem[] => {
    return Array.from({ length: 10 }).map((_, i) => {
        const total = 1000 + Math.floor(Math.random() * 5000);
        // Create near 50:50 splits
        const diff = i * 2 + Math.floor(Math.random() * 5);
        const countA = Math.floor(total / 2) + (Math.random() > 0.5 ? diff : -diff);
        const countB = total - countA;
        const percentA = (countA / total) * 100;

        return {
            id: `lb-${i}`,
            title: `밸런스 질문 ${i + 1}`,
            option_a: i % 2 === 0 ? "평생 라면 먹기" : "평생 탄산 안 마시기",
            option_b: i % 2 === 0 ? "평생 밥만 먹기" : "평생 물만 마시기",
            vote_count_a: countA,
            vote_count_b: countB,
            balance_score: Math.abs(50 - percentA),
        };
    }).sort((a, b) => a.balance_score - b.balance_score);
};

export default function LeaderboardPage() {
    const [items, setItems] = useState<LeaderboardItem[]>([]);

    useEffect(() => {
        // In real implementation, fetch from Supabase:
        // supabase.from('questions').select('*').order('balance_score', { ascending: true }).limit(10)
        setItems(generateMockLeaderboard());
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
                                className="bg-[#1E1E1E] border border-white/10 rounded-xl p-4 relative overflow-hidden"
                            >
                                {/* Rank Badge */}
                                <div className="absolute top-0 left-0 bg-[#FEE500] text-black font-bold px-3 py-1 rounded-br-lg text-sm z-10">
                                    {index + 1}위
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
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
            </div>
        </div>
    );
}
