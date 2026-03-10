export type AppFlow =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'beforeFarewellHome'
  | 'afterFarewellHome'
  | 'memorial'
  | 'funeralCompanies'
  | 'footprints'
  | 'farewellPreview'
  | 'emergency';

export type PreviewableAppFlow = Exclude<AppFlow, 'loading' | 'auth' | 'onboarding'>;
