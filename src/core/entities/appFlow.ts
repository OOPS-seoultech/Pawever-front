export type AppFlow =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'beforeFarewellHome'
  | 'afterFarewellHome'
  | 'funeralCompanies'
  | 'footprints'
  | 'farewellPreview'
  | 'emergency';

export type PreviewableAppFlow = Exclude<AppFlow, 'loading' | 'auth' | 'onboarding'>;
