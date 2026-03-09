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
};
