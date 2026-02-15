'use client';

import { Copy, Download, Share2, X, Instagram, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareButtons({ title }: { title: string }) {
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Copy Link
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    // Save Image
    const handleSaveImage = async () => {
        const element = document.body;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                useCORS: true,
                backgroundColor: '#000000',
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'balance-game-result.png';
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to capture image', err);
        }
    };

    // Platform specific sharing
    const shareToKakao = () => {
        alert("카카오톡으로 공유합니다 (API 키 필요)");
        setShowMenu(false);
    };

    const shareToTwitter = () => {
        const text = encodeURIComponent(`[밸런스 게임] ${title}\n\n이걸 고른다고? 👇`);
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        setShowMenu(false);
    };

    const shareToInstagram = () => {
        // IG doesn't support direct link sharing API for web. Usually image download + manual upload.
        handleSaveImage();
        alert("이미지가 저장되었습니다! 인스타그램 스토리에 업로드하세요.");
        setShowMenu(false);
    };

    return (
        <>
            <div className="flex gap-2 w-full max-w-md mx-auto relative z-50">
                {/* Main Share Trigger */}
                <button
                    onClick={() => setShowMenu(true)}
                    className="flex-1 bg-[#FEE500] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#E6CF00] transition-colors"
                >
                    <Share2 size={20} className="fill-current" /> 공유하기
                </button>

                {/* Copy Link */}
                <button
                    onClick={handleCopyLink}
                    className="flex-1 bg-white/10 backdrop-blur text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                >
                    <Copy size={20} /> {copied ? '복사됨!' : '링크'}
                </button>

                {/* Image Save */}
                <button
                    onClick={handleSaveImage}
                    className="flex-1 bg-white/10 backdrop-blur text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                >
                    <Download size={20} /> 짤저장
                </button>
            </div>

            {/* Share Menu Modal/Sheet */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                            onClick={() => setShowMenu(false)}
                        />
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="fixed bottom-0 left-0 w-full bg-[#1E1E1E] rounded-t-2xl p-6 z-[70] border-t border-white/10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-bold text-lg">어디로 공유할까요?</h3>
                                <button onClick={() => setShowMenu(false)} className="text-white/50 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={shareToKakao} className="flex flex-col items-center gap-2">
                                    <div className="w-14 h-14 bg-[#FEE500] rounded-full flex items-center justify-center text-black">
                                        <MessageCircle fill="currentColor" size={28} />
                                    </div>
                                    <span className="text-white text-sm">카카오톡</span>
                                </button>

                                <button onClick={shareToInstagram} className="flex flex-col items-center gap-2">
                                    <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                                        <Instagram size={28} />
                                    </div>
                                    <span className="text-white text-sm">인스타그램</span>
                                </button>

                                <button onClick={shareToTwitter} className="flex flex-col items-center gap-2">
                                    <div className="w-14 h-14 bg-black border border-white/20 rounded-full flex items-center justify-center text-white">
                                        <span className="font-bold text-xl">𝕏</span>
                                    </div>
                                    <span className="text-white text-sm">트위터</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
