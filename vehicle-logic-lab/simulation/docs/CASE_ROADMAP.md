# 현실 빈도 기반 Case Roadmap

## 순위 기준과 한계

2026년 3월 발표된 ADAC의 2025년 고장출동 통계를 공개 proxy로 사용한다. 집계는 독일에서 출동이 필요했던 고장이고, 2~9년 차량을 중심으로 한 모델 통계이므로 다음을 뜻하지 않는다.

- 한국 차량 전체의 결함률
- OEM 검증 조직에서 발견되는 software defect 비율
- 안전 위해도 또는 리콜 우선순위
- 특정 EV 모델의 발생 확률

공개 자료에서는 12V 배터리 45.4%, 엔진관리 또는 HV system 21.8%, starter/generator/저전압 전장/조명 10.4%, 타이어 8.9%, 잠금장치 6.8% 순이다. 이 부품군 순서를 캠페인의 기본 case 순서로 사용한다.

근거: [ADAC Pannenstatistik 2026 — 2025년 집계](https://www.adac.de/rund-ums-fahrzeug/unfall-schaden-panne/adac-pannenstatistik-2026/)

## 제작 순서

| 순서 | 고장 Case | 공개 빈도 근거 | 주행과 사건 연결 | 검증 학습 | 상태 |
|---:|---|---:|---|---|---|
| 1 | 12V 배터리 저전압/열화 | 45.4% | 검증 지점 정차·전원 재인가 후 READY 실패 | precondition, loaded voltage, symptom/root cause | 저충실도 concept만 존재, full-fidelity authoring 필요 |
| 2 | 구동·엔진관리/HV 출력 제한 | 21.8% 범주 | 가속 성능 확인 구간에서 목표 torque 미달 | signal boundary, scaling, equivalence inputs | full-fidelity 기준선 실행 가능, mission 재작성 필요 |
| 3 | 발전·저전압 전장·조명 이상 | 10.4% 범주 | 야간 delivery에서 간헐 lamp/전원 증상 | intermittent fault, load condition, correlation | 설계 예정 |
| 4 | 타이어 저압 vs TPMS system fault | 8.9% tire 범주 | slalom 전 사전점검과 주행 안정성 변화 | 저압과 sensor/system fault 관찰 패턴 구분 | owner manual 근거 확보 |
| 5 | 키·도어 잠금/인증 이상 | 6.8% | 장비 전달 후 차량 재진입/인증 실패 | key state, proximity, 12V와 competing hypothesis | 설계 예정 |
| 6 | sensor 오염 vs ADAS component fault | 공개 순위 없음 | 악천후 구간에서 ADAS availability 변화 | 환경 조건, cleaning recovery, false diagnosis 방지 | 교육 가치 기반 보너스 |
| 7 | 회생제동 제한 조건 | 공개 순위 없음 | 내리막 energy challenge | SOC·노면·기능 조건과 정상 제한 구분 | P2 이후 |

## Case authoring gate

각 case는 구현 전 아래 항목을 채워야 한다.

```text
fieldFrequency
  source / year / population / category / limitation

driverObservable
  request / condition / response

runtimeModel
  executedComponents / assumptions / limitations

investigation
  competingHypotheses / lastKnownNormal / firstKnownAbnormal

test
  fixedConditions / changedInput / observedOutput / oracle / tolerance

resolution
  repair / regression / sameEventRedrive
```

