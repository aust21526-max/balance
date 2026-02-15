import { useState, useEffect } from 'react';
import { getAllQuestions, deleteQuestion, getComments, deleteComment, Comment } from '@/lib/supabase-api';
import { Question } from '@/lib/mock-data';
import { Trash2, RefreshCw, MessageSquare, X } from 'lucide-react';
import clsx from 'clsx';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);

    // Comment Management State
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    // Hardcoded for MVP as requested by user. ideally use env or server-side check.
    const ADMIN_PASS = '1Anjry00min!';

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASS) {
            setIsAuthenticated(true);
            fetchQuestions();
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const data = await getAllQuestions();
            setQuestions(data);
        } catch (error) {
            console.error(error);
            alert('데이터 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteQuestion(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (error) {
            alert('삭제 실패');
        }
    };

    // Comment Functions
    const openComments = async (question: Question) => {
        setSelectedQuestion(question);
        setLoadingComments(true);
        try {
            const data = await getComments(question.id);
            setComments(data);
        } catch (error) {
            console.error(error);
            alert('댓글 로딩 실패');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
        try {
            await deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            alert('댓글 삭제 실패');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm">
                    <h1 className="text-2xl font-bold text-center">관리자 로그인</h1>
                    <input
                        type="password"
                        placeholder="비밀번호"
                        className="p-3 rounded bg-white/10 border border-white/20 text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="bg-white text-black font-bold p-3 rounded hover:bg-gray-200">
                        접속
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Question Manager ({questions.length})</h1>
                    <button onClick={fetchQuestions} className="p-2 bg-white/10 rounded hover:bg-white/20">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="space-y-4">
                    {questions.map((q) => (
                        <div key={q.id} className="bg-[#1E1E1E] p-4 rounded-lg border border-white/10 flex justify-between items-center group">
                            <div className="flex-1">
                                <div className="font-bold text-lg mb-1">{q.title}</div>
                                <div className="text-sm text-gray-400 flex gap-4">
                                    <span className="text-balance-red">A: {q.option_a} ({q.vote_count_a})</span>
                                    <span className="text-balance-blue">B: {q.option_b} ({q.vote_count_b})</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openComments(q)}
                                    className="p-2 text-white hover:bg-white/10 rounded transition-colors relative"
                                    title="댓글 관리"
                                >
                                    <MessageSquare size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                    title="질문 삭제"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comment Management Modal */}
            {selectedQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1E1E1E] w-full max-w-2xl rounded-xl border border-white/10 flex flex-col h-[80vh] shadow-xl">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold">댓글 관리</h2>
                                <p className="text-xs text-white/50">{selectedQuestion.title}</p>
                            </div>
                            <button onClick={() => setSelectedQuestion(null)} className="p-1 hover:bg-white/10 rounded">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loadingComments ? (
                                <div className="text-center py-10 opacity-50">로딩 중...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-10 opacity-50">댓글이 없습니다.</div>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="bg-black/30 p-3 rounded border border-white/5 flex justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex gap-2 text-xs mb-1 opacity-70">
                                                <span className={c.vote_side === 'A' ? "text-balance-red" : "text-balance-blue"}>
                                                    {c.vote_side}팀
                                                </span>
                                                <span>{c.nickname}</span>
                                                <span>👍 {c.like_count}</span>
                                                <span>{new Date(c.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm">{c.content}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteComment(c.id)}
                                            className="self-start text-red-500 hover:bg-red-500/10 p-1 rounded"
                                            title="댓글 삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
