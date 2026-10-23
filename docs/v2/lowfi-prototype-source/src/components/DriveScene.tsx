import { useEffect, useRef, useState } from 'react'

interface DriveSceneProps {
  mode: 'incident' | 'verified'
  onComplete: () => void
}

interface DriveSnapshot {
  speed: number
  progress: number
  steer: number
  accelerator: number
  brake: number
  safety: number
  faultActive: boolean
}

const initialSnapshot: DriveSnapshot = {
  speed: 0,
  progress: 0,
  steer: 0,
  accelerator: 0,
  brake: 0,
  safety: 100,
  faultActive: false,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function DriveScene({ mode, onComplete }: DriveSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef(new Set<string>())
  const completeRef = useRef(false)
  const [snapshot, setSnapshot] = useState(initialSnapshot)

  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault()
        keysRef.current.add(event.code)
      }
    }
    const release = (event: KeyboardEvent) => keysRef.current.delete(event.code)
    window.addEventListener('keydown', press)
    window.addEventListener('keyup', release)
    return () => {
      window.removeEventListener('keydown', press)
      window.removeEventListener('keyup', release)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let animationFrame = 0
    let previous = performance.now()
    let lastUiUpdate = 0
    let speed = 0
    let progress = 0
    let lane = 0
    let safety = 100
    const hitObstacles = new Set<number>()
    const obstacles = [
      { at: 23, lane: -0.58, color: '#f5b45f' },
      { at: 47, lane: 0.54, color: '#ef776f' },
      { at: 79, lane: -0.12, color: '#6ea6b8', moving: true },
    ]

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const drawCar = (x: number, y: number, color: string, scale = 1) => {
      context.save()
      context.translate(x, y)
      context.scale(scale, scale)
      context.fillStyle = '#263f3a'
      context.fillRect(-17, -25, 34, 50)
      context.fillStyle = color
      context.beginPath()
      context.roundRect(-14, -23, 28, 46, 8)
      context.fill()
      context.fillStyle = '#d8f0ef'
      context.fillRect(-10, -13, 20, 13)
      context.fillStyle = '#ffe6a9'
      context.fillRect(-10, 16, 6, 4)
      context.fillRect(4, 16, 6, 4)
      context.restore()
    }

    const draw = (time: number) => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const horizon = height * 0.27
      context.clearRect(0, 0, width, height)

      const sky = context.createLinearGradient(0, 0, 0, horizon)
      sky.addColorStop(0, '#9ed9e8')
      sky.addColorStop(1, '#eaf4dc')
      context.fillStyle = sky
      context.fillRect(0, 0, width, horizon)

      context.fillStyle = '#7fa772'
      context.fillRect(0, horizon, width, height - horizon)
      context.fillStyle = '#3f4b48'
      context.beginPath()
      context.moveTo(width * 0.39, horizon)
      context.lineTo(width * 0.08, height)
      context.lineTo(width * 0.92, height)
      context.lineTo(width * 0.61, horizon)
      context.closePath()
      context.fill()

      context.strokeStyle = '#f7e7a4'
      context.lineWidth = 3
      context.setLineDash([18, 22])
      context.lineDashOffset = (progress * 13) % 40
      for (const offset of [-0.17, 0.17]) {
        context.beginPath()
        context.moveTo(width * (0.5 + offset * 0.35), horizon)
        context.lineTo(width * (0.5 + offset), height)
        context.stroke()
      }
      context.setLineDash([])

      for (let index = 0; index < obstacles.length; index += 1) {
        const obstacle = obstacles[index]
        const relative = obstacle.at - progress
        if (relative < -2 || relative > 30) continue
        const depth = 1 - clamp(relative / 30, 0, 1)
        const y = horizon + Math.pow(depth, 1.7) * (height - horizon - 70)
        const roadWidth = width * (0.11 + depth * 0.64)
        const movingOffset = obstacle.moving ? Math.sin(time / 850) * 0.28 : 0
        const obstacleLane = clamp(obstacle.lane + movingOffset, -0.78, 0.78)
        const x = width / 2 + obstacleLane * roadWidth * 0.42
        drawCar(x, y, obstacle.color, 0.35 + depth * 0.65)
      }

      const carX = width / 2 + lane * width * 0.27
      drawCar(carX, height - 72, mode === 'verified' ? '#68b88a' : '#f1d272', 1.12)

      if (progress > 63 && mode === 'incident') {
        context.fillStyle = 'rgba(255, 247, 226, 0.92)'
        context.beginPath()
        context.roundRect(width / 2 - 144, horizon + 22, 288, 58, 18)
        context.fill()
        context.fillStyle = '#7f332b'
        context.font = '700 15px system-ui'
        context.textAlign = 'center'
        context.fillText('출력이 약해졌어요 · 목표 도착이 지연됩니다', width / 2, horizon + 56)
      }
    }

    const frame = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.04)
      previous = now
      const keys = keysRef.current
      const steer = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0)
      const accelerator = keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0
      const brake = keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0
      const faultActive = mode === 'incident' && progress >= 63
      const availablePower = faultActive ? 0.28 : 1

      speed += (accelerator * 38 * availablePower - brake * 58 - 4.6) * dt
      speed = clamp(speed, 0, mode === 'verified' ? 74 : 66)
      lane = clamp(lane + steer * dt * (0.66 + speed / 120), -0.93, 0.93)
      progress = clamp(progress + speed * dt * 0.105, 0, 100)

      obstacles.forEach((obstacle, index) => {
        if (hitObstacles.has(index)) return
        const obstacleLane = obstacle.moving ? clamp(obstacle.lane + Math.sin(now / 850) * 0.28, -0.78, 0.78) : obstacle.lane
        if (Math.abs(progress - obstacle.at) < 1.7 && Math.abs(lane - obstacleLane) < 0.34) {
          hitObstacles.add(index)
          speed *= 0.28
          safety = Math.max(0, safety - 15)
        }
      })

      draw(now)
      if (now - lastUiUpdate > 80) {
        lastUiUpdate = now
        setSnapshot({
          speed,
          progress,
          steer,
          accelerator,
          brake,
          safety,
          faultActive,
        })
      }

      if (progress >= 100 && !completeRef.current) {
        completeRef.current = true
        window.setTimeout(onComplete, 450)
        return
      }
      animationFrame = requestAnimationFrame(frame)
    }

    animationFrame = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
    }
  }, [mode, onComplete])

  const hold = (code: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      keysRef.current.add(code)
    },
    onPointerUp: () => keysRef.current.delete(code),
    onPointerCancel: () => keysRef.current.delete(code),
  })

  return (
    <section className="drive-stage" aria-label="조작 가능한 검증 주행">
      <canvas ref={canvasRef} className="drive-canvas" />
      <div className="drive-objective">
        <span className="eyebrow">{mode === 'verified' ? 'RE-DRIVE' : 'MISSION 01'}</span>
        <strong>{snapshot.progress < 63 ? '검증 지점으로 이동' : mode === 'incident' ? '출력 이상 상태로 안전하게 도착' : '같은 구간 정상화 확인'}</strong>
        <div className="route-progress"><i style={{ width: `${snapshot.progress}%` }} /></div>
      </div>
      <div className="drive-score"><span>SAFE</span><strong>{snapshot.safety}</strong></div>
      <div className="cockpit-strip">
        <div className="steering-gauge" style={{ transform: `rotate(${snapshot.steer * 32}deg)` }}>◉</div>
        <Metric label="STEERING" value={`${Math.round(snapshot.steer * 32)}°`} />
        <Pedal label="ACC" active={snapshot.accelerator > 0} value={snapshot.accelerator} />
        <Pedal label="BRK" active={snapshot.brake > 0} value={snapshot.brake} />
        <Metric label="GEAR" value="D" />
        <Metric label="SPEED" value={`${Math.round(snapshot.speed)} km/h`} alert={snapshot.faultActive} />
        <span className={`ready-lamp ${mode === 'verified' ? 'is-on' : ''}`}>{mode === 'verified' ? 'READY · VERIFIED' : 'READY'}</span>
      </div>
      <div className="drive-controls" aria-label="주행 조작 버튼">
        <button {...hold('ArrowLeft')} aria-label="왼쪽 조향">←</button>
        <button {...hold('ArrowUp')} className="accelerate" aria-label="가속">ACC</button>
        <button {...hold('ArrowDown')} className="brake" aria-label="제동">BRK</button>
        <button {...hold('ArrowRight')} aria-label="오른쪽 조향">→</button>
      </div>
      <p className="keyboard-help">키보드 방향키/WASD 또는 화면 버튼으로 조작</p>
    </section>
  )
}

function Metric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className={`cockpit-metric ${alert ? 'is-alert' : ''}`}><span>{label}</span><strong>{value}</strong></div>
}

function Pedal({ label, value, active }: { label: string; value: number; active: boolean }) {
  return <div className={`pedal ${active ? 'is-active' : ''}`}><span>{label}</span><i style={{ height: `${Math.max(8, value * 100)}%` }} /></div>
}
