import type { PropsWithChildren } from 'react';

import { createContext, startTransition, useContext, useEffect, useState } from 'react';

import type { AuthSession } from '../../core/entities/auth';
import type { AppFlow, PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';
import type { UserProfile } from '../../core/entities/user';

import { devLogin } from '../../infrastructure/repositories/authRepository';
import { getSelectedPet } from '../../infrastructure/repositories/petRepository';
import { getMyProfile } from '../../infrastructure/repositories/userRepository';
import { ApiError } from '../../shared/types/api';
import {
  beginAuthentication,
  closePreviewRoute,
  deriveAppFlow,
  initialAppSessionState,
  markSessionRestored,
  openPreviewRoute,
  resolveAuthenticatedState,
  resolveAuthenticationFailureState,
  resolveSignedOutState,
} from './appSessionState';

type AppSessionContextValue = {
  appFlow: AppFlow;
  closePreview: () => void;
  errorMessage: string | null;
  isAuthenticating: boolean;
  openPreview: (route: PreviewableAppFlow) => void;
  profile: UserProfile | null;
  selectedPet: PetSummary | null;
  session: AuthSession | null;
  signInWithDevPassword: (password: string) => Promise<void>;
  signOut: () => void;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

export function AppSessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialAppSessionState);

  useEffect(() => {
    startTransition(() => {
      setState(current => markSessionRestored(current));
    });
  }, []);

  const appFlow = deriveAppFlow(state);

  const signInWithDevPassword = async (password: string) => {
    if (!password.trim()) {
      setState(current => resolveAuthenticationFailureState(current, 'DEV_LOGIN_PASSWORD를 입력해 주세요.'));
      return;
    }

    setState(current => beginAuthentication(current));

    try {
      const nextSession = await devLogin(password.trim());
      const nextProfile = await getMyProfile(nextSession.accessToken);
      const nextSelectedPet =
        nextSession.selectedPetId === null ? null : await getSelectedPet(nextSession.accessToken);

      startTransition(() => {
        setState(current =>
          resolveAuthenticatedState(current, {
            profile: nextProfile,
            selectedPet: nextSelectedPet,
            session: nextSession,
          }),
        );
      });
    } catch (error) {
      startTransition(() => {
        setState(current => resolveAuthenticationFailureState(current, getErrorMessage(error)));
      });
    }
  };

  const signOut = () => {
    startTransition(() => {
      setState(current => resolveSignedOutState(current));
    });
  };

  const openPreview = (route: PreviewableAppFlow) => {
    setState(current => openPreviewRoute(current, route));
  };

  const closePreview = () => {
    setState(current => closePreviewRoute(current));
  };

  return (
    <AppSessionContext.Provider
      value={{
        appFlow,
        closePreview,
        errorMessage: state.errorMessage,
        isAuthenticating: state.isAuthenticating,
        openPreview,
        profile: state.profile,
        selectedPet: state.selectedPet,
        session: state.session,
        signInWithDevPassword,
        signOut,
      }}
    >
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSessionStore() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSessionStore must be used within AppSessionProvider');
  }

  return context;
}
