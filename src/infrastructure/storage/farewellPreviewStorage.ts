import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PetLifecycleStatus } from '../../core/entities/pet';

export type FarewellPreviewStepId =
  | 'funeral'
  | 'resting'
  | 'administration'
  | 'belongings'
  | 'support';

export type FarewellPreviewAdminItemId =
  | 'registryNumber'
  | 'reportOffice'
  | 'documents'
  | 'submitReport'
  | 'verifyReport';

export type FarewellPreviewSupportItemId =
  | 'seoulYouthMind'
  | 'youthMind'
  | 'nationalMind'
  | 'seoulMentalCenter';

export type FarewellPreviewBelongingsOptionId =
  | 'keep'
  | 'donate'
  | 'dispose'
  | 'memorialSpace';

export type FarewellPreviewState = {
  administrationCompletedItemIds: FarewellPreviewAdminItemId[];
  belongingsConfirmed: boolean;
  belongingsSelectedOptionIds: FarewellPreviewBelongingsOptionId[];
  completedStepIds: FarewellPreviewStepId[];
  currentStepId: FarewellPreviewStepId;
  enteredStepIds: FarewellPreviewStepId[];
  funeralCompanyConfirmed: boolean;
  hasCompletedGuide: boolean;
  lifecycleStatus: PetLifecycleStatus;
  restingActiveStepNumber: number;
  restingCompletedStepCount: number;
  supportCompletedItemIds: FarewellPreviewSupportItemId[];
  supportConfirmed: boolean;
};

type FarewellPreviewIdentity = {
  inviteCode: string | null;
  lifecycleStatus: PetLifecycleStatus;
  petId: number | null;
};

type FarewellPreviewStorageMap = Record<string, FarewellPreviewState>;

const FAREWELL_PREVIEW_STORAGE_KEY = '@pawever/farewell-preview';

const farewellPreviewStepIds: FarewellPreviewStepId[] = [
  'funeral',
  'resting',
  'administration',
  'belongings',
  'support',
];

const farewellPreviewAdminItemIds: FarewellPreviewAdminItemId[] = [
  'registryNumber',
  'reportOffice',
  'documents',
  'submitReport',
  'verifyReport',
];

const farewellPreviewSupportItemIds: FarewellPreviewSupportItemId[] = [
  'seoulYouthMind',
  'youthMind',
  'nationalMind',
  'seoulMentalCenter',
];

const farewellPreviewBelongingsOptionIds: FarewellPreviewBelongingsOptionId[] = [
  'keep',
  'donate',
  'dispose',
  'memorialSpace',
];

const dedupeIds = <T extends string>(values: T[]) => Array.from(new Set(values));

const isFarewellPreviewStepId = (value: string): value is FarewellPreviewStepId =>
  farewellPreviewStepIds.includes(value as FarewellPreviewStepId);

const isFarewellPreviewAdminItemId = (value: string): value is FarewellPreviewAdminItemId =>
  farewellPreviewAdminItemIds.includes(value as FarewellPreviewAdminItemId);

const isFarewellPreviewSupportItemId = (value: string): value is FarewellPreviewSupportItemId =>
  farewellPreviewSupportItemIds.includes(value as FarewellPreviewSupportItemId);

const isFarewellPreviewBelongingsOptionId = (value: string): value is FarewellPreviewBelongingsOptionId =>
  farewellPreviewBelongingsOptionIds.includes(value as FarewellPreviewBelongingsOptionId);

const clampRestingStepNumber = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(6, Math.max(0, Math.round(value)));
};

const createDefaultFarewellPreviewState = (
  lifecycleStatus: PetLifecycleStatus,
): FarewellPreviewState => {
  const isAfterFarewell = lifecycleStatus === 'AFTER_FAREWELL';

  return {
    administrationCompletedItemIds: [],
    belongingsConfirmed: false,
    belongingsSelectedOptionIds: [],
    completedStepIds: [],
    currentStepId: isAfterFarewell ? 'administration' : 'funeral',
    enteredStepIds: [isAfterFarewell ? 'administration' : 'funeral'],
    funeralCompanyConfirmed: false,
    hasCompletedGuide: isAfterFarewell,
    lifecycleStatus,
    restingActiveStepNumber: 0,
    restingCompletedStepCount: 0,
    supportCompletedItemIds: [],
    supportConfirmed: false,
  };
};

const getFarewellPreviewStoragePetKey = ({ inviteCode, petId }: FarewellPreviewIdentity) => {
  if (petId !== null) {
    return `pet:${petId}`;
  }

  if (inviteCode?.trim()) {
    return `invite:${inviteCode.trim().toUpperCase()}`;
  }

  return 'pet:anonymous';
};

