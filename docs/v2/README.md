# TRACKBACK V2 설계 이력

이 폴더의 문서는 기존 프로젝트 안에 V2 UI를 추가하려던 분석·설계 기록이다.

2026-10-18부터 실제 V2는 최상위 독립 프로젝트 `trackback-v2/`에서 진행한다. 현재 source of truth:

- `trackback-v2/README.md`
- `trackback-v2/docs/PRODUCT_ARCHITECTURE.md`
- `trackback-v2/docs/CASE_ROADMAP.md`
- `trackback-v2/docs/MIGRATION_MATRIX.md`
- `trackback-v2/docs/SOURCE_MANIFEST.md`

`trackback-v2`는 상위 프로젝트를 runtime import하지 않으며 해당 폴더만 복사해 설치·빌드할 수 있다.
