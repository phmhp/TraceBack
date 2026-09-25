import { useMemo } from 'react'

interface TimelineProps {
  currentIndex: number
  totalFrames: number
  currentTimeSeconds: number
  totalTimeSeconds: number
  eventTimeSeconds: number
  isPlaying: boolean
  onTogglePlay: () => void
  onSeek: (index: number) => void
  onJumpToEvent: () => void
  onOpenVideo: () => void
}

function formatTimeString(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${String(mins).padStart(2, '0')}:${secs.padStart(6, '0')}`
}

export function InvestigationTimeline({
  currentIndex,
  totalFrames,
  currentTimeSeconds,
  totalTimeSeconds,
  eventTimeSeconds,
  isPlaying,
  onTogglePlay,
  onSeek,
  onJumpToEvent,
  onOpenVideo
}: TimelineProps) {
  // Calculate relative percent of event time along total timeline
  const eventPercent = useMemo(() => {
    if (totalTimeSeconds <= 0) return 30
    return Math.min(100, Math.max(0, (eventTimeSeconds / totalTimeSeconds) * 100))
  }, [eventTimeSeconds, totalTimeSeconds])

  return (
    <footer className="investigation-bottom-bar" aria-label="주행 타임라인">
      <div className="timeline-play-group">
        <button
          type="button"
          className="timeline-play-btn"
          onClick={onTogglePlay}
          aria-label={isPlaying ? '정지' : '재생'}
          title={isPlaying ? '정지' : '재생'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <span className="timeline-time-display">
          {formatTimeString(currentTimeSeconds)} / {formatTimeString(totalTimeSeconds || 60)}
        </span>
      </div>

      <div className="timeline-slider-track">
        <input
          type="range"
          className="timeline-slider-input"
          min="0"
          max={Math.max(0, totalFrames - 1)}
          value={currentIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="타임라인 슬라이더"
        />

        {/* 사건 시점 마커 */}
        <div
          className="timeline-event-marker"
          style={{ left: `${eventPercent}%` }}
          title={`사건 시점 (${eventTimeSeconds.toFixed(3)}s)`}
        >
          <div className="timeline-event-marker-dot" />
        </div>
      </div>

      <div className="timeline-actions-group">
        <button
          type="button"
          className="timeline-btn"
          onClick={onJumpToEvent}
          title="사건 발생 프레임으로 바로 이동"
        >
          <span>🎯</span>
          <span>사건 시점으로 이동</span>
        </button>

        <button
          type="button"
          className="timeline-btn"
          onClick={onOpenVideo}
          title="저장된 주행 영상 보기"
        >
          <span>📹</span>
          <span>영상 보기</span>
        </button>

        <button
          type="button"
          className="timeline-btn"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {})
            } else {
              document.exitFullscreen().catch(() => {})
            }
          }}
          title="전체화면"
        >
          <span>⛶</span>
        </button>
      </div>
    </footer>
  )
}
