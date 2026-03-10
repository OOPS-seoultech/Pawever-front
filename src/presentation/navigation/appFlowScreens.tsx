import type { ReactElement } from 'react';

import type { AppFlow } from '../../core/entities/appFlow';

import { AppLoadingScreen } from '../screens/AppLoadingScreen';
import { AuthEntryScreen } from '../screens/AuthEntryScreen';
import { BeforeFarewellHomeScreen } from '../screens/BeforeFarewellHomeScreen';
import { EmergencyModeScreen } from '../screens/EmergencyModeScreen';
import { FarewellPreviewScreen } from '../screens/FarewellPreviewScreen';
import { FuneralCompaniesScreen } from '../screens/FuneralCompaniesScreen';
import { FootprintsScreen } from '../screens/FootprintsScreen';
import { MemorialScreen } from '../screens/MemorialScreen';
import { OnboardingEntryScreen } from '../screens/OnboardingEntryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

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
  memorial: MemorialScreen,
  onboarding: OnboardingEntryScreen,
  settings: SettingsScreen,
};
