import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function TermsOfService() {
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
                            이용약관
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
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제1조 (목적)
                                </h2>
                                <p className="text-gray-700 leading-relaxed">
                                    본 약관은 시민법정 참심제 추진위원회(이하 "위원회")가 운영하는
                                    시민법정 웹사이트(이하 "사이트")에서 제공하는 인터넷 관련 서비스(이하 "서비스")를 이용함에 있어
                                    위원회와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
                                </p>
                            </section>

                            {/* 제2조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제2조 (정의)
                                </h2>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>
                                        <strong>"사이트"</strong>란 위원회가 참심제 도입을 위해 운영하는 웹사이트를 말합니다.
                                    </li>
                                    <li>
                                        <strong>"이용자"</strong>란 사이트에 접속하여 본 약관에 따라 위원회가 제공하는 서비스를 받는 자를 말합니다.
                                    </li>
                                    <li>
                                        <strong>"서명"</strong>이란 참심제 도입을 위한 온라인 서명 캠페인 참여를 말합니다.
                                    </li>
                                </ul>
                            </section>

                            {/* 제3조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제3조 (약관의 게시와 개정)
                                </h2>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                    <li>
                                        위원회는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 사이트에 게시합니다.
                                    </li>
                                    <li>
                                        위원회는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.
                                    </li>
                                    <li>
                                        약관이 개정될 경우 위원회는 개정 내용과 적용일자를 명시하여
                                        적용일자 7일 전부터 사이트에 공지합니다.
                                    </li>
                                </ol>
                            </section>

                            {/* 제4조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제4조 (서비스의 제공)
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-2">
                                    위원회는 다음과 같은 서비스를 제공합니다:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>참심제 관련 정보 제공</li>
                                    <li>온라인 서명 캠페인 운영</li>
                                    <li>서명 참여 현황 공개</li>
                                    <li>블로그 및 소식 제공</li>
                                    <li>기타 위원회가 정하는 서비스</li>
                                </ul>
                            </section>

                            {/* 제5조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제5조 (서비스의 중단)
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-2">
                                    위원회는 다음 각 호의 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 경우</li>
                                    <li>서비스용 설비의 보수 등 공사로 인한 부득이한 경우</li>
                                    <li>전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지했을 경우</li>
                                    <li>기타 불가항력적 사유가 있는 경우</li>
                                </ul>
                            </section>

                            {/* 제6조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제6조 (이용자의 의무)
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-2">
                                    이용자는 다음 행위를 하여서는 안 됩니다:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>타인의 개인정보를 도용하는 행위</li>
                                    <li>허위 내용의 정보를 등록하는 행위</li>
                                    <li>사이트에 게시된 정보를 변경하는 행위</li>
                                    <li>위원회가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등을 송신 또는 게시하는 행위</li>
                                    <li>위원회 및 기타 제3자의 저작권 등 지적재산권을 침해하는 행위</li>
                                    <li>위원회 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                                    <li>외설 또는 폭력적인 메시지, 화상, 음성 기타 공서양속에 반하는 정보를 사이트에 공개 또는 게시하는 행위</li>
                                    <li>자동화된 수단을 통해 반복적으로 서명하는 행위</li>
                                </ul>
                            </section>

                            {/* 제7조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제7조 (저작권의 귀속)
                                </h2>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                    <li>
                                        사이트가 작성한 저작물에 대한 저작권 기타 지적재산권은 위원회에 귀속합니다.
                                    </li>
                                    <li>
                                        이용자는 사이트를 이용함으로써 얻은 정보 중 위원회에게 지적재산권이 귀속된 정보를
                                        위원회의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여
                                        영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
                                    </li>
                                </ol>
                            </section>

                            {/* 제8조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제8조 (분쟁해결)
                                </h2>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                    <li>
                                        위원회는 이용자가 제기하는 정당한 의견이나 불만을 반영하고
                                        그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.
                                    </li>
                                    <li>
                                        위원회는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다.
                                        다만, 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 즉시 통보해 드립니다.
                                    </li>
                                </ol>
                            </section>

                            {/* 제9조 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    제9조 (재판권 및 준거법)
                                </h2>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                    <li>
                                        사이트와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은
                                        대한민국 법을 준거법으로 합니다.
                                    </li>
                                    <li>
                                        사이트와 이용자 간에 발생한 분쟁에 관한 소송은
                                        민사소송법상의 관할법원에 제기합니다.
                                    </li>
                                </ol>
                            </section>

                            {/* 부칙 */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    부칙
                                </h2>
                                <div className="p-4 bg-blue-50 rounded-lg space-y-2 text-gray-700">
                                    <p><strong>시행일자:</strong> 2025년 12월 26일</p>
                                    <p className="text-sm">본 약관은 2025년 12월 26일부터 적용됩니다.</p>
                                </div>
                            </section>

                            {/* 문의 */}
                            <section className="mt-8 p-6 bg-gray-50 rounded-lg">
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                    약관 관련 문의
                                </h3>
                                <p className="text-gray-700">
                                    본 약관에 대한 문의사항이 있으시면 아래로 연락 주시기 바랍니다.
                                </p>
                                <p className="text-gray-700 mt-2">
                                    <strong>이메일:</strong> siminbupjung@gmail.com
                                </p>
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
