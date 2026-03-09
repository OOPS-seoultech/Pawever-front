import type { ReactElement } from 'react';

import type { AppFlow } from '../../core/entities/appFlow';

import { AppLoadingScreen } from '../screens/AppLoadingScreen';
import { AuthEntryScreen } from '../screens/AuthEntryScreen';
import { MainStageShellScreen } from '../screens/MainStageShellScreen';
import { OnboardingEntryScreen } from '../screens/OnboardingEntryScreen';

type AppFlowScreenRenderer = () => ReactElement;

export const appFlowScreens: Record<AppFlow, AppFlowScreenRenderer> = {
  afterFarewellHome: () => <MainStageShellScreen route="afterFarewellHome" />,
  auth: AuthEntryScreen,
  beforeFarewellHome: () => <MainStageShellScreen route="beforeFarewellHome" />,
  emergency: () => <MainStageShellScreen route="emergency" />,
  loading: AppLoadingScreen,
  onboarding: OnboardingEntryScreen,
};
