# Guided investigation case authoring

조사실 UI를 복제하지 않고 새로운 고장 사례를 추가하기 위한 계약이다. 화면은 모든 사례에서 동일한 여섯 사고 장면을 사용하고, 사례별 내용과 실행 연결만 `GuidedCaseDefinition`으로 제공한다.

```text
현상 확정
→ 도메인 찾기
→ 경계 좁히기
→ 경쟁 가설 구별
→ 동일 조건 비교 검증
→ 수리·회귀·재주행
```

## 책임 분리

| 계층 | 책임 |
|---|---|
| `CaseDefinition` | 사건 경로, 요구사항, 정답과 근거 충분성 규칙 |
| `InvestigationRecipe` | 의미 기반 잠금 해제, 점수, 힌트 |
| `GuidedCaseDefinition` | 초보자에게 한 객체씩 보여줄 장면 내용과 선택지 |
| case controller/runtime | 실제 고장 실행, 사건 recorder, component/vehicle 시험, 수리·회귀 |
| `InvestigationFocusDeck` | 모든 사례가 공유하는 표현과 상호작용 |

## 새 사례 작성 순서

1. `CASE_ROADMAP.md`의 authoring gate를 먼저 채운다.
2. 실제 실행 가능한 `CaseDefinition`과 runtime/controller를 만든다.
3. `InvestigationRecipe`에 의미 기반 완료 조건을 연결한다.
4. `GuidedCaseDefinition`에 아래 항목을 작성한다.
5. registry에 case ID로 등록한다.
6. 정상/고장 실행, 근거 충분성, 오답 수리 회귀를 자동 시험한다.

## GuidedCaseDefinition 필수 항목

| 영역 | 반드시 작성할 내용 |
|---|---|
| observe | 운전자 진술, 사건 지표, 정상/Actual 비교 series, 현상 선택지 |
| domain | 전체 차량 관점의 후보 도메인과 관련 도메인 하나 |
| localize | 마지막 정상과 첫 이상 경계 및 실제 signal ID |
| discriminate | 내부 로직·인터페이스·상태/보정·물리/환경 중 관련 경쟁 가설 |
| testPlans | 고정 조건, 바꿀 입력, 관찰 출력, 실행 target, 판별 가능 여부 |
| verify | FAIL과 원인 확정을 구분하는 결과 해석 선택지 |
| resolve | 근거 기반 보고서 mapping과 수리 후보 |
| scope | 각 장면에서 지금 확인할 범위와 뒤로 미룰 판단 |
| visualModel | 운전자 의도·제어 신호·물리 반응을 연결하는 재사용 시각 레이어 |
| readMetric | 해당 사례 recorder frame을 플레이어용 지표로 바꾸는 adapter |

`validateGuidedCase`는 정답이 여러 개인 현상 선택지, 관련 도메인 누락, 경계 순서 오류, 판별 시험 누락과 수리 후보 누락을 앱 시작 시 거부한다.

## 사례별로 달라져야 하는 것

- 12V 저전압: 전원 재인가 전후, loaded voltage, READY precondition, 배터리/전원 분배/인증 경쟁 가설
- HV 출력 제한: 토크 경로, 비포화 입력 비교, eDrive 내부 로직/인터페이스/보정 경쟁 가설
- 조명 이상: 야간 부하 조건, 간헐 타임라인, 전원/통신/램프 실행 경계
- TPMS: 실제 압력과 sensor report 비교, 타이어 물리 저압과 sensor/system fault 경쟁 가설
- 키·도어 인증: proximity, credential state, 12V 상태와 인증 기능 경계

## 변하지 않아야 하는 것

- FAIL은 root cause가 아니다.
- 페이지 방문이나 단순 열람은 evidence가 아니다.
- 정상 근거도 원인 범위를 배제하는 단서다.
- Guided 화면에서 숨긴 기술 정보는 전문가 도구에 그대로 남는다.
- 수리는 동일 사건 재현과 회귀시험을 통과한 뒤 재주행으로 확인한다.
- 시뮬레이션 실행은 기존 Rapier/C/WASM production path를 사용한다.
