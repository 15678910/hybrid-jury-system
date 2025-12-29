import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 관리자 코드 (환경변수에서 가져옴)
const getAdminCode = () => {
    return import.meta.env.VITE_ADMIN_CODE || '';
};

// 기본 의제 목록 (초기값)
const DEFAULT_TOPICS = [
    {
        id: 'jurySystem',
        title: '시민법관 참심제 도입',
        subtitle: '시민법관 참심제 도입에 대한 찬반 투표',
        description: '시민이 직업 법관과 함께 재판에 참여하여 유무죄와 양형을 결정하는 참심제 도입에 대해 시민 여러분의 의견을 묻습니다.',
        detail: '시민법관 참심제란?',
        detailContent: '일반 시민이 법관과 동등한 권한으로 재판에 참여하여 유무죄 판단과 양형을 함께 결정하는 제도입니다.',
        agreeText: '시민법관 참심제 도입에 찬성합니다',
        disagreeText: '시민법관 참심제 도입에 반대합니다',
        status: 'active',
        color: 'blue',
        deadline: '2026-03-31'
    },
    {
        id: 'lawDistortion',
        title: '법왜곡죄 도입',
        subtitle: '법왜곡죄 국회 본회의 통과에 대한 찬반 투표',
        description: '더불어민주당에서 추진하는 법왜곡죄(형법 제131조의2) 신설안의 국회 본회의 통과에 대해 시민 여러분의 의견을 묻습니다.',
        detail: '법왜곡죄란?',
        detailContent: '법관, 검사 등 사법기관 종사자가 고의로 법을 왜곡하여 재판이나 수사를 진행한 경우 처벌하는 조항입니다.',
        agreeText: '법왜곡죄 도입에 찬성합니다',
        disagreeText: '법왜곡죄 도입에 반대합니다',
        status: 'active',
        color: 'red',
        deadline: '2026-03-31'
    },
    {
        id: 'trialCourt',
        title: '내란전담재판부 설치',
        subtitle: '내란 사건 전담 재판부 설치에 대한 찬반 투표',
        description: '내란죄 등 국가 중대 범죄를 전문적으로 심리하는 전담 재판부 설치에 대해 시민 여러분의 의견을 묻습니다.',
        detail: '내란전담재판부란?',
        detailContent: '내란죄, 외환죄 등 국가의 존립과 헌정질서를 위협하는 중대 범죄를 전문적으로 심리하기 위한 특별 재판부입니다.',
        agreeText: '내란전담재판부 설치에 찬성합니다',
        disagreeText: '내란전담재판부 설치에 반대합니다',
        status: 'active',
        color: 'orange',
        deadline: '2026-03-31'
    }
];

const COLOR_OPTIONS = [
    { value: 'blue', label: '파랑', bg: '#3b82f6' },
    { value: 'red', label: '빨강', bg: '#ef4444' },
    { value: 'orange', label: '주황', bg: '#f97316' },
    { value: 'green', label: '초록', bg: '#22c55e' },
    { value: 'purple', label: '보라', bg: '#a855f7' },
    { value: 'pink', label: '분홍', bg: '#ec4899' }
];

