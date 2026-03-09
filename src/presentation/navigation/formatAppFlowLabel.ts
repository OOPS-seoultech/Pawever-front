import type { AppFlow } from '../../core/entities/appFlow';

const appFlowLabels: Record<AppFlow, string> = {
  afterFarewellHome: '이별 후 홈',
  auth: '인증 진입',
  beforeFarewellHome: '이별 전 홈',
  emergency: '긴급대처',
  loading: '로딩',
  onboarding: '온보딩',
};

export function formatAppFlowLabel(flow: AppFlow) {
  return appFlowLabels[flow];
}
