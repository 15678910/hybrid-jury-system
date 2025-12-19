import { useRef, useEffect } from 'react'

function Poster({ onClose }) {
  const audioRef = useRef(null)

  // 컴포넌트 마운트 시 Audio 객체 생성 및 자동 재생 시도
  useEffect(() => {
    audioRef.current = new Audio('/music.mp3')
    audioRef.current.loop = true

    // 자동 재생 시도 (헤더에서 클릭 시 작동)
    audioRef.current.play()
      .then(() => console.log('자동 재생 성공'))
      .catch(err => console.log('자동 재생 실패 (포스터 클릭하세요):', err))

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

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

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-50">
      <div className="bg-black rounded-2xl shadow-2xl w-full max-w-[450px] h-[75vh] p-3 relative flex flex-col overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-2 right-3 text-white hover:text-gray-300 text-2xl font-bold transition z-10"
        >
          ✕
        </button>

        <div className="flex-1 mt-4 mb-1 flex flex-col justify-center items-center overflow-hidden">
          <img
            src="/참심제_웹자보qrcode.png"
            alt="참심제 포스터"
            onClick={handleImageClick}
            className="w-full h-full object-contain rounded-lg shadow-xl cursor-pointer hover:opacity-90 transition"
          />
          <p
            onClick={handleImageClick}
            className="text-center text-purple-400 text-xs mt-1 animate-pulse cursor-pointer shrink-0"
          >
            🎵 포스터를 클릭하면 음악이 재생됩니다
          </p>
        </div>

        <div className="text-center shrink-0 pt-1">
          <button
            onClick={handleParticipate}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition duration-200 shadow-lg transform hover:scale-105 w-full"
          >
            💪 지금 참여하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default Poster
