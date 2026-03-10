import type { PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';

export function resolveHomePreviewRoute(selectedPet: PetSummary | null): PreviewableAppFlow {
  if (!selectedPet) {
    return 'beforeFarewellHome';
  }

  if (selectedPet.lifecycleStatus === 'AFTER_FAREWELL') {
    return selectedPet.emergencyMode ? 'emergency' : 'afterFarewellHome';
  }

  return 'beforeFarewellHome';
}
