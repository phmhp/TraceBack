# Phase 07 — Evidence Visibility Policy

> Document: 07_CASE_EVIDENCE_VISIBILITY_POLICY_KO  
> Version: 0.3  
> Status: REVIEWED_DRAFT  
> Canonical: YES  
> Last Reviewed: 2026-10-10  
> Runtime Baseline: current Pages 1–4 investigation and evidence model  
> Scope: player-visible evidence and hidden canonical truth boundaries

## 목적

TRACKBACK의 조사 UI가 고장 정답을 먼저 보여주지 않도록 Case 데이터의 공개 수준을 정의한다.

## 1. Visibility Class

### `VISIBLE_AT_INCIDENT`
Incident 발생 즉시 제공할 수 있는 정보.

- 운전자/차량이 겪은 현상
- 시간/속도/기본 주행 상태
- Game Incident Notification
- 실제 기록된 driver input 및 vehicle response 중 허용된 항목

### `VISIBLE_IN_INVESTIGATION`
Page 2~3에서 플레이어가 Architecture/Signal/Requirement/Test를 조사하면서 볼 수 있는 정보.

- Function description
- 구조적 연결
- 실제 관찰 가능한 signal
- unit/validity
- requirement statement
- 실행 가능한 test capability
- 플레이어가 수행한 test 결과

### `DISCOVERABLE_EVIDENCE`
특정 component, interface, timeline, test를 선택해야 드러나는 evidence.

- source/destination mismatch
- 특정 내부 output
- fault activation과 가까운 시점의 deviation
- candidate fault family 단서

### `HIDDEN_GROUND_TRUTH`
Resolution 이전에는 공개 금지.

- Correct Root Cause
- 정확한 defect code/configuration
- Corrective Action 정답
- repair option 정답
- canonical assessment answer
- hidden variant seed가 root cause를 드러내는 metadata
- 수행하지 않은 test의 PASS/FAIL

## 2. Root Cause Leak 방지

다음 UI는 금지한다.

- Fault component를 초기 architecture에서 자동 빨간색 표시
- hidden case data를 signal tooltip에 표시
- Case ID 이름에 root cause를 포함
- Incident alarm에 `eDrive scaling fault`처럼 defect type 직접 노출
- player가 실행하지 않은 TC 결과를 미리 보여줌

## 3. Expected Result 공개

Requirement의 Expected 개념과 Case 정답은 다르다.

- 승인된 일반 요구사항 Expected는 공개 가능.
- Case-specific hidden defect 값/정답은 비공개.
- Whole-vehicle expected trajectory가 없으면 실제 관찰값만 제공.

## 4. AI Hint

Runtime AI는 hidden truth를 직접 읽고 정답을 말하는 방식으로 사용하지 않는다.

Hint는:
- 어디를 비교할지
- 어떤 signal/requirement/test가 관련 있는지
- source와 destination을 구분하라는 방법론

수준으로 제한한다.

## 5. Debrief

Case resolution 후에는:
- Root Cause
- Fault propagation
- 관련 requirement
- 사용한 evidence
- 올바른 repair
- replay 결과

를 공개할 수 있다.

단, TRACKBACK_MODEL reconstruction을 실제 OEM fact로 표현하지 않는다.
