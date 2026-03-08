import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPageview } from '../lib/pageTracking';

/**
 * 라우트 변경을 감지하여 Firestore에 페이지뷰를 기록하는 컴포넌트
 * - BrowserRouter 내부에 렌더링되어야 함
 * - 시각적 출력 없음 (return null)
 */
export default function PageTracker() {
    const location = useLocation();

    useEffect(() => {
        recordPageview(location.pathname);
    }, [location.pathname]);

    return null;
}
