import type { AuthSession } from '../../core/entities/auth';
import type { AppFlow, PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';
import type { UserProfile } from '../../core/entities/user';

import { resolveAppFlow } from '../../core/usecases/resolveAppFlow';

export type AppSessionState = {
  errorMessage: string | null;
  hasRestoredSession: boolean;
  isAuthenticating: boolean;
  previewStack: PreviewableAppFlow[];
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
  previewStack: [],
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
    previewStack: [],
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
    previewStack: [],
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
  const existingIndex = state.previewStack.lastIndexOf(route);

  if (existingIndex >= 0) {
    return {
      ...state,
      previewStack: state.previewStack.slice(0, existingIndex + 1),
    };
  }

  return {
    ...state,
    previewStack: [...state.previewStack, route],
  };
}

export function closePreviewRoute(state: AppSessionState): AppSessionState {
  return {
    ...state,
    previewStack: state.previewStack.slice(0, -1),
  };
}

export function replacePreviewRoute(state: AppSessionState, route: PreviewableAppFlow): AppSessionState {
  if (state.previewStack.length === 0) {
    return openPreviewRoute(state, route);
  }

  return {
    ...state,
    previewStack: [...state.previewStack.slice(0, -1), route],
  };
}

export function deriveAppFlow(state: AppSessionState): AppFlow {
  const activePreviewRoute = state.previewStack[state.previewStack.length - 1];

  if (activePreviewRoute) {
    return activePreviewRoute;
  }

  return resolveAppFlow({
    hasRestoredSession: state.hasRestoredSession,
    selectedPet: state.selectedPet,
    session: state.session,
  });
}
