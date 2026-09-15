import { NavigationButton } from '../components/NavigationButton'

export function MainScreen() {
  return <section className="title-screen">
    <p className="eyebrow">VEHICLE SOFTWARE / RACING</p>
    <h1 tabIndex={-1} className="game-logo">TRACK<br /><span>BACK</span><span className="logo-dot">.</span></h1>
    <div className="title-menu"><NavigationButton>START <span aria-hidden="true">→</span></NavigationButton></div>
    <p className="menu-note">방향키로 주행 · 1 P · 2 R · 3 N · 4 D · Esc 일시정지</p>
  </section>
}
