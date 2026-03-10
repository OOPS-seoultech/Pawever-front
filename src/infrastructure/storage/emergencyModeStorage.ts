import AsyncStorage from '@react-native-async-storage/async-storage';

export type EmergencyModeStepId =
  | 'companyDetail'
  | 'funeral'
  | 'intro'
  | 'resting';

export type EmergencyModeRestingTaskId =
  | 'checkCondition'
  | 'cleanMouth'
  | 'closeEyes'
  | 'preparePad'
  | 'prepareSupplies'
  | 'washBody';

export type EmergencyModeEntrySource = 'afterFarewellSignup' | 'beforeFarewellHome';

export type EmergencyModeState = {
  completedRestingTaskIds: EmergencyModeRestingTaskId[];
  currentStepId: EmergencyModeStepId;
  entrySource: EmergencyModeEntrySource;
  farewellDate: string | null;
  hasCompletedIntro: boolean;
  hasVisitedFuneralCompanies: boolean;
  lastViewedStepId: EmergencyModeStepId;
  selectedFuneralCompanyId: number | null;
};

type EmergencyModeIdentity = {
  inviteCode: string | null;
  petId: number | null;
};

type EmergencyModeStorageMap = Record<string, EmergencyModeState>;

const EMERGENCY_MODE_STORAGE_KEY = '@pawever/emergency-mode';

const emergencyModeStepIds: EmergencyModeStepId[] = [
  'intro',
  'resting',
  'funeral',
  'companyDetail',
];

const emergencyModeRestingTaskIds: EmergencyModeRestingTaskId[] = [
  'checkCondition',
  'prepareSupplies',
  'closeEyes',
  'cleanMouth',
  'washBody',
  'preparePad',
];

const createDefaultEmergencyModeState = (
  entrySource: EmergencyModeEntrySource = 'afterFarewellSignup',
): EmergencyModeState => ({
  completedRestingTaskIds: [],
  currentStepId: 'intro',
  entrySource,
  farewellDate: null,
  hasCompletedIntro: false,
  hasVisitedFuneralCompanies: false,
  lastViewedStepId: 'intro',
  selectedFuneralCompanyId: null,
});

const isEmergencyModeStepId = (value: string): value is EmergencyModeStepId =>
  emergencyModeStepIds.includes(value as EmergencyModeStepId);

const isEmergencyModeRestingTaskId = (value: string): value is EmergencyModeRestingTaskId =>
  emergencyModeRestingTaskIds.includes(value as EmergencyModeRestingTaskId);

const getEmergencyModeStoragePetKey = ({ inviteCode, petId }: EmergencyModeIdentity) => {
  if (petId !== null) {
    return `pet:${petId}`;
  }

  if (inviteCode?.trim()) {
    return `invite:${inviteCode.trim().toUpperCase()}`;
  }

  return 'pet:anonymous';
};

const sanitizeEmergencyModeState = (
  state: Partial<EmergencyModeState> | undefined,
  entrySource: EmergencyModeEntrySource = 'afterFarewellSignup',
): EmergencyModeState => {
  const fallback = createDefaultEmergencyModeState(entrySource);

  if (!state) {
    return fallback;
  }

  return {
    completedRestingTaskIds: Array.from(new Set(
      (state.completedRestingTaskIds ?? []).filter(isEmergencyModeRestingTaskId),
    )),
    currentStepId: isEmergencyModeStepId(state.currentStepId ?? '')
      ? state.currentStepId!
      : fallback.currentStepId,
    entrySource: state.entrySource === 'beforeFarewellHome' ? 'beforeFarewellHome' : fallback.entrySource,
    farewellDate: state.farewellDate?.trim() || null,
    hasCompletedIntro: state.hasCompletedIntro ?? fallback.hasCompletedIntro,
    hasVisitedFuneralCompanies: state.hasVisitedFuneralCompanies ?? fallback.hasVisitedFuneralCompanies,
    lastViewedStepId: isEmergencyModeStepId(state.lastViewedStepId ?? '')
      ? state.lastViewedStepId!
      : fallback.lastViewedStepId,
    selectedFuneralCompanyId: typeof state.selectedFuneralCompanyId === 'number' && Number.isFinite(state.selectedFuneralCompanyId)
      ? state.selectedFuneralCompanyId
      : null,
  };
};

async function readStoredEmergencyModeMap() {
  const raw = await AsyncStorage.getItem(EMERGENCY_MODE_STORAGE_KEY);

  if (!raw) {
    return {} as EmergencyModeStorageMap;
  }

  return JSON.parse(raw) as EmergencyModeStorageMap;
}

export async function readStoredEmergencyModeState(
  identity: EmergencyModeIdentity,
  entrySource: EmergencyModeEntrySource = 'afterFarewellSignup',
) {
  const map = await readStoredEmergencyModeMap();
  const petKey = getEmergencyModeStoragePetKey(identity);

  return sanitizeEmergencyModeState(map[petKey], entrySource);
}

export async function writeStoredEmergencyModeState(
  identity: EmergencyModeIdentity,
  nextState: Partial<EmergencyModeState>,
  entrySource: EmergencyModeEntrySource = 'afterFarewellSignup',
) {
  const map = await readStoredEmergencyModeMap();
  const petKey = getEmergencyModeStoragePetKey(identity);
  const current = sanitizeEmergencyModeState(map[petKey], entrySource);

  map[petKey] = sanitizeEmergencyModeState({
    ...current,
    ...nextState,
  }, entrySource);

  await AsyncStorage.setItem(EMERGENCY_MODE_STORAGE_KEY, JSON.stringify(map));
}

export async function clearStoredEmergencyModeStates() {
  await AsyncStorage.removeItem(EMERGENCY_MODE_STORAGE_KEY);
}
