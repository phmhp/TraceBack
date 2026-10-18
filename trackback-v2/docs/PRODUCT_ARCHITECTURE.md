# 제품·기술 설계

## 제품 한 문장

고양이 운전자의 검증 파트너가 되어 실제 도로형 미션에서 이상을 체감하고, 차량 기능 경로를 추적해 가설을 시험하고, 수정 후 같은 조건으로 정상화를 확인하는 차량 검증 어드벤처.

## 플레이 루프

```text
Job Brief
→ Drive
→ Incident Replay
→ Driver Request
→ Vehicle X-Ray
→ Fault Boundary
→ Controlled Test
→ Evidence Report
→ Repair / Regression
→ Same-event Re-drive
```

### 장면 규칙

- 화면당 질문 하나
- primary CTA 하나
- 기본 clue 최대 세 장
- 현재 판단에 쓰지 않는 기술 상세는 drawer
- 페이지 방문이 아니라 의미 있는 판단으로 clue 획득
- 오답은 life 차감보다 왜 결론을 낼 수 없는지 알려주는 새 관찰을 제공

## 독립 아키텍처

```text
UI scenes
  ↓
Episode state machine
  ↓
Case data / Evidence contracts
  ↓
DriveSimulationPort · TestExecutionPort · RepairPort
  ↓
SimulationRuntime · C/WASM · RapierWorld · Pangyo map
```

기존 full-fidelity runtime을 새 프로젝트 내부로 이관했다. production path는 `GameApplication`이 C/WASM vehicle software, `SimulationRuntime`, Rapier physics, map, case controller와 UI를 조합한다. 상위 프로젝트 import는 허용하지 않는다. 2D concept은 독립 제출 폴더에서 제거했으며 제품 기반으로 사용하지 않는다.

## 차량 X-Ray 정보 계층

1. Domain — Driver/Environment, Energy, Propulsion, Braking, Steering, ADAS, Vehicle Plant
2. Function — 사건과 관계된 기능 역할과 producer/consumer
3. Logic — precondition → input → calculation/decision → output
4. Trace — requirement → expected → actual → evidence → conclusion

본편에서는 사건 subgraph만 노출하고 전체 domain atlas는 episode 완료 후 자유 학습 모드로 제공합니다.

## Case authoring 순서와 현재 기준선

현재 실행 가능한 CASE-PT-001 propulsion scaling case는 runtime, evidence, experiment, repair, re-drive의 품질 기준선으로 유지한다. 캠페인 콘텐츠 순서에서는 공개 현장 빈도에 따라 12V case를 첫 신규 episode로 authoring하고 propulsion case를 두 번째로 재구성한다.

### 신규 Episode 01 학습 모델

```text
Start Request 정상
→ Start Preconditions 정상
→ 12V Supply 최초 이상
→ Power Control 차단
→ DRIVE READY OFF
```

교육 목표:

- 증상과 root cause를 구분한다.
- 운전자 입력 및 precondition을 먼저 확인한다.
- Last Known Normal과 First Known Abnormal을 찾는다.
- 무부하 값 하나로 결론내지 않고 조건을 통제한 부하 시험을 설계한다.
- 수정 후 regression과 동일 조건 re-drive를 모두 수행한다.

## 1주 범위

- Day 1: full-fidelity 독립 fork와 build/test baseline
- Day 2: 기존 driving event를 mission/checkpoint/traffic 규칙으로 재구성
- Day 3: incident recap과 driver request 장면화
- Day 4: 기존 architecture/signal/interface/requirement 정보를 사건 중심 progressive disclosure로 재배치
- Day 5: hypothesis와 discriminating test의 선택·예측·해석 강화
- Day 6: repair/regression/re-drive와 before/after 표현 강화
- Day 7: responsive QA, accessibility, bundle split, canonical manifest

현재 완료된 것은 Day 1의 독립 full-fidelity 기준선이다. 나머지 단계는 구현 예정이며 완료로 간주하지 않는다.

