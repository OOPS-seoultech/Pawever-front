# Pawever Front
이 레포는 Pawever 모바일 앱 프론트엔드 코드베이스다.

## 문서 원칙
- 마스터 대시보드: `PAWEVER_PROJECT_MASTER.md`
- 백엔드/API: `PAWEVER_BACKEND_SPEC_AND_API.md`
- 프론트 기능/개발: `PAWEVER_FRONTEND_FEATURE_AND_DEVELOPMENT_SPEC.md`
- 프론트 운영/출시: `PAWEVER_FRONTEND_OPERATIONS_AND_RELEASE.md`
- UI 기준: Figma

원칙:
- 긴 수명의 정책 문서, 기능 명세, 구조 문서는 루트 문서에 반영한다.
- 이 레포 내부에는 실행 방법, 로컬 개발 메모처럼 코드와 직접 붙는 짧은 문서만 둔다.
- 임시 메모나 개인 작업 기록은 source of truth로 취급하지 않는다.


## 현재 앱 골격
- `src/core`: 도메인 엔티티와 앱 흐름 규칙
- `src/infrastructure`: API 호출과 repository
- `src/presentation`: 화면, 네비게이션, 사용자 상호작용, presentation store
- `src/shared`: config, provider, theme, 공통 타입
- `src/data`: 정적 샘플 데이터
