import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ConsentCheckbox({ consents, onChange, showMarketing = false }) {
    const handleChange = (key) => {
        onChange({
            ...consents,
            [key]: !consents[key]
        });
    };

    return (
        <div className="space-y-3 mb-6">
            {/* 만 14세 이상 확인 */}
            <label className="flex items-start space-x-2 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={consents.age14 || false}
                    onChange={() => handleChange('age14')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                />
                <span className="text-gray-700 group-hover:text-gray-900">
                    <span className="text-red-500">*</span> 만 14세 이상입니다
                </span>
            </label>

            {/* 개인정보 처리방침 동의 */}
            <label className="flex items-start space-x-2 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={consents.privacy || false}
                    onChange={() => handleChange('privacy')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                />
                <span className="text-gray-700 group-hover:text-gray-900">
                    <span className="text-red-500">*</span> 개인정보 처리방침에 동의합니다{' '}
                    <Link
                        to="/privacy"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        (더 보기)
                    </Link>
                </span>
            </label>

            {/* 이용약관 동의 */}
            <label className="flex items-start space-x-2 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={consents.terms || false}
                    onChange={() => handleChange('terms')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                />
                <span className="text-gray-700 group-hover:text-gray-900">
                    <span className="text-red-500">*</span> 이용약관에 동의합니다{' '}
                    <Link
                        to="/terms"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        (더 보기)
                    </Link>
                </span>
            </label>

            {/* 마케팅 정보 수신 동의 (선택) */}
            {showMarketing && (
                <label className="flex items-start space-x-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={consents.marketing || false}
                        onChange={() => handleChange('marketing')}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 group-hover:text-gray-900">
                        (선택) 캠페인 소식 및 마케팅 정보 수신에 동의합니다
                    </span>
                </label>
            )}

            {/* 필수 동의 안내 */}
            <p className="text-xs text-gray-500 mt-2">
                <span className="text-red-500">*</span> 필수 항목입니다
            </p>
        </div>
    );
}
