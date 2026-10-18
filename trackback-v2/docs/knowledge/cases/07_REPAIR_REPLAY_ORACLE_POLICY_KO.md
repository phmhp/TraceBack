# Phase 07 — Repair / Replay / Oracle Policy

> Document: 07_REPAIR_REPLAY_ORACLE_POLICY_KO  
> Version: 0.3  
> Status: REVIEWED_DRAFT  
> Canonical: YES  
> Last Reviewed: 2026-10-10  
> Runtime Baseline: narrow case repair/replay support only; no general Phase D completion claim  
> Scope: repair invariants, replay comparability, and oracle separation

## 1. Repair의 정의

Repair는 Fault Stimulus를 제거하는 것이 아니라 **Case Ground Truth가 지정한 defect를 수정**하는 것이다.

허용 예:
- wrong scaling correction
- threshold correction
- state-transition correction
- arbitration policy correction
- timeout reaction correction
- monitoring logic correction

불허 예:
- fault injection disable
- scenario trigger disable
- low friction 제거
- lead vehicle event 삭제
- expected/oracle 변경
- root cause 교체

## 2. Replay Invariants

Corrected Replay에서 고정할 항목:
- Base Case ID
- Scenario Variant ID
- initial snapshot
- driver input replay
- environment actor behavior
- Fault Stimulus
- trigger window/seed 정책
- observation definition
- oracle definition

변경 허용:
- selected repair / defect implementation
- repair로 직접 영향을 받는 software state

## 3. Snapshot 요구

최소 후보:
- simulation time/tick
- vehicle pose/velocity
- gear state
- driver input replay state
- software input/output state
- fault injector state
- scenario actor state
- relevant calibration profile ID

현재 runtime이 scheduler/network queue까지 보존한다는 근거는 없으므로 아직 그러한 replay equivalence를 주장하지 않는다.

## 4. Oracle

### Executable deterministic oracle
PASS/FAIL 가능.

### Narrow interface oracle
특정 interface transform/equality만 PASS/FAIL 가능.

### Observation-only
`OBSERVED`만 가능.

### Design-only
실행 결과 없음.

## 5. Verdict와 Diagnosis 분리

`FAIL`:
- test criterion 위반

`ROOT CAUSE CORRECT`:
- canonical game-case answer와 diagnosis가 일치

두 판정은 서로 독립이다.

## 6. Before / After

Case validation 시 이상적인 형태:

```text
Fault Run + Defect
  -> Oracle FAIL 또는 intended abnormal observation

Same Fault Run + Correct Repair
  -> Oracle PASS 또는 intended corrected observation
```

단, 승인된 oracle이 없으면 Before/After 모두 관찰 결과로만 남긴다.

## 7. Repair Candidate

오답 후보는 교육 목적상 plausible할 수 있지만:
- Ground Truth를 바꾸면 안 됨
- baseline과 우연히 동등한 경우를 확인해야 함
- 다른 operating point에서 부작용이 없는지 regression 필요
