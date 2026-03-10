import AsyncStorage from '@react-native-async-storage/async-storage';

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
    petName: resolveNullableStringField(snapshot.petName, current.petName),
    petBirthDate: resolveNullableStringField(snapshot.petBirthDate, current.petBirthDate),
    progressPercent: clampProgressPercent(snapshot.progressPercent ?? current.progressPercent),
  };

  await AsyncStorage.setItem(BEFORE_FAREWELL_HOME_STORAGE_KEY, JSON.stringify(nextSnapshot));
}

export async function clearStoredBeforeFarewellHomeSnapshot() {
  await AsyncStorage.removeItem(BEFORE_FAREWELL_HOME_STORAGE_KEY);
}
