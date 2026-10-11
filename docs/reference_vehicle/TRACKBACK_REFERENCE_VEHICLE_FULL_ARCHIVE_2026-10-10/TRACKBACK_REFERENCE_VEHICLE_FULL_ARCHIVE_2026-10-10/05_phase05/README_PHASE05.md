# Phase 05 전달 패키지 사용법

## 목적
Phase 01~04 및 감사 보고서로 구분된 **16개 영역 / 74개 LF** 전체의 FR/SYSR/SWR/SIMR **요구사항 후보**를 명시적으로 정리한다. 아직 코드를 변경하거나 기존 Ground Truth를 정정하지 않는다.

## 파일

| 파일 | 역할 |
|---|---|
| `05_REQUIREMENTS_ENGINEERING_KO.md` | 한글 16개 영역 상세 요구사항·공통 정책·검증·기능안전 경계 |
| `05_REQUIREMENT_CANDIDATES.csv` | 32 FR + 74 SYSR + 62 SWR + 12 SIMR = 180개 고유 후보 |
| `05_TRACEABILITY_CANDIDATES.csv` | FR→SYSR, SYSR→SWR/SIMR, LF→SYSR의 가설 링크 (222개) |
| `05_LF_REQUIREMENT_REVIEW_MATRIX.csv` | 74개 LF의 실제 실행 감사 상태와 후보 요구사항, 관측, 미결정 |
| `05_OPEN_ENGINEERING_DECISIONS.csv` | 74개 LF별 미확정 조건 및 우선순위 |
| `05_PROPULSION_REFERENCE_CROSSWALK.csv` | 원본 Propulsion v0.1의 12개 FR 및 관련 SYS/SWR/TC ID 보존 |
| `05_SAFETY_TRACE_GATE_KO.md` | 승인된 HARA 없는 상황에서 Safety Trace를 자동 생성하지 않는 절차 |

## 프로젝트 위치 (권장)
```text
TraceBack/docs/reference_vehicle/review/phase05/
  05_REQUIREMENTS_ENGINEERING_KO.md
  05_REQUIREMENT_CANDIDATES.csv
  05_TRACEABILITY_CANDIDATES.csv
  05_LF_REQUIREMENT_REVIEW_MATRIX.csv
  05_OPEN_ENGINEERING_DECISIONS.csv
  05_PROPULSION_REFERENCE_CROSSWALK.csv
  05_SAFETY_TRACE_GATE_KO.md
  README_PHASE05.md
```

- `review/`에 둔 상태에서는 **프로젝트 실제 Runtime Registry/Canonical Ground Truth로 import하지 않는다.** 추후 사용자 승인과 독립 코드·자료 검증 후에만 canonical 경로로 승격한다.
- 현재 실제 code audit 기준 `VERIFIED 5 / PARTIAL 27 / DESIGN_ONLY 42`는 LF 역할의 충족 상태. 신규 요구사항 180개가 코드에서 검증됐다는 뜻이 아니다.
- 원본의 `docs/reference_vehicle/`와 `docs/reference-vehicle/audit/` 두 경로는 기존대로 보존, 자동 이동·rename 금지.

## Phase 06 전 최소 검토
1. 현 Canonical 21개 statement의 전문·allocation/TC 상세와 후보 대조
2. P0: Brake policy owner, VMC role, host VehicleReady/Enable, Calibration review, timestamp semantics
3. DRAFT 문장의 OPEN condition·ELSE·output 해결 여부 확인
4. 실행 가능한 SWR/TC/OBSERVED 기준을 별도 확정
5. 기능안전은 Item/HARA 정식 근거가 있는 항목만 별도 흐름으로 승인

> **중요:** 다른 Domain의 설계 범위를 현재 C/WASM이 제공한다고 주장하지 않는다. FR/SYSR/SWR/SIMR 체계는 용어와 논리 책임 설계를 위한 제안이다.
