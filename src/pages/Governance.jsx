import { useState, useEffect } from 'react';

export default function Governance() {
    const [activeProposals, setActiveProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Snapshot API로 현재 진행중인 투표 가져오기
    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            // Snapshot GraphQL API
            const response = await fetch('https://hub.snapshot.org/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query Proposals {
                            proposals(
                                first: 20,
                                where: {
                                    space_in: ["citizen-jury"],
                                    state: "active"
                                },
                                orderBy: "created",
                                orderDirection: desc
                            ) {
                                id
                                title
                                body
                                choices
                                start
                                end
                                state
                                scores
                                scores_total
                            }
                        }
                    `
                })
            });

            const data = await response.json();
            setActiveProposals(data.data.proposals || []);
            setLoading(false);
        } catch (error) {
            console.error('투표 로드 실패:', error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        시민법정 의사결정
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        블록체인 기반 투명한 투표 시스템
                    </p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://snapshot.org/#/citizen-jury"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
                        >
                            Snapshot 바로가기 →
                        </a>
                    </div>
                </div>

                {/* 현재 진행중인 투표 */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        현재 진행중인 투표
                    </h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">투표 불러오는 중...</p>
                        </div>
                    ) : activeProposals.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {activeProposals.map((proposal) => (
                                <ProposalCard key={proposal.id} proposal={proposal} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                            <p className="text-gray-600 text-lg">
                                현재 진행중인 투표가 없습니다.
                            </p>
                            <p className="text-gray-500 mt-2">
                                첫 투표를 생성해보세요!
                            </p>
                        </div>
                    )}
                </div>

                {/* Snapshot 임베드 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        <h2 className="text-2xl font-bold">전체 투표 보기</h2>
                        <p className="mt-2">과거 투표 및 상세 내용 확인</p>
                    </div>
                    <iframe
                        src="https://snapshot.org/#/citizen-jury"
                        width="100%"
                        height="800px"
                        frameBorder="0"
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}

// 투표 카드 컴포넌트
function ProposalCard({ proposal }) {
    const endDate = new Date(proposal.end * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex-1">
                    {proposal.title}
                </h3>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full ml-4">
                    진행중
                </span>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-3">
                {proposal.body}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                    <span>⏰ {daysLeft}일 남음</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🗳️ {proposal.scores_total || 0}표</span>
                </div>
            </div>

            <a
                href={`https://snapshot.org/#/citizen-jury/proposal/${proposal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-purple-600 text-white text-center rounded-lg font-medium hover:bg-purple-700 transition"
            >
                투표하기 →
            </a>
        </div>
    );
}
