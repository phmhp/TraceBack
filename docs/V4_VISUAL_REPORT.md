# v0.4 그래픽 개편

사용자 요구: 노란 색조와 평면 도형 중심 표현을 제거하고, 밝고 입체적인 게임 화면에서 그래픽과 텍스트를 동시에 보여준다. 첨부 Switch 화면은 화면 깊이·색 대비·선택 피드백의 참고이며 캐릭터나 브랜드 자산은 복제하지 않는다.

## 구현

- 메인/정비소/접수/보상: 새 원화, 중립 주광, 선명한 청록·블루·화이트, 반투명 패널과 그림자. 수첩은 원화가 있는 챕터 카드.
- 운전석: 새 환경 원화 위에 실제 상태/출력 계기판. 페달을 누르면 모양과 눌림 깊이가 바뀌고, 시스템 준비는 회전·빛, 전원은 파동·출력으로 반응.
- 내부 탐험: 차량 투시 개념 그림의 위치 마커와 원근 확대. 선택한 페달/제어기/계기판을 별도 실시간 3D 모형으로 확대. 제어기 덮개 분해, 금속 핀·기판·냉각핀, 페달 피벗, 계기 바늘·램프, 접촉 그림자.
- 작업대: 기존 실제 그래프를 단계별 조립. 옆의 입체 모형과 브레이크/시스템/전원 조작이 실제 플레이어 그래프를 실행. 입력을 바꾸면 관련 부품으로 초점 이동. 연결 시 선 생성·포트 강조·모형 반응.
- 시험: 선택한 실제 입력 조건으로 페달 모양 변화. 예상은 반투명 점선 구체, 실제 출력은 실체 램프로 구분. `verify`의 결과를 그대로 사용하고 예상만으로 성공 판정을 만들지 않음.
- 모든 버튼: 눌림/초점/호버/클릭 파동. 메뉴는 블러와 원래 장면을 함께 유지. 움직임 줄이기에서는 장식 애니메이션 없이 최종 상태로 표시.
- 과거의 노란 저해상도 3D 차고는 현재 화면 진입점에서 제외. 오프닝의 차체 흔들림/경고 후 안전 정차→정비소로 진행. 이동은 연출이며 물리 시뮬레이션이 아님.

3D 부품과 투시 원화는 교육용 개념 표현이다. 실차 ECU 위치/배선/고전압 구조/속도계를 재현했다고 주장하지 않는다. 모형 바늘은 출력 반응 지시계이며 속도가 아니다. 고정 원화 속 빛은 실시간 신호 판정이 아니다. 실시간 상태는 계기판·신호 표시·3D 모형에서 읽는다.

## 검증 기록

- `npm test`: 25/25 통과. 조건 조합, 독립 기대값, 상태·버튼 상승 에지, 실패/보상 경계, 저장 복원 유지.
- `npm run build`: TypeScript 및 production Vite 빌드 통과.
- `npm run check:independence`: 상위 소스·외부 자산 의존 없음.
- 실제 개발 브라우저 약 1017×704에서 메인→인트로→접수→정비소→정상 조작→부품 선택→5개 실제 연결→시동 출력 확인→3개 필수 예상 시험→8개 전체 회귀→보상→수첩을 조작 확인.
- 실행 중인 이전 Windows 창은 종료하거나 덮어쓰지 않음. 새 실행파일을 버전별로 따로 생성. Windows v0.4 자체 창의 실플레이 검증은 별도이며 브라우저와 동일한 dist가 패키지에 들어간다.
- 패키지 내부 app.asar에서 버전 0.4.0과 원화 3종의 원본 바이트 일치, 최신 JS 일치를 확인. CSS 원화 참조는 `../art/` 상대 경로로 변환되어 오프라인 파일 로딩에 대응.
- 움직임 줄이기를 실제로 켜고 내부 입력을 변경하여 상태/모형 동기화 확인. 이 모드에서 클릭 파동은 정지된 잔상으로 남지 않게 숨김.
- 빌드 경고: 큰 Three.js 번들. 개발 도구 의존성 npm 감사 moderate 8건은 기존과 같으며 이번 시각 개편에서 범위 밖 업데이트를 강행하지 않음.

스크린샷: `screenshots/v4-title.png`, `v4-cockpit.png`, `v4-inside.png`.

