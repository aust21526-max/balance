'use client';

import { useState, useEffect } from 'react';
import { getAllQuestions, deleteQuestion } from '@/lib/supabase-api';
import { Question } from '@/lib/mock-data';
import { Trash2, RefreshCw } from 'lucide-react';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);

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
                        <div key={q.id} className="bg-[#1E1E1E] p-4 rounded-lg border border-white/10 flex justify-between items-center">
                            <div className="flex-1">
                                <div className="font-bold text-lg mb-1">{q.title}</div>
                                <div className="text-sm text-gray-400 flex gap-4">
                                    <span className="text-balance-red">A: {q.option_a} ({q.vote_count_a})</span>
                                    <span className="text-balance-blue">B: {q.option_b} ({q.vote_count_b})</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(q.id)}
                                className="ml-4 p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                title="삭제"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
