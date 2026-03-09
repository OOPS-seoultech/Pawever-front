export type PetLifecycleStatus = 'BEFORE_FAREWELL' | 'AFTER_FAREWELL';

export type PetSummary = {
  animalTypeName: string;
  birthDate: string | null;
  breedName: string;
  emergencyMode: boolean;
  gender: string | null;
  id: number;
  inviteCode: string;
  isOwner: boolean;
  lifecycleStatus: PetLifecycleStatus;
  name: string;
  profileImageUrl: string | null;
  selected: boolean;
  weight: number | null;
};
