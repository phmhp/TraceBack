# Phase 06 — Verification Techniques & Coverage Guide

## 목적

TRACKBACK에서 검증 기법을 UI 옵션 이름으로만 나열하지 않고, **언제 왜 사용하는지와 현재 실행 가능 범위**를 고정한다.

## Requirements-based Test
요구사항의 조건과 기대 결과를 직접 시험한다. 가장 기본이다. 다만 요구사항 자체가 미승인이거나 Expected가 OPEN이면 시험 설계까지만 가능하다.

## Equivalence Partitioning / Boundary Value
입력 공간을 정상/비정상/경계로 나눈다. `min-ε`, `min`, `min+ε`, `max-ε`, `max`, `max+ε` 같은 후보를 만들 수 있지만, 실제 min/max의 출처가 먼저 필요하다.

## State Transition / Decision Table
Gear, Vehicle State, Fault Reaction/Recovery, authority처럼 여러 조건의 조합에 적합하다. Transition table에 없는 ELSE를 AI가 임의로 채우지 않는다.

## Pairwise
다중 입력 조합 폭발을 줄이는 기법이다. pair coverage는 `각 두 인자의 값 조합이 최소 한 번 나타나는 것`을 목표로 하며, 각 개별 요구사항의 필수 TC를 삭제하는 근거가 아니다.

## Interface Test
양단의 type/unit/value/validity/time을 비교한다. `source output == destination input`만 보는 것으로 끝나지 않고 전달 정책(drop/hold/transform)이 있으면 그 정책을 Expected로 사용한다. 현재 eDrive seam은 network interface가 아니라 host interception seam이다.

## Fault Injection
Fault stimulus를 만들기 위한 수단이다. FI 성공 여부와 diagnostic detection/reaction 여부는 별개다.

## Back-to-Back
동일 자극을 두 독립 실행 표현에 넣고 같은 관측점을 정렬하여 비교한다. 현재 TRACKBACK은 독립 second runner가 없어 지원하지 않는다.

## Structural Coverage
Statement/Branch/MC/DC는 코드 구조를 얼마나 실행했는지를 보여준다. Requirements coverage와 별개다. 미실행 코드가 남았을 때 추가 TC를 설계하는 근거가 될 수 있지만, coverage만 맞추기 위한 의미 없는 TC는 금지한다.

## 추천 사용 순서

```text
Requirement
→ partition/state/decision analysis
→ TC candidate
→ Oracle 승인
→ 실행
→ requirements coverage 확인
→ structural coverage gap 확인
→ 필요 시 추가 TC
→ regression suite 편입
```
