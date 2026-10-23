import { NavigationButton } from '../components/NavigationButton'

export function MainScreen() {
  return (
    <section className="title-screen">

      <h1
        tabIndex={-1}
        className="game-logo"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          lineHeight: 0.75,
        }}
      >
        Track

        <span
          style={{
            marginLeft: '140px',
            marginTop: '15px',
          }}
        >
          Back
        </span>
      </h1>

      <div className="title-menu">
        <NavigationButton>
          START <span aria-hidden="true">→</span>
        </NavigationButton>
      </div>

    </section>
  )
}