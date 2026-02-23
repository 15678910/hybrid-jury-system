import React from 'react'

const CHUNK_RELOAD_KEY = 'chunk_reload_attempted'

function isChunkLoadError(error) {
  const msg = error?.message || ''
  return (
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('ChunkLoadError')
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info)

    if (isChunkLoadError(error)) {
      const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY)
      if (!alreadyRetried) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
        window.location.reload()
      }
    }
  }

  handleRetry() {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const isChunkError = isChunkLoadError(this.state.error)
    const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY)

    if (isChunkError && !alreadyRetried) {
      // 자동 리로드 중 — 로딩 화면 표시
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">페이지를 다시 불러오는 중...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            페이지를 불러올 수 없습니다
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            {isChunkError
              ? '네트워크 오류 또는 캐시 문제로 페이지 로딩에 실패했습니다.'
              : '예상치 못한 오류가 발생했습니다.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
