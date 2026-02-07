import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { onAuthChange } from '../lib/auth';

// 관리자 작성자 코드 (환경변수에서 가져옴)
const getAdminWriterCodes = () => {
    const adminCode = import.meta.env.VITE_ADMIN_CODE;
    const writerCode = import.meta.env.VITE_WRITER_CODE;
    return [adminCode, writerCode].filter(Boolean);
};
const ADMIN_WRITER_CODES = getAdminWriterCodes();

// 제안이 정식 투표로 승격되기 위한 최소 추천 수
const MIN_SUPPORTS_FOR_PROMOTION = 10;

// 제안 마감 기간 (일) - 이 기간 내 추천 수 미달 시 자동 반려
const PROPOSAL_DEADLINE_DAYS = 30;

// 기본 의제 정의
const DEFAULT_TOPICS = [
    {
        id: 'jurySystem',
        title: '시민법관 참심제 도입',
        subtitle: '시민법관 참심제 도입에 대한 찬반 투표',
        description: '시민이 직업 법관과 함께 재판에 참여하여 유무죄와 양형을 결정하는 참심제 도입에 대해 시민 여러분의 의견을 묻습니다.',
        detail: '시민법관 참심제란?',
        detailContent: '일반 시민이 법관과 동등한 권한으로 재판에 참여하여 유무죄 판단과 양형을 함께 결정하는 제도입니다. 독일, 프랑스 등 민주주의 선진국에서 시행 중이며, 사법의 민주적 정당성을 높이는 핵심 제도입니다.',
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
        detailContent: '법관, 검사 등 사법기관 종사자가 고의로 법을 왜곡하여 재판이나 수사를 진행한 경우 처벌하는 조항입니다. 독일 형법에 이미 존재하며, 사법부의 책임성을 높이기 위한 제도입니다.',
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
        detailContent: '내란죄, 외환죄 등 국가의 존립과 헌정질서를 위협하는 중대 범죄를 전문적으로 심리하기 위한 특별 재판부입니다. 신속하고 전문적인 재판을 통해 국가 안보와 민주주의를 수호하기 위한 제도입니다.',
        agreeText: '내란전담재판부 설치에 찬성합니다',
        disagreeText: '내란전담재판부 설치에 반대합니다',
        status: 'active',
        color: 'orange',
        deadline: '2026-03-31'
    }
];

