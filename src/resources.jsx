import React, { useState } from 'react';

const Resources = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [previewFile, setPreviewFile] = useState(null);

    const resources = [
        // 한국 자료
        {
            id: 1,
            title: '형사재판절차에 있어서 배심 및 참심제도의 도입방안',
            description: '한국 형사재판 절차에서 배심제와 참심제 도입에 관한 연구 자료',
            category: 'korea',
            file: '형사재판절차에 있어서 배심 및 참심제도의 도입방안.pdf',
            date: '2025-09-29',
            language: '한국어'
        },
        {
            id: 2,
            title: '바람직한_한국형_국민참여재판_제도의_도입을_위한_비교법적_고찰',
            description: '국민참여재판 제도의 개선 방향에 대한 제안',
            category: 'korea',
            file: 'korea_mixed_jury_system.pdf',
            date: '2025-11-03',
            language: '한국어'
        },
        
        // 유럽 자료
        {
            id: 4,
            title: 'Characteristics of European Union Justice',
            description: '유럽연합 사법 제도의 특성에 관한 연구',
            category: 'europe',
            file: 'Characteristics of European Union Justice.pdf',
            date: '2025-11-01',
            language: 'English'
        },
        
        // 스웨덴 자료
        {
            id: 5,
            title: 'FULLTEXT01 - Sweden Judicial System',
            description: '스웨덴 사법 시스템에 관한 전체 텍스트',
            category: 'sweden',
            file: 'FULLTEXT01sweden.pdf',
            date: '2025-10-14',
            language: 'English'
        },
        {
            id: 6,
            title: 'Hoffmann-Holland-Putzer Lay Judges Germany',
            description: '독일의 참심제에 관한 연구 (Hoffmann-Holland-Putzer)',
            category: 'germany',
            file: 'germany_lay_judges.pdf',
            date: '2025-10-14',
            language: 'English'
        },
        {
            id: 7,
            title: 'Madeleine Rundberg - Masters Thesis 2022',
            description: '스웨덴 참심제에 관한 석사 논문 (Madeleine Rundberg, 2022)',
            category: 'sweden',
            file: 'Madeleine_Rundberg_SOLM02_Masters_Thesis_2022sweden.pdf',
            date: '2025-10-14',
            language: 'English'
        },
        {
            id: 8,
            title: 'The Swedish Code of Judicial Procedure',
            description: '스웨덴 사법 절차 법전 (DS 1998:65)',
            category: 'sweden',
            file: 'the-swedish-code-of-judicial-procedure-ds-1998_65sweden.pdf',
            date: '2025-10-14',
            language: 'English'
        },
        
        // 핀란드 자료
        {
            id: 9,
            title: 'Karhu Jenna - Finnish Lay Judge System',
            description: '핀란드 참심제 연구 (Karhu Jenna)',
            category: 'finland',
            file: 'karhu_jenna_fin.pdf',
            date: '2025-10-14',
            language: 'English'
        },
        {
            id: 10,
            title: 'Sanni Tolonen - Finnish Judicial System',
            description: '핀란드 사법 시스템 연구 (Sanni Tolonen)',
            category: 'finland',
            file: 'Sanni Tolonen_fin.pdf',
            date: '2025-10-14',
            language: 'English'
        },
        {
            id: 11,
            title: 'TIV Lautamies - Lay Judge Guide (A5)',
            description: '핀란드 참심원 안내 책자',
            category: 'finland',
            file: 'TIV_Lautamies_esite_A5_FIN.pdf',
            date: '2025-10-14',
            language: 'Finnish'
        },
        
        // EU 법률 자료
        {
            id: 12,
            title: 'SSRN-2665612 - EU Legal Research',
            description: 'EU 법률 연구 논문',
            category: 'europe',
            file: 'ssrn-2665612eu.pdf',
            date: '2025-10-14',
            language: 'English'
        }
    ];

    const categories = [
        { id: 'all', name: '전체', icon: '📚' },
        { id: 'korea', name: '한국', icon: '🇰🇷' },
        { id: 'europe', name: '유럽', icon: '🇪🇺' },
        { id: 'sweden', name: '스웨덴', icon: '🇸🇪' },
        { id: 'finland', name: '핀란드', icon: '🇫🇮' },
        { id: 'germany', name: '독일', icon: '🇩🇪' }
    ];

    const filteredResources = selectedCategory === 'all' 
        ? resources 
        : resources.filter(r => r.category === selectedCategory);

    const getFileIcon = (filename) => {
        if (filename.endsWith('.pdf')) return '📄';
        if (filename.endsWith('.png') || filename.endsWith('.jpg')) return '🖼️';
        if (filename.endsWith('.mp3')) return '🎵';
        return '📎';
    };

    return (
        <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    📚 자료실
                </h2>
                <p className="text-xl text-gray-600">
                    혼합형 참심제 관련 국내외 연구 자료 및 문서
                </p>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
                {categories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-6 py-3 rounded-full font-medium transition-all ${
                            selectedCategory === category.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                    </button>
                ))}
            </div>

            {/* 자료 개수 표시 */}
            <div className="text-center mb-6">
                <span className="text-gray-600">
                    총 <strong className="text-blue-600">{filteredResources.length}</strong>개의 자료
                </span>
            </div>

            {/* 자료 목록 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                    <div 
                        key={resource.id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border border-gray-100 hover:scale-105"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-4xl">
                                {getFileIcon(resource.file)}
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {resource.language}
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                            {resource.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {resource.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <span>📅 {resource.date}</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPreviewFile(resource)}
                                className="flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
                            >
                                미리보기 👁️
                            </button>
                            <a
                                href={`/${encodeURIComponent(resource.file)}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                            >
                                다운로드 📥
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {filteredResources.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-xl text-gray-600">
                        해당 카테고리에 자료가 없습니다.
                    </p>
                </div>
            )}

            {/* 미리보기 모달 */}
            {previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-900">
                                {previewFile.title}
                            </h3>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={`/${encodeURIComponent(previewFile.file)}`}
                                className="w-full h-full"
                                title={previewFile.title}
                            />
                        </div>
                        <div className="p-4 border-t flex gap-3">
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                            >
                                닫기
                            </button>
                            <a
                                href={`/${encodeURIComponent(previewFile.file)}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition"
                            >
                                다운로드 📥
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resources;