const sanitizeFarewellPreviewState = (
  state: Partial<FarewellPreviewState> | undefined,
  lifecycleStatus: PetLifecycleStatus,
) => {
  const fallback = createDefaultFarewellPreviewState(lifecycleStatus);

  if (!state || state.lifecycleStatus !== lifecycleStatus) {
    return fallback;
  }

  const restingCompletedStepCount = clampRestingStepNumber(
    state.restingCompletedStepCount ?? fallback.restingCompletedStepCount,
  );
  const restingActiveStepNumber = clampRestingStepNumber(
    state.restingActiveStepNumber ?? Math.min(6, restingCompletedStepCount + 1),
  );

  return {
    administrationCompletedItemIds: dedupeIds(
      (state.administrationCompletedItemIds ?? []).filter(isFarewellPreviewAdminItemId),
    ),
    belongingsConfirmed: state.belongingsConfirmed ?? false,
    belongingsSelectedOptionIds: dedupeIds(
      (state.belongingsSelectedOptionIds ?? []).filter(isFarewellPreviewBelongingsOptionId),
    ),
    completedStepIds: dedupeIds(
      (state.completedStepIds ?? []).filter(isFarewellPreviewStepId),
    ),
    currentStepId: isFarewellPreviewStepId(state.currentStepId ?? '')
      ? state.currentStepId!
      : fallback.currentStepId,
    enteredStepIds: dedupeIds(
      (state.enteredStepIds ?? []).filter(isFarewellPreviewStepId),
    ),
    funeralCompanyConfirmed: state.funeralCompanyConfirmed ?? false,
    hasCompletedGuide: state.hasCompletedGuide ?? fallback.hasCompletedGuide,
    lifecycleStatus,
    restingActiveStepNumber,
    restingCompletedStepCount,
    supportCompletedItemIds: dedupeIds(
      (state.supportCompletedItemIds ?? []).filter(isFarewellPreviewSupportItemId),
    ),
    supportConfirmed: state.supportConfirmed ?? false,
  };
};

async function readStoredFarewellPreviewMap() {
  const raw = await AsyncStorage.getItem(FAREWELL_PREVIEW_STORAGE_KEY);

  if (!raw) {
    return {} as FarewellPreviewStorageMap;
  }

  return JSON.parse(raw) as FarewellPreviewStorageMap;
}

export async function readStoredFarewellPreviewState(identity: FarewellPreviewIdentity) {
  const map = await readStoredFarewellPreviewMap();
  const petKey = getFarewellPreviewStoragePetKey(identity);

  return sanitizeFarewellPreviewState(map[petKey], identity.lifecycleStatus);
}

export async function writeStoredFarewellPreviewState(
  identity: FarewellPreviewIdentity,
  nextState: FarewellPreviewState,
) {
  const map = await readStoredFarewellPreviewMap();
  const petKey = getFarewellPreviewStoragePetKey(identity);

  map[petKey] = sanitizeFarewellPreviewState(nextState, identity.lifecycleStatus);

  await AsyncStorage.setItem(FAREWELL_PREVIEW_STORAGE_KEY, JSON.stringify(map));
}

export async function clearStoredFarewellPreviewStates() {
  await AsyncStorage.removeItem(FAREWELL_PREVIEW_STORAGE_KEY);
}

export function computeFarewellPreviewProgress(state: FarewellPreviewState) {
  if (state.lifecycleStatus === 'AFTER_FAREWELL') {
    if (state.supportConfirmed) {
      return 100;
    }

    if (
      state.supportCompletedItemIds.length > 0
      || state.completedStepIds.includes('support')
    ) {
      return 74;
    }

    if (state.belongingsConfirmed || state.completedStepIds.includes('belongings')) {
      return 67;
    }

    const afterAdministrationProgress = [10, 20, 30, 40, 50];

    return afterAdministrationProgress[
      Math.max(0, state.administrationCompletedItemIds.length - 1)
    ] ?? 0;
  }

  if (state.supportConfirmed) {
    return 100;
  }

  const supportProgressByCount = [80, 85, 90, 95];

  if (state.supportCompletedItemIds.length > 0) {
    return supportProgressByCount[
      Math.max(0, state.supportCompletedItemIds.length - 1)
    ] ?? 80;
  }

  if (state.belongingsConfirmed || state.completedStepIds.includes('belongings')) {
    return 80;
  }

  const administrationProgressByCount = [45, 52, 58, 65, 70];

  if (state.administrationCompletedItemIds.length > 0) {
    return administrationProgressByCount[
      Math.max(0, state.administrationCompletedItemIds.length - 1)
    ] ?? 40;
  }

  const restingProgressByCount = [26, 29, 32, 35, 38, 40];

  if (state.restingCompletedStepCount > 0) {
    return restingProgressByCount[
      Math.max(0, state.restingCompletedStepCount - 1)
    ] ?? 20;
  }

  if (state.funeralCompanyConfirmed || state.completedStepIds.includes('funeral')) {
    return 20;
  }

  return 0;
}
