'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/lib/mock-data';
import { MessageSquare, ArrowRight, Plus, Trophy, Home, Lock } from 'lucide-react';
import clsx from 'clsx';
import ShareButtons from './ShareButtons';
import SubmitQuestionModal from './SubmitQuestionModal';
import PeekStats from './PeekStats';
import CommentModal from './CommentModal';
import { incrementVote } from '@/lib/d1-api';

interface VoteInterfaceProps {
    initialQuestion: Question;
}

export default function VoteInterface({ initialQuestion }: VoteInterfaceProps) {
    const [question, setQuestion] = useState(initialQuestion);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showComments, setShowComments] = useState(false);

    // Optimistic UI updates
    const [localVoteA, setLocalVoteA] = useState(0);
    const [localVoteB, setLocalVoteB] = useState(0);

    // Initial load check
    // console.log("VoteInterface Loaded: v3 (Real Data Integration)");

    // Voted history state
    const [votedIds, setVotedIds] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('voted_questions');
        if (stored) {
            setVotedIds(JSON.parse(stored));
        }
    }, []);

    const totalVotes = question.vote_count_a + question.vote_count_b + localVoteA + localVoteB;

    const currentVoteA = question.vote_count_a + localVoteA;
    const currentVoteB = question.vote_count_b + localVoteB;

    const percentA = totalVotes === 0 ? 50 : Math.round((currentVoteA / totalVotes) * 100);
    const percentB = totalVotes === 0 ? 50 : 100 - percentA;

    const handleVote = async (option: 'A' | 'B') => {
        if (hasVoted) return;

        setSelectedOption(option);
        setHasVoted(true);

        const newVotedIds = [...votedIds, question.id];
        setVotedIds(newVotedIds);
        localStorage.setItem('voted_questions', JSON.stringify(newVotedIds));

        // Optimistic Update
        if (option === 'A') setLocalVoteA(prev => prev + 1);
        else setLocalVoteB(prev => prev + 1);

        // Real API Call
        await incrementVote(question.id, option);
    };

    const handleNext = async () => {
        // Reset states for animation
        setHasVoted(false);
        setSelectedOption(null);
        setLocalVoteA(0);
        setLocalVoteB(0);
        setShowComments(false);

        // Fetch new question excluding voted ones
        // Import getOneRandomQuestion dynamically to avoid server/client issues if any, 
        // though strictly 'lib/supabase-api' is safe. 
        // We'll use the imported one.
        // But first, show loading state? For now, we rely on React state update speed.

        try {
            const { getOneRandomQuestion } = await import('@/lib/supabase-api');
            const newQuestion = await getOneRandomQuestion(votedIds);

            if (newQuestion) {
                setQuestion(newQuestion);
            } else {
                alert("모든 질문을 완료하셨습니다! 대단해요 🎉 (새 질문이 등록될 때까지 기다려주세요)");
                // Optionally reset list or redirect
            }
        } catch (e) {
            console.error("Failed to fetch next", e);
            alert("질문을 불러오는데 실패했습니다.");
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full overflow-hidden relative bg-black">

            <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between items-start pointer-events-none mix-blend-difference text-white">
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <a href="/" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                            <Home size={20} />
                        </a>
                        <h1 className="font-bold text-xl tracking-tighter">BALANCE</h1>
                    </div>

                    <div className="flex items-center gap-2 pl-1">
                        <span className="text-xs opacity-70 font-mono">Votes: {totalVotes.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                        <a href="/leaderboard" className="mt-1 flex items-center gap-2 bg-[#FEE500] text-black px-3 py-1.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                            <Trophy size={14} className="fill-black" /> 명예의 전당
                        </a>
                        <a href="/admin" className="mt-1 flex items-center justify-center bg-white/10 text-white w-8 h-8 rounded-full hover:bg-white/20 transition-colors" title="관리자">
                            <Lock size={12} />
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
                        <button
                            onClick={() => setShowComments(true)}
                            className="w-full max-w-md mx-auto mt-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-4 flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-full">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-bold text-sm">댓글 토론장 입장</div>
                                    <div className="text-white/40 text-xs">익명으로 자유롭게 의견 나누기</div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-white/30 group-hover:translate-x-1 transition-transform" />
                        </button>

                    </motion.div>
                )}
            </AnimatePresence>

            <CommentModal
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                questionId={question.id}
                userVoteSide={selectedOption}
            />

        </div>
    );
}