export default function Governance() {
    const [searchParams] = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
    const [introDropdownOpen, setIntroDropdownOpen] = useState(false);
    const [casesDropdownOpen, setCasesDropdownOpen] = useState(false);

    // 주제 관리 상태
    const [topics, setTopics] = useState(DEFAULT_TOPICS);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [writerCode, setWriterCode] = useState('');
    const [isAdminVerified, setIsAdminVerified] = useState(false);

    // URL 파라미터로 관리자 자동 인증 (?admin=SbAdmin2025!)
    useEffect(() => {
        const adminCode = searchParams.get('admin');
        if (adminCode && ADMIN_WRITER_CODES.includes(adminCode)) {
            setIsAdminVerified(true);
            setWriterCode(adminCode);
        }
    }, [searchParams]);

    // 새 주제 생성 폼 상태
    const [newTopic, setNewTopic] = useState({
        title: '',
        subtitle: '',
        description: '',
        detail: '',
        detailContent: '',
        agreeText: '',
        disagreeText: '',
        deadline: '',
        color: 'blue'
    });

    // 의제별 투표 상태
    const [votes, setVotes] = useState({
        lawDistortion: { agree: 0, disagree: 0 },
        trialCourt: { agree: 0, disagree: 0 },
        jurySystem: { agree: 0, disagree: 0 }
    });
    const [userVotes, setUserVotes] = useState({
        lawDistortion: null,
        trialCourt: null,
        jurySystem: null
    });

    // 의제별 댓글 상태
    const [comments, setComments] = useState({
        lawDistortion: [],
        trialCourt: [],
        jurySystem: []
    });

    // 제안 주제 상태
    const [proposals, setProposals] = useState([]);
    const [rejectedProposals, setRejectedProposals] = useState([]); // 반려된 제안들
    const [proposalSupports, setProposalSupports] = useState({}); // { proposalId: supportCount }
    const [userSupports, setUserSupports] = useState({}); // { proposalId: true/false }
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [showCommunityGuideModal, setShowCommunityGuideModal] = useState(false);
    const [newProposal, setNewProposal] = useState({
        title: '',
        subtitle: '',
        description: '',
        detail: '',
        detailContent: '',
        proposerName: ''
    });

    // 공통 상태
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTabs, setActiveTabs] = useState({
        lawDistortion: 'all',
        trialCourt: 'all',
        jurySystem: 'all'
    });

    // 로그인 상태 관리
    const [currentUser, setCurrentUser] = useState(null);

    // 로그인 상태 감지
    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // 로그인한 사용자의 투표/추천 기록 확인
    useEffect(() => {
        const checkUserHistory = async () => {
            if (!currentUser) {
                setUserVotes({});
                setUserSupports({});
                return;
            }

            // 사용자의 기존 투표 확인
            const votesHistory = {};
            for (const topic of topics) {
                const voteRef = doc(db, `votes_${topic.id}`, currentUser.uid);
                const voteSnap = await getDoc(voteRef);
                if (voteSnap.exists()) {
                    votesHistory[topic.id] = voteSnap.data().vote;
                }
            }
            setUserVotes(votesHistory);

            // 사용자의 기존 추천 확인
            const supportsHistory = {};
            for (const proposal of proposals) {
                const supportRef = doc(db, `proposal_supports_${proposal.id}`, currentUser.uid);
                const supportSnap = await getDoc(supportRef);
                if (supportSnap.exists()) {
                    supportsHistory[proposal.id] = true;
                }
            }
            setUserSupports(supportsHistory);
        };

        checkUserHistory();
    }, [currentUser, topics, proposals]);

    // Firestore에서 의제 설정 불러오기
    useEffect(() => {
        const loadTopicSettings = async () => {
            try {
                const settingsRef = doc(db, 'settings', 'governance');
                const settingsSnap = await getDoc(settingsRef);

                if (settingsSnap.exists()) {
                    const data = settingsSnap.data();

                    // topics 배열이 있으면 사용, 없으면 기존 deadlines 방식으로 fallback
                    if (data.topics && data.topics.length > 0) {
                        // status가 'draft'가 아닌 것만 표시
                        const activeTopics = data.topics.filter(t => t.status !== 'draft');
                        setTopics(activeTopics);
                    } else if (data.deadlines) {
                        // 기존 방식: deadlines만 적용
                        setTopics(prevTopics => prevTopics.map(topic => ({
                            ...topic,
                            deadline: data.deadlines[topic.id] || topic.deadline
                        })));
                    }
                }
            } catch (error) {
                console.error('의제 설정 로드 실패:', error);
            }
        };

        loadTopicSettings();
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        topics.forEach(topic => {
            fetchVotes(topic.id);
            fetchComments(topic.id);
        });

        // 제안 목록 로드
        fetchProposals();
    }, [topics]);

    // 제안 목록 가져오기
    const fetchProposals = async () => {
        try {
            const proposalsRef = collection(db, 'proposals');
            const q = query(proposalsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const fetchedProposals = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));

            // 추천 수 로드
            const supports = {};
            const proposalsToPromote = [];
            const proposalsToReject = [];
            const activeProposals = [];
            const alreadyRejected = [];
            const now = new Date();

            for (const proposal of fetchedProposals) {
                const supportsRef = collection(db, `proposal_supports_${proposal.id}`);
                const supportsSnapshot = await getDocs(supportsRef);
                const supportCount = supportsSnapshot.size;
                supports[proposal.id] = supportCount;

                // 이미 반려된 제안은 반려 목록으로
                if (proposal.status === 'rejected') {
                    alreadyRejected.push(proposal);
                    continue;
                }

                // 이미 승격된 제안은 무시
                if (proposal.status === 'promoted') {
                    continue;
                }

                // 제안 생성일로부터 경과 일수 계산
                const createdDate = proposal.createdAt instanceof Date
                    ? proposal.createdAt
                    : new Date(proposal.createdAt);
                const daysPassed = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

                // 추천 수가 기준 이상이면 승격 대상
                if (supportCount >= MIN_SUPPORTS_FOR_PROMOTION) {
                    proposalsToPromote.push(proposal);
                }
                // 마감 기한이 지났고 추천 수 미달이면 반려 대상
                else if (daysPassed >= PROPOSAL_DEADLINE_DAYS) {
                    proposalsToReject.push({
                        ...proposal,
                        rejectedReason: `${PROPOSAL_DEADLINE_DAYS}일 기한 내 추천 수 미달 (${supportCount}/${MIN_SUPPORTS_FOR_PROMOTION}명)`,
                        rejectedAt: now
                    });
                }
                // 아직 진행 중인 제안
                else {
                    activeProposals.push({
                        ...proposal,
                        daysRemaining: PROPOSAL_DEADLINE_DAYS - daysPassed
                    });
                }
            }

            // 반려 대상 제안들의 상태를 Firestore에 업데이트
            for (const proposal of proposalsToReject) {
                try {
                    const proposalRef = doc(db, 'proposals', proposal.id);
                    await updateDoc(proposalRef, {
                        status: 'rejected',
                        rejectedReason: proposal.rejectedReason,
                        rejectedAt: proposal.rejectedAt
                    });
                } catch (error) {
                    console.error(`제안 반려 처리 실패 (${proposal.id}):`, error);
                }
            }

            // 승격 대상 제안을 투표 섹션으로 이동
            if (proposalsToPromote.length > 0) {
                const newTopics = proposalsToPromote.map(proposal => {
                    const deadline = new Date();
                    deadline.setDate(deadline.getDate() + 30);

                    return {
                        id: proposal.id,
                        title: proposal.title,
                        subtitle: proposal.subtitle || `${proposal.title}에 대한 시민 투표`,
                        description: proposal.description,
                        detail: proposal.detail || '제안 상세',
                        detailContent: proposal.detailContent || proposal.description,
                        agreeText: `${proposal.title}에 찬성합니다`,
                        disagreeText: `${proposal.title}에 반대합니다`,
                        status: 'active',
                        color: 'purple',
                        deadline: deadline.toISOString().split('T')[0],
                        startDate: new Date().toISOString().split('T')[0],
                        promotedFrom: 'proposal',
                        proposerName: proposal.proposerName
                    };
                });

                // Firestore settings/governance에 새 의제 추가
                try {
                    const settingsRef = doc(db, 'settings', 'governance');
                    const settingsSnap = await getDoc(settingsRef);

                    let existingTopics = [];
                    if (settingsSnap.exists()) {
                        existingTopics = settingsSnap.data().topics || [];
                    }

                    // 중복 체크 후 추가
                    const existingIds = existingTopics.map(t => t.id);
                    const uniqueNewTopics = newTopics.filter(t => !existingIds.includes(t.id));

                    if (uniqueNewTopics.length > 0) {
                        await setDoc(settingsRef, {
                            topics: [...existingTopics, ...uniqueNewTopics]
                        }, { merge: true });
                    }
                } catch (error) {
                    console.error('settings 저장 실패:', error);
                }

                // 승격된 제안들의 상태를 Firestore에 업데이트
                for (const proposal of proposalsToPromote) {
                    try {
                        const proposalRef = doc(db, 'proposals', proposal.id);
                        await updateDoc(proposalRef, {
                            status: 'promoted',
                            promotedAt: new Date()
                        });
                    } catch (error) {
                        console.error(`제안 승격 처리 실패 (${proposal.id}):`, error);
                    }
                }

                setTopics(prev => {
                    // 이미 존재하는 토픽은 제외
                    const existingIds = prev.map(t => t.id);
                    const uniqueNewTopics = newTopics.filter(t => !existingIds.includes(t.id));
                    return [...prev, ...uniqueNewTopics];
                });
            }

            setProposals(activeProposals);
            setRejectedProposals([...alreadyRejected, ...proposalsToReject]);
            setProposalSupports(supports);

            // 사용자 추천 확인은 로그인 후 별도로 처리
            setUserSupports({});
        } catch (error) {
            console.error('제안 목록 로드 실패:', error);
        }
    };

    // 제안 추천하기
    const handleSupport = async (proposalId) => {
        // 로그인 확인
        if (!currentUser) {
            alert('로그인이 필요합니다. 메인 페이지에서 로그인해주세요.');
            return;
        }

        // 이미 추천한 경우 (관리자 테스트 모드가 아닐 때만 체크)
        if (userSupports[proposalId] && !isAdminVerified) {
            alert('이미 추천하셨습니다.');
            return;
        }

        try {
            // 관리자 테스트 모드: 랜덤 ID 사용, 일반 사용자: 사용자 ID로 중복 방지
            const docId = isAdminVerified ? `admin_test_${Date.now()}` : currentUser.uid;
            const supportRef = doc(db, `proposal_supports_${proposalId}`, docId);
            await setDoc(supportRef, {
                createdAt: new Date(),
                userId: docId,
                displayName: isAdminVerified ? '관리자테스트' : (currentUser.displayName || '')
            });

            setUserSupports(prev => ({ ...prev, [proposalId]: true }));

            const newSupportCount = (proposalSupports[proposalId] || 0) + 1;
            setProposalSupports(prev => ({ ...prev, [proposalId]: newSupportCount }));

            // 추천 수가 기준에 도달하면 정식 투표로 승격
            if (newSupportCount >= MIN_SUPPORTS_FOR_PROMOTION) {
                await promoteProposal(proposalId);
            }

            alert('추천되었습니다!');
        } catch (error) {
            console.error('추천 실패:', error);
            alert('추천에 실패했습니다.');
        }
    };

    // 제안을 정식 투표로 승격
    const promoteProposal = async (proposalId) => {
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;

        // 30일 후 마감일 설정
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);

        const newTopic = {
            id: proposalId,
            title: proposal.title,
            subtitle: proposal.subtitle || `${proposal.title}에 대한 시민 투표`,
            description: proposal.description,
            detail: proposal.detail || '제안 상세',
            detailContent: proposal.detailContent || proposal.description,
            agreeText: `${proposal.title}에 찬성합니다`,
            disagreeText: `${proposal.title}에 반대합니다`,
            status: 'active',
            color: 'purple',
            deadline: deadline.toISOString().split('T')[0],
            startDate: new Date().toISOString().split('T')[0],
            promotedFrom: 'proposal',
            proposerName: proposal.proposerName
        };

        try {
            // 1. Firestore settings/governance에 새 의제 추가
            const settingsRef = doc(db, 'settings', 'governance');
            const settingsSnap = await getDoc(settingsRef);

            let existingTopics = [];
            if (settingsSnap.exists()) {
                existingTopics = settingsSnap.data().topics || [];
            }

            // 중복 체크 후 추가
            if (!existingTopics.find(t => t.id === proposalId)) {
                await setDoc(settingsRef, {
                    topics: [...existingTopics, newTopic]
                }, { merge: true });
            }

            // 2. proposals 컬렉션에서 해당 제안의 상태를 'promoted'로 업데이트
            const proposalRef = doc(db, 'proposals', proposalId);
            await updateDoc(proposalRef, {
                status: 'promoted',
                promotedAt: new Date()
            });

            // 3. UI 상태 업데이트
            setTopics(prev => {
                if (prev.find(t => t.id === proposalId)) return prev;
                return [...prev, newTopic];
            });
            setProposals(prev => prev.filter(p => p.id !== proposalId));

            alert(`"${proposal.title}" 제안이 ${MIN_SUPPORTS_FOR_PROMOTION}명의 추천을 받아 정식 투표로 승격되었습니다!`);
        } catch (error) {
            console.error('제안 승격 실패:', error);
            alert('제안 승격에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 새 제안 등록
    const handleSubmitProposal = async (e) => {
        e.preventDefault();

        if (!newProposal.title || !newProposal.description || !newProposal.proposerName) {
            alert('제목, 설명, 제안자명을 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 필수 필드만 포함하고, 선택 필드는 값이 있을 때만 추가
            const proposalData = {
                title: newProposal.title.trim(),
                description: newProposal.description.trim(),
                proposerName: newProposal.proposerName.trim(),
                createdAt: new Date(),
                status: 'proposal'
            };

            // 선택적 필드 추가 (값이 있을 때만)
            if (newProposal.subtitle?.trim()) {
                proposalData.subtitle = newProposal.subtitle.trim();
            }
            if (newProposal.detail?.trim()) {
                proposalData.detail = newProposal.detail.trim();
            }
            if (newProposal.detailContent?.trim()) {
                proposalData.detailContent = newProposal.detailContent.trim();
            }

            await addDoc(collection(db, 'proposals'), proposalData);

            setNewProposal({
                title: '',
                subtitle: '',
                description: '',
                detail: '',
                detailContent: '',
                proposerName: ''
            });
            setShowProposalModal(false);
            fetchProposals();
            alert('제안이 등록되었습니다! 다른 시민들의 추천을 받으면 정식 투표로 진행됩니다.');
        } catch (error) {
            console.error('제안 등록 실패:', error);
            alert('제안 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 투표 초기화 함수
    const resetVote = (topicId) => {
        localStorage.removeItem(`vote_${topicId}`);
        setUserVotes(prev => ({ ...prev, [topicId]: null }));
        fetchVotes(topicId);
        alert('투표가 초기화되었습니다. 다시 투표할 수 있습니다.');
    };

    // 의제별 투표 데이터 가져오기
    const fetchVotes = async (topicId) => {
        try {
            const votesRef = collection(db, `votes_${topicId}`);
            const querySnapshot = await getDocs(votesRef);

            let agree = 0;
            let disagree = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.vote === 'agree') agree++;
                else if (data.vote === 'disagree') disagree++;
            });

            setVotes(prev => ({ ...prev, [topicId]: { agree, disagree } }));
        } catch (error) {
            console.error(`투표 데이터 로드 실패 (${topicId}):`, error);
        }
    };

    // 의제별 댓글 가져오기
    const fetchComments = async (topicId) => {
        try {
            const commentsRef = collection(db, `comments_${topicId}`);
            const q = query(commentsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const fetchedComments = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));

            setComments(prev => ({ ...prev, [topicId]: fetchedComments }));
        } catch (error) {
            console.error(`댓글 로드 실패 (${topicId}):`, error);
        }
    };

    // 의제별 투표하기
    const handleVote = async (topicId, vote) => {
        // 로그인 확인
        if (!currentUser) {
            alert('로그인이 필요합니다. 메인 페이지에서 로그인해주세요.');
            return;
        }

        // 이미 투표한 경우 (관리자는 테스트를 위해 중복 투표 허용)
        if (userVotes[topicId] && !isAdminVerified) {
            alert('이미 투표하셨습니다.');
            return;
        }

        try {
            // 관리자 테스트 모드: 랜덤 ID로 투표 (테스트용)
            const docId = isAdminVerified ? `admin_test_${Date.now()}` : currentUser.uid;
            const voteRef = doc(db, `votes_${topicId}`, docId);
            await setDoc(voteRef, {
                vote,
                createdAt: new Date(),
                userId: docId,
                displayName: isAdminVerified ? `관리자테스트` : (currentUser.displayName || '')
            });

            if (!isAdminVerified) {
                setUserVotes(prev => ({ ...prev, [topicId]: vote }));
            }
            setVotes(prev => {
                const currentVotes = prev[topicId] || { agree: 0, disagree: 0 };
                return {
                    ...prev,
                    [topicId]: {
                        ...currentVotes,
                        [vote]: (currentVotes[vote] || 0) + 1
                    }
                };
            });
            alert(isAdminVerified ? '관리자 테스트 투표가 등록되었습니다!' : '투표가 정상적으로 등록되었습니다!');
        } catch (error) {
            console.error('투표 실패:', error);
            setUserVotes(prev => ({ ...prev, [topicId]: null }));
            alert('투표에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 의제별 댓글 작성
    const handleSubmitComment = async (topicId, content, author, position) => {
        if (!content.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return false;
        }

        if (!author.trim()) {
            alert('닉네임을 입력해주세요.');
            return false;
        }

        setIsSubmitting(true);

        try {
            const docRef = await addDoc(collection(db, `comments_${topicId}`), {
                content: content.trim(),
                author: author.trim(),
                position,
                createdAt: new Date(),
                likes: 0
            });

            const newCommentData = {
                id: docRef.id,
                content: content.trim(),
                author: author.trim(),
                position,
                createdAt: new Date(),
                likes: 0
            };

            setComments(prev => ({
                ...prev,
                [topicId]: [newCommentData, ...prev[topicId]]
            }));
            return true;
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    // 의제별 댓글 좋아요
    const handleLikeComment = async (topicId, commentId) => {
        const likedKey = `liked_${topicId}`;
        const likedComments = JSON.parse(localStorage.getItem(likedKey) || '[]');
        if (likedComments.includes(commentId)) {
            alert('이미 좋아요를 누르셨습니다.');
            return;
        }

        try {
            const commentRef = doc(db, `comments_${topicId}`, commentId);
            await updateDoc(commentRef, {
                likes: increment(1)
            });

            likedComments.push(commentId);
            localStorage.setItem(likedKey, JSON.stringify(likedComments));

            setComments(prev => ({
                ...prev,
                [topicId]: prev[topicId].map(c =>
                    c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
                )
            }));
        } catch (error) {
            console.error('좋아요 실패:', error);
        }
    };

    // 관리자 코드 검증
    const verifyAdminCode = () => {
        if (ADMIN_WRITER_CODES.includes(writerCode)) {
            setIsAdminVerified(true);
            return true;
        }
        alert('작성자 코드가 올바르지 않습니다.');
        return false;
    };

    // 새 주제 생성
    const handleCreateTopic = () => {
        if (!isAdminVerified && !verifyAdminCode()) return;

        if (!newTopic.title || !newTopic.subtitle || !newTopic.deadline) {
            alert('제목, 부제목, 마감일은 필수 항목입니다.');
            return;
        }

        // 한글 제목은 Firestore 컬렉션 이름에 문제가 될 수 있으므로 영문 랜덤 ID 사용
        const topicId = 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const createdTopic = {
            id: topicId,
            title: newTopic.title,
            subtitle: newTopic.subtitle,
            description: newTopic.description || newTopic.subtitle,
            detail: newTopic.detail || `${newTopic.title}란?`,
            detailContent: newTopic.detailContent || newTopic.description || newTopic.subtitle,
            agreeText: newTopic.agreeText || `${newTopic.title}에 찬성합니다`,
            disagreeText: newTopic.disagreeText || `${newTopic.title}에 반대합니다`,
            status: 'active',
            color: newTopic.color,
            deadline: newTopic.deadline
        };

        setTopics(prev => [...prev, createdTopic]);
        setVotes(prev => ({ ...prev, [topicId]: { agree: 0, disagree: 0 } }));
        setUserVotes(prev => ({ ...prev, [topicId]: null }));
        setComments(prev => ({ ...prev, [topicId]: [] }));
        setActiveTabs(prev => ({ ...prev, [topicId]: 'all' }));

        // 폼 초기화
        setNewTopic({
            title: '',
            subtitle: '',
            description: '',
            detail: '',
            detailContent: '',
            agreeText: '',
            disagreeText: '',
            deadline: '',
            color: 'blue'
        });
        setShowAdminModal(false);
        alert('새 주제가 생성되었습니다!');
    };

    // 마감일 수정
    const handleUpdateDeadline = (newDeadline) => {
        if (!isAdminVerified && !verifyAdminCode()) return;

        if (!selectedTopicId || !newDeadline) {
            alert('마감일을 선택해주세요.');
            return;
        }

        setTopics(prev => prev.map(topic =>
            topic.id === selectedTopicId
                ? { ...topic, deadline: newDeadline }
                : topic
        ));
        setShowDeadlineModal(false);
        setSelectedTopicId(null);
        alert('마감일이 수정되었습니다!');
    };

    // 마감일 수정 모달 열기
    const openDeadlineModal = (topicId) => {
        setSelectedTopicId(topicId);
        setShowDeadlineModal(true);
    };


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 헤더 - App.jsx와 동일한 스타일 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            ⚖️ 사법개혁
                        </Link>

                        {/* 데스크톱 메뉴 */}
                        <div className="hidden lg:flex space-x-6 text-sm items-center">
                            {/* 소개 */}
                            <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>

                            {/* 소통방 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setIntroDropdownOpen(true)}
                                onMouseLeave={() => setIntroDropdownOpen(false)}
                            >
                                <button className="text-blue-600 font-bold flex items-center gap-1">
                                    소통방
                                    <svg className={`w-4 h-4 transition-transform ${introDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${introDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[140px] z-50">
                                        <Link to="/governance" className="block px-4 py-2 hover:bg-gray-100 text-blue-600 font-bold">
                                            의사결정
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <a href="/#necessity" className="hover:text-blue-600 transition font-medium">도입 필요성</a>

                            {/* 해외사례 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setCasesDropdownOpen(true)}
                                onMouseLeave={() => setCasesDropdownOpen(false)}
                            >
                                <button className="hover:text-blue-600 transition font-medium flex items-center gap-1">
                                    해외사례
                                    <svg className={`w-4 h-4 transition-transform ${casesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${casesDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[160px] z-50">
                                        <a href="/#cases" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            해외사례
                                        </a>
                                        <Link to="/europe-jury" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            유럽
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <a href="/#constitution" className="hover:text-blue-600 transition font-medium">헌법적 근거</a>
                            <a href="/#bill" className="hover:text-blue-600 transition font-medium">법안 제안</a>

                            {/* 미디어 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setMediaDropdownOpen(true)}
                                onMouseLeave={() => setMediaDropdownOpen(false)}
                            >
                                <button className="hover:text-blue-600 transition font-medium flex items-center gap-1">
                                    미디어
                                    <svg className={`w-4 h-4 transition-transform ${mediaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 z-[9999] ${mediaDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[120px]">
                                        <Link to="/news" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            사법뉴스
                                        </Link>
                                        <Link to="/blog" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            블로그
                                        </Link>
                                        <Link to="/videos" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            동영상
                                        </Link>
                                        <Link to="/sentencing-analysis" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            내란재판분석
                                        </Link>
                                        <Link to="/reform-analysis" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            개혁안 비교
                                        </Link>
                                        <Link to="/judge-evaluation" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            판사평가
                                        </Link>
                                        <Link to="/law-database" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            법령DB
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <a href="/#signature" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg">
                                참여하기
                            </a>
                        </div>

                        {/* 모바일 메뉴 버튼 */}
                        <button
                            className="lg:hidden p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </nav>

                    {/* 모바일 메뉴 */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden py-4 border-t">
                            <div className="flex flex-col space-y-3">
                                <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>
                                <div className="pl-4 border-l-2 border-blue-600">
                                    <p className="text-blue-600 font-bold mb-2">소통방</p>
                                    <Link to="/governance" className="block text-blue-600 font-bold pl-2" onClick={() => setMobileMenuOpen(false)}>의사결정</Link>
                                </div>
                                <a href="/#necessity" className="hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>도입 필요성</a>
                                {/* 모바일 해외사례 서브메뉴 */}
                                <div className="pl-4 border-l-2 border-gray-200">
                                    <p className="text-gray-500 text-sm mb-2">해외사례</p>
                                    <a href="/#cases" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>해외사례</a>
                                    <Link to="/europe-jury" className="block hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>유럽</Link>
                                </div>
                                <a href="/#constitution" className="hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>헌법적 근거</a>
                                <a href="/#bill" className="hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>법안 제안</a>
                                {/* 모바일 미디어 서브메뉴 */}
                                <div className="pl-4 border-l-2 border-gray-200">
                                    <p className="text-gray-500 text-sm mb-2">미디어</p>
                                    <Link to="/news" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>사법뉴스</Link>
                                    <Link to="/blog" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>블로그</Link>
                                    <Link to="/videos" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>동영상</Link>
                                    <Link to="/sentencing-analysis" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>내란재판분석</Link>
                                    <Link to="/reform-analysis" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>개혁안 비교</Link>
                                    <Link to="/judge-evaluation" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>판사평가</Link>
                                    <Link to="/law-database" className="block hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>법령DB</Link>
                                </div>
                                <a href="/#signature" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg text-center">
                                    참여하기
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* 메인 콘텐츠 - 헤더 높이만큼 상단 여백 */}
            <main className="flex-1 pt-24 pb-12">
                <div className="max-w-6xl mx-auto px-4">
                    {/* 페이지 헤더 - 민주주의 서울 스타일 */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            시민 참여 플랫폼
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            주권자에 의한 결정!
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            사법개혁에 관한 여러분의 의견을 들려주세요.
                        </p>
                        {/* 제안하기 버튼 */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => setShowProposalModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition text-sm font-medium shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                주제 제안하기
                            </button>
                            <button
                                onClick={() => setShowCommunityGuideModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-yellow-500 text-yellow-700 rounded-full hover:bg-yellow-50 transition text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                커뮤니티 운영 가이드
                            </button>
                        </div>
                    </div>

                    {/* 제안방 섹션 - 시민 제안 토너먼트 */}
                    {proposals.length > 0 && (
                        <div className="mb-12">
                            {/* 섹션 헤더 */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">제안방</h2>
                                        <p className="text-sm text-gray-500">{MIN_SUPPORTS_FOR_PROMOTION}명 이상 추천 시 정식 투표로 승격 (제안일로부터 {PROPOSAL_DEADLINE_DAYS}일 이내)</p>
                                    </div>
                                </div>
                                <span className="bg-purple-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                                    {proposals.length}개 제안
                                </span>
                            </div>

                            {/* 제안 카드 그리드 */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {proposals.map((proposal) => (
                                    <ProposalCard
                                        key={proposal.id}
                                        proposal={proposal}
                                        supportCount={proposalSupports[proposal.id] || 0}
                                        hasSupported={userSupports[proposal.id]}
                                        onSupport={() => handleSupport(proposal.id)}
                                        minSupports={MIN_SUPPORTS_FOR_PROMOTION}
                                        deadlineDays={PROPOSAL_DEADLINE_DAYS}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 반려방 섹션 - 기한 내 추천 수 미달 */}
                    {rejectedProposals.length > 0 && (
                        <div className="mb-12">
                            {/* 섹션 헤더 */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">반려방</h2>
                                        <p className="text-sm text-gray-500">{PROPOSAL_DEADLINE_DAYS}일 이내 {MIN_SUPPORTS_FOR_PROMOTION}명 추천을 받지 못해 반려된 제안입니다</p>
                                    </div>
                                </div>
                                <span className="bg-gray-400 text-white text-sm font-bold px-4 py-2 rounded-full">
                                    {rejectedProposals.length}개 반려
                                </span>
                            </div>

                            {/* 반려된 제안 카드 그리드 */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rejectedProposals.map((proposal) => (
                                    <RejectedProposalCard
                                        key={proposal.id}
                                        proposal={proposal}
                                        supportCount={proposalSupports[proposal.id] || 0}
                                        minSupports={MIN_SUPPORTS_FOR_PROMOTION}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 진행 중인 투표 섹션 - 민주주의 서울 스타일 */}
                    {topics.some(topic => new Date() <= new Date(topic.deadline)) && (
                        <div className="mb-12">
                            {/* 섹션 헤더 */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">진행 중인 투표</h2>
                                        <p className="text-sm text-gray-500">지금 참여할 수 있는 투표입니다</p>
                                    </div>
                                </div>
                                <span className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                                    {topics.filter(topic => new Date() <= new Date(topic.deadline)).length}개 진행중
                                </span>
                            </div>

                            {/* 투표 카드 그리드 */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {topics.filter(topic => new Date() <= new Date(topic.deadline)).map((topic) => (
                                    <TopicSection
                                        key={topic.id}
                                        topic={topic}
                                        votes={votes[topic.id]}
                                        onOpenDeadlineModal={() => openDeadlineModal(topic.id)}
                                        userVote={userVotes[topic.id]}
                                        comments={comments[topic.id] || []}
                                        activeTab={activeTabs[topic.id]}
                                        isSubmitting={isSubmitting}
                                        onVote={(vote) => handleVote(topic.id, vote)}
                                        onResetVote={() => resetVote(topic.id)}
                                        onSubmitComment={(content, author, position) => handleSubmitComment(topic.id, content, author, position)}
                                        onLikeComment={(commentId) => handleLikeComment(topic.id, commentId)}
                                        onTabChange={(tab) => setActiveTabs(prev => ({ ...prev, [topic.id]: tab }))}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 마감된 투표 섹션 */}
                    {topics.some(topic => new Date() > new Date(topic.deadline)) && (
                        <ExpiredVotesSection
                            topics={topics}
                            votes={votes}
                            userVotes={userVotes}
                            comments={comments}
                            activeTabs={activeTabs}
                            isSubmitting={isSubmitting}
                            onVote={handleVote}
                            onResetVote={resetVote}
                            onSubmitComment={handleSubmitComment}
                            onLikeComment={handleLikeComment}
                            onTabChange={(topicId, tab) => setActiveTabs(prev => ({ ...prev, [topicId]: tab }))}
                            onOpenDeadlineModal={openDeadlineModal}
                        />
                    )}

                    {/* 데모 안내 */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                        <p className="text-amber-800 text-sm text-center">
                            <strong>안내:</strong> 이 투표와 토론은 시민법정 커뮤니티 내에서 진행되는 의견 수렴입니다.
                            공식적인 법적 효력은 없으며, 시민들의 목소리를 모으기 위한 공간입니다.
                        </p>
                    </div>

                    {/* 투표 참여 가이드 */}
                    <section className="bg-white rounded-xl shadow-lg p-8 mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">투표 참여 방법</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-4">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">1️⃣</span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">의견 읽기</h3>
                                <p className="text-gray-600 text-sm">
                                    찬성과 반대 의견을 충분히 읽고 생각해보세요.
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">2️⃣</span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">투표하기</h3>
                                <p className="text-gray-600 text-sm">
                                    찬성 또는 반대 버튼을 눌러 의사를 표현하세요.
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">3️⃣</span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">토론 참여</h3>
                                <p className="text-gray-600 text-sm">
                                    댓글로 여러분의 의견을 자유롭게 나눠주세요.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>

            {/* 새 주제 만들기 모달 */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">새 주제 만들기</h2>
                                <button
                                    onClick={() => { setShowAdminModal(false); setIsAdminVerified(false); setWriterCode(''); }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* 작성자 코드 입력 - 인증 전 */}
                            {!isAdminVerified ? (
                                <div className="text-center py-8">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 mb-4">관리자 인증이 필요합니다</p>
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 text-left">작성자 코드</label>
                                        <input
                                            type="password"
                                            value={writerCode}
                                            onChange={(e) => setWriterCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && verifyAdminCode()}
                                            placeholder="작성자 코드를 입력하세요"
                                            className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
                                            autoFocus
                                        />
                                        <button
                                            onClick={verifyAdminCode}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                        >
                                            확인
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* 인증 완료 표시 */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-green-800 text-sm font-bold">관리자 인증됨</span>
                                    </div>

                                    {/* 제목 */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">제목 *</label>
                                        <input
                                            type="text"
                                            value={newTopic.title}
                                            onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="예: 법왜곡죄 도입"
                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* 부제목 */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">부제목 *</label>
                                        <input
                                            type="text"
                                            value={newTopic.subtitle}
                                            onChange={(e) => setNewTopic(prev => ({ ...prev, subtitle: e.target.value }))}
                                            placeholder="예: 법왜곡죄 도입에 대한 찬반 투표"
                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* 설명 */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">설명</label>
                                        <textarea
                                            value={newTopic.description}
                                            onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="주제에 대한 설명을 입력하세요"
                                            rows={3}
                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* 마감일 */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">투표 마감일 *</label>
                                        <input
                                            type="date"
                                            value={newTopic.deadline}
                                            onChange={(e) => setNewTopic(prev => ({ ...prev, deadline: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                        />
                                    </div>

                                    {/* 색상 */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">테마 색상</label>
                                        <select
                                            value={newTopic.color}
                                            onChange={(e) => setNewTopic(prev => ({ ...prev, color: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                        >
                                            <option value="blue">파랑</option>
                                            <option value="red">빨강</option>
                                            <option value="orange">주황</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        {isAdminVerified && (
                            <div className="p-6 border-t bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => { setShowAdminModal(false); setIsAdminVerified(false); setWriterCode(''); }}
                                    className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleCreateTopic}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    주제 만들기
                                </button>
                            </div>
                        )}
                        {!isAdminVerified && (
                            <div className="p-6 border-t bg-gray-50">
                                <button
                                    onClick={() => { setShowAdminModal(false); setWriterCode(''); }}
                                    className="w-full px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                                >
                                    닫기
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 제안 모달 */}
            {showProposalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">새로운 주제 제안하기</h2>
                                    <p className="text-purple-100 text-sm mt-1">
                                        {MIN_SUPPORTS_FOR_PROMOTION}명 이상 추천 시 정식 투표로 진행됩니다
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowProposalModal(false)}
                                    className="text-white/80 hover:text-white"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmitProposal} className="p-6 space-y-4">
                            {/* 제안자 이름 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    제안자 이름 (닉네임) *
                                </label>
                                <input
                                    type="text"
                                    value={newProposal.proposerName}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, proposerName: e.target.value }))}
                                    placeholder="예: 시민A"
                                    maxLength={20}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                />
                            </div>

                            {/* 제목 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    제안 제목 *
                                </label>
                                <input
                                    type="text"
                                    value={newProposal.title}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="예: 대법관 임기 제한"
                                    maxLength={50}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                />
                            </div>

                            {/* 부제목 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    부제목 (선택)
                                </label>
                                <input
                                    type="text"
                                    value={newProposal.subtitle}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, subtitle: e.target.value }))}
                                    placeholder="예: 대법관 임기를 6년으로 제한하는 것에 대한 찬반 투표"
                                    maxLength={100}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* 설명 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    제안 설명 *
                                </label>
                                <textarea
                                    value={newProposal.description}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="이 제안이 왜 필요한지, 어떤 문제를 해결하려는지 설명해주세요."
                                    maxLength={500}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">
                                    {newProposal.description.length}/500
                                </p>
                            </div>

                            {/* 상세 설명 (선택) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    상세 설명 (선택)
                                </label>
                                <textarea
                                    value={newProposal.detailContent}
                                    onChange={(e) => setNewProposal(prev => ({ ...prev, detailContent: e.target.value }))}
                                    placeholder="추가적인 배경 설명, 참고자료, 기대효과 등을 적어주세요."
                                    maxLength={1000}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* 안내 메시지 */}
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-purple-800 text-sm">
                                    <strong>안내:</strong> 제안이 등록되면 다른 시민들이 추천할 수 있습니다.
                                    {MIN_SUPPORTS_FOR_PROMOTION}명 이상의 추천을 받으면 자동으로 정식 투표 주제로 승격됩니다.
                                </p>
                            </div>

                            {/* 버튼 */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowProposalModal(false)}
                                    className="flex-1 px-4 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? '등록 중...' : '제안 등록하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 마감일 수정 모달 */}
            {showDeadlineModal && (
                <DeadlineModal
                    topic={topics.find(t => t.id === selectedTopicId)}
                    writerCode={writerCode}
                    setWriterCode={setWriterCode}
                    isAdminVerified={isAdminVerified}
                    onClose={() => { setShowDeadlineModal(false); setSelectedTopicId(null); setWriterCode(''); setIsAdminVerified(false); }}
                    onUpdate={handleUpdateDeadline}
                    onVerify={verifyAdminCode}
                />
            )}

            {/* 커뮤니티 운영 가이드 모달 */}
            {showCommunityGuideModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* 헤더 */}
                        <div className="p-6 border-b bg-gradient-to-r from-yellow-500 to-orange-500 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">커뮤니티 운영 가이드</h2>
                                    <p className="text-yellow-100 text-sm mt-1">
                                        민주적 의사결정을 위한 참여 방법
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCommunityGuideModal(false)}
                                    className="text-white/80 hover:text-white"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 콘텐츠 */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* 개요 */}
                            <div className="mb-8">
                                <p className="text-gray-700 leading-relaxed">
                                    이 가이드는 시민법정 커뮤니티(카카오톡 오픈채팅방, 텔레그램)에서 민주적 의사결정을 진행하는 방법을 설명합니다.
                                    참여자들이 직접 제안하고, 투표하고, 운영 규칙을 스스로 만들어가는 것이 목표입니다.
                                </p>
                            </div>

                            {/* 채널별 용도 구분 */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">채널별 용도 구분</h3>
                                <div className="overflow-x-auto mb-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="text-left p-3 font-bold">채널</th>
                                                <th className="text-left p-3 font-bold">용도</th>
                                                <th className="text-left p-3 font-bold">특징</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-3 text-gray-800 font-semibold">웹사이트</td>
                                                <td className="p-3 text-gray-600">심도 있는 정책 논의</td>
                                                <td className="p-3 text-gray-600">장기 투표, 10명 추천 시 자동 승격</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 text-gray-800 font-semibold">텔레그램/카카오톡</td>
                                                <td className="p-3 text-gray-600">간단한 설문 및 빠른 의견 수렴</td>
                                                <td className="p-3 text-gray-600">단기 투표(24시간~7일), 즉시 생성</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <p className="text-purple-800 text-sm font-semibold mb-2">언제 어디서 제안할까요?</p>
                                    <ul className="text-purple-700 text-sm space-y-1">
                                        <li>• <strong>웹사이트</strong>: 커뮤니티 규칙 변경, 중요 정책 결정, 충분한 토론이 필요한 사안</li>
                                        <li>• <strong>텔레그램/카카오톡</strong>: 일정 조율, 간단한 의견 수렴, 빠른 결정이 필요한 사안</li>
                                    </ul>
                                </div>
                            </div>

                            {/* 웹사이트 주제 제안 섹션 */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">웹사이트 주제 제안하기</h3>
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                                    <p className="text-blue-800 text-sm">
                                        <strong>시민법정 웹사이트</strong>에서 직접 새로운 투표 주제를 제안할 수 있습니다!
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-800 mb-2">제안 방법</h4>
                                    <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-2">
                                        <li>메인 페이지에서 <strong>"+ 주제 제안하기"</strong> 버튼 클릭</li>
                                        <li>제안할 주제와 설명 작성</li>
                                        <li>제출 후 다른 시민들의 추천을 받습니다</li>
                                    </ol>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                        <span className="text-green-600 text-lg">🎯</span>
                                        <div>
                                            <p className="text-green-800 font-semibold mb-1">자동 승격 조건</p>
                                            <p className="text-green-700 text-sm">
                                                추천 기간 내 <strong>추천 수 10명 이상</strong>이면 자동으로 "진행 중인 투표" 섹션으로 이동되어 정식 투표가 시작됩니다!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                        <span className="text-gray-700">제안 등록 (제안방에 표시)</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                        <span className="text-gray-700">시민들이 추천 (👍 버튼)</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                        <span className="text-gray-700">10명 이상 추천 시 → 정식 투표로 자동 승격!</span>
                                    </div>
                                </div>
                            </div>

                            {/* 카카오톡 섹션 */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-yellow-900" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3c-5.52 0-10 3.59-10 8 0 2.82 1.87 5.29 4.69 6.71-.22.82-.89 2.97-.93 3.13-.06.22.04.39.26.39.15 0 .34-.09.34-.09 1.06-.61 3.9-2.28 4.64-2.69.33.04.66.05 1 .05 5.52 0 10-3.59 10-8s-4.48-8-10-8z"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">카카오톡 오픈채팅방 운영 방법</h3>
                                </div>

                                <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                                    <p className="text-yellow-800 text-sm mb-2">
                                        <strong>참고:</strong> 카카오톡은 봇 자동화가 불가능하므로 수동으로 운영합니다.
                                    </p>
                                </div>

                                {/* 제안하기 */}
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-800 mb-2">1. 제안하기</h4>
                                    <p className="text-gray-600 mb-2">누구나 아래 형식으로 제안할 수 있습니다:</p>
                                    <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm mb-2">
                                        #제안 [제안 내용]
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        <p>예시:</p>
                                        <ul className="list-disc list-inside ml-2">
                                            <li>#제안 월례회의를 매주 토요일 오후 3시로 변경하자</li>
                                            <li>#제안 신규 회원 환영 메시지를 추가하자</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 투표 만들기 */}
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-800 mb-2">2. 투표 만들기 (방장/관리자)</h4>
                                    <p className="text-gray-600 mb-2">제안이 올라오면 방장이 투표를 생성합니다:</p>
                                    <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-2">
                                        <li>채팅방 메뉴 (우상단 ≡) 클릭</li>
                                        <li><strong>투표</strong> 선택</li>
                                        <li>투표 내용 입력:
                                            <ul className="list-disc list-inside ml-4 mt-1">
                                                <li>제목: [제안] 제안 내용</li>
                                                <li>선택지: 찬성 / 반대 / 기권</li>
                                                <li>마감일: 24시간 후</li>
                                            </ul>
                                        </li>
                                        <li>완료 클릭</li>
                                    </ol>
                                </div>

                                {/* 결과 공지 */}
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">3. 투표 결과 공지</h4>
                                    <div className="bg-gray-100 rounded-lg p-3 text-sm font-mono whitespace-pre-line">
{`📊 투표 결과 발표

📝 제안: [제안 내용]
👤 제안자: [이름]

✅ 결과: 통과 / 부결

📈 투표 현황:
  찬성: OO표
  반대: OO표
  기권: OO표`}
                                    </div>
                                </div>
                            </div>

                            {/* 텔레그램 섹션 */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">텔레그램 운영 방법 (자동화)</h3>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                    <p className="text-blue-800 text-sm">
                                        <strong>장점:</strong> 텔레그램은 봇이 자동으로 처리합니다!
                                    </p>
                                </div>

                                {/* 제안하기 (텔레그램) */}
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-800 mb-2">1. 제안하기</h4>
                                    <p className="text-gray-600 mb-2">그룹에서 아래 형식으로 메시지를 보내면 자동으로 투표가 생성됩니다:</p>
                                    <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm mb-2">
                                        #제안 [제안 내용]
                                    </div>
                                    <div className="text-sm text-gray-500 mb-3">
                                        <p>예시:</p>
                                        <ul className="list-disc list-inside ml-2">
                                            <li>#제안 월례회의를 매주 토요일 오후 3시로 변경하자</li>
                                        </ul>
                                    </div>

                                    {/* 투표 기간 조정 */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                                        <p className="text-green-800 text-sm font-semibold mb-1">투표 기간 조정 (선택사항)</p>
                                        <p className="text-green-700 text-sm mb-2">제안자가 직접 투표 기간을 설정할 수 있습니다:</p>
                                        <div className="bg-white rounded p-2 font-mono text-sm mb-2">
                                            <p>#제안 48시간 [제안 내용]</p>
                                            <p>#제안 7일 [제안 내용]</p>
                                        </div>
                                        <ul className="text-green-600 text-xs space-y-1">
                                            <li>• 기본값: 24시간 (미지정 시)</li>
                                            <li>• 시간 단위: 1~240시간 (예: 48시간, 72시간)</li>
                                            <li>• 일 단위: 1~10일 (예: 3일, 7일)</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 설문하기 (#설문 태그) */}
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-800 mb-2">2. 설문하기 (#설문 태그)</h4>
                                    <p className="text-gray-600 mb-2">간단한 의견 수렴이나 일정 조율에는 <code className="bg-gray-100 px-1 rounded">#설문</code> 태그를 사용합니다:</p>
                                    <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm mb-2">
                                        #설문 [질문 내용]
                                    </div>
                                    <div className="text-sm text-gray-500 mb-3">
                                        <p>예시:</p>
                                        <ul className="list-disc list-inside ml-2">
                                            <li>#설문 다음 정기모임 날짜는 언제가 좋을까요?</li>
                                            <li>#설문 48시간 새 로고 디자인 A안과 B안 중 어떤 게 좋나요?</li>
                                        </ul>
                                    </div>

                                </div>

                                {/* 다중 선택 투표하기 (#투표 태그) */}
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-800 mb-2">3. 다중 선택 투표하기 (#투표 태그)</h4>
                                    <p className="text-gray-600 mb-2">일정 조율 등 여러 선택지 중 하나를 고르는 투표에는 <code className="bg-gray-100 px-1 rounded">#투표</code> 태그를 사용합니다:</p>
                                    <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm mb-2 whitespace-pre-line">
{`#투표 질문 내용
- 선택지1
- 선택지2
- 선택지3`}
                                    </div>
                                    <div className="text-sm text-gray-500 mb-3">
                                        <p>예시:</p>
                                        <div className="bg-gray-50 rounded p-2 font-mono text-xs mt-1 whitespace-pre-line">
{`#투표 오프라인 모임 날짜 선택
- 1월 2일
- 1월 5일
- 1월 9일`}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <p>• 선택지는 최소 2개, 최대 10개</p>
                                        <p>• 투표 종료 후 1위 선택지 표시</p>
                                    </div>
                                </div>

                                {/* #제안 vs #설문 vs #투표 비교 */}
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                                    <p className="text-orange-800 text-sm font-semibold mb-2">#제안 vs #설문 vs #투표 차이점</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-orange-100">
                                                    <th className="text-left p-2">구분</th>
                                                    <th className="text-left p-2">#제안</th>
                                                    <th className="text-left p-2">#설문</th>
                                                    <th className="text-left p-2">#투표</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b border-orange-100">
                                                    <td className="p-2 text-orange-700">용도</td>
                                                    <td className="p-2 text-orange-600">규칙 변경</td>
                                                    <td className="p-2 text-orange-600">예/아니오</td>
                                                    <td className="p-2 text-orange-600">다중 선택</td>
                                                </tr>
                                                <tr className="border-b border-orange-100">
                                                    <td className="p-2 text-orange-700">선택지</td>
                                                    <td className="p-2 text-orange-600">찬성/반대/기권</td>
                                                    <td className="p-2 text-orange-600">예/아니오/모름</td>
                                                    <td className="p-2 text-orange-600">직접 지정</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 text-orange-700">결과</td>
                                                    <td className="p-2 text-orange-600">통과/부결</td>
                                                    <td className="p-2 text-orange-600">현황 표시</td>
                                                    <td className="p-2 text-orange-600">1위 표시</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-800 mb-2">4. 자동 처리 흐름</h4>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                            <span className="text-gray-700"><code className="bg-gray-100 px-1 rounded">#제안 [기간] 내용</code> 메시지 작성</span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                            <span className="text-gray-700">봇이 자동으로 투표 생성 (지정 기간 또는 기본 24시간)</span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                            <span className="text-gray-700">참여자들이 찬성/반대/기권 투표</span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                            <span className="text-gray-700">마감 후 자동으로 결과 공지</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 투표 규칙 */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">민주적 의사결정 원칙</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="text-left p-3 font-bold">항목</th>
                                                <th className="text-left p-3 font-bold">내용</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-3 text-gray-600">투표 기간</td>
                                                <td className="p-3">24시간 (긴급 시 조정 가능)</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-3 text-gray-600">통과 기준</td>
                                                <td className="p-3">찬성 &gt; 반대 (기권 제외)</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-3 text-gray-600">동률 처리</td>
                                                <td className="p-3">부결</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 text-gray-600">최소 참여</td>
                                                <td className="p-3">없음 (추후 조정 가능)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* FAQ */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">자주 묻는 질문</h3>
                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="font-bold text-gray-800 mb-1">Q: 투표 기간을 변경할 수 있나요?</p>
                                        <p className="text-gray-600 text-sm">A: 네, 텔레그램에서는 제안자가 직접 투표 기간을 설정할 수 있습니다. <code className="bg-gray-200 px-1 rounded text-xs">#제안 48시간 내용</code> 또는 <code className="bg-gray-200 px-1 rounded text-xs">#제안 7일 내용</code> 형식으로 작성하세요. 미지정 시 기본 24시간입니다.</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="font-bold text-gray-800 mb-1">Q: 부결된 제안을 다시 올릴 수 있나요?</p>
                                        <p className="text-gray-600 text-sm">A: 네, 하지만 내용을 수정하거나 보완한 후 다시 제안하는 것을 권장합니다.</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="font-bold text-gray-800 mb-1">Q: 익명 투표는 안 되나요?</p>
                                        <p className="text-gray-600 text-sm">A: 민주적 투명성을 위해 공개 투표를 기본으로 합니다. 필요 시 제안으로 변경 가능합니다.</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="font-bold text-gray-800 mb-1">Q: #제안과 #설문의 차이점은 무엇인가요?</p>
                                        <p className="text-gray-600 text-sm">A: <code className="bg-gray-200 px-1 rounded text-xs">#제안</code>은 커뮤니티 규칙 변경 등 중요한 의사결정에 사용하며, 통과/부결이 판정됩니다. <code className="bg-gray-200 px-1 rounded text-xs">#설문</code>은 일정 조율이나 간단한 의견 수렴에 사용하며, 응답 현황만 보여주는 참고용입니다.</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="font-bold text-gray-800 mb-1">Q: 웹사이트 제안과 텔레그램 제안 중 어디서 해야 하나요?</p>
                                        <p className="text-gray-600 text-sm">A: 중요한 정책이나 규칙 변경은 웹사이트에서, 빠른 의견 수렴이나 일정 조율은 텔레그램/카카오톡에서 하시면 됩니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 푸터 */}
                        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500">
                                    이 가이드도 커뮤니티 제안을 통해 수정될 수 있습니다.
                                </p>
                                <button
                                    onClick={() => setShowCommunityGuideModal(false)}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium"
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// 의제별 섹션 컴포넌트 - 민주주의 서울 스타일 카드
function TopicSection({ topic, votes, userVote, comments, activeTab, isSubmitting, onVote, onResetVote, onSubmitComment, onLikeComment, onTabChange, onOpenDeadlineModal }) {
    const [newComment, setNewComment] = useState('');
    const [commentAuthor, setCommentAuthor] = useState('');
    const [commentPosition, setCommentPosition] = useState('agree');
    const [showDetail, setShowDetail] = useState(false);

    const totalVotes = (votes?.agree || 0) + (votes?.disagree || 0);
    const agreePercent = totalVotes > 0 ? ((votes?.agree || 0) / totalVotes) * 100 : 50;
    const disagreePercent = totalVotes > 0 ? ((votes?.disagree || 0) / totalVotes) * 100 : 50;

    // 마감일 계산 (마감일의 23:59:59까지 유효)
    const deadlineDate = new Date(topic.deadline + 'T23:59:59');
    const startDate = new Date(topic.startDate || '2025-01-01');
    const now = new Date();
    const isExpired = now > deadlineDate;
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    // 날짜 포맷팅
    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
    };

    const filteredComments = activeTab === 'all'
        ? comments
        : comments.filter(c => c.position === activeTab);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await onSubmitComment(newComment, commentAuthor, commentPosition);
        if (success) {
            setNewComment('');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-gray-100 hover:shadow-xl transition-shadow">
            {/* 카드 썸네일 영역 */}
            <div className="bg-white p-6 relative min-h-[160px] flex flex-col justify-center border-b">
                {/* 중앙 질문 */}
                <div className="text-gray-900 text-center py-4">
                    <p className="text-xl md:text-2xl font-bold leading-tight">
                        "{topic.title}에 대해<br/>어떻게 생각하십니까?"
                    </p>
                </div>

                {/* 하단 마스코트/아이콘 영역 */}
                <div className="absolute bottom-3 right-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">⚖️</span>
                    </div>
                </div>
            </div>

            {/* 카드 내용 영역 */}
            <div className="p-4 flex-1 flex flex-col">
                {/* 제목 */}
                <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
                    {topic.subtitle}
                </h3>

                {/* 투표 기간 */}
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <span>{formatDate(startDate)} ~ {formatDate(deadlineDate)}</span>
                    {isExpired ? (
                        <span className="text-red-500 font-bold">(투표 마감)</span>
                    ) : (
                        <span className="text-green-600 font-bold">({daysLeft}일 남음)</span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenDeadlineModal(); }}
                        className="ml-auto text-gray-400 hover:text-blue-600 p-1"
                        title="마감일 수정"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </div>

                {/* 투표 결과 표시 */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                        <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </span>
                        <span className="text-sm font-bold text-gray-800">{votes?.agree || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </span>
                        <span className="text-sm font-bold text-gray-800">{votes?.disagree || 0}</span>
                    </div>
                </div>

                {/* 결과보기/참여하기 버튼 */}
                <button
                    onClick={() => setShowDetail(!showDetail)}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                        isExpired
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {showDetail ? '접기' : (isExpired ? '결과보기' : '참여하기')}
                </button>
            </div>

            {/* 상세 영역 (토글) */}
            {showDetail && (
                <div className="border-t bg-gray-50">
                    {/* 설명 */}
                    <div className="p-4 border-b">
                        <p className="text-sm text-gray-600">{topic.description}</p>
                        <div className="mt-3 bg-white rounded-lg p-3 text-xs text-gray-600 border">
                            <p className="font-bold mb-1 text-gray-800">{topic.detail}</p>
                            <p>{topic.detailContent}</p>
                        </div>
                    </div>

                    {/* 마감된 경우: 최종 결과 표시 */}
                    {isExpired ? (
                        <div className="p-4 border-b">
                            {/* 결과 공개 헤더 */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                    결과공개
                                </span>
                            </div>

                            {/* 최종 투표 결과 */}
                            <div className="bg-white rounded-xl p-4 border">
                                <div className="text-center mb-4">
                                    <span className="text-sm font-bold text-gray-800">최종 투표 결과</span>
                                    <span className="text-xs text-gray-500 ml-2">총 {totalVotes}명 참여</span>
                                </div>

                                {/* 결과 비교 */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`flex-1 text-center p-4 rounded-xl ${
                                        agreePercent > disagreePercent
                                            ? 'bg-green-500 text-white shadow-lg'
                                            : 'bg-green-100'
                                    }`}>
                                        <div className={`text-3xl font-bold ${agreePercent > disagreePercent ? 'text-white' : 'text-green-700'}`}>
                                            {agreePercent.toFixed(1)}%
                                        </div>
                                        <div className={`text-sm ${agreePercent > disagreePercent ? 'text-green-100' : 'text-gray-600'}`}>
                                            찬성 ({votes?.agree || 0}표)
                                        </div>
                                    </div>
                                    <div className={`flex-1 text-center p-4 rounded-xl ${
                                        disagreePercent > agreePercent
                                            ? 'bg-red-500 text-white shadow-lg'
                                            : 'bg-red-100'
                                    }`}>
                                        <div className={`text-3xl font-bold ${disagreePercent > agreePercent ? 'text-white' : 'text-red-700'}`}>
                                            {disagreePercent.toFixed(1)}%
                                        </div>
                                        <div className={`text-sm ${disagreePercent > agreePercent ? 'text-red-100' : 'text-gray-600'}`}>
                                            반대 ({votes?.disagree || 0}표)
                                        </div>
                                    </div>
                                </div>

                                {/* 결과 배지 */}
                                <div className="text-center">
                                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                                        agreePercent > disagreePercent
                                            ? 'bg-green-600 text-white'
                                            : agreePercent < disagreePercent
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-600 text-white'
                                    }`}>
                                        {agreePercent > disagreePercent ? '찬성 다수' : agreePercent < disagreePercent ? '반대 다수' : '찬반 동률'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 진행 중인 경우: 투표 버튼 표시 */
                        <div className="p-4 border-b">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onVote('agree')}
                                    disabled={userVote !== null}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        userVote === 'agree'
                                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                            : userVote
                                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                            : 'border-green-200 hover:border-green-500 hover:bg-green-50 cursor-pointer'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-bold text-gray-800">찬성</div>
                                        {userVote === 'agree' && (
                                            <div className="text-green-600 font-bold text-xs mt-1">투표완료</div>
                                        )}
                                    </div>
                                </button>

                                <button
                                    onClick={() => onVote('disagree')}
                                    disabled={userVote !== null}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        userVote === 'disagree'
                                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                            : userVote
                                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                            : 'border-red-200 hover:border-red-500 hover:bg-red-50 cursor-pointer'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto mb-2 bg-red-400 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-bold text-gray-800">반대</div>
                                        {userVote === 'disagree' && (
                                            <div className="text-red-600 font-bold text-xs mt-1">투표완료</div>
                                        )}
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setCommentPosition('alternative');
                                        document.getElementById(`comment-form-${topic.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="p-4 rounded-xl border-2 border-yellow-200 hover:border-yellow-500 hover:bg-yellow-50 cursor-pointer transition-all"
                                >
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto mb-2 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-sm font-bold text-gray-800">대안</div>
                                    </div>
                                </button>
                            </div>

                            {userVote && (
                                <button
                                    onClick={onResetVote}
                                    className="text-xs text-gray-400 hover:text-gray-600 underline mt-3 block w-full text-center"
                                >
                                    다시 투표하기
                                </button>
                            )}

                            {/* 현재 투표 현황 */}
                            <div className="mt-4 bg-white rounded-lg p-3 border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">현재 투표 현황</span>
                                    <button
                                        onClick={onOpenDeadlineModal}
                                        className="text-xs text-gray-400 hover:text-blue-600"
                                        title="마감일 수정"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-500"
                                        style={{ width: `${agreePercent}%` }}
                                    />
                                    <div
                                        className="h-full bg-red-400 transition-all duration-500"
                                        style={{ width: `${disagreePercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-green-600 font-medium">찬성 {agreePercent.toFixed(1)}%</span>
                                    <span className="text-red-500 font-medium">반대 {disagreePercent.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 토론방 */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-900">의견 ({comments.length})</span>
                            <div className="flex gap-1">
                                {['all', 'agree', 'disagree', 'alternative'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => onTabChange(tab)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                            activeTab === tab
                                                ? tab === 'all' ? 'bg-gray-800 text-white'
                                                : tab === 'agree' ? 'bg-green-500 text-white'
                                                : tab === 'disagree' ? 'bg-red-400 text-white'
                                                : 'bg-yellow-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {tab === 'all' ? '전체' : tab === 'agree' ? '찬성' : tab === 'disagree' ? '반대' : '대안'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 댓글 목록 */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3">
                            {filteredComments.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    첫 번째 의견을 남겨주세요!
                                </div>
                            ) : (
                                filteredComments.slice(0, 5).map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`p-3 rounded-lg text-sm ${
                                            comment.position === 'agree' ? 'bg-green-50 border-l-4 border-green-500' :
                                            comment.position === 'disagree' ? 'bg-red-50 border-l-4 border-red-400' : 'bg-yellow-50 border-l-4 border-yellow-500'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-800">{comment.author}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                comment.position === 'agree' ? 'bg-green-200 text-green-800' :
                                                comment.position === 'disagree' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                            }`}>
                                                {comment.position === 'agree' ? '찬성' : comment.position === 'disagree' ? '반대' : '대안'}
                                            </span>
                                            <button
                                                onClick={() => onLikeComment(comment.id)}
                                                className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                                            >
                                                ❤️ {comment.likes || 0}
                                            </button>
                                        </div>
                                        <p className="text-gray-700 text-sm">{comment.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 댓글 작성 폼 */}
                        <form id={`comment-form-${topic.id}`} onSubmit={handleSubmit} className="bg-white rounded-lg p-3 border">
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={commentAuthor}
                                    onChange={(e) => setCommentAuthor(e.target.value)}
                                    placeholder="닉네임"
                                    maxLength={20}
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                />
                                <select
                                    value={commentPosition}
                                    onChange={(e) => setCommentPosition(e.target.value)}
                                    className="px-3 py-2 border rounded-lg text-sm"
                                >
                                    <option value="agree">찬성</option>
                                    <option value="disagree">반대</option>
                                    <option value="alternative">대안</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="의견을 작성해주세요"
                                    maxLength={500}
                                    rows={2}
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    등록
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// 마감된 투표 섹션 컴포넌트
function ExpiredVotesSection({ topics, votes, userVotes, comments, activeTabs, isSubmitting, onVote, onResetVote, onSubmitComment, onLikeComment, onTabChange, onOpenDeadlineModal }) {
    const expiredTopics = topics.filter(topic => new Date() > new Date(topic.deadline));

    if (expiredTopics.length === 0) return null;

    return (
        <div className="mb-12">
            {/* 섹션 헤더 - 민주주의 서울 스타일 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">투표 마감</h2>
                        <p className="text-sm text-gray-500">최종 결과가 확정된 투표입니다</p>
                    </div>
                </div>
                <span className="bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-full">
                    {expiredTopics.length}개 마감
                </span>
            </div>

            {/* 마감된 투표 카드 그리드 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expiredTopics.map((topic) => (
                    <TopicSection
                        key={topic.id}
                        topic={topic}
                        votes={votes[topic.id]}
                        onOpenDeadlineModal={() => onOpenDeadlineModal(topic.id)}
                        userVote={userVotes[topic.id]}
                        comments={comments[topic.id] || []}
                        activeTab={activeTabs[topic.id]}
                        isSubmitting={isSubmitting}
                        onVote={(vote) => onVote(topic.id, vote)}
                        onResetVote={() => onResetVote(topic.id)}
                        onSubmitComment={(content, author, position) => onSubmitComment(topic.id, content, author, position)}
                        onLikeComment={(commentId) => onLikeComment(topic.id, commentId)}
                        onTabChange={(tab) => onTabChange(topic.id, tab)}
                    />
                ))}
            </div>
        </div>
    );
}

// 제안 카드 컴포넌트
function ProposalCard({ proposal, supportCount, hasSupported, onSupport, minSupports, deadlineDays }) {
    const progressPercent = Math.min((supportCount / minSupports) * 100, 100);
    const createdDate = proposal.createdAt instanceof Date
        ? proposal.createdAt
        : new Date(proposal.createdAt);
    const daysRemaining = proposal.daysRemaining || deadlineDays;

    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100 hover:shadow-xl transition-shadow">
            {/* 카드 상단 영역 */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-5 border-b">
                <div className="flex items-start justify-between mb-3">
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        시민 제안
                    </span>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-500">
                            {formatDate(createdDate)}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            daysRemaining <= 7
                                ? 'bg-red-100 text-red-600'
                                : daysRemaining <= 14
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-green-100 text-green-600'
                        }`}>
                            D-{daysRemaining}
                        </span>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {proposal.title}
                </h3>
                {proposal.subtitle && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {proposal.subtitle}
                    </p>
                )}
                <p className="text-sm text-gray-500 line-clamp-2">
                    {proposal.description}
                </p>
            </div>

            {/* 카드 하단 영역 */}
            <div className="p-4">
                {/* 제안자 */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="text-sm text-gray-600">
                        제안자: <span className="font-medium text-gray-800">{proposal.proposerName}</span>
                    </span>
                </div>

                {/* 진행률 바 */}
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-purple-600 font-bold">
                            {supportCount}/{minSupports} 추천
                        </span>
                        <span className="text-gray-500">
                            {minSupports - supportCount > 0
                                ? `${minSupports - supportCount}명 더 필요`
                                : '승격 조건 달성!'
                            }
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* 추천 버튼 */}
                <button
                    onClick={onSupport}
                    disabled={hasSupported}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        hasSupported
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg'
                    }`}
                >
                    {hasSupported ? (
                        <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            추천 완료
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            이 제안 추천하기
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// 반려된 제안 카드 컴포넌트
function RejectedProposalCard({ proposal, supportCount, minSupports }) {
    const createdDate = proposal.createdAt instanceof Date
        ? proposal.createdAt
        : new Date(proposal.createdAt);
    const rejectedDate = proposal.rejectedAt instanceof Date
        ? proposal.rejectedAt
        : new Date(proposal.rejectedAt || createdDate);

    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
    };

    return (
        <div className="bg-gray-50 rounded-xl shadow-md overflow-hidden border border-gray-200 opacity-75">
            {/* 카드 상단 영역 */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-5 border-b">
                <div className="flex items-start justify-between mb-3">
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                        반려됨
                    </span>
                    <span className="text-xs text-gray-500">
                        {formatDate(createdDate)}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2 line-clamp-2">
                    {proposal.title}
                </h3>
                {proposal.subtitle && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        {proposal.subtitle}
                    </p>
                )}
                <p className="text-sm text-gray-400 line-clamp-2">
                    {proposal.description}
                </p>
            </div>

            {/* 카드 하단 영역 */}
            <div className="p-4">
                {/* 제안자 */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="text-sm text-gray-500">
                        제안자: <span className="font-medium text-gray-600">{proposal.proposerName}</span>
                    </span>
                </div>

                {/* 반려 사유 */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-red-600">
                            <p className="font-bold mb-1">반려 사유</p>
                            <p>{proposal.rejectedReason || `기한 내 추천 수 미달 (${supportCount}/${minSupports}명)`}</p>
                            <p className="text-red-400 mt-1">반려일: {formatDate(rejectedDate)}</p>
                        </div>
                    </div>
                </div>

                {/* 최종 추천 수 */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>최종 추천 수</span>
                    <span className="font-bold text-gray-600">{supportCount}/{minSupports}명</span>
                </div>
            </div>
        </div>
    );
}

// 마감일 수정 모달 컴포넌트
function DeadlineModal({ topic, writerCode, setWriterCode, isAdminVerified, onClose, onUpdate, onVerify }) {
    const [newDeadline, setNewDeadline] = useState(topic?.deadline || '');

    if (!topic) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">마감일 수정</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* 작성자 코드 입력 - 인증 전 */}
                    {!isAdminVerified ? (
                        <div className="text-center py-4">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 mb-2">관리자 인증이 필요합니다</p>
                                <p className="text-sm text-gray-500">{topic.title}</p>
                            </div>
                            <div className="max-w-xs mx-auto">
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-left">작성자 코드</label>
                                <input
                                    type="password"
                                    value={writerCode}
                                    onChange={(e) => setWriterCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onVerify()}
                                    placeholder="작성자 코드를 입력하세요"
                                    className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
                                    autoFocus
                                />
                                <button
                                    onClick={onVerify}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 인증 완료 표시 */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-green-800 text-sm font-bold">관리자 인증됨</span>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm font-bold text-gray-800">{topic.title}</p>
                                <p className="text-xs text-gray-500">현재 마감일: {new Date(topic.deadline).toLocaleDateString('ko-KR')}</p>
                            </div>

                            {/* 새 마감일 선택 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">새 마감일</label>
                                <input
                                    type="date"
                                    value={newDeadline}
                                    onChange={(e) => setNewDeadline(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                        </>
                    )}
                </div>
                {isAdminVerified ? (
                    <div className="p-6 border-t bg-gray-50 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                        >
                            취소
                        </button>
                        <button
                            onClick={() => onUpdate(newDeadline)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            수정하기
                        </button>
                    </div>
                ) : (
                    <div className="p-6 border-t bg-gray-50">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition"
                        >
                            닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
