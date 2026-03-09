import type { PropsWithChildren } from 'react';

import { createContext, startTransition, useContext, useEffect, useState } from 'react';

import type { AuthSession } from '../../core/entities/auth';
import type { AppFlow, PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';
import type { UserProfile } from '../../core/entities/user';

import { devLogin } from '../../infrastructure/repositories/authRepository';
import { getMyPets, getSelectedPet } from '../../infrastructure/repositories/petRepository';
import { getMyProfile } from '../../infrastructure/repositories/userRepository';
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession,
} from '../../infrastructure/storage/authSessionStorage';
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

const shouldRecoverSelectedPet = (error: unknown) => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return error.status === 404;
};

const getRecoveredSelectedPet = async (accessToken: string) => {
  const pets = await getMyPets(accessToken);

  return pets.find(pet => pet.selected) ?? pets[0] ?? null;
};

const getAuthenticatedSnapshot = async (session: AuthSession) => {
  const profile = await getMyProfile(session.accessToken);

  if (session.selectedPetId === null) {
    return {
      profile,
      selectedPet: null,
      session,
    };
  }

  try {
    const selectedPet = await getSelectedPet(session.accessToken);

    return {
      profile,
      selectedPet,
      session: {
        ...session,
        selectedPetId: selectedPet.id,
      },
    };
  } catch (error) {
    if (!shouldRecoverSelectedPet(error)) {
      throw error;
    }

    const selectedPet = await getRecoveredSelectedPet(session.accessToken);

    return {
      profile,
      selectedPet,
      session: {
        ...session,
        selectedPetId: selectedPet?.id ?? null,
      },
    };
  }
};

export function AppSessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialAppSessionState);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedSession = await readStoredAuthSession();

        if (!storedSession) {
          if (!isMounted) {
            return;
          }

          startTransition(() => {
            setState(current => markSessionRestored(current));
          });
          return;
        }

        const snapshot = await getAuthenticatedSnapshot(storedSession);
        await writeStoredAuthSession(snapshot.session);

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setState(current => resolveAuthenticatedState(current, snapshot));
        });
      } catch (error) {
        await clearStoredAuthSession();

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setState(current =>
            resolveAuthenticationFailureState(
              markSessionRestored(current),
              `저장된 로그인 정보를 복원하지 못했습니다. ${getErrorMessage(error)}`,
            ),
          );
        });
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
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
      const snapshot = await getAuthenticatedSnapshot(nextSession);
      await writeStoredAuthSession(snapshot.session);

      startTransition(() => {
        setState(current => resolveAuthenticatedState(current, snapshot));
      });
    } catch (error) {
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current => resolveAuthenticationFailureState(current, getErrorMessage(error)));
      });
    }
  };

  const signOut = () => {
    clearStoredAuthSession().finally(() => {
      startTransition(() => {
        setState(current => resolveSignedOutState(current));
      });
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
