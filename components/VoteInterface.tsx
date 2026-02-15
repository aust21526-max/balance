'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/lib/mock-data';
import { MessageSquare, ArrowRight, Plus, Trophy } from 'lucide-react';
import clsx from 'clsx';
import ShareButtons from './ShareButtons';
import SubmitQuestionModal from './SubmitQuestionModal';
import PeekStats from './PeekStats';

interface VoteInterfaceProps {
    initialQuestion: Question;
}

export default function VoteInterface({ initialQuestion }: VoteInterfaceProps) {
    const [question, setQuestion] = useState(initialQuestion);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // Initial load check
    console.log("VoteInterface Loaded: v2 (Leaderboard + PeekStats + ShareMenu)");

    const totalVotes = question.vote_count_a + question.vote_count_b + (hasVoted ? 1 : 0);
    const percentA = hasVoted
        ? Math.round(((question.vote_count_a + (selectedOption === 'A' ? 1 : 0)) / totalVotes) * 100)
        : 50;
    const percentB = hasVoted ? 100 - percentA : 50;

    const handleVote = (option: 'A' | 'B') => {
        if (hasVoted) return;
        setSelectedOption(option);
        setHasVoted(true);
    };

    const handleNext = () => {
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full overflow-hidden relative bg-black">

            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between items-start pointer-events-none mix-blend-difference text-white">
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <h1 className="font-bold text-xl tracking-tighter">BALANCE</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">🔥 {totalVotes.toLocaleString()}</span>
                        <a href="/leaderboard" className="opacity-80 hover:opacity-100 transition-opacity">
                            <Trophy size={16} className="text-[#FEE500]" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Floating Action Button (Create) - Only visible if not in modal */}
            {!isModalOpen && (
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="pointer-events-auto bg-white/10 backdrop-blur-md text-white text-xs font-bold py-2 px-3 rounded-full hover:bg-white/20 transition-colors border border-white/10 flex items-center gap-1"
                    >
                        <Plus size={14} /> 질문 만들기
                    </button>
                </div>
            )}

            <SubmitQuestionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Main Split View */}
            <div className="flex flex-col md:flex-row h-full w-full">
                <motion.button
                    className={clsx(
                        "relative flex-1 flex items-center justify-center p-8 text-white transition-all duration-500 outline-none",
                        "bg-balance-red hover:bg-red-600 active:scale-[0.98]",
                        hasVoted && selectedOption !== 'A' && "opacity-50 grayscale"
                    )}
                    onClick={() => handleVote('A')}
                    disabled={hasVoted}
                    initial={{ flex: 1 }}
                    animate={{
                        flex: hasVoted ? Math.max(15, Math.min(85, percentA)) : 1,
                        transition: { type: "spring", stiffness: 120, damping: 20 }
                    }}
                >
                    <motion.div
                        className="z-10 text-center flex flex-col items-center gap-2 md:gap-4 px-2"
                        animate={{ y: hasVoted ? -100 : 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                    >
                        <h2 className="text-2xl md:text-5xl font-black text-balance-shadow leading-tight break-keep drop-shadow-lg">
                            {question.option_a}
                        </h2>
                        {hasVoted && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl md:text-8xl font-black mt-2 md:mt-4 drop-shadow-xl"
                            >
                                {percentA}%
                            </motion.div>
                        )}
                    </motion.div>
                </motion.button>

                {!hasVoted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className="bg-white text-black font-black text-2xl rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-4 border-black font-mono">
                            VS
                        </div>
                    </div>
                )}

                <motion.button
                    className={clsx(
                        "relative flex-1 flex items-center justify-center p-8 text-white transition-all duration-500 outline-none",
                        "bg-balance-blue hover:bg-blue-600 active:scale-[0.98]",
                        hasVoted && selectedOption !== 'B' && "opacity-50 grayscale"
                    )}
                    onClick={() => handleVote('B')}
                    disabled={hasVoted}
                    initial={{ flex: 1 }}
                    animate={{
                        flex: hasVoted ? Math.max(15, Math.min(85, percentB)) : 1,
                        transition: { type: "spring", stiffness: 120, damping: 20 }
                    }}
                >
                    <motion.div
                        className="z-10 text-center flex flex-col items-center gap-2 md:gap-4 px-2"
                        animate={{ y: hasVoted ? -100 : 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                    >
                        <h2 className="text-2xl md:text-5xl font-black text-balance-shadow leading-tight break-keep drop-shadow-lg">
                            {question.option_b}
                        </h2>
                        {hasVoted && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl md:text-8xl font-black mt-2 md:mt-4 drop-shadow-xl"
                            >
                                {percentB}%
                            </motion.div>
                        )}
                    </motion.div>
                </motion.button>
            </div>

            {/* Results / Action Bar */}
            <AnimatePresence>
                {hasVoted && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 pb-8 z-40 flex flex-col gap-4 max-h-[60vh] overflow-y-auto"
                    >
                        <div className="text-center text-white/80 font-medium mb-4">
                            {(percentA > percentB && selectedOption === 'A') || (percentB > percentA && selectedOption === 'B')
                                ? "대중의 선택과 일치합니다! 👏"
                                : "당신은 특별한 취향을 가졌군요... 🤔"}
                        </div>

                        <ShareButtons title={question.title} />

                        <PeekStats />

                        <button onClick={handleNext} className="w-full max-w-md mx-auto bg-white/10 border border-white/20 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                            다음 질문으로 <ArrowRight size={20} />
                        </button>

                        {/* Comment Section Placeholder */}
                        {!showComments ? (
                            <button
                                onClick={() => setShowComments(true)}
                                className="text-white/50 text-sm flex items-center justify-center gap-1 hover:text-white transition-colors py-2"
                            >
                                <MessageSquare size={16} /> 댓글 토론 (99+)
                            </button>
                        ) : (
                            <div className="w-full max-w-md mx-auto mt-4 px-2">
                                <h3 className="text-white font-bold mb-2">🔥 베스트 댓글</h3>
                                <div className="bg-white/5 rounded-lg p-3 mb-2 border border-white/10">
                                    <div className="flex justify-between text-xs text-white/50 mb-1">
                                        <span className="text-balance-red font-bold">A 선택</span>
                                        <span>👍 1,240</span>
                                    </div>
                                    <p className="text-sm text-white/90">솔직히 샤워 안 하면 냄새나서 사회생활 못 함 ㅋㅋ 양치는 껌 씹으면 됨</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 mb-2 border border-white/10">
                                    <div className="flex justify-between text-xs text-white/50 mb-1">
                                        <span className="text-balance-blue font-bold">B 선택</span>
                                        <span>👍 856</span>
                                    </div>
                                    <p className="text-sm text-white/90">이빨 썩어서 틀니 끼면 되지만 피부 썩으면 답도 없음</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
