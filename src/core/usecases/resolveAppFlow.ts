import type { AuthSession } from '../entities/auth';
import type { PetSummary } from '../entities/pet';
import type { AppFlow } from '../entities/appFlow';

type ResolveAppFlowInput = {
  hasRestoredSession: boolean;
  selectedPet: PetSummary | null;
  session: AuthSession | null;
};

export function resolveAppFlow({
  hasRestoredSession,
  selectedPet,
  session,
}: ResolveAppFlowInput): AppFlow {
  if (!hasRestoredSession) {
    return 'loading';
  }

  if (!session) {
    return 'auth';
  }

  if (session.isNewUser || session.selectedPetId === null || !selectedPet) {
    return 'onboarding';
  }

  if (selectedPet.lifecycleStatus === 'AFTER_FAREWELL') {
    return selectedPet.emergencyMode ? 'emergency' : 'afterFarewellHome';
  }

  return 'beforeFarewellHome';
}
