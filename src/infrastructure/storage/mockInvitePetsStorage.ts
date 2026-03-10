import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PetSummary } from '../../core/entities/pet';

const MOCK_INVITE_PETS_STORAGE_KEY = '@pawever/mock-invite-pets';
const ADDED_INVITE_PETS_STORAGE_KEY = '@pawever/added-invite-pets';

const defaultMockInvitePets: Record<string, PetSummary> = {
  '11111111': {
    animalTypeName: '강아지',
    birthDate: '2020-04-17',
    breedName: '말티즈',
    emergencyMode: false,
    gender: 'FEMALE',
    id: -211,
    inviteCode: '11111111',
    isOwner: false,
    lifecycleStatus: 'BEFORE_FAREWELL',
    name: '해솔',
    profileImageUrl: null,
    selected: true,
    weight: 4.2,
  },
};

const normalizeInviteCode = (inviteCode: string) => inviteCode.trim().toUpperCase();

const sanitizeStoredPetSummary = (inviteCode: string, pet: Partial<PetSummary>): PetSummary => ({
  animalTypeName: pet.animalTypeName?.trim() || '강아지',
  birthDate: pet.birthDate?.trim() || '2020-04-17',
  breedName: pet.breedName?.trim() || '말티즈',
  emergencyMode: Boolean(pet.emergencyMode),
  gender: pet.gender?.trim() || 'FEMALE',
  id: typeof pet.id === 'number' && Number.isFinite(pet.id) ? pet.id : -211,
  inviteCode,
  isOwner: false,
  lifecycleStatus: pet.lifecycleStatus === 'AFTER_FAREWELL' ? 'AFTER_FAREWELL' : 'BEFORE_FAREWELL',
  name: pet.name?.trim() || '해솔',
  profileImageUrl: pet.profileImageUrl?.trim() || null,
  selected: pet.selected ?? true,
  weight: typeof pet.weight === 'number' && Number.isFinite(pet.weight) ? pet.weight : 4.2,
});

const readStoredMockInvitePetsMap = async () => {
  const raw = await AsyncStorage.getItem(MOCK_INVITE_PETS_STORAGE_KEY);

  if (!raw) {
    await AsyncStorage.setItem(MOCK_INVITE_PETS_STORAGE_KEY, JSON.stringify(defaultMockInvitePets));
    return defaultMockInvitePets;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<PetSummary>>;

    return Object.entries({
      ...defaultMockInvitePets,
      ...parsed,
    }).reduce<Record<string, PetSummary>>((accumulator, [inviteCode, pet]) => {
      accumulator[inviteCode] = sanitizeStoredPetSummary(inviteCode, pet);
      return accumulator;
    }, {});
  } catch {
    await AsyncStorage.setItem(MOCK_INVITE_PETS_STORAGE_KEY, JSON.stringify(defaultMockInvitePets));
    return defaultMockInvitePets;
  }
};

export async function ensureStoredMockInvitePetsSeeded() {
  await readStoredMockInvitePetsMap();
}

export async function readStoredMockInvitePet(inviteCode: string) {
  const normalizedInviteCode = normalizeInviteCode(inviteCode);

  if (!normalizedInviteCode) {
    return null;
  }

  const storedPets = await readStoredMockInvitePetsMap();
  return storedPets[normalizedInviteCode] ?? null;
}

export async function writeStoredMockInvitePet(inviteCode: string, pet: Partial<PetSummary>) {
  const normalizedInviteCode = normalizeInviteCode(inviteCode);

  if (!normalizedInviteCode) {
    return;
  }

  const storedPets = await readStoredMockInvitePetsMap();
  const nextPet = sanitizeStoredPetSummary(normalizedInviteCode, pet);

  await AsyncStorage.setItem(
    MOCK_INVITE_PETS_STORAGE_KEY,
    JSON.stringify({
      ...storedPets,
      [normalizedInviteCode]: nextPet,
    }),
  );
}

export async function readStoredAddedInvitePets() {
  const raw = await AsyncStorage.getItem(ADDED_INVITE_PETS_STORAGE_KEY);

  if (!raw) {
    return [] as PetSummary[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<PetSummary>>;

    return parsed.map((pet, index) =>
      sanitizeStoredPetSummary(
        pet.inviteCode?.trim() || `LOCAL${index + 1}`,
        pet,
      ),
    );
  } catch {
    await AsyncStorage.removeItem(ADDED_INVITE_PETS_STORAGE_KEY);
    return [] as PetSummary[];
  }
}

export async function appendStoredAddedInvitePet(pet: PetSummary) {
  const currentPets = await readStoredAddedInvitePets();
  const normalizedInviteCode = normalizeInviteCode(pet.inviteCode) || `LOCAL${pet.id}`;
  const nextCurrentPet = sanitizeStoredPetSummary(normalizedInviteCode, {
    ...pet,
    isOwner: false,
    selected: true,
  });

  const nextPets = [
    nextCurrentPet,
    ...currentPets.filter(currentPet =>
      normalizeInviteCode(currentPet.inviteCode) !== normalizedInviteCode && currentPet.id !== pet.id),
  ].map((currentPet, index) => ({
    ...currentPet,
    selected: index === 0,
  }));

  await AsyncStorage.setItem(ADDED_INVITE_PETS_STORAGE_KEY, JSON.stringify(nextPets));
}

export async function clearStoredAddedInvitePets() {
  await AsyncStorage.removeItem(ADDED_INVITE_PETS_STORAGE_KEY);
}
