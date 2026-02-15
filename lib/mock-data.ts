export interface Question {
    id: string;
    title: string;
    option_a: string;
    option_b: string;
    vote_count_a: number;
    vote_count_b: number;
}

export const MOCK_QUESTIONS: Question[] = [
    {
        id: '1',
        title: '평생 양치 안 하기 vs 평생 샤워 안 하기',
        option_a: '평생 양치 안 하기',
        option_b: '평생 샤워 안 하기',
        vote_count_a: 154,
        vote_count_b: 846,
    },
    {
        id: '2',
        title: '토마토 맛 토 (토맛토) vs 토 맛 토마토',
        option_a: '토마토 맛 토',
        option_b: '토 맛 토마토',
        vote_count_a: 420,
        vote_count_b: 580,
    },
    {
        id: '3',
        title: '50억 받고 바퀴벌레랑 살기 vs 그냥 살기',
        option_a: '50억 받고 바퀴벌레',
        option_b: '그냥 살기',
        vote_count_a: 9800,
        vote_count_b: 200,
    }
];

export const MOCK_QUESTION = MOCK_QUESTIONS[0];

export function getRandomQuestion(): Question {
    return MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)];
}
