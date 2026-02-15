'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, Send } from 'lucide-react';
import { getComments, postComment, likeComment, Comment } from '@/lib/d1-api';
import clsx from 'clsx';

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    questionId: string;
    userVoteSide: 'A' | 'B' | null;
}

export default function CommentModal({ isOpen, onClose, questionId, userVoteSide }: CommentModalProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, questionId]);

    const fetchComments = async () => {
        setLoading(true);
        const data = await getComments(questionId);
        setComments(data);
        setLoading(false);
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !userVoteSide) return;

        setIsSubmitting(true);
        try {
            await postComment(questionId, newComment, userVoteSide);
            setNewComment('');
            fetchComments(); // Refresh list
        } catch (error) {
            alert('댓글 등록 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (commentId: string) => {
        // Optimistic update
        setComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, like_count: c.like_count + 1 } : c
        ));

        try {
            await likeComment(commentId);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-[#1E1E1E] w-full max-w-lg rounded-2xl border border-white/10 flex flex-col h-[80vh] relative z-20 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1E1E1E] z-10">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                💬 댓글 토론 <span className="text-sm opacity-50 font-normal">{comments.length}</span>
                            </h2>
                            <button onClick={onClose} className="text-white/50 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Comment List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="text-center text-white/50 py-10">로딩 중...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-center text-white/30 py-10 flex flex-col items-center">
                                    <div className="text-4xl mb-2">📭</div>
                                    아직 댓글이 없습니다.<br />첫 번째 의견을 남겨보세요!
                                </div>
                            ) : (
                                comments.map((comment, idx) => (
                                    <div key={comment.id} className="bg-black/40 rounded-xl p-3 border border-white/5">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex gap-2 items-center">
                                                <span className={clsx(
                                                    "text-xs font-bold px-1.5 py-0.5 rounded",
                                                    comment.vote_side === 'A' ? "bg-balance-red/20 text-balance-red" : "bg-balance-blue/20 text-balance-blue"
                                                )}>
                                                    {comment.vote_side} 선택
                                                </span>
                                                <span className="text-xs text-white/40">{comment.nickname}</span>
                                                {idx < 3 && comment.like_count > 0 && (
                                                    <span className="text-xs text-[#FEE500] font-bold">BEST</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleLike(comment.id)}
                                                className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
                                            >
                                                <ThumbsUp size={12} />
                                                {comment.like_count}
                                            </button>
                                        </div>
                                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-[#1E1E1E]">
                            {!userVoteSide ? (
                                <div className="text-center text-sm text-balance-red font-bold py-3 bg-white/5 rounded-lg">
                                    투표를 먼저 해야 댓글을 작성할 수 있습니다. 🚫
                                </div>
                            ) : (
                                <form onSubmit={handlePost} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={`${userVoteSide === 'A' ? 'RED' : 'BLUE'} 팀으로 의견 남기기...`}
                                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                                        maxLength={200}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newComment.trim()}
                                        className={clsx(
                                            "p-3 rounded-xl font-bold text-white transition-all disabled:opacity-50",
                                            userVoteSide === 'A' ? "bg-balance-red hover:bg-red-600" : "bg-balance-blue hover:bg-blue-600"
                                        )}
                                    >
                                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
