import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SNSShareBar from '../components/SNSShareBar';

export default function Donate() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        // 후원정보
        donationType: 'monthly', // monthly, once
        donationName: '뉴스타파를 응원합니다',
        donationAmount: '',
        customAmount: '',

        // 기본정보
        memberType: 'individual', // individual, business
        name: '',
        isOver14: false,
        phone: '',
        email: '',

        // 결제정보
        paymentMethod: 'cms', // cms, card, kakao
        bankName: '',
        accountNumber: '',
        paymentDate: 'day25', // day10, day25
        paymentDay: '매월 5일',

        // 동의
        agreeAll: false,
        agreePrivacy: false,
        agreePayment: false,
        agreeCms: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const donationAmounts = ['5,000원', '10,000원', '20,000원', '30,000원', '50,000원', '100,000원', '직접입력'];

    const handleAmountSelect = (amount) => {
        if (amount === '직접입력') {
            setFormData({ ...formData, donationAmount: 'custom' });
        } else {
            setFormData({ ...formData, donationAmount: amount, customAmount: '' });
        }
    };

    const handleAgreeAll = (checked) => {
        setFormData({
            ...formData,
            agreeAll: checked,
            agreePrivacy: checked,
            agreePayment: checked,
            agreeCms: checked
        });
    };

    const handleIndividualAgree = (key, checked) => {
        const newData = { ...formData, [key]: checked };
        newData.agreeAll = newData.agreePrivacy && newData.agreePayment && newData.agreeCms;
        setFormData(newData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 유효성 검사
        if (!formData.donationAmount) {
            alert('후원금액을 선택해주세요.');
            return;
        }
        if (formData.donationAmount === 'custom' && !formData.customAmount) {
            alert('후원금액을 입력해주세요.');
            return;
        }
        if (!formData.name) {
            alert('이름을 입력해주세요.');
            return;
        }
        if (!formData.phone) {
            alert('휴대전화 번호를 입력해주세요.');
            return;
        }
        if (!formData.email) {
            alert('이메일 주소를 입력해주세요.');
            return;
        }
        if (!formData.agreePrivacy || !formData.agreePayment) {
            alert('필수 약관에 동의해주세요.');
            return;
        }

        setIsSubmitting(true);

        // 실제 결제 연동 시 여기에 구현
        // 현재는 데모용으로 알림만 표시
        setTimeout(() => {
            alert('후원 신청이 완료되었습니다.\n담당자가 확인 후 연락드리겠습니다.\n\n감사합니다!');
            setIsSubmitting(false);
            navigate('/');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />

            <div className="flex min-h-screen pt-16">
                {/* 좌측 배너 */}
                <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-gray-600 to-gray-800 items-center justify-center p-12">
                    <div className="text-center text-white">
                        <h2 className="text-3xl font-bold mb-4 leading-tight">
                            주권자에 의한<br/>
                            시민법관 참심제!
                        </h2>
                    </div>
                </div>

                {/* 우측 폼 */}
                <div className="flex-1 overflow-y-auto py-8 px-4 lg:px-12">
                    <div className="max-w-xl mx-auto">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* 후원정보 */}
                            <section className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 text-center mb-6 pb-3 border-b">후원정보</h3>

                                {/* 후원유형 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">후원유형</label>
                                    <div className="flex">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, donationType: 'monthly' })}
                                            className={`flex-1 py-2 text-sm font-medium transition ${
                                                formData.donationType === 'monthly'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            정기후원
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, donationType: 'once' })}
                                            className={`flex-1 py-2 text-sm font-medium transition ${
                                                formData.donationType === 'once'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            일시후원
                                        </button>
                                    </div>
                                </div>

                                {/* 후원명 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">후원명</label>
                                    <input
                                        type="text"
                                        value={formData.donationName}
                                        onChange={(e) => setFormData({ ...formData, donationName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                        placeholder="시민법정을 응원합니다"
                                    />
                                </div>

                                {/* 후원금액 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">후원금액</label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {donationAmounts.map((amount) => (
                                            <button
                                                key={amount}
                                                type="button"
                                                onClick={() => handleAmountSelect(amount)}
                                                className={`py-2 text-sm border rounded transition ${
                                                    (formData.donationAmount === amount) ||
                                                    (amount === '직접입력' && formData.donationAmount === 'custom')
                                                        ? 'bg-orange-500 text-white border-orange-500'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-orange-500'
                                                }`}
                                            >
                                                {amount}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.donationAmount === 'custom' && (
                                        <input
                                            type="text"
                                            value={formData.customAmount}
                                            onChange={(e) => setFormData({ ...formData, customAmount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                            placeholder="금액을 입력해주세요"
                                        />
                                    )}
                                </div>

                                <div className="text-xs text-gray-500 mt-4 space-y-1">
                                    <p>※ 해외에서 후원하시려면 이메일(siminbupjung@gmail.com)로 문의해주세요.</p>
                                </div>
                            </section>

                            {/* 기본정보 */}
                            <section className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 text-center mb-6 pb-3 border-b">기본정보</h3>

                                {/* 회원유형 */}
                                <div className="mb-4">
                                    <div className="flex">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, memberType: 'individual' })}
                                            className={`flex-1 py-2 text-sm font-medium transition ${
                                                formData.memberType === 'individual'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            개인
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, memberType: 'business' })}
                                            className={`flex-1 py-2 text-sm font-medium transition ${
                                                formData.memberType === 'business'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            기업/단체
                                        </button>
                                    </div>
                                </div>

                                {/* 이름 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">이름 <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                            placeholder="실명을 입력해주세요"
                                            required
                                        />
                                        <label className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={formData.isOver14}
                                                onChange={(e) => setFormData({ ...formData, isOver14: e.target.checked })}
                                                className="w-4 h-4 text-orange-500"
                                            />
                                            14세 미만
                                        </label>
                                    </div>
                                </div>

                                {/* 휴대전화 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">휴대전화 번호 <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                        placeholder="010-1234-5678"
                                        required
                                    />
                                </div>

                                {/* 이메일 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">이메일 주소 <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                        placeholder="example@email.com"
                                        required
                                    />
                                </div>

                                <p className="text-xs text-gray-500">
                                    ※ 이메일 주소 입력 시, 시민법정 소식지를 받으실 수 있습니다.
                                </p>
                            </section>

                            {/* 결제정보 */}
                            <section className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 text-center mb-6 pb-3 border-b">결제정보</h3>

                                {/* 결제수단 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">결제수단</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'cms' })}
                                            className={`flex-1 py-2 text-sm font-medium rounded transition ${
                                                formData.paymentMethod === 'cms'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            CMS자동이체
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                                            className={`flex-1 py-2 text-sm font-medium rounded transition ${
                                                formData.paymentMethod === 'card'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            신용카드
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: 'kakao' })}
                                            className={`flex-1 py-2 text-sm font-medium rounded flex items-center justify-center gap-1 transition ${
                                                formData.paymentMethod === 'kakao'
                                                    ? 'bg-[#FEE500] text-[#391B1B]'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            <span>kakaopay</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 은행명 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">은행명</label>
                                    <select
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                    >
                                        <option value="">은행을 선택해 주세요</option>
                                        <option value="kakao">카카오뱅크</option>
                                        <option value="kb">국민은행</option>
                                        <option value="shinhan">신한은행</option>
                                        <option value="woori">우리은행</option>
                                        <option value="hana">하나은행</option>
                                        <option value="nh">농협은행</option>
                                        <option value="ibk">기업은행</option>
                                        <option value="sc">SC제일은행</option>
                                        <option value="toss">토스뱅크</option>
                                    </select>
                                </div>

                                {/* 계좌번호 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">계좌번호</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.accountNumber}
                                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                            placeholder="숫자만 입력해 주세요. 계좌번호 사이의 빼기"
                                        />
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm hover:bg-gray-300 transition"
                                        >
                                            확인
                                        </button>
                                    </div>
                                </div>

                                {/* 예상수금일 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">예상수금일</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentDate: 'day10' })}
                                            className={`flex-1 py-2 text-sm font-medium rounded transition ${
                                                formData.paymentDate === 'day10'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            매월(예상10일)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentDate: 'day25' })}
                                            className={`flex-1 py-2 text-sm font-medium rounded transition ${
                                                formData.paymentDate === 'day25'
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            분기(1/4/7/10)
                                        </button>
                                    </div>
                                </div>

                                {/* 후원일 */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">후원일</label>
                                    <select
                                        value={formData.paymentDay}
                                        onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                    >
                                        <option value="매월 5일">매월 5일</option>
                                        <option value="매월 10일">매월 10일</option>
                                        <option value="매월 15일">매월 15일</option>
                                        <option value="매월 20일">매월 20일</option>
                                        <option value="매월 25일">매월 25일</option>
                                    </select>
                                </div>

                                <div className="text-xs text-gray-500 space-y-1 mt-4 p-3 bg-gray-50 rounded">
                                    <p>※ 후원 금액 : 시민법정 주비위도움 / 대표 : 555-9009-9999 / 사이버 기획 / simindev@naver.org</p>
                                </div>
                            </section>

                            {/* 동의 */}
                            <section className="bg-white rounded-lg p-6 shadow-sm">
                                <div className="space-y-3">
                                    {/* 전체 동의 */}
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreeAll}
                                            onChange={(e) => handleAgreeAll(e.target.checked)}
                                            className="w-5 h-5 text-orange-500 rounded"
                                        />
                                        <span className="font-medium text-gray-800">전체 동의하기</span>
                                    </label>

                                    {/* 개인정보 수집 */}
                                    <label className="flex items-center gap-2 cursor-pointer pl-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreePrivacy}
                                            onChange={(e) => handleIndividualAgree('agreePrivacy', e.target.checked)}
                                            className="w-4 h-4 text-orange-500 rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                            개인정보수집 및 이용동의 <span className="text-red-500">(필수)</span>
                                        </span>
                                        <a href="/privacy" target="_blank" className="text-xs text-blue-600 hover:underline ml-auto">보기</a>
                                    </label>

                                    {/* 자동이체 */}
                                    <label className="flex items-center gap-2 cursor-pointer pl-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreePayment}
                                            onChange={(e) => handleIndividualAgree('agreePayment', e.target.checked)}
                                            className="w-4 h-4 text-orange-500 rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                            자동이체약관 <span className="text-red-500">(필수)</span>
                                        </span>
                                        <a href="/terms" target="_blank" className="text-xs text-blue-600 hover:underline ml-auto">보기</a>
                                    </label>

                                    {/* CMS */}
                                    <label className="flex items-center gap-2 cursor-pointer pl-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.agreeCms}
                                            onChange={(e) => handleIndividualAgree('agreeCms', e.target.checked)}
                                            className="w-4 h-4 text-orange-500 rounded"
                                        />
                                        <span className="text-sm text-gray-700">
                                            CMS자동 승인 <span className="text-gray-400">(선택)</span>
                                        </span>
                                    </label>
                                </div>
                            </section>

                            {/* 신청하기 버튼 */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? '신청 중...' : '신청하기'}
                            </button>
                        </form>

                        {/* 연말정산 가이드 */}
                        <section className="bg-white rounded-lg p-6 shadow-sm mt-8">
                            <h3 className="text-lg font-bold text-gray-800 text-center mb-6 pb-3 border-b">
                                <span className="text-orange-500">연말정산</span> 기부금 세액공제 안내
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                                        기부금 세액공제란?
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        비영리단체에 기부한 금액의 일정 비율을 연말정산 시 세금에서 공제받을 수 있는 제도입니다.
                                        시민법정 후원금은 <strong className="text-orange-600">지정기부금</strong>으로 세액공제 혜택을 받으실 수 있습니다.
                                    </p>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                                        세액공제 비율
                                    </h4>
                                    <div className="text-sm text-gray-600 space-y-2">
                                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                            <span>기부금 1,000만원 이하</span>
                                            <span className="font-bold text-blue-600">15% 공제</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span>기부금 1,000만원 초과</span>
                                            <span className="font-bold text-blue-600">30% 공제</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            * 예: 연간 12만원 후원 시 약 18,000원 세액공제
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
                                        기부금 영수증 발급 방법
                                    </h4>
                                    <ul className="text-sm text-gray-600 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-0.5">•</span>
                                            <span><strong>국세청 연말정산 간소화 서비스:</strong> 매년 1월 중순부터 자동 조회 가능</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-0.5">•</span>
                                            <span><strong>개별 발급 요청:</strong> siminbupjung@gmail.com으로 성함, 주민번호(앞 6자리), 연락처 발송</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
                                        유의사항
                                    </h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• 기부금 영수증은 <strong>실명</strong>으로만 발급됩니다.</li>
                                        <li>• 후원자 본인 명의로만 세액공제가 가능합니다.</li>
                                        <li>• 공제한도: 근로소득금액의 30% 이내</li>
                                        <li>• 문의: siminbupjung@gmail.com</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
                                <p className="text-sm text-gray-600 mb-2">기부금 영수증 발급 문의</p>
                                <a href="mailto:siminbupjung@gmail.com" className="text-blue-600 hover:underline font-medium">
                                    siminbupjung@gmail.com
                                </a>
                            </div>
                        </section>

                        {/* 후원 계좌 안내 */}
                        <section className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 shadow-sm mt-8 border border-orange-200">
                            <h3 className="text-lg font-bold text-gray-800 text-center mb-4">
                                계좌이체로 후원하기
                            </h3>
                            <div className="bg-white rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">은행명</p>
                                        <p className="font-medium text-gray-800">카카오뱅크</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">예금주</p>
                                        <p className="font-medium text-gray-800">시민법정참심제추진위</p>
                                    </div>
                                </div>
                                <div className="text-center border-t pt-3">
                                    <p className="text-xs text-gray-500 mb-1">계좌번호</p>
                                    <p className="font-bold text-lg text-orange-600">3333-12-3456789</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-3">
                                * 입금자명에 성함을 기재해주시면 기부금 영수증 발급이 가능합니다.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
            <SNSShareBar />
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                    <p className="mt-2 text-sm">문의: siminbupjung@gmail.com</p>
                </div>
            </footer>
        </div>
    );
}
