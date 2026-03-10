import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AudioRecorderPlayer, {
  type PlayBackType,
  type RecordBackType,
} from 'react-native-audio-recorder-player';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PetLifecycleStatus } from '../../core/entities/pet';
import { openAppSettings, requestMicrophonePermission } from '../../infrastructure/native/permissions';
import {
  countCompletedFootprintsMissions,
  type FootprintsMissionProgress,
  type FootprintsRecording,
  type FootprintsState,
  readStoredFootprintsState,
  writeStoredFootprintsState,
} from '../../infrastructure/storage/footprintsStorage';
import {
  footprintsMissionDefinitions,
  type FootprintsMissionDefinition,
  type FootprintsSectionId,
} from '../../shared/data/footprintsData';
import { resolveHomePreviewRoute } from '../navigation/resolveHomePreviewRoute';
import { useAppSessionStore } from '../stores/AppSessionStore';

const inactiveHomeAssetUri = 'https://www.figma.com/api/mcp/asset/9a1de914-5682-454b-8955-f7202bdb9562';
const inactiveFootprintAssetUri = 'https://www.figma.com/api/mcp/asset/588ce4ea-6b6d-49e9-84b9-dae34bc703c6';
const inactiveExploreAssetUri = 'https://www.figma.com/api/mcp/asset/85190583-627a-4f2c-ba44-b00dfb3fe342';
const inactiveSettingsAssetUri = 'https://www.figma.com/api/mcp/asset/00a9a881-da45-491e-a25e-8eabe68ce7de';

const maxRecordingDurationSec = 10;
const waveformSeed = [0.18, 0.34, 0.27, 0.46, 0.39, 0.54, 0.41, 0.62, 0.58, 0.44, 0.36, 0.29, 0.33, 0.47, 0.56, 0.42, 0.31, 0.38, 0.49, 0.57, 0.43, 0.35];
const defaultWaveform = Array.from({ length: waveformSeed.length }, () => 0.22);

type BottomNavTabId = 'explore' | 'footprints' | 'home' | 'settings';
type FinalizeRecordingHandler = (options?: {
  autoStopped?: boolean;
  durationSec?: number;
  waveform?: number[];
}) => Promise<FootprintsRecording | null>;

const sectionLabels: Array<{ id: FootprintsSectionId; label: string }> = [
  { id: 'stamp', label: '도장찍기' },
  { id: 'record', label: '녹음하기' },
  { id: 'message', label: '마음 전하기' },
];

const getBottomNavTabs = (lifecycleStatus: PetLifecycleStatus): Array<{
  iconUri: string;
  id: BottomNavTabId;
  label: string;
}> => {
  if (lifecycleStatus === 'AFTER_FAREWELL') {
    return [
      { iconUri: inactiveHomeAssetUri, id: 'home', label: '홈' },
      { iconUri: inactiveFootprintAssetUri, id: 'footprints', label: '발자국' },
      { iconUri: inactiveExploreAssetUri, id: 'explore', label: '이어보기' },
      { iconUri: inactiveSettingsAssetUri, id: 'settings', label: '설정' },
    ];
  }

  return [
    { iconUri: inactiveHomeAssetUri, id: 'home', label: '홈' },
    { iconUri: inactiveFootprintAssetUri, id: 'footprints', label: '발자국' },
    { iconUri: inactiveExploreAssetUri, id: 'explore', label: '살펴보기' },
    { iconUri: inactiveSettingsAssetUri, id: 'settings', label: '설정' },
  ];
};

const createFallbackFootprintsState = (): FootprintsState => ({
  microphonePermission: 'unknown',
  missions: {
    message: footprintsMissionDefinitions.message.map(missionDefinition => ({
      completed: false,
      id: missionDefinition.id,
      recording: null,
    })),
    record: footprintsMissionDefinitions.record.map(missionDefinition => ({
      completed: false,
      id: missionDefinition.id,
      recording: null,
    })),
    stamp: footprintsMissionDefinitions.stamp.map(missionDefinition => ({
      completed: false,
      id: missionDefinition.id,
      recording: null,
    })),
  },
});

const getMissionDescriptionLines = (
  missionDefinition: FootprintsMissionDefinition,
  sectionId: FootprintsSectionId,
) => {
  if (sectionId === 'stamp') {
    return [
      `${missionDefinition.title} 미션을 직접 해보는 순간을 마음껏 누려 보세요.`,
      '지금 이 장면을 사진이나 짧은 메모로 함께 남겨두면 더 오래 돌아볼 수 있어요.',
    ];
  }

  if (sectionId === 'record') {
    return [
      `${missionDefinition.title}를 10초 안에 짧게 기록해 보세요.`,
      '작은 소리일수록 조용한 공간에서 또렷하게 남겨두는 편이 좋아요.',
    ];
  }

  return [
    `${missionDefinition.title}에 대한 마음을 짧게 녹음해 보세요.`,
    '말로 꺼내기 어려운 감정일수록 지금의 톤과 숨결로 남겨두면 나중에 큰 위로가 됩니다.',
  ];
};

const getMissionProgress = (
  footprintsState: FootprintsState,
  sectionId: FootprintsSectionId,
  missionId: string,
) => footprintsState.missions[sectionId].find(mission => mission.id === missionId) ?? null;

