# Source & Provenance Manifest

## 공개 빈도 근거

| Source | 사용 claim | 제한 |
|---|---|---|
| [ADAC Pannenstatistik 2026](https://www.adac.de/rund-ums-fahrzeug/unfall-schaden-panne/adac-pannenstatistik-2026/) | 2025 고장출동: 12V 45.4%, engine management/HV 21.8%, starter/generator/electrical/lighting 10.4%, tire 8.9%, locking 6.8% | 독일 roadside breakdown proxy. 한국/OEM 검증 결함률이 아님 |

## 기존 프로젝트 reference에서 반영한 claim

| Source | 포함한 범위 | 포함하지 않은 범위 |
|---|---|---|
| `JKEV_2027_ko_KR.pdf` owner manual | DRIVE READY, gear indication, TPMS 운전자 관측, sensor obstruction/ADAS limitation 같은 운전자 관측 사실 | ECU 구조, CAN ID, DTC, 내부 signal name, 임의 threshold |
| TRACKBACK full-fidelity runtime/case docs | C/WASM 실행, Rapier physics, request/condition/response, Actual/Expected, evidence, experiment, repair/regression/re-drive | 상위 저장소 runtime link와 archive 문서 |

원본 PDF는 authoring source 보존을 위해 `docs/reference/JKEV_2027_ko_KR.pdf`에 복사했다. runtime bundle에는 포함되지 않는다. 외부 배포 전에는 문서 배포 권리를 별도로 확인해야 한다.

canonical architecture, signal, interface, requirement, verification, case, validation 자료는 `docs/reference_vehicle`에 registry 생성 입력으로 보존하고, 읽기용 선별본은 `docs/knowledge`에 둔다.

## Simulation assumptions

Case 01의 다음 값과 논리는 교육용 simulation assumption이다.

- 12V under-load expected threshold 11.5V
- incident actual voltage 9.4V
- power control activation block sequence
- repair 후 정상 battery model과 회귀 결과

실제 차량 진단, 정비, 안전 판정을 위한 수치가 아니다. 실제 OEM requirement 또는 승인된 service data가 제공되면 case oracle을 교체해야 한다.

## 선별 복사 자산

| V2 asset | 기존 위치 | 용도 | 출하 전 조치 |
|---|---|---|---|
| `public/assets/cat-face.png` | `public/assets/investigation/cat-face.png` | 고양이 운전자 identity | 제작·사용 권리 확인 |
| `public/assets/vehicle-blueprint.png` | `public/assets/investigation/vehicle-blueprint.png` | Job Brief 시각 정보 | 제작·사용 권리 확인 |
| `public/assets/paper-texture.png` | `public/assets/investigation/paper-texture.png` | 기존 UI 질감 유지 | 제작·사용 권리 확인 |

