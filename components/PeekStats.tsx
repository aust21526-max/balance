'use client';

import { useState } from 'react';
import { Lock, Unlock, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PeekStats() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isWatchingAd, setIsWatchingAd] = useState(false);

    const handleUnlock = () => {
        setIsWatchingAd(true);

        // Simulate Ad viewing (3 seconds)
        setTimeout(() => {
            setIsWatchingAd(false);
            setIsUnlocked(true);
        }, 3000);
    };

    return (
        <div className="w-full max-w-md mx-auto mt-4">
            {!isUnlocked ? (
                <button
                    onClick={handleUnlock}
                    disabled={isWatchingAd}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity relative overflow-hidden"
                >
                    {isWatchingAd ? (
                        <>
                            <span className="animate-spin">⏳</span> 광고 시청 중... (3초)
                        </>
                    ) : (
                        <>
                            <Lock size={18} />
                            <span>20대 여성의 선택은? (통계 엿보기)</span>
                        </>
                    )}
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20"
                >
                    <div className="flex items-center gap-2 mb-3 text-purple-300 font-bold">
                        <Unlock size={18} /> 상세 통계 (잠금 해제됨)
                    </div>

                    <div className="space-y-3 text-sm text-gray-300">
                        <div className="flex justify-between items-center">
                            <span>👱‍♀️ 20대 여성</span>
                            <div className="flex gap-2">
                                <span className="text-balance-red">A: 62%</span>
                                <span className="text-balance-blue">B: 38%</span>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className="bg-balance-red h-full w-[62%] float-left"></div>
                            <div className="bg-balance-blue h-full w-[38%] float-left"></div>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                            <span>👨‍🦱 20대 남성</span>
                            <div className="flex gap-2">
                                <span className="text-balance-red">A: 45%</span>
                                <span className="text-balance-blue">B: 55%</span>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className="bg-balance-red h-full w-[45%] float-left"></div>
                            <div className="bg-balance-blue h-full w-[55%] float-left"></div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
