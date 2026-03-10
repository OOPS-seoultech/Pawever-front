import type { PreviewableAppFlow } from '../../core/entities/appFlow';

type StageBlueprint = {
  description: string;
  nextSlices: string[];
  tabs: string[];
};

export const sourceOfTruthGuide = [
  'API / enum / 인증: backend spec + Swagger',
  'UI 구조 / 에셋: Figma',
  '화면 동작 / 권한 / 예외: frontend feature spec',
  '배포 / env / 식별자: operations spec',
] as const;

export const appFlowBlueprints: Record<PreviewableAppFlow, StageBlueprint> = {
  afterFarewellHome: {
    description: '이별 후 홈, 별자리 추모관, 이어보기 흐름이 들어갈 자리입니다.',
    nextSlices: ['이별 후 홈 요약 카드', '별자리 추모관 진입', '이어보기 진입'],
    tabs: ['홈', '별자리', '이어보기', '설정'],
  },
  beforeFarewellHome: {
    description: '이별 전 홈, 발자국, 살펴보기, 설정 탭이 연결될 메인 구조입니다.',
    nextSlices: ['이별 전 홈 허브', '발자국 진입', '미리 살펴보기 진입'],
    tabs: ['홈', '발자국', '살펴보기', '설정'],
  },
  emergency: {
    description: '긴급대처 흐름과 최근 단계 복귀 규칙이 들어갈 자리입니다.',
    nextSlices: ['긴급대처 최근 단계 복귀', '완료 상태 공유', '네비게이션 숨김 규칙'],
    tabs: ['홈', '발자국', '살펴보기', '설정'],
  },
  farewellPreview: {
    description: '미리 살펴보기와 이어 살펴보기 단계를 반려동물 상태에 따라 보여주는 안내 흐름입니다.',
    nextSlices: ['이별 전 온보딩', '행정 처리와 지원사업 완료 상태', 'Owner/Guest 저장 분리'],
    tabs: ['홈', '발자국', '살펴보기', '설정'],
  },
  funeralCompanies: {
    description: '장례업체를 옵션, 지도, 검색, 저장/피하기, 상세 흐름으로 탐색하는 화면입니다.',
    nextSlices: ['위치 권한과 옵션 선택', '지도+리스트 필터링', '상세와 저장/피하기'],
    tabs: ['홈', '발자국', '살펴보기', '설정'],
  },
  footprints: {
    description: '발자국 남기기에서 도장찍기, 녹음하기, 마음 전하기를 반려동물 상태에 따라 보여주는 공간입니다.',
    nextSlices: ['Owner/Guest 권한 분리', '녹음 바텀시트', '완료 미션 공유'],
    tabs: ['홈', '발자국', '살펴보기', '설정'],
  },
  memorial: {
    description: '이별 후 반려동물을 위한 별자리 추모관과 알림 흐름이 들어갈 자리입니다.',
    nextSlices: ['별자리 홈', '최근 알림 뱃지', '추모 컨텐츠 진입'],
    tabs: ['홈', '별자리', '이어보기', '설정'],
  },
  settings: {
    description: '반려동물 정보 수정, 같이 기록, 알림, Q&A, 로그아웃과 탈퇴를 다루는 설정 화면입니다.',
    nextSlices: ['정보 수정하기', '같이 기록하기와 반려동물 전환', '알림/약관/탈퇴'],
    tabs: ['홈', '발자국', '살펴보기', '설정'],
  },
};
