import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PetLifecycleStatus } from '../../core/entities/pet';
import { footprintsMissionDefinitions, type FootprintsSectionId } from '../../shared/data/footprintsData';

export type FootprintsRecording = {
  durationSec: number;
  fileUri: string | null;
  format: 'MP3' | 'WAV';
  sizeBytes: number;
  updatedAt: string;
  waveform: number[];
};

export type FootprintsMissionProgress = {
  completed: boolean;
  id: string;
  recording: FootprintsRecording | null;
};

export type FootprintsState = {
  microphonePermission: 'denied' | 'granted' | 'unknown';
  missions: Record<FootprintsSectionId, FootprintsMissionProgress[]>;
};

type FootprintsIdentity = {
  inviteCode: string | null;
  petId: number | null;
};

type FootprintsStorageMap = Record<string, FootprintsState>;

const FOOTPRINTS_STORAGE_KEY = '@pawever/footprints';
const waveformSeed = [0.18, 0.34, 0.27, 0.46, 0.39, 0.54, 0.41, 0.62, 0.58, 0.44, 0.36, 0.29, 0.33, 0.47, 0.56, 0.42, 0.31, 0.38, 0.49, 0.57, 0.43, 0.35];

const stampAfterDefaultCompletedIds = [
  'stamp-home-party',
  'stamp-photo-booth',
  'stamp-paw-print',
  'stamp-sniff-freely',
  'stamp-fur-keepsake',
];

const recordAfterDefaultCompletedIds = [
  'record-sleep-breath',
  'record-snore',
  'record-greeting',
  'record-heartbeat',
  'record-food-asmr',
  'record-paw-click',
];

const messageAfterDefaultCompletedIds = [
  'message-thanks',
  'message-first-day',
];

const getFootprintsStoragePetKey = ({ inviteCode, petId }: FootprintsIdentity) => {
  if (petId !== null) {
    return `pet:${petId}`;
  }

  if (inviteCode?.trim()) {
    return `invite:${inviteCode.trim().toUpperCase()}`;
  }

  return 'pet:anonymous';
};

const createMockWaveform = (seedOffset: number) =>
  waveformSeed.map((value, index) => {
    const shifted = waveformSeed[(index + seedOffset) % waveformSeed.length] ?? value;

    return Math.min(0.72, Math.max(0.16, Number((shifted).toFixed(2))));
  });

const createMockRecording = (durationSec: number, seedOffset: number): FootprintsRecording => ({
  durationSec,
  fileUri: null,
  format: 'WAV',
  sizeBytes: durationSec * 144000,
  updatedAt: new Date().toISOString(),
  waveform: createMockWaveform(seedOffset),
});

const createInitialFootprintsState = (lifecycleStatus: PetLifecycleStatus): FootprintsState => {
  const isAfterFarewell = lifecycleStatus === 'AFTER_FAREWELL';

  return {
    microphonePermission: 'unknown',
    missions: {
      message: footprintsMissionDefinitions.message.map((missionDefinition, index) => {
        const completed = isAfterFarewell && messageAfterDefaultCompletedIds.includes(missionDefinition.id);

        return {
          completed,
          id: missionDefinition.id,
          recording: completed ? createMockRecording(7 + index, index + 3) : null,
        };
      }),
      record: footprintsMissionDefinitions.record.map((missionDefinition, index) => {
        const completed = isAfterFarewell && recordAfterDefaultCompletedIds.includes(missionDefinition.id);

        return {
          completed,
          id: missionDefinition.id,
          recording: completed ? createMockRecording(5 + (index % 4), index + 5) : null,
        };
      }),
      stamp: footprintsMissionDefinitions.stamp.map(missionDefinition => ({
        completed: isAfterFarewell && stampAfterDefaultCompletedIds.includes(missionDefinition.id),
        id: missionDefinition.id,
        recording: null,
      })),
    },
  };
};

const clampDurationSec = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(value)));
};