const getMissionIsAccessible = (
  lifecycleStatus: PetLifecycleStatus,
  sectionId: FootprintsSectionId,
  missionProgress: FootprintsMissionProgress | null,
) => {
  if (lifecycleStatus === 'BEFORE_FAREWELL') {
    return true;
  }

  if (sectionId === 'message') {
    return true;
  }

  return missionProgress?.completed ?? false;
};

const getMissionActionLabel = (
  sectionId: FootprintsSectionId,
  missionProgress: FootprintsMissionProgress | null,
  isOwner: boolean,
) => {
  if (sectionId === 'stamp') {
    if (missionProgress?.completed) {
      return '이미 완료한 미션이에요';
    }

    return isOwner ? '완료했어요' : '프로필 주인만 진행 가능해요';
  }

  if (!isOwner) {
    return '프로필 주인만 진행 가능해요';
  }

  return missionProgress?.recording ? '소리 다시 기록하기' : '소리 기록하기';
};

const getToastTimeout = (setToastMessage: (nextMessage: string | null) => void) =>
  setTimeout(() => {
    setToastMessage(null);
  }, 1800);

const getFootprintsNote = (lifecycleStatus: PetLifecycleStatus) => (
  lifecycleStatus === 'AFTER_FAREWELL'
    ? '긴급 대처 모드 이후에는,\n함께 남긴 발자국만 확인할 수 있어요'
    : '지금 남기는 작은 기록들이,\n나중에 오래 돌아볼 흔적이 돼요'
);

const showBlockedMicrophoneAlert = () => {
  Alert.alert('마이크 권한이 필요해요', '아이의 소리를 기록하려면 설정에서 마이크 권한을 허용해 주세요.', [
    { style: 'cancel', text: '닫기' },
    {
      onPress: () => {
        openAppSettings().catch(() => undefined);
      },
      text: '설정 열기',
    },
  ]);
};

const clampWaveformValue = (value: number) =>
  Math.max(0.16, Math.min(0.72, Number(value.toFixed(2))));

const normalizeMeteringToWaveformValue = (metering?: number) => {
  if (metering === undefined || Number.isNaN(metering)) {
    return 0.22;
  }

  const clampedMetering = Math.max(-60, Math.min(0, metering));
  const ratio = (clampedMetering + 60) / 60;

  return clampWaveformValue(0.16 + (ratio * 0.56));
};

const appendWaveformValue = (waveform: number[], nextValue: number) => {
  const nextWaveform = [...waveform, clampWaveformValue(nextValue)];

  return nextWaveform.slice(-waveformSeed.length);
};

const resolveRecordingFormat = (fileUri: string | null): 'MP3' | 'WAV' => {
  if (fileUri?.toLowerCase().endsWith('.mp3')) {
    return 'MP3';
  }

  return 'WAV';
};

const sanitizeRecordingPathSegment = (value: string) => (
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'item'
);

