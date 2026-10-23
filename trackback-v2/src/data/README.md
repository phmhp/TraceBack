# Data

- mock/: 화면 전용 JSON. 반드시 kind: PLACEHOLDER. 실제 측정값을 흉내 내지 않고 미연결 값은 대시로 표시합니다.
- definitions/: 향후 Signal / Requirement / Fault / Scenario 정의를 관리할 자리. 현재 항목/스키마/로더 없음.
- ground-truth/: 향후 사람이 검토·승인한 Case만 둘 자리. 현재 승인 데이터 없음.

Placeholder는 Simulation Evidence도 AI_DRAFT Case도 아닙니다. 개발 UI fixture입니다.
향후 source provenance(REAL_WORLD_SOURCE / STANDARD_REFERENCE / TRACKBACK_MODEL / SIMULATION_EVIDENCE)와 review status(AI_DRAFT / APPROVED_BASE_CASE)는 서로 다른 축으로 관리해야 합니다.
공개되지 않은 architecture, requirement, root cause를 실제 정보라고 단정하지 않습니다.
폴더 위치나 TypeScript 캐스팅으로 승인을 대신할 수 없습니다. 향후 실제 데이터 도입 시 schema validation, source references, review metadata 및 실행 검증을 구현해야 합니다.
검증된 데이터는 composition 단계에서 필요한 계층에 주입합니다. 각 계층이 원시 JSON이나 UI fixture를 직접 import하지 않습니다.
