import { useRef, useEffect, useState } from 'react'

function Poster({ onClose }) {
  const audioRef = useRef(null)
  const [dontShowToday, setDontShowToday] = useState(false)

  // 컴포넌트 마운트 시 Audio 객체 생성 (자동 재생 X)
  useEffect(() => {
    audioRef.current = new Audio('/music.mp3')
    audioRef.current.loop = true

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // 포스터 이미지 클릭 시 음악 재생/정지
  const handleImageClick = () => {
    if (!audioRef.current) return

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => console.log('음악 재생 성공'))
        .catch(err => console.log('재생 실패:', err))
    } else {
      audioRef.current.pause()
    }
  }

  const handleParticipate = () => {
    if (audioRef.current) audioRef.current.pause()
    saveDontShowToday()
    if (onClose) onClose()
    setTimeout(() => {
      const participateSection = document.getElementById('signature')
      if (participateSection) {
        participateSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleClose = () => {
    if (audioRef.current) audioRef.current.pause()
    saveDontShowToday()
    if (onClose) onClose()
  }

  // 오늘 보지 않음 저장
  const saveDontShowToday = () => {
    if (dontShowToday) {
      const today = new Date().toDateString()
      localStorage.setItem('posterDontShowUntil', today)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 bg-black/50 z-50 overflow-y-auto">
      <div className="bg-black rounded-xl shadow-2xl w-full max-w-[500px] p-1.5 relative my-2">
        <button
          onClick={handleClose}
          className="absolute top-1 right-2 text-white hover:text-gray-300 text-2xl font-bold transition z-10"
        >
          ✕
        </button>

        <div className="mt-4 mb-1 flex items-center justify-center">
          <img
            src="/참심제포스터1.png"
            alt="참심제 포스터"
            onClick={handleImageClick}
            className="max-w-full object-contain rounded-lg shadow-xl cursor-pointer hover:opacity-90 transition"
            style={{ maxHeight: '68vh' }}
          />
        </div>

        <div className="pb-2 px-1">
          <p
            onClick={handleImageClick}
            className="text-center text-purple-400 text-xs animate-pulse cursor-pointer mb-1.5"
          >
            🎵 포스터를 클릭하면 음악이 재생됩니다
          </p>

          <button
            onClick={handleParticipate}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition duration-200 shadow-lg transform hover:scale-105 w-full"
          >
            💪 참여하기
          </button>

          {/* 오늘 보지 않음 체크박스 - 체크하면 바로 닫힘 */}
          <label className="flex items-center justify-center gap-2 text-gray-300 text-xs cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => {
                if (e.target.checked) {
                  // 체크하면 바로 저장하고 닫기
                  const today = new Date().toDateString()
                  localStorage.setItem('posterDontShowUntil', today)
                  if (audioRef.current) audioRef.current.pause()
                  if (onClose) onClose()
                } else {
                  setDontShowToday(false)
                }
              }}
              className="w-4 h-4 accent-purple-500"
            />
            오늘 하루 보지 않기
          </label>
        </div>
      </div>
    </div>
  )
}

// 오늘 포스터를 보여줄지 확인하는 함수
export const shouldShowPoster = () => {
  const dontShowUntil = localStorage.getItem('posterDontShowUntil')
  if (!dontShowUntil) return true

  const today = new Date().toDateString()
  return dontShowUntil !== today
}

export default Poster