export default function GovernanceAdmin() {
    const [searchParams] = useSearchParams();
    const [isVerified, setIsVerified] = useState(false);
    const [adminCode, setAdminCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('topics'); // 'topics', 'proposals', 'votes', 'comments'

    // 의제 목록 상태
    const [topics, setTopics] = useState([]);
    const [editingTopic, setEditingTopic] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // 시민 제안 상태
    const [proposals, setProposals] = useState([]);
    const [editingProposal, setEditingProposal] = useState(null);
    const [proposalSupports, setProposalSupports] = useState({});
    const [proposalStatusTab, setProposalStatusTab] = useState('all'); // 'all', 'proposal', 'promoted', 'rejected'

    // 투표/댓글 통계
    const [voteStats, setVoteStats] = useState({});
    const [commentStats, setCommentStats] = useState({});

    // 투표 관리 상태
    const [selectedTopicForVotes, setSelectedTopicForVotes] = useState(null);
    const [voteAdjustment, setVoteAdjustment] = useState({ agree: 0, disagree: 0, reason: '' });
    const [adjustmentLogs, setAdjustmentLogs] = useState([]);

    // 새 의제 폼 상태
    const [newTopic, setNewTopic] = useState({
        id: '',
        title: '',
        subtitle: '',
        description: '',
        detail: '',
        detailContent: '',
        agreeText: '',
        disagreeText: '',
        status: 'active',
        color: 'blue',
        deadline: ''
    });

    // URL 파라미터로 관리자 자동 인증
    useEffect(() => {
        const adminCodeParam = searchParams.get('admin');
        const correctCode = getAdminCode();
        if (adminCodeParam && adminCodeParam === correctCode) {
            setIsVerified(true);
            loadAllData();
        }
    }, [searchParams]);

    // 관리자 코드 확인
    const handleVerify = () => {
        const correctCode = getAdminCode();
        if (adminCode === correctCode) {
            setIsVerified(true);
            setError('');
            loadAllData();
        } else {
            setError('관리자 코드가 올바르지 않습니다.');
        }
    };

    // 모든 데이터 로드
    const loadAllData = async () => {
        setIsLoading(true);
        await Promise.all([
            loadTopics(),
            loadProposals(),
        ]);
        setIsLoading(false);
    };

    // 의제 설정 로드
    const loadTopics = async () => {
        try {
            const settingsRef = doc(db, 'settings', 'governance');
            const settingsSnap = await getDoc(settingsRef);

            if (settingsSnap.exists()) {
                const data = settingsSnap.data();
                if (data.topics && data.topics.length > 0) {
                    setTopics(data.topics);
                    // 각 의제의 투표/댓글 통계 로드
                    await loadStatsForTopics(data.topics);
                } else {
                    const mergedTopics = DEFAULT_TOPICS.map(topic => ({
                        ...topic,
                        deadline: data.deadlines?.[topic.id] || topic.deadline
                    }));
                    setTopics(mergedTopics);
                    await loadStatsForTopics(mergedTopics);
                }
            } else {
                setTopics(DEFAULT_TOPICS);
                await loadStatsForTopics(DEFAULT_TOPICS);
            }
        } catch (err) {
            console.error('설정 로드 오류:', err);
            setTopics(DEFAULT_TOPICS);
        }
    };

    // 시민 제안 로드
    const loadProposals = async () => {
        try {
            const proposalsRef = collection(db, 'proposals');
            const q = query(proposalsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const fetchedProposals = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));

            setProposals(fetchedProposals);

            // 각 제안의 추천 수 로드
            const supports = {};
            for (const proposal of fetchedProposals) {
                const supportsRef = collection(db, `proposal_supports_${proposal.id}`);
                const supportsSnap = await getDocs(supportsRef);
                supports[proposal.id] = supportsSnap.size;
            }
            setProposalSupports(supports);
        } catch (err) {
            console.error('제안 로드 오류:', err);
        }
    };

    // 의제별 투표/댓글 통계 로드
    const loadStatsForTopics = async (topicsList) => {
        const votes = {};
        const comments = {};

        for (const topic of topicsList) {
            // 투표 수
            try {
                const votesRef = collection(db, `votes_${topic.id}`);
                const votesSnap = await getDocs(votesRef);
                let agree = 0, disagree = 0;
                votesSnap.docs.forEach(doc => {
                    const vote = doc.data().vote;
                    if (vote === 'agree') agree++;
                    else if (vote === 'disagree') disagree++;
                });
                votes[topic.id] = { agree, disagree, total: agree + disagree };
            } catch (e) {
                votes[topic.id] = { agree: 0, disagree: 0, total: 0 };
            }

            // 댓글 수
            try {
                const commentsRef = collection(db, `comments_${topic.id}`);
                const commentsSnap = await getDocs(commentsRef);
                comments[topic.id] = commentsSnap.size;
            } catch (e) {
                comments[topic.id] = 0;
            }
        }

        setVoteStats(votes);
        setCommentStats(comments);
    };

    // 의제 수정 저장
    const handleSaveEdit = async () => {
        if (!editingTopic) return;

        setIsLoading(true);
        setError('');

        try {
            const updatedTopics = topics.map(t =>
                t.id === editingTopic.id ? editingTopic : t
            );

            const settingsRef = doc(db, 'settings', 'governance');
            await setDoc(settingsRef, {
                topics: updatedTopics,
                updatedAt: new Date()
            }, { merge: true });

            setTopics(updatedTopics);
            setEditingTopic(null);
            setSuccessMessage('의제가 수정되었습니다.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('의제 수정 오류:', err);
            setError('의제 수정에 실패했습니다.');
        }
        setIsLoading(false);
    };

    // 새 의제 추가
    const handleAddTopic = async () => {
        if (!newTopic.title || !newTopic.id) {
            setError('의제 ID와 제목은 필수입니다.');
            return;
        }

        if (topics.some(t => t.id === newTopic.id)) {
            setError('이미 존재하는 의제 ID입니다.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const updatedTopics = [...topics, { ...newTopic, status: 'active' }];

            const settingsRef = doc(db, 'settings', 'governance');
            await setDoc(settingsRef, {
                topics: updatedTopics,
                updatedAt: new Date()
            }, { merge: true });

            setTopics(updatedTopics);
            setNewTopic({
                id: '', title: '', subtitle: '', description: '',
                detail: '', detailContent: '', agreeText: '', disagreeText: '',
                status: 'active', color: 'blue', deadline: ''
            });
            setShowAddForm(false);
            setSuccessMessage('새 의제가 추가되었습니다.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('의제 추가 오류:', err);
            setError('의제 추가에 실패했습니다.');
        }
        setIsLoading(false);
    };

    // 의제 삭제
    const handleDeleteTopic = async (topicId) => {
        if (!window.confirm('정말로 이 의제를 삭제하시겠습니까?')) return;

        setIsLoading(true);
        try {
            const updatedTopics = topics.filter(t => t.id !== topicId);
            const settingsRef = doc(db, 'settings', 'governance');
            await setDoc(settingsRef, { topics: updatedTopics, updatedAt: new Date() }, { merge: true });
            setTopics(updatedTopics);
            setSuccessMessage('의제가 삭제되었습니다.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('의제 삭제에 실패했습니다.');
        }
        setIsLoading(false);
    };

    // 제안을 의제로 승격
    const handlePromoteProposal = async (proposal) => {
        const newId = proposal.id;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);

        const newTopic = {
            id: newId,
            title: proposal.title,
            subtitle: proposal.subtitle || `${proposal.title}에 대한 찬반 투표`,
            description: proposal.description,
            detail: `${proposal.title}란?`,
            detailContent: proposal.description,
            agreeText: `${proposal.title}에 찬성합니다`,
            disagreeText: `${proposal.title}에 반대합니다`,
            status: 'active',
            color: 'green',
            deadline: deadline.toISOString().split('T')[0],
            promotedFrom: 'proposal'
        };

        setIsLoading(true);
        try {
            const updatedTopics = [...topics, newTopic];
            const settingsRef = doc(db, 'settings', 'governance');
            await setDoc(settingsRef, { topics: updatedTopics, updatedAt: new Date() }, { merge: true });
            setTopics(updatedTopics);

            // 제안 상태 업데이트 (proposals 컬렉션에서 status를 promoted로 변경)
            const proposalRef = doc(db, 'proposals', proposal.id);
            await updateDoc(proposalRef, {
                status: 'promoted',
                promotedAt: new Date()
            });

            setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: 'promoted' } : p));
            setSuccessMessage('제안이 정식 의제로 승격되었습니다.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('승격에 실패했습니다.');
        }
        setIsLoading(false);
    };

    // 제안 삭제
    const handleDeleteProposal = async (proposalId) => {
        if (!window.confirm('정말로 이 제안을 삭제하시겠습니까?')) return;

        setIsLoading(true);
        try {
            await deleteDoc(doc(db, 'proposals', proposalId));
            setProposals(prev => prev.filter(p => p.id !== proposalId));
            setSuccessMessage('제안이 삭제되었습니다.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('제안 삭제에 실패했습니다.');
        }
        setIsLoading(false);
    };

    // 제안 수정 저장
    const handleSaveProposal = async () => {
        if (!editingProposal) return;

        setIsLoading(true);
        try {
            const proposalRef = doc(db, 'proposals', editingProposal.id);
            await setDoc(proposalRef, {
                title: editingProposal.title,
                description: editingProposal.description,
                status: editingProposal.status,
                updatedAt: new Date()
            }, { merge: true });

            setProposals(prev => prev.map(p => p.id === editingProposal.id ? editingProposal : p));
            setEditingProposal(null);
            setSuccessMessage('제안이 수정되었습니다.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('제안 수정에 실패했습니다.');
        }
        setIsLoading(false);
    };

    const getColorBg = (color) => {
        const found = COLOR_OPTIONS.find(c => c.value === color);
        return found ? found.bg : '#3b82f6';
    };

    // 테스트 투표 삭제 (admin_test_* ID만)
    const handleDeleteTestVotes = async (topicId) => {
        if (!window.confirm('테스트 투표 데이터(admin_test_*)를 삭제하시겠습니까?')) return;

        setIsLoading(true);
        try {
            const votesRef = collection(db, `votes_${topicId}`);
            const votesSnap = await getDocs(votesRef);

            let deletedCount = 0;
            for (const docSnap of votesSnap.docs) {
                if (docSnap.id.startsWith('admin_test_')) {
                    await deleteDoc(doc(db, `votes_${topicId}`, docSnap.id));
                    deletedCount++;
                }
            }

            // 통계 새로고침
            await loadStatsForTopics(topics);

            setSuccessMessage(`${deletedCount}개의 테스트 투표가 삭제되었습니다.`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('테스트 투표 삭제에 실패했습니다.');
        }
        setIsLoading(false);
    };

    // 투표 수 조정 (로그 기록 포함)
    const handleAdjustVotes = async (topicId) => {
        if (!voteAdjustment.reason.trim()) {
            setError('조정 사유를 입력해주세요.');
            return;
        }

        const currentStats = voteStats[topicId] || { agree: 0, disagree: 0 };
        const newAgree = Math.max(0, currentStats.agree + voteAdjustment.agree);
        const newDisagree = Math.max(0, currentStats.disagree + voteAdjustment.disagree);

        setIsLoading(true);
        try {
            // 조정 로그 기록
            const logRef = collection(db, 'vote_adjustments');
            await addDoc(logRef, {
                topicId,
                topicTitle: topics.find(t => t.id === topicId)?.title || topicId,
                beforeAgree: currentStats.agree,
                beforeDisagree: currentStats.disagree,
                adjustAgree: voteAdjustment.agree,
                adjustDisagree: voteAdjustment.disagree,
                afterAgree: newAgree,
                afterDisagree: newDisagree,
                reason: voteAdjustment.reason,
                adjustedAt: new Date(),
                adjustedBy: 'admin'
            });

            // 조정된 투표 수를 settings에 저장
            const settingsRef = doc(db, 'settings', 'vote_adjustments');
            const settingsSnap = await getDoc(settingsRef);
            const existingAdjustments = settingsSnap.exists() ? settingsSnap.data().adjustments || {} : {};

            await setDoc(settingsRef, {
                adjustments: {
                    ...existingAdjustments,
                    [topicId]: {
                        agree: (existingAdjustments[topicId]?.agree || 0) + voteAdjustment.agree,
                        disagree: (existingAdjustments[topicId]?.disagree || 0) + voteAdjustment.disagree
                    }
                },
                updatedAt: new Date()
            }, { merge: true });

            // 통계 업데이트
            setVoteStats(prev => ({
                ...prev,
                [topicId]: { agree: newAgree, disagree: newDisagree, total: newAgree + newDisagree }
            }));

            setVoteAdjustment({ agree: 0, disagree: 0, reason: '' });
            setSelectedTopicForVotes(null);
            setSuccessMessage('투표 수가 조정되었습니다. 조정 이력이 기록되었습니다.');
            setTimeout(() => setSuccessMessage(''), 3000);

            // 조정 로그 새로고침
            await loadAdjustmentLogs();
        } catch (err) {
            console.error('투표 조정 오류:', err);
            setError('투표 수 조정에 실패했습니다.');
        }
        setIsLoading(false);
    };

    // 조정 로그 로드
    const loadAdjustmentLogs = async () => {
        try {
            const logsRef = collection(db, 'vote_adjustments');
            const q = query(logsRef, orderBy('adjustedAt', 'desc'));
            const logsSnap = await getDocs(q);

            const logs = logsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                adjustedAt: doc.data().adjustedAt?.toDate?.() || new Date()
            }));
            setAdjustmentLogs(logs);
        } catch (err) {
            console.error('조정 로그 로드 오류:', err);
        }
    };

    // 의제 폼 컴포넌트
    const TopicForm = ({ topic, setTopic, onSave, onCancel, isNew = false }) => (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {isNew ? '새 의제 추가' : `의제 수정: ${topic.title}`}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isNew && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">의제 ID (영문)</label>
                        <input
                            type="text"
                            value={topic.id}
                            onChange={(e) => setTopic({ ...topic, id: e.target.value.replace(/[^a-zA-Z0-9]/g, '') })}
                            placeholder="예: newTopic123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                <div className={isNew ? '' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => setTopic({ ...topic, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">부제목</label>
                    <input
                        type="text"
                        value={topic.subtitle}
                        onChange={(e) => setTopic({ ...topic, subtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                        value={topic.description}
                        onChange={(e) => setTopic({ ...topic, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상세 제목</label>
                    <input
                        type="text"
                        value={topic.detail}
                        onChange={(e) => setTopic({ ...topic, detail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                    <input
                        type="date"
                        value={topic.deadline}
                        onChange={(e) => setTopic({ ...topic, deadline: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                    <textarea
                        value={topic.detailContent}
                        onChange={(e) => setTopic({ ...topic, detailContent: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">찬성 버튼 텍스트</label>
                    <input
                        type="text"
                        value={topic.agreeText}
                        onChange={(e) => setTopic({ ...topic, agreeText: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">반대 버튼 텍스트</label>
                    <input
                        type="text"
                        value={topic.disagreeText}
                        onChange={(e) => setTopic({ ...topic, disagreeText: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">테마 색상</label>
                    <div className="flex gap-2">
                        {COLOR_OPTIONS.map(color => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => setTopic({ ...topic, color: color.value })}
                                style={{ backgroundColor: color.bg }}
                                className={`w-8 h-8 rounded-full ${topic.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                title={color.label}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <select
                        value={topic.status}
                        onChange={(e) => setTopic({ ...topic, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="active">활성 (투표 가능)</option>
                        <option value="closed">종료 (투표 불가)</option>
                        <option value="draft">초안 (비공개)</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    onClick={onSave}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {isLoading ? '저장 중...' : '저장'}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                    취소
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* 헤더 */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="text-xl font-bold text-blue-600">시민법정</Link>
                        <div className="flex items-center gap-4">
                            {isVerified && (
                                <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                                    관리자 모드
                                </span>
                            )}
                            <a
                                href="/governance"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-blue-600 transition text-sm"
                            >
                                거버넌스 페이지 보기 ↗
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
                        거버넌스 관리자 설정
                    </h1>

                    {!isVerified ? (
                        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">관리자 인증</h2>
                            <div className="space-y-4">
                                <input
                                    type="password"
                                    value={adminCode}
                                    onChange={(e) => setAdminCode(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                                    placeholder="관리자 코드를 입력하세요"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
                                <button
                                    onClick={handleVerify}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 메시지 */}
                            {error && <p className="text-red-600 bg-red-50 p-4 rounded-xl">{error}</p>}
                            {successMessage && <p className="text-green-600 bg-green-50 p-4 rounded-xl">{successMessage}</p>}

                            {/* 탭 메뉴 */}
                            <div className="flex gap-2 bg-white p-2 rounded-xl shadow flex-wrap">
                                {[
                                    { id: 'topics', label: '의제 관리', count: topics.length },
                                    { id: 'proposals', label: '시민 제안', count: proposals.length },
                                    { id: 'votes', label: '투표 관리', count: null },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${activeTab === tab.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tab.label} {tab.count !== null && `(${tab.count})`}
                                    </button>
                                ))}
                            </div>

                            {/* 의제 관리 탭 */}
                            {activeTab === 'topics' && (
                                <div className="space-y-4">
                                    {!showAddForm && !editingTopic && (
                                        <button
                                            onClick={() => setShowAddForm(true)}
                                            className="w-full py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                                        >
                                            + 새 의제 추가
                                        </button>
                                    )}

                                    {showAddForm && (
                                        <TopicForm
                                            topic={newTopic}
                                            setTopic={setNewTopic}
                                            onSave={handleAddTopic}
                                            onCancel={() => setShowAddForm(false)}
                                            isNew={true}
                                        />
                                    )}

                                    {editingTopic && (
                                        <TopicForm
                                            topic={editingTopic}
                                            setTopic={setEditingTopic}
                                            onSave={handleSaveEdit}
                                            onCancel={() => setEditingTopic(null)}
                                            isNew={false}
                                        />
                                    )}

                                    {!showAddForm && !editingTopic && (
                                        <div className="bg-white rounded-2xl shadow-lg p-6">
                                            <h2 className="text-xl font-semibold text-gray-800 mb-4">의제 목록</h2>
                                            {isLoading ? (
                                                <div className="text-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {topics.map(topic => (
                                                        <div key={topic.id} className="p-4 bg-gray-50 rounded-xl">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorBg(topic.color) }} />
                                                                        <h3 className="font-semibold text-gray-800">{topic.title}</h3>
                                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${topic.status === 'active' ? 'bg-green-100 text-green-700' :
                                                                                topic.status === 'closed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                                                                            }`}>
                                                                            {topic.status === 'active' ? '활성' : topic.status === 'closed' ? '종료' : '초안'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 truncate">{topic.subtitle}</p>
                                                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                                                        <span>ID: {topic.id}</span>
                                                                        <span>마감: {topic.deadline || '미설정'}</span>
                                                                        {voteStats[topic.id] && (
                                                                            <span className="text-blue-600">
                                                                                찬성 {voteStats[topic.id].agree} / 반대 {voteStats[topic.id].disagree}
                                                                            </span>
                                                                        )}
                                                                        {commentStats[topic.id] !== undefined && (
                                                                            <span className="text-purple-600">댓글 {commentStats[topic.id]}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 shrink-0">
                                                                    <button
                                                                        onClick={() => setEditingTopic({ ...topic })}
                                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                                                                    >
                                                                        수정
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteTopic(topic.id)}
                                                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                                                                    >
                                                                        삭제
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {topics.length === 0 && (
                                                        <p className="text-center text-gray-500 py-8">등록된 의제가 없습니다.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 시민 제안 탭 */}
                            {activeTab === 'proposals' && (
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">시민 제안 목록</h2>

                                    {/* 상태별 서브탭 */}
                                    <div className="flex flex-wrap gap-2 mb-4 border-b pb-4">
                                        {[
                                            { id: 'all', label: '전체', count: proposals.length },
                                            { id: 'proposal', label: '제안중', count: proposals.filter(p => p.status === 'proposal').length, color: 'blue' },
                                            { id: 'promoted', label: '승격됨', count: proposals.filter(p => p.status === 'promoted').length, color: 'green' },
                                            { id: 'rejected', label: '반려됨', count: proposals.filter(p => p.status === 'rejected').length, color: 'red' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setProposalStatusTab(tab.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    proposalStatusTab === tab.id
                                                        ? tab.color === 'blue' ? 'bg-blue-600 text-white'
                                                            : tab.color === 'green' ? 'bg-green-600 text-white'
                                                            : tab.color === 'red' ? 'bg-red-600 text-white'
                                                            : 'bg-gray-800 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {tab.label} ({tab.count})
                                            </button>
                                        ))}
                                    </div>

                                    {/* 자동 승격/반려 안내 */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <p className="text-sm text-blue-700">
                                            <strong>자동 승격/반려 시스템:</strong> 제안일로부터 30일 이내 10명 이상 추천 시 자동 승격, 30일 경과 후 추천 수 미달 시 자동 반려됩니다.
                                        </p>
                                    </div>

                                    {editingProposal ? (
                                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                            <h3 className="font-semibold">제안 수정</h3>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">제목</label>
                                                <input
                                                    type="text"
                                                    value={editingProposal.title}
                                                    onChange={(e) => setEditingProposal({ ...editingProposal, title: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">설명</label>
                                                <textarea
                                                    value={editingProposal.description}
                                                    onChange={(e) => setEditingProposal({ ...editingProposal, description: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">상태</label>
                                                <select
                                                    value={editingProposal.status}
                                                    onChange={(e) => setEditingProposal({ ...editingProposal, status: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                >
                                                    <option value="proposal">제안 중</option>
                                                    <option value="promoted">승격됨</option>
                                                    <option value="rejected">반려됨</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveProposal} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">저장</button>
                                                <button onClick={() => setEditingProposal(null)} className="flex-1 py-2 bg-gray-200 rounded-lg">취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {proposals
                                                .filter(p => proposalStatusTab === 'all' || p.status === proposalStatusTab)
                                                .map(proposal => (
                                                <div key={proposal.id} className="p-4 bg-gray-50 rounded-xl">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <h3 className="font-semibold text-gray-800">{proposal.title}</h3>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${proposal.status === 'proposal' ? 'bg-blue-100 text-blue-700' :
                                                                        proposal.status === 'promoted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {proposal.status === 'proposal' ? '제안 중' : proposal.status === 'promoted' ? '승격됨' : '반려됨'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 line-clamp-2">{proposal.description}</p>
                                                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                                                <span>제안자: {proposal.proposerName}</span>
                                                                <span className="text-orange-600">추천 {proposalSupports[proposal.id] || 0}명</span>
                                                                <span>제안일: {proposal.createdAt?.toLocaleDateString?.() || ''}</span>
                                                            </div>
                                                            {/* 반려 사유 표시 */}
                                                            {proposal.status === 'rejected' && proposal.rejectedReason && (
                                                                <div className="mt-2 text-xs bg-red-50 text-red-600 p-2 rounded">
                                                                    <strong>반려 사유:</strong> {proposal.rejectedReason}
                                                                    {proposal.rejectedAt && (
                                                                        <span className="ml-2 text-red-400">
                                                                            (반려일: {proposal.rejectedAt?.toLocaleDateString?.() || new Date(proposal.rejectedAt).toLocaleDateString()})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* 승격 정보 표시 */}
                                                            {proposal.status === 'promoted' && proposal.promotedAt && (
                                                                <div className="mt-2 text-xs bg-green-50 text-green-600 p-2 rounded">
                                                                    <strong>승격일:</strong> {proposal.promotedAt?.toLocaleDateString?.() || new Date(proposal.promotedAt).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-2 shrink-0">
                                                            {proposal.status === 'proposal' && (
                                                                <button
                                                                    onClick={() => handlePromoteProposal(proposal)}
                                                                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                                                                >
                                                                    의제로 승격
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setEditingProposal({ ...proposal })}
                                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                                                            >
                                                                수정
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProposal(proposal.id)}
                                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {proposals.filter(p => proposalStatusTab === 'all' || p.status === proposalStatusTab).length === 0 && (
                                                <p className="text-center text-gray-500 py-8">
                                                    {proposalStatusTab === 'all' ? '등록된 제안이 없습니다.' :
                                                     proposalStatusTab === 'proposal' ? '진행 중인 제안이 없습니다.' :
                                                     proposalStatusTab === 'promoted' ? '승격된 제안이 없습니다.' :
                                                     '반려된 제안이 없습니다.'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 투표 관리 탭 */}
                            {activeTab === 'votes' && (
                                <div className="space-y-6">
                                    {/* 의제별 투표 현황 */}
                                    <div className="bg-white rounded-2xl shadow-lg p-6">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4">의제별 투표 현황</h2>

                                        <div className="space-y-4">
                                            {topics.map(topic => (
                                                <div key={topic.id} className="p-4 bg-gray-50 rounded-xl">
                                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorBg(topic.color) }} />
                                                                <h3 className="font-semibold text-gray-800">{topic.title}</h3>
                                                            </div>
                                                            <div className="flex gap-4 text-sm">
                                                                <span className="text-green-600 font-medium">
                                                                    찬성: {voteStats[topic.id]?.agree || 0}표
                                                                </span>
                                                                <span className="text-red-600 font-medium">
                                                                    반대: {voteStats[topic.id]?.disagree || 0}표
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    총 {voteStats[topic.id]?.total || 0}표
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleDeleteTestVotes(topic.id)}
                                                                disabled={isLoading}
                                                                className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 disabled:opacity-50"
                                                            >
                                                                테스트 투표 삭제
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTopicForVotes(topic.id);
                                                                    setVoteAdjustment({ agree: 0, disagree: 0, reason: '' });
                                                                    loadAdjustmentLogs();
                                                                }}
                                                                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                                                            >
                                                                투표 수 조정
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* 투표 조정 폼 */}
                                                    {selectedTopicForVotes === topic.id && (
                                                        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                            <h4 className="font-medium text-purple-800 mb-3">투표 수 조정</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                <div>
                                                                    <label className="block text-sm text-gray-600 mb-1">찬성 조정 (+ 또는 -)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={voteAdjustment.agree}
                                                                        onChange={(e) => setVoteAdjustment({ ...voteAdjustment, agree: parseInt(e.target.value) || 0 })}
                                                                        className="w-full px-3 py-2 border rounded-lg"
                                                                        placeholder="예: 5 또는 -3"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm text-gray-600 mb-1">반대 조정 (+ 또는 -)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={voteAdjustment.disagree}
                                                                        onChange={(e) => setVoteAdjustment({ ...voteAdjustment, disagree: parseInt(e.target.value) || 0 })}
                                                                        className="w-full px-3 py-2 border rounded-lg"
                                                                        placeholder="예: 5 또는 -3"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="mb-3">
                                                                <label className="block text-sm text-gray-600 mb-1">조정 사유 (필수)</label>
                                                                <textarea
                                                                    value={voteAdjustment.reason}
                                                                    onChange={(e) => setVoteAdjustment({ ...voteAdjustment, reason: e.target.value })}
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border rounded-lg"
                                                                    placeholder="조정 사유를 입력하세요 (예: 중복 투표 제거, 테스트 데이터 보정 등)"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleAdjustVotes(topic.id)}
                                                                    disabled={isLoading || !voteAdjustment.reason.trim()}
                                                                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                                                                >
                                                                    {isLoading ? '처리 중...' : '조정 적용'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedTopicForVotes(null)}
                                                                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-purple-600 mt-2">
                                                                * 조정 내역은 모두 기록되며, 아래 이력에서 확인할 수 있습니다.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {topics.length === 0 && (
                                                <p className="text-center text-gray-500 py-8">등록된 의제가 없습니다.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 조정 이력 */}
                                    <div className="bg-white rounded-2xl shadow-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-semibold text-gray-800">투표 조정 이력</h2>
                                            <button
                                                onClick={loadAdjustmentLogs}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                                            >
                                                새로고침
                                            </button>
                                        </div>

                                        {adjustmentLogs.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">일시</th>
                                                            <th className="px-3 py-2 text-left">의제</th>
                                                            <th className="px-3 py-2 text-center">이전</th>
                                                            <th className="px-3 py-2 text-center">조정</th>
                                                            <th className="px-3 py-2 text-center">이후</th>
                                                            <th className="px-3 py-2 text-left">사유</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {adjustmentLogs.map(log => (
                                                            <tr key={log.id} className="border-b hover:bg-gray-50">
                                                                <td className="px-3 py-2 whitespace-nowrap">
                                                                    {log.adjustedAt?.toLocaleString?.() || '-'}
                                                                </td>
                                                                <td className="px-3 py-2">{log.topicTitle}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className="text-green-600">찬{log.beforeAgree}</span>
                                                                    {' / '}
                                                                    <span className="text-red-600">반{log.beforeDisagree}</span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center font-medium">
                                                                    <span className={log.adjustAgree >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                        {log.adjustAgree >= 0 ? '+' : ''}{log.adjustAgree}
                                                                    </span>
                                                                    {' / '}
                                                                    <span className={log.adjustDisagree >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                        {log.adjustDisagree >= 0 ? '+' : ''}{log.adjustDisagree}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className="text-green-600">찬{log.afterAgree}</span>
                                                                    {' / '}
                                                                    <span className="text-red-600">반{log.afterDisagree}</span>
                                                                </td>
                                                                <td className="px-3 py-2 max-w-xs truncate" title={log.reason}>
                                                                    {log.reason}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">
                                                조정 이력이 없습니다.
                                            </p>
                                        )}
                                    </div>

                                    {/* 안내 */}
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <h3 className="font-medium text-red-800 mb-2">주의사항</h3>
                                        <ul className="text-sm text-red-700 space-y-1">
                                            <li>- 테스트 투표 삭제: admin_test_로 시작하는 ID의 투표만 삭제됩니다.</li>
                                            <li>- 투표 수 조정: 모든 조정 내역은 기록되며 삭제할 수 없습니다.</li>
                                            <li>- 조정된 투표 수는 실제 투표 데이터에는 영향을 주지 않고, 화면 표시에만 반영됩니다.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* 안내 */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <h3 className="font-medium text-yellow-800 mb-2">안내</h3>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    <li>- 의제를 수정하면 즉시 거버넌스 페이지에 반영됩니다.</li>
                                    <li>- 시민 제안을 의제로 승격하면 30일간 투표가 진행됩니다.</li>
                                    <li>- 상태를 '초안'으로 설정하면 페이지에 표시되지 않습니다.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