const clampWaveformValue = (value: number) => {
  if (Number.isNaN(value)) {
    return 0.16;
  }

  return Math.max(0.16, Math.min(0.72, Number(value.toFixed(2))));
};

const sanitizeRecording = (recording: Partial<FootprintsRecording> | null | undefined) => {
  if (!recording) {
    return null;
  }

  return {
    durationSec: clampDurationSec(recording.durationSec ?? 0),
    fileUri: recording.fileUri?.trim() || null,
    format: recording.format === 'MP3' ? 'MP3' : 'WAV',
    sizeBytes: Math.max(0, Math.round(recording.sizeBytes ?? 0)),
    updatedAt: recording.updatedAt?.trim() || new Date().toISOString(),
    waveform: (recording.waveform ?? createMockWaveform(0)).map(clampWaveformValue),
  } satisfies FootprintsRecording;
};

const sanitizeSectionMissions = (
  sectionId: FootprintsSectionId,
  rawMissions: FootprintsMissionProgress[] | undefined,
  fallbackMissions: FootprintsMissionProgress[],
) => {
  const missionMap = new Map((rawMissions ?? []).map(mission => [mission.id, mission]));

  return footprintsMissionDefinitions[sectionId].map(missionDefinition => {
    const rawMission = missionMap.get(missionDefinition.id);
    const fallbackMission = fallbackMissions.find(mission => mission.id === missionDefinition.id);

    return {
      completed: rawMission?.completed ?? fallbackMission?.completed ?? false,
      id: missionDefinition.id,
      recording: sanitizeRecording(rawMission?.recording) ?? fallbackMission?.recording ?? null,
    };
  });
};

const sanitizeFootprintsState = (
  rawState: Partial<FootprintsState> | undefined,
  lifecycleStatus: PetLifecycleStatus,
) => {
  const fallback = createInitialFootprintsState(lifecycleStatus);

  if (!rawState) {
    return fallback;
  }

  return {
    microphonePermission: rawState.microphonePermission === 'granted'
      ? 'granted'
      : rawState.microphonePermission === 'denied'
        ? 'denied'
        : 'unknown',
    missions: {
      message: sanitizeSectionMissions('message', rawState.missions?.message, fallback.missions.message),
      record: sanitizeSectionMissions('record', rawState.missions?.record, fallback.missions.record),
      stamp: sanitizeSectionMissions('stamp', rawState.missions?.stamp, fallback.missions.stamp),
    },
  } satisfies FootprintsState;
};

async function readStoredFootprintsMap() {
  const raw = await AsyncStorage.getItem(FOOTPRINTS_STORAGE_KEY);

  if (!raw) {
    return {} as FootprintsStorageMap;
  }

  return JSON.parse(raw) as FootprintsStorageMap;
}

export async function readStoredFootprintsState(
  identity: FootprintsIdentity,
  lifecycleStatus: PetLifecycleStatus,
) {
  const map = await readStoredFootprintsMap();
  const petKey = getFootprintsStoragePetKey(identity);

  return sanitizeFootprintsState(map[petKey], lifecycleStatus);
}

export async function writeStoredFootprintsState(
  identity: FootprintsIdentity,
  lifecycleStatus: PetLifecycleStatus,
  nextState: FootprintsState,
) {
  const map = await readStoredFootprintsMap();
  const petKey = getFootprintsStoragePetKey(identity);

  map[petKey] = sanitizeFootprintsState(nextState, lifecycleStatus);

  await AsyncStorage.setItem(FOOTPRINTS_STORAGE_KEY, JSON.stringify(map));
}

export async function clearStoredFootprintsStates() {
  await AsyncStorage.removeItem(FOOTPRINTS_STORAGE_KEY);
}

export function countCompletedFootprintsMissions(footprintsState: FootprintsState) {
  return Object.values(footprintsState.missions)
    .flat()
    .filter(mission => mission.completed)
    .length;
}
