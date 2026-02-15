'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle } from 'lucide-react';

interface SubmitQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SubmitQuestionModal({ isOpen, onClose }: SubmitQuestionModalProps) {
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!optionA.trim() || !optionB.trim()) return;

        setIsSubmitting(true);

        // Verify with AI Moderation API
        try {
            const response = await fetch('/api/moderate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: optionA + " " + optionB }),
            });

            const data = await response.json();

            if (!data.approved) {
                setSubmitStatus('error');
                alert("AI가 부적절한 내용을 감지하여 등록이 거부되었습니다.\n(사유: " + data.reason + ")");
                setIsSubmitting(false);
                return;
            }
        } catch (e) {
            console.error("Moderation check failed", e);
            // In a real app, you might want to fail open or closed depending on policy.
            // Here we proceed for demo purposes if API fails.
        }

        // Simulate API call and duplicate check
        setTimeout(() => {
            // Mock duplicate check logic
            const isDuplicate = Math.random() < 0.1; // 10% chance of duplicate for demo

            if (isDuplicate) {
                setSubmitStatus('error');
                alert("이미 비슷한 밸런스 게임이 존재합니다! (중복 방지 테스트)");
                setIsSubmitting(false);
            } else {
                setSubmitStatus('success');
                setTimeout(() => {
                    onClose();
                    setOptionA('');
                    setOptionB('');
                    setSubmitStatus('idle');
                    alert("질문이 등록되었습니다! (AI 승인 완료)");
                }, 1000);
            }
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#1E1E1E] w-full max-w-md rounded-2xl border border-white/10 p-6 relative z-10 shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6">나만의 밸런스 게임 만들기</h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-balance-red font-bold">옵션 A (Red)</label>
                                <input
                                    type="text"
                                    value={optionA}
                                    onChange={(e) => setOptionA(e.target.value)}
                                    placeholder="예: 평생 라면만 먹기"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-balance-red transition-colors"
                                    maxLength={50}
                                />
                            </div>

                            <div className="flex justify-center text-white/20 font-mono font-bold">VS</div>

                            <div className="space-y-2">
                                <label className="text-sm text-balance-blue font-bold">옵션 B (Blue)</label>
                                <input
                                    type="text"
                                    value={optionB}
                                    onChange={(e) => setOptionB(e.target.value)}
                                    placeholder="예: 평생 밥만 먹기"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-balance-blue transition-colors"
                                    maxLength={50}
                                />
                            </div>

                            <div className="mt-4 p-3 bg-white/5 rounded-lg text-xs text-white/60 flex gap-2 items-start">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <p>AI가 내용을 자동 검수하며, 중복된 질문은 등록되지 않습니다.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !optionA || !optionB}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl mt-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                {isSubmitting ? 'AI 검수 중...' : '등록하기'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
