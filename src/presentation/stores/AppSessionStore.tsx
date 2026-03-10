import type { PropsWithChildren } from 'react';

import { createContext, startTransition, useContext, useEffect, useState } from 'react';

import type { AuthSession } from '../../core/entities/auth';
import type { AppFlow, PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';
import type { UserProfile } from '../../core/entities/user';

import { getKakaoProviderAccessToken, getNaverProviderAccessToken } from '../../infrastructure/auth/socialLoginClient';
import { devLogin, loginWithKakao, loginWithNaver } from '../../infrastructure/repositories/authRepository';
import { getMyPets, getSelectedPet, switchSelectedPet as switchSelectedPetRequest } from '../../infrastructure/repositories/petRepository';
import { joinByInviteCode as joinByInviteCodeRequest } from '../../infrastructure/repositories/sharingRepository';
import { getMyProfile } from '../../infrastructure/repositories/userRepository';
import {
  clearStoredBeforeFarewellHomeSnapshot,
  writeStoredBeforeFarewellHomeSnapshot,
} from '../../infrastructure/storage/beforeFarewellHomeStorage';
import { clearStoredEmergencyModeStates } from '../../infrastructure/storage/emergencyModeStorage';
import { clearStoredFarewellPreviewStates } from '../../infrastructure/storage/farewellPreviewStorage';
import { clearStoredFuneralCompaniesStates } from '../../infrastructure/storage/funeralCompaniesStorage';
import { clearStoredFootprintsStates } from '../../infrastructure/storage/footprintsStorage';
import { clearStoredAddedInvitePets } from '../../infrastructure/storage/mockInvitePetsStorage';
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession,
} from '../../infrastructure/storage/authSessionStorage';
import {
  clearStoredSignupLoadingAnimalType,
  writeStoredSignupLoadingAnimalType,
} from '../../infrastructure/storage/signupLoadingAnimalStorage';
import { ApiError } from '../../shared/types/api';
import {
  beginAuthentication,
  closePreviewRoute,
  deriveAppFlow,
  initialAppSessionState,
  markSessionRestored,
  openPreviewRoute,
  replacePreviewRoute,
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
  previewStack: PreviewableAppFlow[];
  profile: UserProfile | null;
  replacePreview: (route: PreviewableAppFlow) => void;
  selectedPet: PetSummary | null;
  session: AuthSession | null;
  joinByInviteCode: (inviteCode: string) => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signInWithNaver: () => Promise<void>;
  signInWithDevPassword: (password: string) => Promise<void>;
  signOut: () => void;
  switchSelectedPet: (petId: number) => Promise<void>;
  updateSelectedPetLocally: (updater: (current: PetSummary | null) => PetSummary | null) => void;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);
const minimumLoadingDurationMs = 1000;

const wait = (durationMs: number) =>
  new Promise(resolve => {
    setTimeout(resolve, durationMs);
  });