## 자체 생성 원화 / imagegen 사용 기록

내장 image_gen 사용, CLI/API 키 미사용. 생성한 세 파일을 프로젝트 `public/art/`로 복사. 외부 런타임 다운로드 없음. 사용자는 원화만 보는 것이 아니라 그 위의 실제 조작/UI와 실시간 3D 모형을 플레이한다.

### public/art/momo-garage-v4.png

```text
Use case: stylized-concept. Asset type: finished full-bleed background artwork for an original cozy vehicle-engineering adventure game title screen, landscape 16:9. Primary request: exquisite high quality dimensional 3D animated-film style scene of a tiny cheerful white cat mechanic wearing teal overalls beside a glossy turquoise compact electric roadster in a sunlit contemporary small garage. Original character, NOT any existing franchise. Wide cinematic three-quarter view, car and cat mainly in the right 60% of frame, quiet bright airy pale blue wall on the left for real UI text to overlay. Detailed rounded automotive body panels, rubber tread wheels, metallic hubs, clear blue windshield, peach seat cushions, detailed organized tool cabinets, little plants and garage windows framing a crisp cobalt-blue sky and greenery. Strong appealing teal, coral, clean white, cool sky blue palette. Neutral daylight color balance, no yellow cast, no sepia, no beige filter. Sophisticated physically based materials with nuanced reflections, soft contact shadows, ambient occlusion and depth of field in distant environment, beautiful stylized polished production render, not primitive geometry collage or flat vector. Cozy and inviting but not washed out. No lettering, no logos, no watermark, no UI controls baked in.
```

### public/art/coastal-cockpit-v4.png

```text
Use case: stylized-concept. Asset type: finished in-game driver-view environment background, 16:9 landscape. Original cozy small turquoise electric convertible car, first-person view from driver seat, exquisite 3D animated feature production quality with convincing physically based material rendering. Looking through curved windshield onto clear coastal test road, vivid cobalt blue sky, fluffy white clouds, sea and lush fresh green trees, crisp neutral daylight. Foreground lower 45 percent is sophisticated soft light-gray dashboard with mint turquoise trim, real detailed dark navy leather steering wheel on lower left, empty gently curved dark digital instrument panel at lower center (no text or symbols in it), round metallic start button on right, coral passenger seat edge. No characters, no hands. Reflective trim, glass windshield, fine molded surface detail, beautiful soft lighting and contact shadows, inviting sunny and refined not gritty. Keep instrument panel available for separately rendered live game readout. No writing, no logo, no watermark. No yellow color cast, no sepia, no flat vector, no blocky primitive shapes. Use all frame, no borders.
```

### public/art/vehicle-cutaway-v4.png

```text
Use case: stylized-concept. Asset type: original educational game vehicle cutaway illustration on a clean pale ice-blue studio background, landscape. A glossy turquoise compact electric convertible roadster with coral seats, shown from elevated front three-quarter view, exceptionally polished 3D animated feature rendering with rich material detail and soft contact shadow. The car body has a graceful transparent ghosted section on the driver's side so the pedal lever near footwell, a small sealed silver electronic controller near front compartment, and digital dashboard instrument cluster can be seen in relation to one another. Keep the car recognizable and beautifully modeled, curved body panels, detailed rubber tires and alloy wheels, transparent glass windshield. Tiny cyan illuminated traces conceptually connect those three components, NOT a physical production wiring diagram. Educational stylized fictional electric car, not a real vehicle brand. Crisp balanced neutral daylight, glossy turquoise, coral, blue and white, vivid but comfortable, not yellowish. Car fills frame with space around silhouette, no text, no labels, no logos, no people, no watermark, no arrow diagram, no flat vector, no primitive collage.
```

## 후속 작업

> 새 원화의 차체/캐릭터를 기준으로 실시간 차량·캐릭터의 정식 3D 자산을 제작하거나 검토된 자산을 도입하라. 현재 렌더 원화와 실시간 부품 모형을 구분하고, 모든 조작/검증은 기존 Snapshot/verify를 유지한다. 키보드·게임패드·저시력·다중 해상도 실사용 검증을 수행하며 실제 3D/주행 구현 전에는 기능을 완성으로 표시하지 않는다. 기존 저장 및 원본 TRACKBACK은 보존한다.
