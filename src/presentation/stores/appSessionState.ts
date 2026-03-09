import type { AuthSession } from '../../core/entities/auth';
import type { AppFlow, PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';
import type { UserProfile } from '../../core/entities/user';

import { resolveAppFlow } from '../../core/usecases/resolveAppFlow';

export type AppSessionState = {
  errorMessage: string | null;
  hasRestoredSession: boolean;
  isAuthenticating: boolean;
  previewRoute: PreviewableAppFlow | null;
  profile: UserProfile | null;
  selectedPet: PetSummary | null;
  session: AuthSession | null;
};

type ResolveAuthenticatedStateInput = {
  profile: UserProfile;
  selectedPet: PetSummary | null;
  session: AuthSession;
};

export const initialAppSessionState: AppSessionState = {
  errorMessage: null,
  hasRestoredSession: false,
  isAuthenticating: false,
  previewRoute: null,
  profile: null,
  selectedPet: null,
  session: null,
};

export function markSessionRestored(state: AppSessionState): AppSessionState {
  return {
    ...state,
    errorMessage: null,
    hasRestoredSession: true,
  };
}

export function beginAuthentication(state: AppSessionState): AppSessionState {
  return {
    ...state,
    errorMessage: null,
    isAuthenticating: true,
  };
}

export function resolveAuthenticatedState(
  state: AppSessionState,
  { profile, selectedPet, session }: ResolveAuthenticatedStateInput,
): AppSessionState {
  return {
    ...state,
    errorMessage: null,
    hasRestoredSession: true,
    isAuthenticating: false,
    previewRoute: null,
    profile,
    selectedPet,
    session,
  };
}

export function resolveSignedOutState(state: AppSessionState): AppSessionState {
  return {
    ...state,
    errorMessage: null,
    isAuthenticating: false,
    previewRoute: null,
    profile: null,
    selectedPet: null,
    session: null,
  };
}

export function resolveAuthenticationFailureState(
  state: AppSessionState,
  errorMessage: string,
): AppSessionState {
  return {
    ...resolveSignedOutState(state),
    errorMessage,
  };
}

export function openPreviewRoute(state: AppSessionState, route: PreviewableAppFlow): AppSessionState {
  return {
    ...state,
    previewRoute: route,
  };
}

export function closePreviewRoute(state: AppSessionState): AppSessionState {
  return {
    ...state,
    previewRoute: null,
  };
}

export function deriveAppFlow(state: AppSessionState): AppFlow {
  if (state.previewRoute) {
    return state.previewRoute;
  }

  return resolveAppFlow({
    hasRestoredSession: state.hasRestoredSession,
    selectedPet: state.selectedPet,
    session: state.session,
  });
}
