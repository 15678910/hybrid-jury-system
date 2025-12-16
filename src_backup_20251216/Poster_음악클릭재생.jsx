import { useEffect, useRef } from 'react'

function Poster({ onClose }) {
  const audioRef = useRef(null)

  useEffect(() => {
    // 자동 재생 시도
    const playAudio = async () => {
      try {
        if (audioRef.current) {
          // 음소거로 먼저 재생 시도 (브라우저 정책 우회)
          audioRef.current.muted = true
          await audioRef.current.play()
          // 성공하면 음소거 해제
          audioRef.current.muted = false
        }
      } catch (error) {
        console.log('자동 재생 실패:', error)
        // 실패해도 버튼 없이 진행
      }
    }

    // 약간의 딜레이 후 재생
    const timer = setTimeout(playAudio, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleParticipate = () => {
    if (onClose) onClose() // 모달 닫기
    // 참여하기 섹션으로 스크롤
    setTimeout(() => {
      const participateSection = document.getElementById('signature')
      if (participateSection) {
        participateSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  // 모달 클릭 시 음악 재생
  const handleModalClick = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(err => console.log('재생 실패:', err))
    }
  }

  return (
    <div 
      className="flex items-center justify-center p-4 min-h-screen"
      onClick={handleModalClick}
    >
      {/* 배경 음악 */}
      <audio 
        ref={audioRef} 
        loop
        preload="auto"
        autoPlay
      >
        <source src="/시민법정_참심제_reggae1.mp3" type="audio/mpeg" />
      </audio>

      {/* 작은 모달 컨텐츠 - 2/3 크기 */}
      <div className="bg-black rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* 닫기 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold transition z-10"
          >
            ✕
          </button>
        )}

        {/* 포스터 이미지 */}
        <div className="mb-6 mt-8">
          <img 
            src="/참심제_웹자보qrcode.png" 
            alt="참심제 포스터" 
            className="w-full h-auto rounded-lg shadow-xl"
          />
        </div>

        {/* 참여하기 버튼 */}
        <div className="text-center mb-4">
          <button
            onClick={handleParticipate}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-10 rounded-xl text-lg transition duration-200 shadow-lg transform hover:scale-105 w-full"
          >
            💪 지금 참여하기
          </button>
        </div>

        {/* 하단 안내 */}
        <div className="text-center text-gray-400 text-xs">
          <p>주권자사법개혁추진위원회</p>
          <p className="mt-1">www.시민법정.kr</p>
        </div>
      </div>
    </div>
  )
}

export default Poster