export function FootprintsScreen() {
  const insets = useSafeAreaInsets();
  const { openPreview, selectedPet } = useAppSessionStore();
  const lifecycleStatus = selectedPet?.lifecycleStatus ?? 'BEFORE_FAREWELL';
  const isOwner = selectedPet?.isOwner ?? true;
  const homePreviewRoute = resolveHomePreviewRoute(selectedPet);
  const bottomNavTabs = useMemo(
    () => getBottomNavTabs(lifecycleStatus),
    [lifecycleStatus],
  );
  const [isHydrating, setHydrating] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState<FootprintsSectionId>('stamp');
  const [footprintsState, setFootprintsState] = useState<FootprintsState | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCompletionBurstVisible, setCompletionBurstVisible] = useState(false);
  const [pendingRecordingMissionId, setPendingRecordingMissionId] = useState<string | null>(null);
  const [pendingRecordingSectionId, setPendingRecordingSectionId] = useState<FootprintsSectionId>('record');
  const [isRecordingSheetVisible, setRecordingSheetVisible] = useState(false);
  const [isRecordingCloseModalVisible, setRecordingCloseModalVisible] = useState(false);
  const [sheetStoredRecording, setSheetStoredRecording] = useState<FootprintsRecording | null>(null);
  const [draftRecording, setDraftRecording] = useState<FootprintsRecording | null>(null);
  const [isRecording, setRecording] = useState(false);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState(0);
  const [liveRecordingWaveform, setLiveRecordingWaveform] = useState<number[]>(defaultWaveform);
  const [isDraftPlaying, setDraftPlaying] = useState(false);
  const [draftPlaybackIndex, setDraftPlaybackIndex] = useState(0);
  const [playingMissionId, setPlayingMissionId] = useState<string | null>(null);
  const [detailPlaybackIndex, setDetailPlaybackIndex] = useState(0);
  const playbackTargetRef = useRef<'sheet' | string | null>(null);
  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer());
  const isRecordingRef = useRef(false);
  const liveRecordingWaveformRef = useRef<number[]>(defaultWaveform);
  const pendingRecordingSectionRef = useRef<FootprintsSectionId>('record');
  const pendingRecordingMissionIdRef = useRef<string | null>(null);
  const sheetRecordingRef = useRef<FootprintsRecording | null>(null);
  const missionRecordingRef = useRef<FootprintsRecording | null>(null);
  const finalizeRecordingRef = useRef<FinalizeRecordingHandler | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const nextFootprintsState = await readStoredFootprintsState(
        {
          inviteCode: selectedPet?.inviteCode ?? null,
          petId: selectedPet?.id ?? null,
        },
        lifecycleStatus,
      );

      if (!isMounted) {
        return;
      }

      setFootprintsState(nextFootprintsState);
      setHydrating(false);
    };

    hydrate().catch(() => {
      if (!isMounted) {
        return;
      }

      setFootprintsState(createFallbackFootprintsState());
      setHydrating(false);
    });

    return () => {
      isMounted = false;
    };
  }, [lifecycleStatus, selectedPet?.id, selectedPet?.inviteCode]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeout = getToastTimeout(setToastMessage);

    return () => {
      clearTimeout(timeout);
    };
  }, [toastMessage]);

  useEffect(() => {
    const audioRecorderPlayer = audioRecorderPlayerRef.current;

    audioRecorderPlayer.setSubscriptionDuration(0.1).catch(() => undefined);

    audioRecorderPlayer.addRecordBackListener((event: RecordBackType) => {
      const nextElapsedSec = Math.min(maxRecordingDurationSec, Math.max(0, event.currentPosition / 1000));
      const nextWaveform = appendWaveformValue(
        liveRecordingWaveformRef.current,
        normalizeMeteringToWaveformValue(event.currentMetering),
      );

      setRecordingElapsedSec(nextElapsedSec);
      liveRecordingWaveformRef.current = nextWaveform;
      setLiveRecordingWaveform(nextWaveform);

      if (isRecordingRef.current && nextElapsedSec >= maxRecordingDurationSec) {
        isRecordingRef.current = false;
        finalizeRecordingRef.current?.({
          autoStopped: true,
          durationSec: maxRecordingDurationSec,
          waveform: nextWaveform,
        }).catch(() => undefined);
      }
    });

    audioRecorderPlayer.addPlayBackListener((event: PlayBackType) => {
      if (event.isFinished) {
        playbackTargetRef.current = null;
        setDraftPlaying(false);
        setDraftPlaybackIndex(0);
        setPlayingMissionId(null);
        setDetailPlaybackIndex(0);

        return;
      }

      const playbackTarget = playbackTargetRef.current;

      if (playbackTarget === 'sheet') {
        const sheetRecording = sheetRecordingRef.current;

        if (!sheetRecording) {
          return;
        }

        const durationMs = Math.max(sheetRecording.durationSec * 1000, event.duration, 1);
        const nextIndex = Math.min(
          sheetRecording.waveform.length - 1,
          Math.max(0, Math.floor((event.currentPosition / durationMs) * sheetRecording.waveform.length)),
        );

        setDraftPlaybackIndex(nextIndex);
        return;
      }

      if (!playbackTarget) {
        return;
      }

      const missionRecording = missionRecordingRef.current;

      if (!missionRecording) {
        return;
      }

      const durationMs = Math.max(missionRecording.durationSec * 1000, event.duration, 1);
      const nextIndex = Math.min(
        missionRecording.waveform.length - 1,
        Math.max(0, Math.floor((event.currentPosition / durationMs) * missionRecording.waveform.length)),
      );

      setDetailPlaybackIndex(nextIndex);
    });

    return () => {
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.removePlayBackListener();
      audioRecorderPlayer.stopRecorder().catch(() => undefined);
      audioRecorderPlayer.stopPlayer().catch(() => undefined);
    };
  }, []);

  const activeMissionDefinitions = footprintsMissionDefinitions[activeSectionId];
  const selectedMissionDefinition = selectedMissionId
    ? activeMissionDefinitions.find(missionDefinition => missionDefinition.id === selectedMissionId) ?? null
    : null;
  const selectedMissionProgress = selectedMissionId && footprintsState
    ? getMissionProgress(footprintsState, activeSectionId, selectedMissionId)
    : null;
  const selectedMissionRecording = selectedMissionProgress?.recording ?? null;
  const visibleCompletedCount = footprintsState ? countCompletedFootprintsMissions(footprintsState) : 0;
  const topCountLabel = lifecycleStatus === 'AFTER_FAREWELL'
    ? `${String(visibleCompletedCount).padStart(2, '0')}개의 추억이 남았어요!`
    : `${String(visibleCompletedCount).padStart(2, '0')}개의 추억을 쌓았어요!`;
  const sheetEffectiveRecording = draftRecording ?? sheetStoredRecording;

  useEffect(() => {
    pendingRecordingMissionIdRef.current = pendingRecordingMissionId;
  }, [pendingRecordingMissionId]);

  useEffect(() => {
    pendingRecordingSectionRef.current = pendingRecordingSectionId;
  }, [pendingRecordingSectionId]);

  useEffect(() => {
    liveRecordingWaveformRef.current = liveRecordingWaveform;
  }, [liveRecordingWaveform]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    sheetRecordingRef.current = sheetEffectiveRecording;
  }, [sheetEffectiveRecording]);

  useEffect(() => {
    missionRecordingRef.current = selectedMissionRecording;
  }, [selectedMissionRecording]);

  const persistFootprintsState = (nextFootprintsState: FootprintsState) => {
    setFootprintsState(nextFootprintsState);

    if (!isOwner) {
      return;
    }

    writeStoredFootprintsState(
      {
        inviteCode: selectedPet?.inviteCode ?? null,
        petId: selectedPet?.id ?? null,
      },
      lifecycleStatus,
      nextFootprintsState,
    ).catch(() => undefined);
  };

  const applyFootprintsState = (
    updater: (current: FootprintsState) => FootprintsState,
  ) => {
    if (!footprintsState) {
      return;
    }

    persistFootprintsState(updater(footprintsState));
  };

  const stopActivePlayback = async () => {
    const audioRecorderPlayer = audioRecorderPlayerRef.current;

    playbackTargetRef.current = null;
    setDraftPlaying(false);
    setDraftPlaybackIndex(0);
    setPlayingMissionId(null);
    setDetailPlaybackIndex(0);

    await audioRecorderPlayer.stopPlayer().catch(() => undefined);
  };

  const finalizeRecording = async (options?: {
    autoStopped?: boolean;
    durationSec?: number;
    waveform?: number[];
  }) => {
    const recordedFileUri = await audioRecorderPlayerRef.current.stopRecorder().catch(() => null);
    if (!recordedFileUri) {
      setRecording(false);
      setToastMessage('음성 파일을 저장하지 못했어요. 다시 시도해 주세요.');

      return null;
    }

    const nextDurationSec = Math.min(
      maxRecordingDurationSec,
      Math.max(1, Number((options?.durationSec ?? recordingElapsedSec).toFixed(1))),
    );
    const nextRecording: FootprintsRecording = {
      durationSec: nextDurationSec,
      fileUri: recordedFileUri,
      format: resolveRecordingFormat(recordedFileUri),
      sizeBytes: Math.max(1, Math.round(nextDurationSec * 144000)),
      updatedAt: new Date().toISOString(),
      waveform: [...(options?.waveform ?? liveRecordingWaveformRef.current)],
    };

    setRecording(false);
    setDraftRecording(nextRecording);
    setRecordingElapsedSec(nextDurationSec);

    if (options?.autoStopped) {
      setToastMessage('최대 시간(10초)에 도달했습니다');
    }

    return nextRecording;
  };
  finalizeRecordingRef.current = finalizeRecording;

  const resetRecordingSheetState = () => {
    setRecordingSheetVisible(false);
    setRecordingCloseModalVisible(false);
    setSheetStoredRecording(null);
    setDraftRecording(null);
    setRecording(false);
    setRecordingElapsedSec(0);
    setLiveRecordingWaveform(defaultWaveform);
    setDraftPlaying(false);
    setDraftPlaybackIndex(0);
    setPendingRecordingMissionId(null);
    setPendingRecordingSectionId('record');
  };

  const getRecordingTargetPath = (missionId: string) => {
    const petIdentity = selectedPet?.id !== null && selectedPet?.id !== undefined
      ? `pet-${selectedPet.id}`
      : `invite-${sanitizeRecordingPathSegment(selectedPet?.inviteCode ?? 'anonymous')}`;
    const fileName = `footprints-${petIdentity}-${sanitizeRecordingPathSegment(missionId)}.${Platform.OS === 'ios' ? 'm4a' : 'mp4'}`;

    if (Platform.OS === 'ios') {
      return fileName;
    }

    return `/data/user/0/com.pawever.app/files/${fileName}`;
  };

  const discardRecordingSheet = async () => {
    isRecordingRef.current = false;
    await audioRecorderPlayerRef.current.stopRecorder().catch(() => undefined);
    await stopActivePlayback();
    resetRecordingSheetState();
  };

  const handleBack = () => {
    if (isRecordingSheetVisible) {
      if (isRecording || sheetEffectiveRecording) {
        setRecordingCloseModalVisible(true);
        return;
      }

      stopActivePlayback().catch(() => undefined);
      resetRecordingSheetState();
      return;
    }

    if (selectedMissionId) {
      stopActivePlayback().catch(() => undefined);
      setSelectedMissionId(null);
      return;
    }

    openPreview(homePreviewRoute);
  };

  const handleMarkStampMissionCompleted = () => {
    if (!selectedMissionId || !isOwner || !footprintsState) {
      return;
    }

    applyFootprintsState(current => ({
      ...current,
      missions: {
        ...current.missions,
        stamp: current.missions.stamp.map(mission => (
          mission.id === selectedMissionId
            ? { ...mission, completed: true }
            : mission
        )),
      },
    }));

    setCompletionBurstVisible(true);
    setTimeout(() => {
      setCompletionBurstVisible(false);
    }, 700);
  };

  const openRecordingSheet = async (missionId: string, sectionId: FootprintsSectionId) => {
    if (!footprintsState) {
      return;
    }

    const missionProgress = getMissionProgress(footprintsState, sectionId, missionId);

    await stopActivePlayback();
    setPendingRecordingMissionId(missionId);
    setPendingRecordingSectionId(sectionId);
    setSheetStoredRecording(missionProgress?.recording ?? null);
    setDraftRecording(null);
    setRecording(false);
    setRecordingElapsedSec(missionProgress?.recording?.durationSec ?? 0);
    setLiveRecordingWaveform(missionProgress?.recording?.waveform ?? defaultWaveform);
    setDraftPlaying(false);
    setDraftPlaybackIndex(0);
    setRecordingSheetVisible(true);
  };

  const handleOpenRecordAction = async () => {
    if (!selectedMissionId || !isOwner || !footprintsState) {
      return;
    }

    if (footprintsState.microphonePermission !== 'granted') {
      const permissionResult = await requestMicrophonePermission();
      persistFootprintsState({
        ...footprintsState,
        microphonePermission: permissionResult.granted ? 'granted' : 'denied',
      });

      if (!permissionResult.granted) {
        setToastMessage('마이크 권한을 허용하면 소리를 기록할 수 있어요.');

        if (permissionResult.blocked) {
          showBlockedMicrophoneAlert();
        }

        return;
      }
    }

    await openRecordingSheet(selectedMissionId, activeSectionId);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      isRecordingRef.current = false;
      await finalizeRecording();

      return;
    }

    if (!pendingRecordingMissionId) {
      setToastMessage('어떤 미션을 녹음할지 먼저 선택해 주세요.');
      return;
    }

    await stopActivePlayback();
    setDraftRecording(null);
    setDraftPlaying(false);
    setDraftPlaybackIndex(0);
    setRecordingElapsedSec(0);
    setLiveRecordingWaveform(defaultWaveform);
    liveRecordingWaveformRef.current = defaultWaveform;
    isRecordingRef.current = true;
    setRecording(true);

    const recorderUri = await audioRecorderPlayerRef.current
      .startRecorder(getRecordingTargetPath(pendingRecordingMissionId), undefined, true)
      .catch(() => null);

    if (!recorderUri) {
      isRecordingRef.current = false;
      setRecording(false);
      setToastMessage('음성 녹음을 시작하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handlePersistRecording = async (markCompleted: boolean) => {
    if (!pendingRecordingMissionId || !footprintsState) {
      return;
    }

    const recordingToPersist = isRecording
      ? await finalizeRecording()
      : sheetEffectiveRecording;

    if (!recordingToPersist) {
      return;
    }

    await stopActivePlayback();

    applyFootprintsState(current => ({
      ...current,
      missions: {
        ...current.missions,
        [pendingRecordingSectionId]: current.missions[pendingRecordingSectionId].map(mission => (
          mission.id === pendingRecordingMissionId
            ? {
              ...mission,
              completed: markCompleted ? true : mission.completed,
              recording: recordingToPersist,
            }
            : mission
        )),
      },
    }));

    resetRecordingSheetState();
  };

  const handleCloseRecordingSheet = () => {
    if (isRecording || sheetEffectiveRecording) {
      setRecordingCloseModalVisible(true);
      return;
    }

    stopActivePlayback().catch(() => undefined);
    resetRecordingSheetState();
  };

  const handleToggleMissionPlayback = async () => {
    if (!selectedMissionDefinition) {
      return;
    }

    if (playingMissionId === selectedMissionDefinition.id) {
      await stopActivePlayback();
      return;
    }

    if (!selectedMissionRecording?.fileUri) {
      setToastMessage('재생할 음성 파일이 아직 없어요.');
      return;
    }

    await stopActivePlayback();
    playbackTargetRef.current = selectedMissionDefinition.id;
    setPlayingMissionId(selectedMissionDefinition.id);
    setDetailPlaybackIndex(0);

    const startedPlayer = await audioRecorderPlayerRef.current.startPlayer(selectedMissionRecording.fileUri).catch(() => null);

    if (!startedPlayer) {
      playbackTargetRef.current = null;
      setPlayingMissionId(null);
      setToastMessage('음성을 재생하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handleToggleSheetPlayback = async () => {
    if (isRecording) {
      return;
    }

    if (isDraftPlaying) {
      await stopActivePlayback();
      return;
    }

    if (!sheetEffectiveRecording?.fileUri) {
      setToastMessage('재생할 음성 파일이 아직 없어요.');
      return;
    }

    await stopActivePlayback();
    playbackTargetRef.current = 'sheet';
    setDraftPlaying(true);
    setDraftPlaybackIndex(0);

    const startedPlayer = await audioRecorderPlayerRef.current.startPlayer(sheetEffectiveRecording.fileUri).catch(() => null);

    if (!startedPlayer) {
      playbackTargetRef.current = null;
      setDraftPlaying(false);
      setToastMessage('음성을 재생하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const renderWaveform = (
    waveform: number[],
    activeIndex: number,
    accentColor: string,
  ) => (
    <View style={styles.waveformRow}>
      {waveform.map((heightRatio, index) => {
        const waveformBarStyle = {
          backgroundColor: index <= activeIndex ? accentColor : '#D9D5D0',
          height: 44 * heightRatio,
        };

        return (
          <View
            key={`${heightRatio}-${index}`}
            style={[styles.waveformBar, waveformBarStyle]}
          />
        );
      })}
    </View>
  );

  const renderMissionGrid = () => (
    <>
      <View style={styles.countBlock}>
        <Text style={styles.countLabel}>
          <Text style={styles.countLabelAccent}>{topCountLabel.slice(0, 2)}</Text>
          {topCountLabel.slice(2)}
        </Text>
      </View>

      <View style={styles.segmentedControl}>
        {sectionLabels.map(section => {
          const isActive = section.id === activeSectionId;

          return (
            <Pressable
              key={section.id}
              onPress={() => {
                setActiveSectionId(section.id);
                setSelectedMissionId(null);
              }}
              style={[styles.segmentedButton, isActive ? styles.segmentedButtonActive : null]}
            >
              <Text style={[styles.segmentedButtonLabel, isActive ? styles.segmentedButtonLabelActive : null]}>
                {section.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {activeMissionDefinitions.map(missionDefinition => {
          const missionProgress = footprintsState
            ? getMissionProgress(footprintsState, activeSectionId, missionDefinition.id)
            : null;
          const isAccessible = getMissionIsAccessible(lifecycleStatus, activeSectionId, missionProgress);
          const isCompleted = missionProgress?.completed ?? false;

          return (
            <Pressable
              key={missionDefinition.id}
              disabled={!isAccessible}
              onPress={() => setSelectedMissionId(missionDefinition.id)}
              style={styles.gridItem}
            >
              <View
                style={[
                  styles.gridIconCircle,
                  isAccessible ? styles.gridIconCircleDefault : styles.gridIconCirclePlaceholder,
                  isCompleted ? styles.gridIconCircleCompleted : null,
                ]}
              >
                <Text style={[styles.gridIconLabel, !isAccessible ? styles.gridIconLabelPlaceholder : null]}>
                  {isCompleted ? '🐾' : missionDefinition.emoji}
                </Text>
              </View>
              <Text style={[styles.gridTitle, !isAccessible ? styles.gridTitlePlaceholder : null]}>
                {missionDefinition.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.footnote}>{getFootprintsNote(lifecycleStatus)}</Text>
    </>
  );

  const renderMissionDetail = () => {
    if (!selectedMissionDefinition) {
      return null;
    }

    const descriptionLines = getMissionDescriptionLines(selectedMissionDefinition, activeSectionId);
    const isCompleted = selectedMissionProgress?.completed ?? false;
    const canEdit = isOwner && activeSectionId !== 'stamp';
    const showListenButton = Boolean(selectedMissionRecording);
    const detailActionLabel = getMissionActionLabel(activeSectionId, selectedMissionProgress, isOwner);
    const canCompleteStamp = activeSectionId === 'stamp' && isOwner && !isCompleted;

    return (
      <>
        <View style={styles.detailIllustrationWrap}>
          <View
            style={[
              styles.detailIllustrationCircle,
              isCompleted ? styles.detailIllustrationCircleCompleted : null,
            ]}
          >
            <Text style={styles.detailIllustrationEmoji}>
              {isCompleted ? '🐾' : selectedMissionDefinition.emoji}
            </Text>
          </View>
        </View>

        <Text style={styles.detailTitle}>{selectedMissionDefinition.title}</Text>
        <Text style={styles.detailSubtitle}>{selectedMissionDefinition.subtitle}</Text>

        <View style={styles.detailDescriptionCard}>
          {descriptionLines.map(line => (
            <Text key={line} style={styles.detailDescriptionLine}>
              {line}
            </Text>
          ))}
        </View>

        {showListenButton ? (
          <View style={styles.listenCard}>
            <Pressable
              onPress={() => {
                handleToggleMissionPlayback().catch(() => undefined);
              }}
              style={styles.listenButton}
            >
              <Text style={styles.listenButtonLabel}>
                {playingMissionId === selectedMissionDefinition.id ? '듣기 멈추기' : '소리 듣기'}
              </Text>
            </Pressable>
            {selectedMissionRecording ? renderWaveform(selectedMissionRecording.waveform, detailPlaybackIndex, '#F39D42') : null}
          </View>
        ) : null}

        <Pressable
          disabled={activeSectionId === 'stamp' ? !canCompleteStamp : !canEdit}
          onPress={() => {
            if (activeSectionId === 'stamp') {
              handleMarkStampMissionCompleted();
              return;
            }

            handleOpenRecordAction().catch(() => undefined);
          }}
          style={[
            styles.detailPrimaryButton,
            (activeSectionId === 'stamp' ? !canCompleteStamp : !canEdit)
              ? styles.detailPrimaryButtonDisabled
              : null,
          ]}
        >
          <Text style={[
            styles.detailPrimaryButtonLabel,
            (activeSectionId === 'stamp' ? !canCompleteStamp : !canEdit)
              ? styles.detailPrimaryButtonLabelDisabled
              : null,
          ]}>
            {detailActionLabel}
          </Text>
        </Pressable>
      </>
    );
  };

  if (isHydrating || !footprintsState) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />
        <Text style={styles.loadingLabel}>발자국 정보를 불러오고 있어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110, paddingTop: insets.top + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonLabel}>{'<'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>발자국 남기기</Text>
          <View style={styles.backButton} />
        </View>

        {selectedMissionId ? renderMissionDetail() : renderMissionGrid()}
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomNavRow}>
          {bottomNavTabs.map(tab => {
            const isActive = tab.id === 'footprints';

            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  if (tab.id === 'home') {
                    openPreview(homePreviewRoute);
                    return;
                  }

                  if (tab.id === 'explore') {
                    openPreview('farewellPreview');
                  }
                }}
                style={styles.bottomNavItem}
              >
                <View style={[styles.bottomNavIconFrame, isActive ? styles.bottomNavIconFrameActive : null]}>
                  <Image
                    resizeMode="contain"
                    source={{ uri: tab.iconUri }}
                    style={[
                      styles.bottomNavIconImage,
                      isActive ? styles.bottomNavIconImageActive : styles.bottomNavIconImageInactive,
                    ]}
                  />
                </View>
                <Text style={[styles.bottomNavLabel, isActive ? styles.bottomNavLabelActive : styles.bottomNavLabelInactive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {toastMessage ? (
        <View style={[styles.toast, { bottom: insets.bottom + 96 }]}>
          <Text style={styles.toastLabel}>{toastMessage}</Text>
        </View>
      ) : null}

      {isCompletionBurstVisible ? (
        <View style={styles.completionBurstOverlay} pointerEvents="none">
          <View style={styles.completionBurstBadge}>
            <Text style={styles.completionBurstEmoji}>🐾</Text>
          </View>
        </View>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={handleCloseRecordingSheet}
        statusBarTranslucent
        transparent
        visible={isRecordingSheetVisible}
      >
        <View style={styles.sheetRoot}>
          <Pressable onPress={handleCloseRecordingSheet} style={styles.modalOverlay} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>음성 녹음</Text>
            <Text style={styles.sheetSubtitle}>
              음성은 최대 10초까지만 가능해요.{'\n'}
              완료 버튼을 눌러야 저장되니, 꼭 완료 버튼을 눌러주세요!
            </Text>

            <Pressable onPress={handleToggleRecording} style={[styles.recordButtonCircle, isRecording ? styles.recordButtonCircleActive : null]}>
              {isRecording ? (
                <View style={styles.recordStopSquare} />
              ) : (
                <Text style={styles.recordMicEmoji}>🎤</Text>
              )}
            </Pressable>

            <View style={styles.sheetWaveformRow}>
              <Pressable
                disabled={!sheetEffectiveRecording || isRecording}
                onPress={() => {
                  handleToggleSheetPlayback().catch(() => undefined);
                }}
                style={[
                  styles.waveformPlayButton,
                  !sheetEffectiveRecording || isRecording ? styles.waveformPlayButtonDisabled : null,
                ]}
              >
                <Text style={styles.waveformPlayButtonLabel}>
                  {isDraftPlaying ? '■' : '▶'}
                </Text>
              </Pressable>
              {renderWaveform(
                isRecording
                  ? liveRecordingWaveform
                  : (sheetEffectiveRecording?.waveform ?? defaultWaveform),
                isRecording
                  ? Math.max(0, Math.floor((recordingElapsedSec / maxRecordingDurationSec) * waveformSeed.length) - 1)
                  : draftPlaybackIndex,
                '#F39D42',
              )}
            </View>

            <Text style={styles.sheetTimerLabel}>{`${Math.max(0, recordingElapsedSec).toFixed(1)}초 / 10초`}</Text>

            <View style={styles.sheetButtonRow}>
              <Pressable onPress={handleCloseRecordingSheet} style={[styles.sheetSecondaryButton, styles.sheetHalfButton]}>
                <Text style={styles.sheetSecondaryButtonLabel}>닫기</Text>
              </Pressable>
              <Pressable
                disabled={!sheetEffectiveRecording}
                onPress={() => {
                  handlePersistRecording(true).catch(() => undefined);
                }}
                style={[
                  styles.sheetPrimaryButton,
                  styles.sheetHalfButton,
                  !sheetEffectiveRecording ? styles.sheetPrimaryButtonDisabled : null,
                ]}
              >
                <Text style={styles.sheetPrimaryButtonLabel}>완료</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setRecordingCloseModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isRecordingCloseModalVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setRecordingCloseModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>음성녹음을 종료하시겠어요?</Text>
            <Text style={styles.modalDescription}>
              지금 창을 닫으면, 기록한 음성 파일이 저장되지 않을 수 있습니다.
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => {
                  discardRecordingSheet().catch(() => undefined);
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonSecondaryLabel}>닫기</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  handlePersistRecording(false).catch(() => undefined);
                }}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonPrimaryLabel}>저장하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#F6F4F1',
    flex: 1,
  },
  loadingRoot: {
    alignItems: 'center',
    backgroundColor: '#F6F4F1',
    flex: 1,
    justifyContent: 'center',
  },
  loadingLabel: {
    color: '#5E4A43',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -20,
    marginTop: -4,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  backButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  backButtonLabel: {
    color: '#B6ADA8',
    fontFamily: 'sans-serif',
    fontSize: 28,
    lineHeight: 28,
  },
  headerTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  countBlock: {
    marginBottom: 16,
    marginTop: 18,
  },
  countLabel: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    textAlign: 'center',
  },
  countLabelAccent: {
    color: '#FF7A00',
  },
  segmentedControl: {
    backgroundColor: '#EDE9E4',
    borderRadius: 999,
    flexDirection: 'row',
    marginBottom: 18,
    padding: 4,
  },
  segmentedButton: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  segmentedButtonActive: {
    backgroundColor: '#F6A84B',
  },
  segmentedButtonLabel: {
    color: '#B2AAA4',
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: '800',
  },
  segmentedButtonLabelActive: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 22,
  },
  gridItem: {
    alignItems: 'center',
    gap: 8,
    width: '30.5%',
  },
  gridIconCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  gridIconCircleDefault: {
    backgroundColor: '#FFFFFF',
  },
  gridIconCirclePlaceholder: {
    backgroundColor: '#E5E2DE',
  },
  gridIconCircleCompleted: {
    backgroundColor: '#FFF0BF',
    borderColor: '#F39D42',
    borderWidth: 3,
  },
  gridIconLabel: {
    fontSize: 38,
  },
  gridIconLabelPlaceholder: {
    opacity: 0.25,
  },
  gridTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  gridTitlePlaceholder: {
    color: '#B6B0AB',
  },
  footnote: {
    color: '#A0968E',
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 28,
    paddingBottom: 12,
    textAlign: 'center',
  },
  detailIllustrationWrap: {
    alignItems: 'center',
    marginTop: 26,
  },
  detailIllustrationCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 84,
    height: 168,
    justifyContent: 'center',
    width: 168,
  },
  detailIllustrationCircleCompleted: {
    backgroundColor: '#FFF0BF',
    borderColor: '#F39D42',
    borderWidth: 4,
  },
  detailIllustrationEmoji: {
    fontSize: 74,
  },
  detailTitle: {
    color: '#FF7A00',
    fontFamily: 'sans-serif',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    marginTop: 26,
    textAlign: 'center',
  },
  detailSubtitle: {
    color: '#A49086',
    fontFamily: 'sans-serif',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  detailDescriptionCard: {
    backgroundColor: '#F0EEEA',
    borderRadius: 18,
    gap: 10,
    marginTop: 26,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  detailDescriptionLine: {
    color: '#5F4C44',
    fontFamily: 'sans-serif',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  listenCard: {
    gap: 12,
    marginTop: 20,
  },
  listenButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF6E8',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
  },
  listenButtonLabel: {
    color: '#F39D42',
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: '800',
  },
  waveformRow: {
    alignItems: 'flex-end',
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 44,
  },
  waveformBar: {
    borderRadius: 999,
    width: 4,
  },
  detailPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#F6A84B',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 50,
  },
  detailPrimaryButtonDisabled: {
    backgroundColor: '#D6D2CE',
  },
  detailPrimaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  detailPrimaryButtonLabelDisabled: {
    color: '#8D8781',
  },
  bottomNav: {
    backgroundColor: '#EFECE8',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  bottomNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  bottomNavIconFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 28,
  },
  bottomNavIconFrameActive: {
    backgroundColor: '#FFE7C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  bottomNavIconImage: {
    height: 20,
    width: 20,
  },
  bottomNavIconImageActive: {
    tintColor: '#F2A03B',
  },
  bottomNavIconImageInactive: {
    tintColor: '#C9C4BF',
  },
  bottomNavLabel: {
    fontFamily: 'sans-serif',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomNavLabelActive: {
    color: '#F2A03B',
  },
  bottomNavLabelInactive: {
    color: '#B9B4AF',
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: 'rgba(66, 48, 42, 0.92)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    position: 'absolute',
  },
  toastLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: '700',
  },
  completionBurstOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  completionBurstBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 240, 191, 0.95)',
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  completionBurstEmoji: {
    fontSize: 40,
  },
  modalRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  permissionCard: {
    backgroundColor: '#FBFAF8',
    borderRadius: 18,
    overflow: 'hidden',
    width: '100%',
  },
  permissionTitle: {
    color: '#1D1D1B',
    fontFamily: 'sans-serif',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    textAlign: 'center',
  },
  permissionDescription: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 15,
    lineHeight: 22,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    textAlign: 'center',
  },
  permissionButtonRow: {
    borderTopColor: '#E1E0DE',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  permissionButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
  },
  permissionButtonLabel: {
    color: '#007AFF',
    fontFamily: 'sans-serif',
    fontSize: 19,
    fontWeight: '700',
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FBFAF8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 14,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#C9C4BF',
    borderRadius: 999,
    height: 4,
    width: 70,
  },
  sheetTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: '#A58E84',
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  recordButtonCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F7F1DD',
    borderRadius: 100,
    height: 200,
    justifyContent: 'center',
    marginTop: 8,
    width: 200,
  },
  recordButtonCircleActive: {
    backgroundColor: '#F6A84B',
  },
  recordMicEmoji: {
    fontSize: 86,
  },
  recordStopSquare: {
    backgroundColor: '#F7F1DD',
    borderRadius: 14,
    height: 76,
    width: 76,
  },
  sheetWaveformRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  waveformPlayButton: {
    alignItems: 'center',
    backgroundColor: '#F39D42',
    borderRadius: 12,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  waveformPlayButtonDisabled: {
    backgroundColor: '#D2CECA',
  },
  waveformPlayButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '800',
  },
  sheetTimerLabel: {
    color: '#8A7A72',
    fontFamily: 'sans-serif',
    fontSize: 13,
    textAlign: 'center',
  },
  sheetButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  sheetHalfButton: {
    flex: 1,
  },
  sheetSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D4D0CB',
    borderRadius: 14,
    borderWidth: 1.4,
    justifyContent: 'center',
    minHeight: 50,
  },
  sheetSecondaryButtonLabel: {
    color: '#9A918B',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#F6A84B',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 50,
  },
  sheetPrimaryButtonDisabled: {
    backgroundColor: '#D6D2CE',
  },
  sheetPrimaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
  },
  modalCard: {
    backgroundColor: '#FBFAF8',
    borderRadius: 18,
    gap: 16,
    maxWidth: 336,
    paddingHorizontal: 20,
    paddingVertical: 22,
    width: '100%',
  },
  modalTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
  modalDescription: {
    color: '#857068',
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#F6A84B',
  },
  modalButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E1DB',
    borderWidth: 1.4,
  },
  modalButtonPrimaryLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
  },
  modalButtonSecondaryLabel: {
    color: '#8D827C',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
  },
});
