import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PlaceholderTrack } from './PlaceholderTrack'
import { PlaceholderVehicle } from './PlaceholderVehicle'

export type ViewMode = 'menu' | 'chase' | 'engineering'

function SceneCamera({ mode }: { mode: ViewMode }) {
  const { camera, invalidate } = useThree()
  useEffect(() => {
    if (mode === 'menu') {
      camera.position.set(6.2, 3.4, -7.2)
      camera.lookAt(1.6, 1.05, 0)
    } else if (mode === 'engineering') {
      camera.position.set(4.8, 3.5, -6)
      camera.lookAt(0, 0.6, 0)
    } else {
      camera.position.set(0, 3.1, 7)
      camera.lookAt(0, 1.1, -8)
    }
    camera.updateProjectionMatrix()
    invalidate()
  }, [mode, camera, invalidate])
  return null
}

function ViewportFallback() {
  return <div className="viewport-fallback">3D 장면을 표시할 수 없습니다. WebGL 지원을 확인하세요.<br />메뉴를 통한 화면 이동은 가능합니다.</div>
}
class ViewportBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <ViewportFallback /> : this.props.children }
}

/** Presentation Canvas. A composition root supplies physics and live rendering as children. */
export default function RaceViewport({ mode, active = false, children }: { mode: ViewMode; active?: boolean; children?: ReactNode }) {
  const engineering = mode === 'engineering'
  return <div className="game-viewport" role="img" aria-label={engineering ? '차량 Engineering View Placeholder' : active ? '조작 가능한 차량과 데이터 기반 월드' : '트랙과 차량의 정적 3D Placeholder'}>
    <ViewportBoundary>
      <Canvas shadows frameloop={active ? 'always' : 'demand'} dpr={[1, 1.5]} camera={{ position: [6.2, 3.4, -7.2], fov: 42 }}
        fallback={<ViewportFallback />}>
        <SceneCamera mode={mode} />
        <color attach="background" args={[engineering ? '#091821' : '#a9ddf1']} />
        <fog attach="fog" args={[engineering ? '#091821' : '#c9e9db', 140, 520]} />
        <hemisphereLight args={['#fff8e7', '#8eb47f', 2.35]} />
        <directionalLight position={[-7, 14, -6]} intensity={1.1} color="#fff2d4" />
        {engineering ? <gridHelper args={[50, 50, '#255569', '#163440']} /> : !active && <PlaceholderTrack />}
        {!active && <PlaceholderVehicle engineering={engineering} />}
        {children}
      </Canvas>
    </ViewportBoundary>
  </div>
}
