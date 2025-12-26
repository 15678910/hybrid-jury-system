import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <article className="container mx-auto max-w-4xl">
                    {/* 뒤로가기 */}
                    <Link
                        to="/"
                        className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        홈으로
                    </Link>

                    {/* 제목 */}
                    <header className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            개인정보 처리방침
                        </h1>
                        <p className="text-gray-500">
                            시행일자: 2025년 12월 26일
                        </p>
                    </header>

                    {/* 본문 */}
                    <div className="bg-white rounded-xl shadow-md p-6 md:p-10">
                        <div className="prose prose-lg max-w-none">
                            {/* 서문 */}
                            <section className="mb-8">
                                <p className="text-gray-700 leading-relaxed">
                                    시민법정 참심제 추진위원회(이하 "위원회")는 정보주체의 자유와 권리 보호를 위해
                                    「개인정보 보호법」 및 관계 법령이 정한 바를 준수합니다.
                                </p>
                            </section>

                            {/* 1. 수집 항목 및 목적 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    1. 개인정보의 수집 및 이용 목적
                                </h2>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>시민법정 참심제 도입을 위한 온라인 서명 캠페인 운영</li>
                                    <li>참여 통계 및 현황 파악</li>
                                    <li>캠페인 관련 정보 제공 (동의한 경우에 한함)</li>
                                </ul>
                            </section>

                            {/* 2. 수집 항목 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    2. 수집하는 개인정보 항목
                                </h2>

                                <div className="mb-4">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">필수 항목</h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                        <li>이름</li>
                                        <li>전화번호 또는 이메일</li>
                                        <li>참여 유형 (개인/단체)</li>
                                        <li>단체명 (단체 참여 시)</li>
                                    </ul>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">선택 항목</h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                        <li>이메일 (소식지 수신 희망 시)</li>
                                    </ul>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">자동 수집 항목</h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                        <li>서명 일시</li>
                                        <li>로그인 방법 (Google, Kakao 등) - 소셜 로그인 이용 시</li>
                                    </ul>
                                </div>
                            </section>

                            {/* 3. 보유 기간 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    3. 개인정보의 보유 및 이용 기간
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-2">
                                    위원회는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>
                                        <strong>보유 기간:</strong> 서명 캠페인 종료 시까지 (2026년 12월 31일 예정)
                                    </li>
                                    <li>
                                        <strong>예외:</strong> 정보주체가 삭제를 요청하는 경우 즉시 파기
                                    </li>
                                </ul>
                            </section>

                            {/* 4. 제3자 제공 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    4. 개인정보의 제3자 제공
                                </h2>
                                <p className="text-gray-700 leading-relaxed">
                                    위원회는 정보주체의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
                                    다만, 다음의 경우는 예외로 합니다:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
                                    <li>법령에 특별한 규정이 있는 경우</li>
                                    <li>법령상 의무를 준수하기 위하여 불가피한 경우</li>
                                </ul>
                            </section>

                            {/* 5. 파기 절차 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    5. 개인정보의 파기 절차 및 방법
                                </h2>
                                <div className="space-y-3 text-gray-700">
                                    <div>
                                        <strong className="block mb-1">파기 절차</strong>
                                        <p className="ml-4">
                                            이용 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함)
                                            내부 방침 및 관련 법령에 따라 일정 기간 저장된 후 파기됩니다.
                                        </p>
                                    </div>
                                    <div>
                                        <strong className="block mb-1">파기 방법</strong>
                                        <ul className="list-disc list-inside ml-4 space-y-1">
                                            <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
                                            <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* 6. 정보주체의 권리 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    6. 정보주체의 권리와 행사 방법
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-2">
                                    정보주체는 언제든지 다음과 같은 권리를 행사할 수 있습니다:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>개인정보 열람 요구</li>
                                    <li>개인정보 정정 요구</li>
                                    <li>개인정보 삭제 요구</li>
                                    <li>개인정보 처리 정지 요구</li>
                                </ul>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    권리 행사는 개인정보 보호책임자에게 서면, 전화, 이메일 등으로 하실 수 있으며,
                                    위원회는 이에 대해 지체 없이 조치하겠습니다.
                                </p>
                            </section>

                            {/* 7. 개인정보 보호책임자 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    7. 개인정보 보호책임자
                                </h2>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
                                    <p><strong>책임자:</strong> 시민법정 참심제 추진위원회</p>
                                    <p><strong>이메일:</strong> siminbupjung@gmail.com</p>
                                    <p><strong>전화:</strong> 문의는 이메일로 부탁드립니다</p>
                                </div>
                            </section>

                            {/* 8. 쿠키 및 자동 수집 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    8. 쿠키의 운용 및 거부
                                </h2>
                                <p className="text-gray-700 leading-relaxed">
                                    위원회는 서명 중복 방지를 위해 최소한의 쿠키를 사용할 수 있습니다.
                                    쿠키는 브라우저 설정을 통해 거부할 수 있으나, 이 경우 서비스 이용에 제한이 있을 수 있습니다.
                                </p>
                            </section>

                            {/* 9. 개인정보 보호 책임 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    9. 개인정보의 안전성 확보 조치
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-2">
                                    위원회는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>관리적 조치: 내부관리계획 수립 및 시행, 정기적 직원 교육</li>
                                    <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 보안프로그램 설치</li>
                                    <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                                </ul>
                            </section>

                            {/* 10. 변경 안내 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    10. 개인정보 처리방침의 변경
                                </h2>
                                <p className="text-gray-700 leading-relaxed">
                                    이 개인정보 처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는
                                    변경사항의 시행 7일 전부터 홈페이지를 통하여 고지할 것입니다.
                                </p>
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-gray-700">
                                        <strong>시행일자:</strong> 2025년 12월 26일
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                </article>
            </main>

            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
