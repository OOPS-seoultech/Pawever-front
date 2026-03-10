import type { ReactElement } from 'react';

import type { AppFlow } from '../../core/entities/appFlow';

import { AppLoadingScreen } from '../screens/AppLoadingScreen';
import { AuthEntryScreen } from '../screens/AuthEntryScreen';
import { BeforeFarewellHomeScreen } from '../screens/BeforeFarewellHomeScreen';
import { EmergencyModeScreen } from '../screens/EmergencyModeScreen';
import { FarewellPreviewScreen } from '../screens/FarewellPreviewScreen';
import { FuneralCompaniesScreen } from '../screens/FuneralCompaniesScreen';
import { FootprintsScreen } from '../screens/FootprintsScreen';
import { MainStageShellScreen } from '../screens/MainStageShellScreen';
import { OnboardingEntryScreen } from '../screens/OnboardingEntryScreen';

type AppFlowScreenRenderer = () => ReactElement;

export const appFlowScreens: Record<AppFlow, AppFlowScreenRenderer> = {
  afterFarewellHome: BeforeFarewellHomeScreen,
  auth: AuthEntryScreen,
  beforeFarewellHome: BeforeFarewellHomeScreen,
  emergency: EmergencyModeScreen,
  farewellPreview: FarewellPreviewScreen,
  funeralCompanies: FuneralCompaniesScreen,
  footprints: FootprintsScreen,
  loading: AppLoadingScreen,
  memorial: () => <MainStageShellScreen route="memorial" />,
  onboarding: OnboardingEntryScreen,
};
