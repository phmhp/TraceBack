# Registries — reserved

향후 실제 확장 지점이 생기면 기능 ID를 구현 factory와 연결하는 명시적인 등록 목록을 둡니다.
Brake / Steering / AEB / Airbag / Watchdog 추가 시 core에 Case 조건문을 넣는 대신 필요한 구현을 composition 단계에서 등록합니다.
지금은 registry 클래스, plugin framework, 자동 탐색, event bus를 만들지 않습니다.
화면 목록은 presentation 관심사이므로 ui/App.tsx에서 관리합니다.
