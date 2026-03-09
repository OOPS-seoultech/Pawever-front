import type { PetSummary } from '../../core/entities/pet';

import { httpClient } from '../http/api/httpClient';

export async function getSelectedPet(accessToken: string) {
  return httpClient.get<PetSummary>('/api/pets/selected', accessToken);
}
