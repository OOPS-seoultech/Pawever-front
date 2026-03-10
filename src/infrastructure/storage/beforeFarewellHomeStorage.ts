import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PetSummary } from '../../core/entities/pet';

type BeforeFarewellHomeSnapshot = {
  guardianName: string | null;
  hasCompletedHomeOnboarding: boolean;
  petProfileBackgroundColor: string | null;
  petProfileCropCenterXRatio: number;
  petProfileCropCenterYRatio: number;
  petProfileCropDiameterRatio: number;
  petProfileCropOffsetXRatio: number;
  petProfileCropOffsetYRatio: number;
  petProfileImageHeight: number;
  petProfileImageUri: string | null;
  petProfileImageWidth: number;
  registeredOwnerPet: PetSummary | null;
  petName: string | null;
  petBirthDate: string | null;
  progressPercent: number;
};

const BEFORE_FAREWELL_HOME_STORAGE_KEY = '@pawever/before-farewell-home';
const defaultBeforeFarewellHomeSnapshot: BeforeFarewellHomeSnapshot = {
  guardianName: null,
  hasCompletedHomeOnboarding: false,
  petProfileBackgroundColor: null,
  petProfileCropCenterXRatio: 0.5,
  petProfileCropCenterYRatio: 0.5,
  petProfileCropDiameterRatio: 0.7142857143,
  petProfileCropOffsetXRatio: 0,
  petProfileCropOffsetYRatio: 0,
  petProfileImageHeight: 0,
  petProfileImageUri: null,
  petProfileImageWidth: 0,
  registeredOwnerPet: null,
  petName: null,
  petBirthDate: null,
  progressPercent: 0,
};

const clampProgressPercent = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

const clampCropOffsetRatio = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(-1, value));
};

const clampUnitRatio = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
};

const clampPositiveNumber = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, value);
};

const resolveNullableStringField = (
  value: string | null | undefined,
  current: string | null,
) => {
  if (value === undefined) {
    return current;
  }

  return value?.trim() || null;
};

const resolveWeightValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return value;
};

const resolvePetLifecycleStatus = (value: string | undefined) => {
  if (value === 'AFTER_FAREWELL') {
    return 'AFTER_FAREWELL';
  }

  return 'BEFORE_FAREWELL';
};

const normalizeStoredPetSummary = (value: Partial<PetSummary> | null | undefined): PetSummary | null => {
  if (!value) {
    return null;
  }

  const name = value.name?.trim();
  const animalTypeName = value.animalTypeName?.trim();
  const breedName = value.breedName?.trim();

  if (!name || !animalTypeName || !breedName) {
    return null;
  }

  return {
    animalTypeName,
    birthDate: value.birthDate?.trim() || null,
    breedName,
    emergencyMode: Boolean(value.emergencyMode),
    gender: value.gender?.trim() || null,
    id: Number.isFinite(value.id) ? value.id as number : -1,
    inviteCode: value.inviteCode?.trim() || 'LOCALOWNER',
    isOwner: value.isOwner !== false,
    lifecycleStatus: resolvePetLifecycleStatus(value.lifecycleStatus),
    name,
    profileImageUrl: value.profileImageUrl?.trim() || null,
    selected: Boolean(value.selected),
    weight: resolveWeightValue(value.weight),
  };
};

const resolveStoredPetSummaryField = (
  value: PetSummary | null | undefined,
  current: PetSummary | null,
) => {
  if (value === undefined) {
    return current;
  }

  return normalizeStoredPetSummary(value);
};