const waitForMinimumLoadingDuration = async (startedAt: number) => {
  const elapsed = Date.now() - startedAt;
  const remaining = minimumLoadingDurationMs - elapsed;

  if (remaining > 0) {
    await wait(remaining);
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

const logAuthenticationError = (provider: string, stage: 'provider' | 'backend' | 'bootstrap', error: unknown) => {
  console.warn(`[auth][${provider}][${stage}]`, error);
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

const getAuthenticatedSnapshotAfterInviteJoin = async (session: AuthSession) => {
  const profile = await getMyProfile(session.accessToken);
  const selectedPet = await getRecoveredSelectedPet(session.accessToken);

  return {
    profile,
    selectedPet,
    session: {
      ...session,
      selectedPetId: selectedPet?.id ?? null,
    },
  };
};

export function AppSessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialAppSessionState);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const restoreStartedAt = Date.now();

      try {
        const storedSession = await readStoredAuthSession();

        if (!storedSession) {
          await waitForMinimumLoadingDuration(restoreStartedAt);

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
        await waitForMinimumLoadingDuration(restoreStartedAt);

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setState(current => resolveAuthenticatedState(current, snapshot));
        });
      } catch (error) {
        await clearStoredAuthSession();
        await waitForMinimumLoadingDuration(restoreStartedAt);

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

  const completeAuthentication = async (session: AuthSession) => {
    const snapshot = await getAuthenticatedSnapshot(session);
    await writeStoredAuthSession(snapshot.session);

    startTransition(() => {
      setState(current => resolveAuthenticatedState(current, snapshot));
    });
  };

  const joinByInviteCode = async (inviteCode: string) => {
    if (!state.session) {
      throw new Error('로그인 세션이 없습니다. 다시 로그인해 주세요.');
    }

    const normalizedInviteCode = inviteCode.trim().toUpperCase();

    if (!normalizedInviteCode) {
      throw new Error('초대코드를 입력해 주세요.');
    }

    setState(current => beginAuthentication(current));

    try {
      await joinByInviteCodeRequest(state.session.accessToken, normalizedInviteCode);

      const snapshot = await getAuthenticatedSnapshotAfterInviteJoin(state.session);
      await writeStoredAuthSession(snapshot.session);

      startTransition(() => {
        setState(current => resolveAuthenticatedState(current, snapshot));
      });
    } catch (error) {
      startTransition(() => {
        setState(current => ({
          ...current,
          isAuthenticating: false,
        }));
      });

      throw error;
    }
  };

  const signInWithDevPassword = async (password: string) => {
    if (!password.trim()) {
      setState(current => resolveAuthenticationFailureState(current, 'DEV_LOGIN_PASSWORD를 입력해 주세요.'));
      return;
    }

    setState(current => beginAuthentication(current));

    try {
      const nextSession = await devLogin(password.trim());
      await completeAuthentication(nextSession);
    } catch (error) {
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current => resolveAuthenticationFailureState(current, getErrorMessage(error)));
      });
    }
  };

  const signInWithKakao = async () => {
    setState(current => beginAuthentication(current));

    let providerAccessToken: string;

    try {
      providerAccessToken = await getKakaoProviderAccessToken();
    } catch (error) {
      logAuthenticationError('kakao', 'provider', error);
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current =>
          resolveAuthenticationFailureState(current, `카카오 인증을 완료하지 못했습니다. ${getErrorMessage(error)}`),
        );
      });
      return;
    }

    let session: AuthSession;

    try {
      session = await loginWithKakao(providerAccessToken);
    } catch (error) {
      logAuthenticationError('kakao', 'backend', error);
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current =>
          resolveAuthenticationFailureState(
            current,
            `카카오 인증은 완료됐지만 백엔드 로그인에 실패했습니다. ${getErrorMessage(error)}`,
          ),
        );
      });
      return;
    }

    try {
      await completeAuthentication(session);
    } catch (error) {
      logAuthenticationError('kakao', 'bootstrap', error);
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current =>
          resolveAuthenticationFailureState(
            current,
            `카카오 로그인 이후 세션 초기화에 실패했습니다. ${getErrorMessage(error)}`,
          ),
        );
      });
    }
  };

  const signInWithNaver = async () => {
    setState(current => beginAuthentication(current));

    let providerAccessToken: string;

    try {
      providerAccessToken = await getNaverProviderAccessToken();
    } catch (error) {
      logAuthenticationError('naver', 'provider', error);
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current =>
          resolveAuthenticationFailureState(current, `네이버 인증을 완료하지 못했습니다. ${getErrorMessage(error)}`),
        );
      });
      return;
    }

    let session: AuthSession;

    try {
      session = await loginWithNaver(providerAccessToken);
    } catch (error) {
      logAuthenticationError('naver', 'backend', error);
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current =>
          resolveAuthenticationFailureState(
            current,
            `네이버 인증은 완료됐지만 백엔드 로그인에 실패했습니다. ${getErrorMessage(error)}`,
          ),
        );
      });
      return;
    }

    try {
      await completeAuthentication(session);
    } catch (error) {
      logAuthenticationError('naver', 'bootstrap', error);
      await clearStoredAuthSession();

      startTransition(() => {
        setState(current =>
          resolveAuthenticationFailureState(
            current,
            `네이버 로그인 이후 세션 초기화에 실패했습니다. ${getErrorMessage(error)}`,
          ),
        );
      });
    }
  };

  const signOut = () => {
    Promise.all([
      clearStoredAuthSession(),
      clearStoredAddedInvitePets(),
      clearStoredBeforeFarewellHomeSnapshot(),
      clearStoredEmergencyModeStates(),
      clearStoredFarewellPreviewStates(),
      clearStoredFuneralCompaniesStates(),
      clearStoredFootprintsStates(),
      clearStoredSignupLoadingAnimalType(),
    ]).finally(() => {
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

  const replacePreview = (route: PreviewableAppFlow) => {
    setState(current => replacePreviewRoute(current, route));
  };

  const updateSelectedPetLocally = (updater: (current: PetSummary | null) => PetSummary | null) => {
    setState(current => ({
      ...current,
      selectedPet: updater(current.selectedPet),
    }));
  };

  const switchSelectedPet = async (petId: number) => {
    if (!state.session) {
      throw new Error('로그인 세션이 없습니다. 다시 로그인해 주세요.');
    }

    if (state.selectedPet?.id === petId) {
      return;
    }

    setState(current => beginAuthentication(current));

    try {
      const switchedPet = await switchSelectedPetRequest(petId, state.session.accessToken);
      const nextProfile = state.profile ?? await getMyProfile(state.session.accessToken);
      const nextSession = {
        ...state.session,
        selectedPetId: switchedPet.id,
      };

      await Promise.all([
        writeStoredAuthSession(nextSession),
        writeStoredSignupLoadingAnimalType(switchedPet.animalTypeName ?? '강아지'),
        writeStoredBeforeFarewellHomeSnapshot({
          guardianName: nextProfile.nickname?.trim() || nextProfile.name?.trim() || null,
          petBirthDate: switchedPet.birthDate,
          petName: switchedPet.name,
          petProfileBackgroundColor: null,
          petProfileCropCenterXRatio: 0.5,
          petProfileCropCenterYRatio: 0.5,
          petProfileCropDiameterRatio: 0.7142857143,
          petProfileCropOffsetXRatio: 0,
          petProfileCropOffsetYRatio: 0,
          petProfileImageHeight: 0,
          petProfileImageUri: null,
          petProfileImageWidth: 0,
          progressPercent: 0,
          registeredOwnerPet: switchedPet.isOwner ? switchedPet : undefined,
        }),
      ]);

      startTransition(() => {
        setState(current => resolveAuthenticatedState(current, {
          profile: nextProfile,
          selectedPet: switchedPet,
          session: nextSession,
        }));
      });
    } catch (error) {
      startTransition(() => {
        setState(current => ({
          ...current,
          errorMessage: getErrorMessage(error),
          isAuthenticating: false,
        }));
      });

      throw error;
    }
  };

  return (
    <AppSessionContext.Provider
      value={{
        appFlow,
        closePreview,
        errorMessage: state.errorMessage,
        isAuthenticating: state.isAuthenticating,
        joinByInviteCode,
        openPreview,
        previewStack: state.previewStack,
        profile: state.profile,
        replacePreview,
        selectedPet: state.selectedPet,
        session: state.session,
        signInWithKakao,
        signInWithNaver,
        signInWithDevPassword,
        signOut,
        switchSelectedPet,
        updateSelectedPetLocally,
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
