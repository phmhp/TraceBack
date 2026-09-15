# UI

screens/는 기존 화면 flow를 유지합니다. RaceScreen은 HUD/Pause UI를 조립합니다.
Keyboard 장치 코드는 UI 밖의 input/keyboard에 있습니다. UI는 키 이벤트를 읽지 않습니다.
state/navigation은 화면 전환만, state/raceHud는 약 10Hz telemetry와 즉시 lifecycle event만 관리합니다.
RaceActionsContext는 composition root가 주입하는 Pause/Resume action입니다.
고빈도 transform은 graphics와 runtime의 mutable state로 관리합니다. HUD는 LIVE_SIMULATION, 나머지 미연결 panel은 PLACEHOLDER로 구분합니다.
