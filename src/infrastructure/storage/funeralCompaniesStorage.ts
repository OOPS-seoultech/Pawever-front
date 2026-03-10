import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PetLifecycleStatus } from '../../core/entities/pet';
import type {
  FuneralCompaniesSortType,
  FuneralCompanyOptionId,
} from '../../shared/data/funeralCompaniesData';

export type FuneralCompaniesState = {
  blockedCompanyIds: number[];
  budgetMax: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  hasCompletedOptions: boolean;
  locationPermission: 'denied' | 'granted' | 'unknown';
  recentSearches: string[];
  savedCompanyIds: number[];
  selectedOptionIds: FuneralCompanyOptionId[];
  sortType: FuneralCompaniesSortType;
};

type FuneralCompaniesIdentity = {
  inviteCode: string | null;
  lifecycleStatus: PetLifecycleStatus;
  petId: number | null;
};

type FuneralCompaniesStorageMap = Record<string, FuneralCompaniesState>;

const FUNERAL_COMPANIES_STORAGE_KEY = '@pawever/funeral-companies';
const funeralCompanyOptionIds: FuneralCompanyOptionId[] = [
  'freeBasicUrn',
  'fullObservation',
  'memorialStone',
  'open24Hours',
  'ossuary',
  'pickupService',
  'privateMemorialRoom',
];
const maxRecentSearchCount = 10;
const maxBudgetWon = 1_000_000;
const budgetUnitWon = 50_000;

const dedupeNumbers = (values: number[]) => Array.from(new Set(values));
const dedupeStrings = (values: string[]) => Array.from(new Set(values));
const isFuneralCompanyOptionId = (value: string): value is FuneralCompanyOptionId =>
  funeralCompanyOptionIds.includes(value as FuneralCompanyOptionId);

const clampBudgetWon = (value: number) => {
  if (Number.isNaN(value)) {
    return maxBudgetWon;
  }

  const normalized = Math.round(value / budgetUnitWon) * budgetUnitWon;
  return Math.min(maxBudgetWon, Math.max(0, normalized));
};

const createDefaultFuneralCompaniesState = (
  lifecycleStatus: PetLifecycleStatus,
): FuneralCompaniesState => ({
  blockedCompanyIds: [],
  budgetMax: maxBudgetWon,
  currentLatitude: null,
  currentLongitude: null,
  hasCompletedOptions: lifecycleStatus === 'AFTER_FAREWELL',
  locationPermission: 'unknown',
  recentSearches: [],
  savedCompanyIds: [],
  selectedOptionIds: [],
  sortType: 'distance',
});

const getFuneralCompaniesStoragePetKey = ({ inviteCode, petId }: FuneralCompaniesIdentity) => {
  if (petId !== null) {
    return `pet:${petId}`;
  }

  if (inviteCode?.trim()) {
    return `invite:${inviteCode.trim().toUpperCase()}`;
  }

  return 'pet:anonymous';
};

const sanitizeFuneralCompaniesState = (
  state: Partial<FuneralCompaniesState> | undefined,
  lifecycleStatus: PetLifecycleStatus,
): FuneralCompaniesState => {
  const fallback = createDefaultFuneralCompaniesState(lifecycleStatus);

  if (!state) {
    return fallback;
  }

  return {
    blockedCompanyIds: dedupeNumbers(
      (state.blockedCompanyIds ?? []).filter(
        companyId => typeof companyId === 'number' && Number.isFinite(companyId),
      ),
    ).slice(0, 15),
    budgetMax: clampBudgetWon(state.budgetMax ?? fallback.budgetMax),
    currentLatitude: typeof state.currentLatitude === 'number' && Number.isFinite(state.currentLatitude)
      ? state.currentLatitude
      : null,
    currentLongitude: typeof state.currentLongitude === 'number' && Number.isFinite(state.currentLongitude)
      ? state.currentLongitude
      : null,
    hasCompletedOptions: state.hasCompletedOptions ?? fallback.hasCompletedOptions,
    locationPermission: state.locationPermission === 'granted' || state.locationPermission === 'denied'
      ? state.locationPermission
      : fallback.locationPermission,
    recentSearches: dedupeStrings(
      (state.recentSearches ?? []).map(search => search.trim()).filter(Boolean),
    ).slice(0, maxRecentSearchCount),
    savedCompanyIds: dedupeNumbers(
      (state.savedCompanyIds ?? []).filter(
        companyId => typeof companyId === 'number' && Number.isFinite(companyId),
      ),
    ).slice(0, 5),
    selectedOptionIds: dedupeStrings(
      (state.selectedOptionIds ?? []).filter(isFuneralCompanyOptionId),
    ) as FuneralCompanyOptionId[],
    sortType: state.sortType === 'cost' || state.sortType === 'reviews'
      ? state.sortType
      : fallback.sortType,
  };
};

async function readStoredFuneralCompaniesMap() {
  const raw = await AsyncStorage.getItem(FUNERAL_COMPANIES_STORAGE_KEY);

  if (!raw) {
    return {} as FuneralCompaniesStorageMap;
  }

  return JSON.parse(raw) as FuneralCompaniesStorageMap;
}

export async function readStoredFuneralCompaniesState(identity: FuneralCompaniesIdentity) {
  const map = await readStoredFuneralCompaniesMap();
  const petKey = getFuneralCompaniesStoragePetKey(identity);

  return sanitizeFuneralCompaniesState(map[petKey], identity.lifecycleStatus);
}

export async function writeStoredFuneralCompaniesState(
  identity: FuneralCompaniesIdentity,
  nextState: FuneralCompaniesState,
) {
  const map = await readStoredFuneralCompaniesMap();
  const petKey = getFuneralCompaniesStoragePetKey(identity);

  map[petKey] = sanitizeFuneralCompaniesState(nextState, identity.lifecycleStatus);

  await AsyncStorage.setItem(FUNERAL_COMPANIES_STORAGE_KEY, JSON.stringify(map));
}

export async function clearStoredFuneralCompaniesStates() {
  await AsyncStorage.removeItem(FUNERAL_COMPANIES_STORAGE_KEY);
}
