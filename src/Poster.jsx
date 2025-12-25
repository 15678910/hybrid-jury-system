import { useRef, useEffect } from 'react'

function Poster({ onClose }) {
  const audioRef = useRef(null)

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
    if (onClose) onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 bg-black/50 z-50">
      <div className="bg-black rounded-2xl shadow-2xl w-full max-w-[500px] h-[85vh] p-3 relative flex flex-col">
        <button
          onClick={handleClose}
          className="absolute top-2 right-3 text-white hover:text-gray-300 text-2xl font-bold transition z-10"
        >
          ✕
        </button>

        <div className="flex-1 mt-6 mb-2 flex items-center justify-center overflow-hidden">
          <img
            src="/온라인참심제!1만명.png"
            alt="온라인참심제 1만명 포스터"
            onClick={handleImageClick}
            className="max-w-full max-h-full object-contain rounded-lg shadow-xl cursor-pointer hover:opacity-90 transition"
          />
        </div>

        <div className="shrink-0 space-y-2 pb-1">
          <p
            onClick={handleImageClick}
            className="text-center text-purple-400 text-sm animate-pulse cursor-pointer"
          >
            🎵 포스터를 클릭하면 음악이 재생됩니다
          </p>
          <button
            onClick={handleParticipate}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition duration-200 shadow-lg transform hover:scale-105 w-full"
          >
            💪 참여하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default Poster
