export type AppFlow =
  | 'loading'
  | 'auth'
  | 'onboarding'
  | 'beforeFarewellHome'
  | 'afterFarewellHome'
  | 'emergency';

export type PreviewableAppFlow = Exclude<AppFlow, 'loading' | 'auth' | 'onboarding'>;
