'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative flex flex-col items-center justify-center p-6">

            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-balance-red/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-balance-blue/20 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="z-10 text-center flex flex-col items-center gap-8 max-w-2xl"
            >
                <div className="space-y-4">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-balance-red font-bold tracking-widest text-sm"
                    >
                        THE GOLDEN RATIO
                    </motion.h2>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
                        <span className="text-white">BALANCE</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-balance-red to-balance-blue">GAME</span>
                    </h1>
                    <p className="text-white/60 text-lg md:text-xl font-light leading-relaxed break-keep">
                        세상 모든 선택에는 이유가 있습니다.<br />
                        당신의 선택이 50:50의 <span className="text-[#FEE500] font-bold">황금 밸런스</span>를 만듭니다.
                    </p>
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="w-full"
                >
                    <Link href="/vote" className="group relative inline-flex items-center justify-center gap-3 bg-white text-black font-bold text-xl px-12 py-5 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        게임 시작하기
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        <div className="absolute -inset-1 bg-gradient-to-r from-balance-red to-balance-blue rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-12 flex gap-8 text-white/30 text-xs font-mono"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-white">10K+</span>
                        <span>VOTES</span>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-white">50:50</span>
                        <span>TARGET</span>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-white">Real-time</span>
                        <span>SYNC</span>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