export async function readStoredBeforeFarewellHomeSnapshot() {
  const raw = await AsyncStorage.getItem(BEFORE_FAREWELL_HOME_STORAGE_KEY);

  if (!raw) {
    return defaultBeforeFarewellHomeSnapshot;
  }

  const parsed = JSON.parse(raw) as Partial<BeforeFarewellHomeSnapshot>;

  return {
    guardianName: parsed.guardianName?.trim() || null,
    hasCompletedHomeOnboarding: parsed.hasCompletedHomeOnboarding ?? false,
    petProfileBackgroundColor: parsed.petProfileBackgroundColor?.trim() || null,
    petProfileCropCenterXRatio: clampUnitRatio(parsed.petProfileCropCenterXRatio ?? defaultBeforeFarewellHomeSnapshot.petProfileCropCenterXRatio),
    petProfileCropCenterYRatio: clampUnitRatio(parsed.petProfileCropCenterYRatio ?? defaultBeforeFarewellHomeSnapshot.petProfileCropCenterYRatio),
    petProfileCropDiameterRatio: clampUnitRatio(parsed.petProfileCropDiameterRatio ?? defaultBeforeFarewellHomeSnapshot.petProfileCropDiameterRatio),
    petProfileCropOffsetXRatio: clampCropOffsetRatio(parsed.petProfileCropOffsetXRatio ?? 0),
    petProfileCropOffsetYRatio: clampCropOffsetRatio(parsed.petProfileCropOffsetYRatio ?? 0),
    petProfileImageHeight: clampPositiveNumber(parsed.petProfileImageHeight ?? 0),
    petProfileImageUri: parsed.petProfileImageUri?.trim() || null,
    petProfileImageWidth: clampPositiveNumber(parsed.petProfileImageWidth ?? 0),
    registeredOwnerPet: normalizeStoredPetSummary(parsed.registeredOwnerPet),
    petName: parsed.petName?.trim() || null,
    petBirthDate: parsed.petBirthDate?.trim() || null,
    progressPercent: clampProgressPercent(parsed.progressPercent ?? 0),
  };
}

export async function writeStoredBeforeFarewellHomeSnapshot(snapshot: Partial<BeforeFarewellHomeSnapshot>) {
  const current = await readStoredBeforeFarewellHomeSnapshot();
  const nextSnapshot: BeforeFarewellHomeSnapshot = {
    guardianName: resolveNullableStringField(snapshot.guardianName, current.guardianName),
    hasCompletedHomeOnboarding: snapshot.hasCompletedHomeOnboarding ?? current.hasCompletedHomeOnboarding,
    petProfileBackgroundColor: resolveNullableStringField(snapshot.petProfileBackgroundColor, current.petProfileBackgroundColor),
    petProfileCropCenterXRatio: clampUnitRatio(snapshot.petProfileCropCenterXRatio ?? current.petProfileCropCenterXRatio),
    petProfileCropCenterYRatio: clampUnitRatio(snapshot.petProfileCropCenterYRatio ?? current.petProfileCropCenterYRatio),
    petProfileCropDiameterRatio: clampUnitRatio(snapshot.petProfileCropDiameterRatio ?? current.petProfileCropDiameterRatio),
    petProfileCropOffsetXRatio: clampCropOffsetRatio(snapshot.petProfileCropOffsetXRatio ?? current.petProfileCropOffsetXRatio),
    petProfileCropOffsetYRatio: clampCropOffsetRatio(snapshot.petProfileCropOffsetYRatio ?? current.petProfileCropOffsetYRatio),
    petProfileImageHeight: clampPositiveNumber(snapshot.petProfileImageHeight ?? current.petProfileImageHeight),
    petProfileImageUri: resolveNullableStringField(snapshot.petProfileImageUri, current.petProfileImageUri),
    petProfileImageWidth: clampPositiveNumber(snapshot.petProfileImageWidth ?? current.petProfileImageWidth),
    registeredOwnerPet: resolveStoredPetSummaryField(snapshot.registeredOwnerPet, current.registeredOwnerPet),
    petName: resolveNullableStringField(snapshot.petName, current.petName),
    petBirthDate: resolveNullableStringField(snapshot.petBirthDate, current.petBirthDate),
    progressPercent: clampProgressPercent(snapshot.progressPercent ?? current.progressPercent),
  };

  await AsyncStorage.setItem(BEFORE_FAREWELL_HOME_STORAGE_KEY, JSON.stringify(nextSnapshot));
}

export async function clearStoredBeforeFarewellHomeSnapshot() {
  await AsyncStorage.removeItem(BEFORE_FAREWELL_HOME_STORAGE_KEY);
}
