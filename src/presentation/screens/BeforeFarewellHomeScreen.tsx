import { useEffect, useRef, useState } from 'react';

import { ActionSheetIOS, Alert, Image, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { type Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PetSummary } from '../../core/entities/pet';
import { openAppSettings, requestCameraPermission, requestPhotoLibraryPermission } from '../../infrastructure/native/permissions';
import { getMyPets } from '../../infrastructure/repositories/petRepository';
import { readStoredBeforeFarewellHomeSnapshot, writeStoredBeforeFarewellHomeSnapshot } from '../../infrastructure/storage/beforeFarewellHomeStorage';
import { computeFarewellPreviewProgress, readStoredFarewellPreviewState } from '../../infrastructure/storage/farewellPreviewStorage';
import { countCompletedFootprintsMissions, readStoredFootprintsState } from '../../infrastructure/storage/footprintsStorage';
import { readStoredAddedInvitePets } from '../../infrastructure/storage/mockInvitePetsStorage';
import { resolvePetEmojiAssetUri } from '../../shared/assets/petEmojiAssets';
import { totalFootprintsMissionCount } from '../../shared/data/footprintsData';
import { SignupCompletionLoadingScreen } from '../components/SignupCompletionLoadingScreen';
import { useAppSessionStore } from '../stores/AppSessionStore';

const pawMarkAssetUri = 'https://www.figma.com/api/mcp/asset/51adb77a-4b60-4189-9655-eaffb6a37860';
const footprintsCardBackgroundAssetUri = 'https://www.figma.com/api/mcp/asset/8c7df408-88d0-492c-a4c7-8116865f7209';
const memorialStarsAssetUri = 'https://www.figma.com/api/mcp/asset/8d7fb7c8-b5a6-430c-80e9-5bfb232538db';
const funeralSearchAssetUri = 'https://www.figma.com/api/mcp/asset/7371051e-9511-404e-9e48-135f7302141d';
const funeralSearchHighlightAssetUri = 'https://www.figma.com/api/mcp/asset/0845a960-0364-4a69-9581-43817bae6a1f';
const reviewAssetUri = 'https://www.figma.com/api/mcp/asset/4350f5bd-ce1c-4b68-b8c8-322f700453a3';
const reviewModalSendAssetUri = 'https://www.figma.com/api/mcp/asset/a01ce908-e8c9-4dc3-97c9-030e30bf4f32';
const inactiveHomeAssetUri = 'https://www.figma.com/api/mcp/asset/9a1de914-5682-454b-8955-f7202bdb9562';
const inactiveFootprintAssetUri = 'https://www.figma.com/api/mcp/asset/588ce4ea-6b6d-49e9-84b9-dae34bc703c6';
const inactiveExploreAssetUri = 'https://www.figma.com/api/mcp/asset/85190583-627a-4f2c-ba44-b00dfb3fe342';
const inactiveSettingsAssetUri = 'https://www.figma.com/api/mcp/asset/00a9a881-da45-491e-a25e-8eabe68ce7de';

const customPetPhotoBackgroundColor = '#EFE7DE';
const dayMs = 1000 * 60 * 60 * 24;
const profileCropStageSize = 308;
const profileCropCircleDiameter = 220;
const defaultProfileCropDiameterRatio = profileCropCircleDiameter / profileCropStageSize;
const minProfileCropDiameter = 120;
const petSwitchScrollableListThreshold = 5;
const reviewImageSlotCount = 2;
const reviewImageSlotWidth = 170;
const reviewImageSlotGap = 15;
const minReviewTextInputHeight = 16;
const maxReviewTextInputHeight = 176;

type PetSwitchProfileItem = {
  detail: string;
  id: string;
  isActive: boolean;
  kind: 'mock' | 'server';
  name: string;
  pet: PetSummary | null;
  profileImageUri: string | null;
  statusLabel: string;
};

type BottomNavTabId = 'explore' | 'footprints' | 'home' | 'settings';

const bottomNavTabs: Array<{
  iconUri: string;
  id: BottomNavTabId;
  label: string;
}> = [
  { iconUri: inactiveHomeAssetUri, id: 'home', label: '홈' },
  { iconUri: inactiveFootprintAssetUri, id: 'footprints', label: '발자국' },
  { iconUri: inactiveExploreAssetUri, id: 'explore', label: '살펴보기' },
  { iconUri: inactiveSettingsAssetUri, id: 'settings', label: '설정' },
];

const addedPetSwitchProfiles: PetSwitchProfileItem[] = [
  {
    detail: '코리안 숏헤어/남자',
    id: 'added-1',
    isActive: false,
    kind: 'mock',
    name: '심콩이',
    pet: null,
    profileImageUri: null,
    statusLabel: '추억한 지 24일',
  },
  {
    detail: '종/성별',
    id: 'added-2',
    isActive: false,
    kind: 'mock',
    name: '반려동물 이름',
    pet: null,
    profileImageUri: null,
    statusLabel: '긴급 대처 모드',
  },
  {
    detail: '종/성별',
    id: 'added-3',
    isActive: false,
    kind: 'mock',
    name: '반려동물 이름',
    pet: null,
    profileImageUri: null,
    statusLabel: '추억한 지 24일',
  },
  {
    detail: '종/성별',
    id: 'added-4',
    isActive: false,
    kind: 'mock',
    name: '반려동물 이름',
    pet: null,
    profileImageUri: null,
    statusLabel: '추억한 지 24일',
  },
];

const beforeFarewellHomeOnboardingSteps = [
  {
    bodyLines: ['긴급 대처 모드로 전환 해주세요.', '계획대로 진행하실 수 있도록 도와드려요.'],
    id: 'emergency',
    title: '혹시, 아이가 무지개 다리를 건너게 되면',
  },
  {
    bodyLines: ['다른 반려인들도 보는 사진이에요', '설정 > 정보 수정하기에서 언제든 바꿀 수 있어요'],
    id: 'profile',
    title: '먼저, 우리 아이의 사진을 등록해주세요!',
  },
];

type PetAvatarProps = {
  backgroundColor?: string | null;
  cropCenterXRatio?: number;
  cropCenterYRatio?: number;
  cropDiameterRatio?: number;
  imageUri: string;
  imageHeight?: number;
  imageWidth?: number;
  isCustomPhoto?: boolean;
  offsetXRatio?: number;
  offsetYRatio?: number;
  size: number;
};

const calculateDaysTogether = (birthDate: string | null) => {
  if (!birthDate) {
    return 1346;
  }

  const parsed = new Date(birthDate);

  if (Number.isNaN(parsed.getTime())) {
    return 1346;
  }

  return Math.max(1, Math.floor((Date.now() - parsed.getTime()) / dayMs));
};

const clampCropOffsetRatio = (value: number) => Math.min(1, Math.max(-1, value));
const clampUnitRatio = (value: number) => Math.min(1, Math.max(0, value));

const showBlockedPermissionAlert = (title: string, message: string) => {
  Alert.alert(title, message, [
    { style: 'cancel', text: '닫기' },
    {
      onPress: () => {
        openAppSettings().catch(() => undefined);
      },
      text: '설정 열기',
    },
  ]);
};

const showNativeImageSourceActionSheet = ({
  onAlbumPress,
  onCameraPress,
  onCancel,
}: {
  onAlbumPress: () => void | Promise<void>;
  onCameraPress: () => void | Promise<void>;
  onCancel?: () => void;
}) => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  ActionSheetIOS.showActionSheetWithOptions(
    {
      cancelButtonIndex: 0,
      options: ['취소', '앨범', '카메라'],
    },
    (buttonIndex) => {
      if (buttonIndex === 1) {
        Promise.resolve(onAlbumPress()).catch(() => undefined);
        return;
      }

      if (buttonIndex === 2) {
        Promise.resolve(onCameraPress()).catch(() => undefined);
        return;
      }

      onCancel?.();
    },
  );

  return true;
};

const getStageImageRect = (imageWidth: number, imageHeight: number, stageSize: number) => {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return {
      height: stageSize,
      left: 0,
      top: 0,
      width: stageSize,
    };
  }

  const aspectRatio = imageWidth / imageHeight;

  if (aspectRatio >= 1) {
    const width = stageSize * aspectRatio;

    return {
      height: stageSize,
      left: (stageSize - width) / 2,
      top: 0,
      width,
    };
  }

  const height = stageSize / aspectRatio;

  return {
    height,
    left: 0,
    top: (stageSize - height) / 2,
    width: stageSize,
  };
};

function PetAvatar({
  backgroundColor,
  cropCenterXRatio = 0.5,
  cropCenterYRatio = 0.5,
  cropDiameterRatio = defaultProfileCropDiameterRatio,
  imageUri,
  imageHeight = 0,
  imageWidth = 0,
  isCustomPhoto = false,
  offsetXRatio = 0,
  offsetYRatio = 0,
  size,
}: PetAvatarProps) {
  const avatarContainerStyle = {
    backgroundColor: backgroundColor ?? '#F3F3F1',
    borderRadius: size / 2,
    height: size,
    width: size,
  };

  if (isCustomPhoto && imageWidth > 0 && imageHeight > 0) {
    const imageRect = getStageImageRect(imageWidth, imageHeight, profileCropStageSize);
    const cropDiameter = profileCropStageSize * clampUnitRatio(cropDiameterRatio || defaultProfileCropDiameterRatio);
    const cropCenterX = profileCropStageSize * clampUnitRatio(cropCenterXRatio);
    const cropCenterY = profileCropStageSize * clampUnitRatio(cropCenterYRatio);
    const cropLeft = cropCenterX - (cropDiameter / 2);
    const cropTop = cropCenterY - (cropDiameter / 2);
    const scale = size / cropDiameter;
    const croppedImageStyle = {
      height: imageRect.height * scale,
      left: (imageRect.left - cropLeft) * scale,
      position: 'absolute' as const,
      top: (imageRect.top - cropTop) * scale,
      width: imageRect.width * scale,
    };

    return (
      <View style={[styles.petAvatarCircle, avatarContainerStyle]}>
        <Image source={{ uri: imageUri }} style={croppedImageStyle} />
      </View>
    );
  }

  if (isCustomPhoto) {
    const imageSize = size * 1.46;
    const maxTravel = ((imageSize - size) / 2);
    const legacyImageStyle = {
      height: imageSize,
      left: (size - imageSize) / 2 + (clampCropOffsetRatio(offsetXRatio) * maxTravel),
      position: 'absolute' as const,
      top: (size - imageSize) / 2 + (clampCropOffsetRatio(offsetYRatio) * maxTravel),
      width: imageSize,
    };

    return (
      <View style={[styles.petAvatarCircle, avatarContainerStyle]}>
        <Image source={{ uri: imageUri }} style={legacyImageStyle} />
      </View>
    );
  }

  const illustrationSize = size * 0.76;
  const illustrationStyle = {
    height: illustrationSize,
    width: illustrationSize,
  };

  return (
    <View style={[styles.petAvatarCircle, avatarContainerStyle]}>
      <Image resizeMode="contain" source={{ uri: imageUri }} style={illustrationStyle} />
    </View>
  );
}

const getPetGenderLabel = (gender: string | null | undefined) => {
  if (!gender) {
    return '성별';
  }

  const normalizedGender = gender.toUpperCase();

  if (normalizedGender.includes('MALE')) {
    return '남자';
  }

  if (normalizedGender.includes('FEMALE')) {
    return '여자';
  }

  return '성별';
};

const getPetSwitchStatusLabel = (pet: PetSummary) => {
  if (pet.lifecycleStatus === 'BEFORE_FAREWELL') {
    return `함께한 지 ${calculateDaysTogether(pet.birthDate)}일`;
  }

  if (pet.emergencyMode) {
    return '긴급 대처 모드';
  }

  return '이별 후';
};

const mapPetToPetSwitchProfile = (pet: PetSummary): PetSwitchProfileItem => ({
  detail: `${pet.breedName ?? '종'}/${getPetGenderLabel(pet.gender)}`,
  id: `pet-${pet.id}`,
  isActive: pet.selected,
  kind: 'server',
  name: pet.name,
  pet,
  profileImageUri: pet.profileImageUrl ?? resolvePetEmojiAssetUri(pet.animalTypeName),
  statusLabel: getPetSwitchStatusLabel(pet),
});

const dedupePetSwitchProfiles = (petProfiles: PetSwitchProfileItem[]) => {
  const seenKeys = new Set<string>();

  return petProfiles.filter((petProfile) => {
    const dedupeKey = petProfile.pet
      ? `${petProfile.pet.id}:${petProfile.pet.inviteCode}`
      : petProfile.id;

    if (seenKeys.has(dedupeKey)) {
      return false;
    }

    seenKeys.add(dedupeKey);
    return true;
  });
};

export function BeforeFarewellHomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { openPreview, profile, selectedPet, session, switchSelectedPet } = useAppSessionStore();
  const [isEditProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [isPhotoSourceSheetVisible, setPhotoSourceSheetVisible] = useState(false);
  const [isPhotoCropModalVisible, setPhotoCropModalVisible] = useState(false);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [isHomeOnboardingVisible, setHomeOnboardingVisible] = useState(false);
  const [isPetSwitchModalVisible, setPetSwitchModalVisible] = useState(false);
  const [isPetSwitchConfirmModalVisible, setPetSwitchConfirmModalVisible] = useState(false);
  const [isPetSwitchLoadingVisible, setPetSwitchLoadingVisible] = useState(false);
  const [homeOnboardingStep, setHomeOnboardingStep] = useState(0);
  const [storedGuardianName, setStoredGuardianName] = useState<string | null>(null);
  const [storedPetProfileBackgroundColor, setStoredPetProfileBackgroundColor] = useState<string | null>(null);
  const [storedPetProfileCropCenterXRatio, setStoredPetProfileCropCenterXRatio] = useState(0.5);
  const [storedPetProfileCropCenterYRatio, setStoredPetProfileCropCenterYRatio] = useState(0.5);
  const [storedPetProfileCropDiameterRatio, setStoredPetProfileCropDiameterRatio] = useState(defaultProfileCropDiameterRatio);
  const [storedPetProfileCropOffsetXRatio, setStoredPetProfileCropOffsetXRatio] = useState(0);
  const [storedPetProfileCropOffsetYRatio, setStoredPetProfileCropOffsetYRatio] = useState(0);
  const [storedPetProfileImageHeight, setStoredPetProfileImageHeight] = useState(0);
  const [storedPetProfileImageUri, setStoredPetProfileImageUri] = useState<string | null>(null);
  const [storedPetProfileImageWidth, setStoredPetProfileImageWidth] = useState(0);
  const [storedPetName, setStoredPetName] = useState<string | null>(null);
  const [storedPetBirthDate, setStoredPetBirthDate] = useState<string | null>(null);
  const [storedProgressPercent, setStoredProgressPercent] = useState(0);
  const [storedFootprintsCompletedCount, setStoredFootprintsCompletedCount] = useState(0);
  const [storedAddedInvitePets, setStoredAddedInvitePets] = useState<PetSummary[]>([]);
  const [storedRegisteredOwnerPet, setStoredRegisteredOwnerPet] = useState<PetSummary | null>(null);
  const [draftProfilePhotoBackgroundColor, setDraftProfilePhotoBackgroundColor] = useState<string | null>(null);
  const [draftProfilePhotoImageUri, setDraftProfilePhotoImageUri] = useState<string | null>(null);
  const [draftProfilePhotoImageHeight, setDraftProfilePhotoImageHeight] = useState(0);
  const [draftProfilePhotoImageWidth, setDraftProfilePhotoImageWidth] = useState(0);
  const [draftCropCenterX, setDraftCropCenterX] = useState(profileCropStageSize / 2);
  const [draftCropCenterY, setDraftCropCenterY] = useState(profileCropStageSize / 2);
  const [draftCropDiameter, setDraftCropDiameter] = useState(profileCropCircleDiameter);
  const [activeBottomNavTab, setActiveBottomNavTab] = useState<BottomNavTabId>('home');
  const [pendingPetSwitchProfile, setPendingPetSwitchProfile] = useState<PetSwitchProfileItem | null>(null);
  const [petSwitchProfiles, setPetSwitchProfiles] = useState<PetSwitchProfileItem[]>([]);
  const [isReviewImageSourceSheetVisible, setReviewImageSourceSheetVisible] = useState(false);
  const [reviewDraftImageUris, setReviewDraftImageUris] = useState<(string | null)[]>(Array.from({ length: reviewImageSlotCount }, () => null));
  const [reviewImageTargetIndex, setReviewImageTargetIndex] = useState<number | null>(null);
  const [reviewDraftText, setReviewDraftText] = useState('');
  const [reviewTextInputHeight, setReviewTextInputHeight] = useState(minReviewTextInputHeight);
  const draftCropCenterXStartRef = useRef(profileCropStageSize / 2);
  const draftCropCenterYStartRef = useRef(profileCropStageSize / 2);
  const draftCropCenterXValueRef = useRef(profileCropStageSize / 2);
  const draftCropCenterYValueRef = useRef(profileCropStageSize / 2);
  const draftCropDiameterStartRef = useRef(profileCropCircleDiameter);
  const draftCropDiameterValueRef = useRef(profileCropCircleDiameter);
  const ownerName = storedGuardianName ?? profile?.nickname ?? profile?.name ?? '보호자';
  const petName = storedPetName ?? selectedPet?.name ?? '설탕';
  const fallbackPetImageUri = selectedPet?.profileImageUrl ?? resolvePetEmojiAssetUri(selectedPet?.animalTypeName);
  const hasStoredPetProfileImage = Boolean(storedPetProfileImageUri);
  const petImageUri = storedPetProfileImageUri ?? fallbackPetImageUri;
  const daysTogether = calculateDaysTogether(storedPetBirthDate ?? selectedPet?.birthDate);
  const progressPercent = Math.min(100, Math.max(0, storedProgressPercent));
  const shouldShowMultipleReviewImageSlots = reviewDraftImageUris.some(imageUri => Boolean(imageUri));
  const reviewModalCardWidth = Math.max(0, windowWidth - 40);
  const reviewModalInnerWidth = Math.max(0, reviewModalCardWidth - 40);
  const reviewImageScrollerInset = Math.max(0, (reviewModalInnerWidth - reviewImageSlotWidth) / 2);
  const locallyAddedPetSwitchProfiles = storedAddedInvitePets.map(mapPetToPetSwitchProfile);
  const fallbackRegisteredOwnerPetSwitchProfile = storedRegisteredOwnerPet ? mapPetToPetSwitchProfile({
    ...storedRegisteredOwnerPet,
    selected: selectedPet ? storedRegisteredOwnerPet.id === selectedPet.id : true,
  }) : null;
  const fallbackCurrentPetSwitchProfile = selectedPet ? mapPetToPetSwitchProfile({
    ...selectedPet,
    name: petName,
    selected: true,
  }) : null;
  const hasFetchedPetSwitchProfiles = petSwitchProfiles.length > 0;
  const fallbackRegisteredPetSwitchProfiles = dedupePetSwitchProfiles([
    ...(fallbackRegisteredOwnerPetSwitchProfile ? [fallbackRegisteredOwnerPetSwitchProfile] : []),
    ...(fallbackCurrentPetSwitchProfile?.pet?.isOwner ? [fallbackCurrentPetSwitchProfile] : []),
  ]);
  const mergedAdditionalPetSwitchProfiles = dedupePetSwitchProfiles([
    ...(hasFetchedPetSwitchProfiles ? petSwitchProfiles.filter(petProfile => !petProfile.pet?.isOwner) : []),
    ...locallyAddedPetSwitchProfiles,
  ]);
  const registeredPetSwitchProfiles = hasFetchedPetSwitchProfiles
    ? petSwitchProfiles.filter(petProfile => petProfile.pet?.isOwner)
    : fallbackRegisteredPetSwitchProfiles;
  const additionalPetSwitchProfiles = mergedAdditionalPetSwitchProfiles.length > 0
    ? mergedAdditionalPetSwitchProfiles
    : (fallbackCurrentPetSwitchProfile?.pet?.isOwner
      ? addedPetSwitchProfiles
      : (fallbackCurrentPetSwitchProfile ? [fallbackCurrentPetSwitchProfile] : []));
  const shouldScrollAdditionalPetSwitchProfiles = additionalPetSwitchProfiles.length > petSwitchScrollableListThreshold;
  const activeHomeOnboardingStep = beforeFarewellHomeOnboardingSteps[homeOnboardingStep] ?? beforeFarewellHomeOnboardingSteps[0];
  const isLastHomeOnboardingStep = homeOnboardingStep === beforeFarewellHomeOnboardingSteps.length - 1;
  const draftStageImageRect = getStageImageRect(draftProfilePhotoImageWidth, draftProfilePhotoImageHeight, profileCropStageSize);
  const draftCropFrameStyle = {
    height: draftCropDiameter,
    left: draftCropCenterX - (draftCropDiameter / 2),
    top: draftCropCenterY - (draftCropDiameter / 2),
    width: draftCropDiameter,
  };
  const cropFramePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        draftCropCenterXStartRef.current = draftCropCenterXValueRef.current;
        draftCropCenterYStartRef.current = draftCropCenterYValueRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const radius = draftCropDiameterValueRef.current / 2;
        const nextCenterX = Math.max(radius, Math.min(profileCropStageSize - radius, draftCropCenterXStartRef.current + gestureState.dx));
        const nextCenterY = Math.max(radius, Math.min(profileCropStageSize - radius, draftCropCenterYStartRef.current + gestureState.dy));

        setDraftCropCenterX(nextCenterX);
        setDraftCropCenterY(nextCenterY);
      },
    }),
  ).current;
  const cropHandlePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        draftCropDiameterStartRef.current = draftCropDiameterValueRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const delta = (gestureState.dx + gestureState.dy) / 2;
        const maxDiameterByBounds = 2 * Math.min(
          draftCropCenterXValueRef.current,
          profileCropStageSize - draftCropCenterXValueRef.current,
          draftCropCenterYValueRef.current,
          profileCropStageSize - draftCropCenterYValueRef.current,
        );
        const nextDiameter = Math.max(
          minProfileCropDiameter,
          Math.min(maxDiameterByBounds, draftCropDiameterStartRef.current + delta),
        );

        setDraftCropDiameter(nextDiameter);
      },
    }),
  ).current;

  useEffect(() => {
    draftCropCenterXValueRef.current = draftCropCenterX;
    draftCropCenterYValueRef.current = draftCropCenterY;
    draftCropDiameterValueRef.current = draftCropDiameter;
  }, [draftCropCenterX, draftCropCenterY, draftCropDiameter]);

  useEffect(() => {
    let isMounted = true;

    const hydrateBeforeFarewellHome = async () => {
      const [snapshot, addedInvitePets, previewState, footprintsState] = await Promise.all([
        readStoredBeforeFarewellHomeSnapshot(),
        readStoredAddedInvitePets(),
        selectedPet
          ? readStoredFarewellPreviewState({
            inviteCode: selectedPet.inviteCode,
            lifecycleStatus: selectedPet.lifecycleStatus,
            petId: selectedPet.id,
          })
          : Promise.resolve(null),
        selectedPet
          ? readStoredFootprintsState(
            {
              inviteCode: selectedPet.inviteCode,
              petId: selectedPet.id,
            },
            selectedPet.lifecycleStatus,
          )
          : Promise.resolve(null),
      ]);

      if (!isMounted) {
        return;
      }

      setStoredGuardianName(snapshot.guardianName);
      setStoredPetProfileBackgroundColor(snapshot.petProfileBackgroundColor);
      setStoredPetProfileCropCenterXRatio(snapshot.petProfileCropCenterXRatio);
      setStoredPetProfileCropCenterYRatio(snapshot.petProfileCropCenterYRatio);
      setStoredPetProfileCropDiameterRatio(snapshot.petProfileCropDiameterRatio);
      setStoredPetProfileCropOffsetXRatio(snapshot.petProfileCropOffsetXRatio);
      setStoredPetProfileCropOffsetYRatio(snapshot.petProfileCropOffsetYRatio);
      setStoredPetProfileImageHeight(snapshot.petProfileImageHeight);
      setStoredPetProfileImageUri(snapshot.petProfileImageUri);
      setStoredPetProfileImageWidth(snapshot.petProfileImageWidth);
      setStoredPetName(snapshot.petName);
      setStoredPetBirthDate(snapshot.petBirthDate);
      setStoredRegisteredOwnerPet(snapshot.registeredOwnerPet);
      setStoredProgressPercent(
        selectedPet?.lifecycleStatus === 'BEFORE_FAREWELL' && previewState
          ? computeFarewellPreviewProgress(previewState)
          : snapshot.progressPercent,
      );
      setStoredFootprintsCompletedCount(
        footprintsState ? countCompletedFootprintsMissions(footprintsState) : 0,
      );
      setStoredAddedInvitePets(addedInvitePets);
      setHomeOnboardingVisible(!snapshot.hasCompletedHomeOnboarding);
    };

    hydrateBeforeFarewellHome();

    return () => {
      isMounted = false;
    };
  }, [selectedPet]);

  useEffect(() => {
    let isMounted = true;

    if (!isPetSwitchModalVisible || !session) {
      return () => {
        isMounted = false;
      };
    }

    const hydratePetSwitchProfiles = async () => {
      try {
        const pets = await getMyPets(session.accessToken);

        if (!isMounted) {
          return;
        }

        setPetSwitchProfiles(pets.map(mapPetToPetSwitchProfile));
      } catch {
        if (!isMounted) {
          return;
        }

        setPetSwitchProfiles([]);
      }
    };

    hydratePetSwitchProfiles();

    return () => {
      isMounted = false;
    };
  }, [isPetSwitchModalVisible, session]);

  const handleAdvanceHomeOnboarding = async () => {
    if (!isLastHomeOnboardingStep) {
      setHomeOnboardingStep((currentStep) => currentStep + 1);
      return;
    }

    await writeStoredBeforeFarewellHomeSnapshot({ hasCompletedHomeOnboarding: true });
    setHomeOnboardingVisible(false);
    setHomeOnboardingStep(0);
    presentPhotoSourceSelection();
  };

  const handleReopenHomeOnboarding = async () => {
    await writeStoredBeforeFarewellHomeSnapshot({ hasCompletedHomeOnboarding: false });
    setHomeOnboardingStep(0);
    setHomeOnboardingVisible(true);
  };

  const handleHeroTextLongPress = () => {
    handleReopenHomeOnboarding().catch(() => undefined);
  };

  const presentPhotoSourceSelection = () => {
    if (showNativeImageSourceActionSheet({
      onAlbumPress: handleOpenPhotoGallery,
      onCameraPress: handleOpenCamera,
    })) {
      return;
    }

    setPhotoSourceSheetVisible(true);
  };

  const presentReviewImageSourceSelection = (targetIndex: number) => {
    setReviewImageTargetIndex(targetIndex);

    if (showNativeImageSourceActionSheet({
      onAlbumPress: () => handleOpenReviewPhotoGallery(targetIndex),
      onCameraPress: () => handleOpenReviewCamera(targetIndex),
      onCancel: () => {
        setReviewImageTargetIndex(null);
      },
    })) {
      return;
    }

    setReviewImageSourceSheetVisible(true);
  };

  const handleHomeOnboardingNextPress = () => {
    handleAdvanceHomeOnboarding().catch(() => undefined);
  };

  const handleClosePetSwitchConfirmModal = () => {
    setPendingPetSwitchProfile(null);
    setPetSwitchConfirmModalVisible(false);
  };

  const handleClosePetSwitchModal = () => {
    setPetSwitchModalVisible(false);
    handleClosePetSwitchConfirmModal();
  };

  const handleClosePhotoFlow = () => {
    setPhotoSourceSheetVisible(false);
    setPhotoCropModalVisible(false);
    setDraftProfilePhotoBackgroundColor(null);
    setDraftProfilePhotoImageUri(null);
    setDraftProfilePhotoImageHeight(0);
    setDraftProfilePhotoImageWidth(0);
    setDraftCropCenterX(profileCropStageSize / 2);
    setDraftCropCenterY(profileCropStageSize / 2);
    setDraftCropDiameter(profileCropCircleDiameter);
  };

  const handleSelectImageAsset = (asset: Asset) => {
    if (!asset.uri) {
      return;
    }

    setDraftProfilePhotoBackgroundColor(customPetPhotoBackgroundColor);
    setDraftProfilePhotoImageUri(asset.uri);
    setDraftProfilePhotoImageHeight(asset.height ?? profileCropStageSize);
    setDraftProfilePhotoImageWidth(asset.width ?? profileCropStageSize);
    setDraftCropCenterX(profileCropStageSize / 2);
    setDraftCropCenterY(profileCropStageSize / 2);
    setDraftCropDiameter(profileCropCircleDiameter);
    setPhotoCropModalVisible(true);
  };

  const handleOpenPhotoGallery = async () => {
    setPhotoSourceSheetVisible(false);

    const permissionResult = await requestPhotoLibraryPermission();

    if (!permissionResult.granted) {
      if (permissionResult.blocked) {
        showBlockedPermissionAlert(
          '사진 권한이 필요해요',
          '앨범에서 사진을 선택하려면 설정에서 사진 권한을 허용해 주세요.',
        );
      }

      return;
    }

    const response = await launchImageLibrary({
      assetRepresentationMode: 'current',
      includeExtra: true,
      mediaType: 'photo',
      presentationStyle: 'fullScreen',
      quality: 1,
      selectionLimit: 1,
    });

    const imageAsset = response.assets?.[0];

    if (response.didCancel || !imageAsset?.uri) {
      return;
    }

    handleSelectImageAsset(imageAsset);
  };

  const handleOpenCamera = async () => {
    setPhotoSourceSheetVisible(false);

    const permissionResult = await requestCameraPermission();

    if (!permissionResult.granted) {
      if (permissionResult.blocked) {
        showBlockedPermissionAlert(
          '카메라 권한이 필요해요',
          '사진을 촬영하려면 설정에서 카메라 권한을 허용해 주세요.',
        );
      }

      return;
    }

    const response = await launchCamera({
      cameraType: 'back',
      mediaType: 'photo',
      presentationStyle: 'fullScreen',
      quality: 1,
      saveToPhotos: false,
    });

    const imageAsset = response.assets?.[0];

    if (response.didCancel || !imageAsset?.uri) {
      return;
    }

    handleSelectImageAsset(imageAsset);
  };

  const handleOpenReviewImageSourceSheet = (index: number) => {
    presentReviewImageSourceSelection(index);
  };

  const handleCloseReviewImageSourceSheet = () => {
    setReviewImageSourceSheetVisible(false);
    setReviewImageTargetIndex(null);
  };

  const resetReviewDraft = () => {
    setReviewDraftImageUris(Array.from({ length: reviewImageSlotCount }, () => null));
    setReviewImageTargetIndex(null);
    setReviewImageSourceSheetVisible(false);
    setReviewDraftText('');
    setReviewTextInputHeight(minReviewTextInputHeight);
  };

  const handleSelectReviewImageAssets = (assets: Asset[], targetIndexOverride?: number | null) => {
    const targetIndex = targetIndexOverride ?? reviewImageTargetIndex;

    if (targetIndex === null) {
      return;
    }

    setReviewDraftImageUris(currentImageUris => {
      const nextImageUris = [...currentImageUris];

      if (nextImageUris[targetIndex]) {
        const replacementAsset = assets.find(asset => Boolean(asset.uri));

        if (replacementAsset?.uri) {
          nextImageUris[targetIndex] = replacementAsset.uri;
        }

        return nextImageUris;
      }

      let nextInsertIndex = targetIndex;

      assets.forEach(asset => {
        if (!asset.uri) {
          return;
        }

        while (nextInsertIndex < nextImageUris.length && nextImageUris[nextInsertIndex]) {
          nextInsertIndex += 1;
        }

        if (nextInsertIndex >= nextImageUris.length) {
          return;
        }

        nextImageUris[nextInsertIndex] = asset.uri;
        nextInsertIndex += 1;
      });

      return nextImageUris;
    });
    setReviewImageSourceSheetVisible(false);
    setReviewImageTargetIndex(null);
  };

  const handleOpenReviewPhotoGallery = async (targetIndexOverride?: number | null) => {
    setReviewImageSourceSheetVisible(false);

    const targetIndex = targetIndexOverride ?? reviewImageTargetIndex;

    if (targetIndex === null) {
      return;
    }

    const permissionResult = await requestPhotoLibraryPermission();

    if (!permissionResult.granted) {
      if (permissionResult.blocked) {
        showBlockedPermissionAlert(
          '사진 권한이 필요해요',
          '후기 이미지를 추가하려면 설정에서 사진 권한을 허용해 주세요.',
        );
      }

      return;
    }

    const isReplacingExistingImage = Boolean(reviewDraftImageUris[targetIndex]);
    const remainingEmptySlotCount = reviewDraftImageUris.filter(imageUri => !imageUri).length;

    const response = await launchImageLibrary({
      assetRepresentationMode: 'current',
      includeExtra: true,
      mediaType: 'photo',
      presentationStyle: 'fullScreen',
      quality: 1,
      selectionLimit: isReplacingExistingImage ? 1 : Math.max(1, remainingEmptySlotCount),
    });

    const selectedAssets = response.assets?.filter(asset => Boolean(asset.uri)) ?? [];

    if (response.didCancel || selectedAssets.length === 0) {
      return;
    }

    handleSelectReviewImageAssets(selectedAssets, targetIndex);
  };

  const handleOpenReviewCamera = async (targetIndexOverride?: number | null) => {
    setReviewImageSourceSheetVisible(false);

    const targetIndex = targetIndexOverride ?? reviewImageTargetIndex;

    if (targetIndex === null) {
      return;
    }

    const permissionResult = await requestCameraPermission();

    if (!permissionResult.granted) {
      if (permissionResult.blocked) {
        showBlockedPermissionAlert(
          '카메라 권한이 필요해요',
          '후기 이미지를 촬영하려면 설정에서 카메라 권한을 허용해 주세요.',
        );
      }

      return;
    }

    const response = await launchCamera({
      cameraType: 'back',
      mediaType: 'photo',
      presentationStyle: 'fullScreen',
      quality: 1,
      saveToPhotos: false,
    });

    const imageAsset = response.assets?.[0];

    if (response.didCancel || !imageAsset?.uri) {
      return;
    }

    handleSelectReviewImageAssets([imageAsset], targetIndex);
  };

  const handleCloseReviewModal = () => {
    setReviewModalVisible(false);
    resetReviewDraft();
  };

  const handleSubmitReview = () => {
    setReviewModalVisible(false);
    resetReviewDraft();
  };

  const handlePetSwitchProfilePress = (petProfile: PetSwitchProfileItem) => {
    if (!petProfile.pet || petProfile.isActive) {
      return;
    }

    setPendingPetSwitchProfile(petProfile);
    setPetSwitchConfirmModalVisible(true);
  };

  const handleConfirmPetSwitch = () => {
    if (!pendingPetSwitchProfile?.pet) {
      return;
    }

    const executePetSwitch = async () => {
      setPetSwitchConfirmModalVisible(false);
      setPetSwitchModalVisible(false);
      setPetSwitchLoadingVisible(true);

      try {
        await switchSelectedPet(pendingPetSwitchProfile.pet.id);
      } finally {
        setPendingPetSwitchProfile(null);
        setPetSwitchLoadingVisible(false);
      }
    };

    executePetSwitch().catch(() => undefined);
  };

  const handleSaveCroppedProfileImage = () => {
    if (!draftProfilePhotoImageUri) {
      setPhotoCropModalVisible(false);
      return;
    }

    const nextCropCenterXRatio = clampUnitRatio(draftCropCenterX / profileCropStageSize);
    const nextCropCenterYRatio = clampUnitRatio(draftCropCenterY / profileCropStageSize);
    const nextCropDiameterRatio = clampUnitRatio(draftCropDiameter / profileCropStageSize);

    const saveLocally = async () => {
      await writeStoredBeforeFarewellHomeSnapshot({
        petProfileBackgroundColor: draftProfilePhotoBackgroundColor ?? customPetPhotoBackgroundColor,
        petProfileCropCenterXRatio: nextCropCenterXRatio,
        petProfileCropCenterYRatio: nextCropCenterYRatio,
        petProfileCropDiameterRatio: nextCropDiameterRatio,
        petProfileCropOffsetXRatio: 0,
        petProfileCropOffsetYRatio: 0,
        petProfileImageHeight: draftProfilePhotoImageHeight,
        petProfileImageUri: draftProfilePhotoImageUri,
        petProfileImageWidth: draftProfilePhotoImageWidth,
      });

      setStoredPetProfileBackgroundColor(draftProfilePhotoBackgroundColor ?? customPetPhotoBackgroundColor);
      setStoredPetProfileCropCenterXRatio(nextCropCenterXRatio);
      setStoredPetProfileCropCenterYRatio(nextCropCenterYRatio);
      setStoredPetProfileCropDiameterRatio(nextCropDiameterRatio);
      setStoredPetProfileCropOffsetXRatio(0);
      setStoredPetProfileCropOffsetYRatio(0);
      setStoredPetProfileImageHeight(draftProfilePhotoImageHeight);
      setStoredPetProfileImageUri(draftProfilePhotoImageUri);
      setStoredPetProfileImageWidth(draftProfilePhotoImageWidth);
      setPhotoCropModalVisible(false);
      setDraftProfilePhotoBackgroundColor(null);
      setDraftProfilePhotoImageUri(null);
      setDraftProfilePhotoImageHeight(0);
      setDraftProfilePhotoImageWidth(0);
      setDraftCropCenterX(profileCropStageSize / 2);
      setDraftCropCenterY(profileCropStageSize / 2);
      setDraftCropDiameter(profileCropCircleDiameter);
    };

    // TODO: send cropped profile image payload to backend once the upload API is available.
    saveLocally().catch(() => undefined);
  };

  const renderPetSwitchAvatar = (petProfile: PetSwitchProfileItem, size: number) => {
    const isCurrentSelectedPet = selectedPet
      ? petProfile.pet?.id === selectedPet.id
      : petProfile.isActive;

    if (isCurrentSelectedPet) {
      return (
        <PetAvatar
          backgroundColor={storedPetProfileBackgroundColor}
          cropCenterXRatio={storedPetProfileCropCenterXRatio}
          cropCenterYRatio={storedPetProfileCropCenterYRatio}
          cropDiameterRatio={storedPetProfileCropDiameterRatio}
          imageUri={petImageUri}
          imageHeight={storedPetProfileImageHeight}
          imageWidth={storedPetProfileImageWidth}
          isCustomPhoto={hasStoredPetProfileImage}
          offsetXRatio={storedPetProfileCropOffsetXRatio}
          offsetYRatio={storedPetProfileCropOffsetYRatio}
          size={size}
        />
      );
    }

    if (petProfile.pet?.profileImageUrl) {
      return (
        <View style={[styles.petSwitchAvatarCircle, { borderRadius: size / 2, height: size, width: size }]}>
          <Image source={{ uri: petProfile.pet.profileImageUrl }} style={[styles.petSwitchAvatarImageCover, { borderRadius: size / 2, height: size, width: size }]} />
        </View>
      );
    }

    if (petProfile.profileImageUri) {
      return (
        <View style={[styles.petSwitchAvatarCircle, styles.petSwitchAvatarCircleActive, { borderRadius: size / 2, height: size, width: size }]}>
          <Image
            resizeMode="contain"
            source={{ uri: petProfile.profileImageUri }}
            style={{ height: size * 0.76, width: size * 0.76 }}
          />
        </View>
      );
    }

    return <View style={[styles.petSwitchAvatarCircle, { borderRadius: size / 2, height: size, width: size }]} />;
  };

  if (isPetSwitchLoadingVisible) {
    return (
      <SignupCompletionLoadingScreen
        description="알맞은 공간으로 이동할게요."
        title="반려동물 정보를 불러오고 있어요 !"
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#FFEC99" barStyle="dark-content" />
      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlowPrimary} />
          <View style={styles.heroGlowSecondary} />

          <View style={styles.heroTopBar}>
            <Image source={{ uri: pawMarkAssetUri }} style={styles.heroPawIcon} />

            <Pressable onPress={() => openPreview('emergency')} style={styles.emergencyButton}>
              <View style={styles.emergencyDot}>
                <Text style={styles.emergencyDotLabel}>!</Text>
              </View>
              <Text style={styles.emergencyButtonLabel}>긴급 대처 모드</Text>
            </Pressable>
          </View>

          <View style={styles.heroMainRow}>
            <Pressable delayLongPress={1000} onLongPress={handleHeroTextLongPress} style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>
                <Text style={styles.heroAccent}>{ownerName}</Text>
                님과
                {'\n'}
                <Text style={styles.heroAccent}>{petName}</Text>
                이의
                {'\n'}
                준비공간입니다.
              </Text>
              <Text style={styles.heroSubtitle}>
                함께한 지 <Text style={styles.heroSubtitleAccent}>+{daysTogether}</Text>일 째 ♥
              </Text>
            </Pressable>

            <View style={styles.profileFrame}>
              <Pressable onPress={() => setEditProfileModalVisible(true)} style={styles.profileCircle}>
                <PetAvatar
                  backgroundColor={storedPetProfileBackgroundColor}
                  cropCenterXRatio={storedPetProfileCropCenterXRatio}
                  cropCenterYRatio={storedPetProfileCropCenterYRatio}
                  cropDiameterRatio={storedPetProfileCropDiameterRatio}
                  imageUri={petImageUri}
                  imageHeight={storedPetProfileImageHeight}
                  imageWidth={storedPetProfileImageWidth}
                  isCustomPhoto={hasStoredPetProfileImage}
                  offsetXRatio={storedPetProfileCropOffsetXRatio}
                  offsetYRatio={storedPetProfileCropOffsetYRatio}
                  size={100}
                />
              </Pressable>
              <Pressable onPress={() => setPetSwitchModalVisible(true)} style={styles.profileBadge}>
                <Text style={styles.profileBadgeLabel}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => openPreview('farewellPreview')} style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>아이의 곁을 지키는 가장 세심한 방법</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </View>
            <Text style={styles.progressCaption}>
              전체 단계 중 <Text style={styles.progressCaptionAccent}>{progressPercent}%</Text> 진행되었어요
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.footprintsCard}>
            <Image source={{ uri: footprintsCardBackgroundAssetUri }} style={styles.footprintsBackgroundImage} />
            <View style={styles.footprintsOverlay} />
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.footprintsTitle}>발자국 남기기</Text>
                <Pressable onPress={() => openPreview('footprints')} style={styles.ctaButton}>
                  <Text style={styles.ctaButtonLabel}>발자국 남기러 가기</Text>
                  <Text style={styles.ctaButtonChevron}>{'>'}</Text>
                </Pressable>
              </View>

              <View style={styles.stampCounterCard}>
                <View style={styles.stampRow}>
                  <View style={styles.stampBubble} />
                  <View style={[styles.stampBubble, styles.stampBubblePrimary]} />
                  <View style={styles.stampBubble} />
                </View>
                <View style={styles.stampCounterChip}>
                  <Text style={styles.stampCounterAccent}>{storedFootprintsCompletedCount}</Text>
                  <Text style={styles.stampCounterLabel}>{` / ${totalFootprintsMissionCount} 달성!`}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.memorialCard}>
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.memorialTitle}>별자리 추모관 둘러보기</Text>
                <Pressable style={styles.ctaButton}>
                  <Text style={styles.ctaButtonLabel}>더 알아보기</Text>
                  <Text style={styles.ctaButtonChevron}>{'>'}</Text>
                </Pressable>
              </View>

              <Image resizeMode="contain" source={{ uri: memorialStarsAssetUri }} style={styles.memorialStarsImage} />
            </View>
          </View>

          <Pressable onPress={() => openPreview('funeralCompanies')} style={styles.infoCard}>
            <View style={styles.infoCardRow}>
              <View style={styles.funeralIconStack}>
                <Image source={{ uri: funeralSearchAssetUri }} style={styles.funeralIconBase} />
                <Image source={{ uri: funeralSearchHighlightAssetUri }} style={styles.funeralIconHighlight} />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoTitle}>장례업체 찾기</Text>
                <Text style={styles.infoDescription}>아이를 위한 정직한 장례 파트너 찾기</Text>
              </View>
            </View>
          </Pressable>

          <Text style={styles.sectionTitle}>다른 분들에게도 도움을 나눠주세요</Text>

          <Pressable onPress={() => setReviewModalVisible(true)} style={styles.infoCard}>
            <View style={styles.infoCardRow}>
              <Image source={{ uri: reviewAssetUri }} style={styles.reviewIcon} />
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoTitle}>후기 남기기</Text>
                <Text style={styles.infoDescription}>더 나은 서비스를 위해 3분만 힘써주세요!</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomNavRow}>
          {bottomNavTabs.map(tab => {
            const isActive = activeBottomNavTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  setActiveBottomNavTab(tab.id);

                  if (tab.id === 'explore') {
                    openPreview('farewellPreview');
                  }

                  if (tab.id === 'footprints') {
                    openPreview('footprints');
                  }
                }}
                style={styles.bottomNavItem}
              >
                <View style={[styles.bottomNavIconFrame, isActive ? styles.bottomNavIconFrameActive : null]}>
                  <Image
                    source={{ uri: tab.iconUri }}
                    style={[
                      styles.bottomNavIcon,
                      isActive ? styles.bottomNavIconActive : styles.bottomNavIconInactive,
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

      <Modal
        animationType="fade"
        onRequestClose={() => setEditProfileModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isEditProfileModalVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setEditProfileModalVisible(false)} style={styles.modalOverlay} />

          <View style={styles.modalCard}>
            <View style={styles.modalTextBlock}>
              <Text style={styles.modalTitle}>
                정보 수정하기 페이지로
                {'\n'}
                이동하시겠어요?
              </Text>
              <Text style={styles.modalDescription}>
                설정 {'>'} 내 정보 수정하기에서
                {'\n'}
                사진 및 데이터를 관리할 수 있어요.
              </Text>
            </View>

            <View style={styles.modalButtonRow}>
              <Pressable onPress={() => setEditProfileModalVisible(false)} style={[styles.modalButton, styles.modalSecondaryButton]}>
                <Text style={styles.modalSecondaryButtonLabel}>아니요</Text>
              </Pressable>
              <Pressable onPress={() => setEditProfileModalVisible(false)} style={[styles.modalButton, styles.modalPrimaryButton]}>
                <Text style={styles.modalPrimaryButtonLabel}>이동할게요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={handleCloseReviewModal}
        statusBarTranslucent
        transparent
        visible={isReviewModalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          contentContainerStyle={styles.reviewModalKeyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 8}
          style={styles.reviewModalKeyboardAvoidingView}
        >
          <View style={styles.reviewModalRoot}>
            <Pressable onPress={handleCloseReviewModal} style={styles.reviewModalOverlay} />

            <View style={styles.reviewModalCard}>
              <View style={styles.reviewModalTextBlock}>
                <Text style={styles.reviewModalTitle}>포에버와 함께하는 시간은 어땠나요?</Text>
                <Text style={styles.reviewModalDescription}>
                  솔직한 이야기를 들려주세요.
                  {'\n'}
                  여러분의 소중한 경험이 저희에게 큰 힘이 됩니다
                </Text>
              </View>

              <View style={styles.reviewModalContent}>
                {shouldShowMultipleReviewImageSlots ? (
                  <ScrollView
                    bounces={false}
                    contentContainerStyle={[
                      styles.reviewImageScrollerContent,
                      { paddingHorizontal: reviewImageScrollerInset },
                    ]}
                    decelerationRate="fast"
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    snapToInterval={reviewImageSlotWidth + reviewImageSlotGap}
                    style={styles.reviewImageScroller}
                  >
                    {reviewDraftImageUris.map((imageUri, index) => (
                      <Pressable key={`review-image-slot-${index}`} onPress={() => handleOpenReviewImageSourceSheet(index)} style={styles.reviewImagePickerButton}>
                        {imageUri ? (
                          <Image source={{ uri: imageUri }} style={styles.reviewSelectedImage} />
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.reviewImageSingleSlotRow}>
                    <Pressable onPress={() => handleOpenReviewImageSourceSheet(0)} style={styles.reviewImagePickerButton} />
                  </View>
                )}

                <View style={styles.reviewTextField}>
                  <TextInput
                    maxLength={300}
                    multiline
                    onChangeText={setReviewDraftText}
                    onContentSizeChange={(event) => {
                      const nextHeight = Math.max(
                        minReviewTextInputHeight,
                        Math.min(maxReviewTextInputHeight, Math.ceil(event.nativeEvent.contentSize.height)),
                      );
                      setReviewTextInputHeight(nextHeight);
                    }}
                    placeholder="텍스트 작성"
                    placeholderTextColor="#86746E"
                    scrollEnabled={reviewTextInputHeight >= maxReviewTextInputHeight}
                    style={[styles.reviewTextInput, { height: reviewTextInputHeight }]}
                    textAlignVertical="top"
                    value={reviewDraftText}
                  />
                  <Image resizeMode="contain" source={{ uri: reviewModalSendAssetUri }} style={styles.reviewSendIcon} />
                </View>

                <Text style={styles.reviewHelperText}>300자까지 입력할 수 있어요</Text>
              </View>

              <View style={styles.reviewButtonStack}>
                <Pressable onPress={handleSubmitReview} style={styles.reviewPrimaryButton}>
                  <Text style={styles.reviewPrimaryButtonLabel}>전달하기</Text>
                </Pressable>
                <Pressable onPress={handleCloseReviewModal} style={styles.reviewSecondaryButton}>
                  <Text style={styles.reviewSecondaryButtonLabel}>다음에 할게요</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={handleCloseReviewImageSourceSheet}
        statusBarTranslucent
        transparent
        visible={Platform.OS === 'android' && isReviewImageSourceSheetVisible}
      >
        <View style={styles.actionSheetRoot}>
          <Pressable onPress={handleCloseReviewImageSourceSheet} style={styles.actionSheetOverlay} />

          <View style={[styles.actionSheetContainer, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
            <View style={styles.actionSheetCard}>
              <Pressable onPress={() => handleOpenReviewPhotoGallery().catch(() => undefined)} style={styles.actionSheetOption}>
                <Text style={styles.actionSheetOptionLabel}>앨범</Text>
              </Pressable>
              <Pressable onPress={() => handleOpenReviewCamera().catch(() => undefined)} style={styles.actionSheetOption}>
                <Text style={styles.actionSheetOptionLabel}>카메라</Text>
              </Pressable>
            </View>

            <Pressable onPress={handleCloseReviewImageSourceSheet} style={styles.actionSheetCancelButton}>
              <Text style={styles.actionSheetCancelLabel}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={handleClosePetSwitchModal}
        statusBarTranslucent
        transparent
        visible={isPetSwitchModalVisible}
      >
        <View style={styles.petSwitchModalRoot}>
          <Pressable onPress={handleClosePetSwitchModal} style={styles.petSwitchModalOverlay} />

          <View style={[styles.petSwitchModalCard, { marginBottom: Math.max(insets.bottom, 20), marginTop: insets.top + 32 }]}>
            <Pressable onPress={handleClosePetSwitchModal} style={styles.petSwitchCloseButton}>
              <Text style={styles.petSwitchCloseButtonLabel}>×</Text>
            </Pressable>

            <View style={styles.petSwitchHeader}>
              <Text style={styles.petSwitchTitle}>반려동물 전환하기</Text>
              <Text style={styles.petSwitchSubtitle}>최대 10마리까지 등록 가능해요</Text>
            </View>

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.petSwitchScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.petSwitchSection}>
                <Text style={styles.petSwitchSectionTitle}>내가 등록한 아이 프로필</Text>

                {registeredPetSwitchProfiles.length === 0 ? (
                  <View style={styles.petSwitchEmptyCard}>
                    <Text style={styles.petSwitchEmptyCardLabel}>내가 등록한 아이가 없어요</Text>
                  </View>
                ) : (
                  registeredPetSwitchProfiles.map((petProfile) => (
                    <Pressable
                      disabled={!petProfile.pet || petProfile.isActive}
                      key={petProfile.id}
                      onPress={() => handlePetSwitchProfilePress(petProfile)}
                      style={[styles.petSwitchCard, petProfile.isActive ? styles.petSwitchCardActive : null]}
                    >
                      <View style={styles.petSwitchCardLeft}>
                        {renderPetSwitchAvatar(petProfile, 40)}

                        <View style={styles.petSwitchCardTextBlock}>
                          <Text style={[styles.petSwitchCardName, petProfile.isActive ? styles.petSwitchCardNameActive : null]}>
                            {petProfile.name}
                          </Text>
                          <Text style={[styles.petSwitchCardDetail, petProfile.isActive ? styles.petSwitchCardDetailActive : null]}>
                            {petProfile.detail}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.petSwitchCardRight}>
                        <Text style={[styles.petSwitchCardStatus, petProfile.isActive ? styles.petSwitchCardStatusActive : null]}>
                          {petProfile.statusLabel}
                        </Text>
                        <Text style={[styles.petSwitchCardChevron, petProfile.isActive ? styles.petSwitchCardChevronActive : null]}>{'>'}</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>

              <View style={styles.petSwitchSection}>
                <Text style={styles.petSwitchSectionTitle}>추가한 아이 프로필</Text>

                {additionalPetSwitchProfiles.length === 0 ? (
                  <View style={styles.petSwitchEmptyCard}>
                    <Text style={styles.petSwitchEmptyCardLabel}>추가한 아이 프로필이 없어요</Text>
                  </View>
                ) : (
                  <ScrollView
                    bounces={false}
                    contentContainerStyle={styles.petSwitchAdditionalListContent}
                    nestedScrollEnabled
                    scrollEnabled={shouldScrollAdditionalPetSwitchProfiles}
                    showsVerticalScrollIndicator={false}
                    style={shouldScrollAdditionalPetSwitchProfiles ? styles.petSwitchAdditionalListScroll : undefined}
                  >
                    {additionalPetSwitchProfiles.map((petProfile) => (
                      <Pressable
                        disabled={!petProfile.pet || petProfile.isActive}
                        key={petProfile.id}
                        onPress={() => handlePetSwitchProfilePress(petProfile)}
                        style={[styles.petSwitchCard, petProfile.isActive ? styles.petSwitchCardActive : null]}
                      >
                        <View style={styles.petSwitchCardLeft}>
                          {renderPetSwitchAvatar(petProfile, 40)}

                          <View style={styles.petSwitchCardTextBlock}>
                            <Text style={[styles.petSwitchCardName, petProfile.isActive ? styles.petSwitchCardNameActive : null]}>
                              {petProfile.name}
                            </Text>
                            <Text style={[styles.petSwitchCardDetail, petProfile.isActive ? styles.petSwitchCardDetailActive : null]}>
                              {petProfile.detail}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.petSwitchCardRight}>
                          <Text style={[styles.petSwitchCardStatus, petProfile.isActive ? styles.petSwitchCardStatusActive : null]}>
                            {petProfile.statusLabel}
                          </Text>
                          <Text style={[styles.petSwitchCardChevron, petProfile.isActive ? styles.petSwitchCardChevronActive : null]}>{'>'}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            </ScrollView>

            <View style={styles.petSwitchFooter}>
              <Text style={styles.petSwitchHelperText}>혹시 다른 아이 관리에 초대 받으셨나요?</Text>

              <Pressable onPress={handleClosePetSwitchModal} style={styles.petSwitchPrimaryButton}>
                <Text style={styles.petSwitchPrimaryButtonLabel}>전환 페이지로 이동하기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={handleClosePetSwitchConfirmModal}
        statusBarTranslucent
        transparent
        visible={isPetSwitchConfirmModalVisible}
      >
        <View style={styles.petSwitchConfirmModalRoot}>
          <Pressable onPress={handleClosePetSwitchConfirmModal} style={styles.petSwitchConfirmModalOverlay} />

          <View style={styles.petSwitchConfirmModalCard}>
            <Text style={styles.petSwitchConfirmTitle}>
              <Text style={styles.petSwitchConfirmTitleAccent}>{pendingPetSwitchProfile?.name ?? '반려동물'}</Text>
              이로
              {'\n'}
              전환할까요?
            </Text>

            <View style={styles.petSwitchConfirmAvatarWrapper}>
              {pendingPetSwitchProfile ? renderPetSwitchAvatar(pendingPetSwitchProfile, 100) : <View style={styles.petSwitchConfirmAvatarPlaceholder} />}
            </View>

            <Text style={styles.petSwitchConfirmDescription}>
              기존 반려동물 정보는 프로필에서
              {'\n'}
              언제든 확인할 수 있어요
            </Text>

            <View style={styles.petSwitchConfirmButtonStack}>
              <Pressable onPress={handleConfirmPetSwitch} style={styles.petSwitchConfirmPrimaryButton}>
                <Text style={styles.petSwitchConfirmPrimaryButtonLabel}>네</Text>
              </Pressable>
              <Pressable onPress={handleClosePetSwitchConfirmModal} style={styles.petSwitchConfirmSecondaryButton}>
                <Text style={styles.petSwitchConfirmSecondaryButtonLabel}>아니요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={handleClosePhotoFlow}
        statusBarTranslucent
        transparent
        visible={Platform.OS === 'android' && isPhotoSourceSheetVisible}
      >
        <View style={styles.actionSheetRoot}>
          <Pressable onPress={handleClosePhotoFlow} style={styles.actionSheetOverlay} />

          <View style={[styles.actionSheetContainer, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
            <View style={styles.actionSheetCard}>
              <Pressable onPress={handleOpenPhotoGallery} style={styles.actionSheetOption}>
                <Text style={styles.actionSheetOptionLabel}>앨범</Text>
              </Pressable>
              <Pressable onPress={handleOpenCamera} style={styles.actionSheetOption}>
                <Text style={styles.actionSheetOptionLabel}>카메라</Text>
              </Pressable>
            </View>

            <Pressable onPress={handleClosePhotoFlow} style={styles.actionSheetCancelButton}>
              <Text style={styles.actionSheetCancelLabel}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={handleClosePhotoFlow}
        statusBarTranslucent
        transparent
        visible={isPhotoCropModalVisible}
      >
        <View style={styles.cropModalRoot}>
          <Pressable onPress={handleClosePhotoFlow} style={styles.cropModalOverlay} />

          <View style={styles.cropModalCard}>
            <Text style={styles.cropModalTitle}>이미지 자르기</Text>

            <View style={styles.cropModalStage}>
              <View style={[styles.cropStageViewport, { backgroundColor: draftProfilePhotoBackgroundColor ?? customPetPhotoBackgroundColor }]}>
                {draftProfilePhotoImageUri ? (
                  <Image
                    source={{ uri: draftProfilePhotoImageUri }}
                    style={[
                      styles.cropStageImage,
                      {
                        height: draftStageImageRect.height,
                        left: draftStageImageRect.left,
                        top: draftStageImageRect.top,
                        width: draftStageImageRect.width,
                      },
                    ]}
                  />
                ) : null}

                <View
                  {...cropFramePanResponder.panHandlers}
                  style={[
                    styles.cropTargetCircle,
                    draftCropFrameStyle,
                    { borderRadius: draftCropDiameter / 2 },
                  ]}
                />
                <View
                  {...cropHandlePanResponder.panHandlers}
                  style={[
                    styles.cropTargetHandle,
                    {
                      left: draftCropCenterX + (draftCropDiameter / 2) - 13,
                      top: draftCropCenterY + (draftCropDiameter / 2) - 13,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.cropModalButtonRow}>
              <Pressable onPress={handleSaveCroppedProfileImage} style={styles.cropPrimaryButton}>
                <Text style={styles.cropPrimaryButtonLabel}>자르기</Text>
              </Pressable>
              <Pressable onPress={handleClosePhotoFlow} style={styles.cropSecondaryButton}>
                <Text style={styles.cropSecondaryButtonLabel}>닫기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal onRequestClose={() => undefined} statusBarTranslucent transparent visible={isHomeOnboardingVisible}>
        <View style={styles.homeOnboardingRoot}>
          <View style={styles.homeOnboardingOverlay} />

          {activeHomeOnboardingStep.id === 'emergency' ? (
            <>
              <View style={[styles.homeOnboardingEmergencyAnchor, styles.homeOnboardingEmergencyAnchorStepOne, { top: insets.top + 18 }]}>
                <View style={[styles.emergencyButton, styles.homeOnboardingEmergencyButton]}>
                  <View style={styles.emergencyDot}>
                    <Text style={styles.emergencyDotLabel}>!</Text>
                  </View>
                  <Text style={styles.emergencyButtonLabel}>긴급 대처 모드</Text>
                </View>
              </View>

              <View style={[styles.homeOnboardingConnector, styles.homeOnboardingConnectorStepOne, { top: insets.top + 56 }]} />
              <View style={[styles.homeOnboardingTextBlock, styles.homeOnboardingTextBlockOffset, { top: insets.top + 102 }]}>
                <Text style={styles.homeOnboardingTitle}>{activeHomeOnboardingStep.title}</Text>
                <Text style={styles.homeOnboardingDescription}>
                  {activeHomeOnboardingStep.bodyLines[0]}
                  {'\n'}
                  {activeHomeOnboardingStep.bodyLines[1]}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.homeOnboardingProfileAnchor, styles.homeOnboardingProfileAnchorStepTwo, { top: insets.top + 82 }]}>
                <View style={styles.homeOnboardingProfileOuter}>
                  <PetAvatar
                    backgroundColor={storedPetProfileBackgroundColor}
                    cropCenterXRatio={storedPetProfileCropCenterXRatio}
                    cropCenterYRatio={storedPetProfileCropCenterYRatio}
                    cropDiameterRatio={storedPetProfileCropDiameterRatio}
                    imageUri={petImageUri}
                    imageHeight={storedPetProfileImageHeight}
                    imageWidth={storedPetProfileImageWidth}
                    isCustomPhoto={hasStoredPetProfileImage}
                    offsetXRatio={storedPetProfileCropOffsetXRatio}
                    offsetYRatio={storedPetProfileCropOffsetYRatio}
                    size={100}
                  />
                </View>
              </View>

              <View style={[styles.homeOnboardingConnector, styles.homeOnboardingConnectorStepTwo, { top: insets.top + 182 }]} />
              <View style={[styles.homeOnboardingTextBlock, styles.homeOnboardingTextBlockOffset, { top: insets.top + 226 }]}>
                <Text style={styles.homeOnboardingTitle}>{activeHomeOnboardingStep.title}</Text>
                <Text style={styles.homeOnboardingDescription}>
                  {activeHomeOnboardingStep.bodyLines[0]}
                  {'\n'}
                  {activeHomeOnboardingStep.bodyLines[1]}
                </Text>
              </View>
            </>
          )}

          <Text style={[styles.homeOnboardingHint, styles.homeOnboardingHintOffset, { bottom: Math.max(insets.bottom, 12) + 108 }]}>
            아래 버튼을 클릭해주세요!
          </Text>

          <Pressable
            onPress={handleHomeOnboardingNextPress}
            style={[styles.homeOnboardingNextButton, styles.homeOnboardingNextButtonOffset, { bottom: Math.max(insets.bottom, 12) + 48 }]}
          >
            <Text style={styles.homeOnboardingNextButtonLabel}>{'>'}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FDFDFD',
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: '#FFEC99',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroGlowPrimary: {
    backgroundColor: 'rgba(255, 249, 219, 0.9)',
    borderRadius: 220,
    height: 320,
    position: 'absolute',
    right: -80,
    top: 10,
    width: 320,
  },
  heroGlowSecondary: {
    backgroundColor: 'rgba(255, 187, 97, 0.16)',
    borderRadius: 260,
    bottom: -150,
    height: 320,
    left: -30,
    position: 'absolute',
    width: 360,
  },
  heroTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  heroPawIcon: {
    height: 34,
    tintColor: '#FFFFFF',
    width: 30,
  },
  emergencyButton: {
    alignItems: 'center',
    backgroundColor: '#FB8E76',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emergencyDot: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    height: 14,
    justifyContent: 'center',
    width: 14,
  },
  emergencyDotLabel: {
    color: '#FB8E76',
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 10,
  },
  emergencyButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTextBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 14,
  },
  heroTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.48,
    lineHeight: 29,
  },
  heroAccent: {
    color: '#FD7E14',
  },
  heroSubtitle: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 10,
  },
  heroSubtitleAccent: {
    color: '#FD7E14',
    fontWeight: '800',
  },
  profileFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  profileCircle: {
    alignItems: 'center',
    backgroundColor: '#F3F3F1',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  petAvatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    height: 76,
    width: 76,
  },
  profileBadge: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 12,
    bottom: 4,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 24,
  },
  profileBadgeLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 16,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: 'rgba(173, 138, 105, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  chevron: {
    color: '#D0CBC2',
    fontSize: 18,
    fontWeight: '700',
  },
  progressCaption: {
    color: '#A79189',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  progressCaptionAccent: {
    color: '#FFA94E',
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: '#F3F3F1',
    borderRadius: 999,
    height: 20,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#F5A54B',
    borderRadius: 999,
    height: '100%',
    minWidth: 0,
  },
  section: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footprintsCard: {
    borderRadius: 24,
    minHeight: 105,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: 'rgba(173, 138, 105, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  footprintsBackgroundImage: {
    bottom: 0,
    height: '130%',
    left: -12,
    position: 'absolute',
    right: -12,
    top: -10,
    width: undefined,
  },
  footprintsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footprintsTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    marginBottom: 16,
  },
  ctaButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFA94E',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 2,
    height: 27,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaButtonLabel: {
    color: '#FFFBEB',
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  ctaButtonChevron: {
    color: '#FFFBEB',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -1,
  },
  stampCounterCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: 'rgba(0, 0, 0, 0.11)',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3.2,
    width: 106,
  },
  stampRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: 8,
  },
  stampBubble: {
    backgroundColor: '#FFE599',
    borderColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 2,
    height: 26,
    marginRight: -6,
    width: 25,
  },
  stampBubblePrimary: {
    backgroundColor: '#FFA94E',
    borderRadius: 17,
    height: 33,
    width: 33,
  },
  stampCounterChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 250, 229, 0.9)',
    borderRadius: 8,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stampCounterAccent: {
    color: '#FD7E14',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  stampCounterLabel: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  memorialCard: {
    backgroundColor: 'rgba(79, 105, 134, 0.64)',
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: 'rgba(173, 138, 105, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  memorialTitle: {
    color: '#FFFBEB',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    marginBottom: 16,
  },
  memorialStarsImage: {
    height: 65,
    width: 81,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: 'rgba(173, 138, 105, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  infoCardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 57,
  },
  funeralIconStack: {
    height: 31,
    marginRight: 16,
    width: 38,
  },
  funeralIconBase: {
    height: 31,
    width: 38,
  },
  funeralIconHighlight: {
    height: 20,
    left: 19,
    position: 'absolute',
    top: 10,
    width: 20,
  },
  reviewIcon: {
    height: 35,
    marginRight: 16,
    width: 37,
  },
  infoTextBlock: {
    flex: 1,
    gap: 6,
  },
  infoTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  infoDescription: {
    color: '#A19895',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitle: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    bottom: 0,
    left: 0,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    shadowColor: '#AD8A69',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  bottomNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomNavItem: {
    alignItems: 'center',
    gap: 5,
    height: 48,
    justifyContent: 'center',
    width: 54,
  },
  bottomNavIconFrame: {
    alignItems: 'center',
    borderRadius: 4,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  bottomNavIconFrameActive: {
    backgroundColor: '#FFA94E',
  },
  bottomNavIcon: {
    height: 20,
    resizeMode: 'contain',
    width: 20,
  },
  bottomNavIconActive: {
    tintColor: '#FFFFFF',
  },
  bottomNavIconInactive: {
    tintColor: '#CECDCB',
  },
  bottomNavLabel: {
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  bottomNavLabelActive: {
    color: '#FFA94E',
  },
  bottomNavLabelInactive: {
    color: '#CECDCB',
  },
  modalRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    width: 312,
  },
  modalTextBlock: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  modalDescription: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
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
    height: 48,
    justifyContent: 'center',
  },
  modalSecondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E0DE',
    borderWidth: 2,
  },
  modalPrimaryButton: {
    backgroundColor: '#FFA94E',
  },
  modalSecondaryButtonLabel: {
    color: '#979691',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  modalPrimaryButtonLabel: {
    color: '#FFFBEB',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  reviewModalRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  reviewModalKeyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  reviewModalKeyboardContainer: {
    flex: 1,
    width: '100%',
  },
  reviewModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  reviewModalCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 17,
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    width: '100%',
  },
  reviewModalTextBlock: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 25,
  },
  reviewModalTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
  },
  reviewModalDescription: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  reviewModalContent: {
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
  },
  reviewImageScroller: {
    marginBottom: 16,
    width: '100%',
  },
  reviewImageScrollerContent: {
    gap: reviewImageSlotGap,
  },
  reviewImageSingleSlotRow: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  reviewImagePickerButton: {
    alignItems: 'center',
    backgroundColor: '#E1E0DE',
    borderRadius: 5,
    height: 170,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 170,
  },
  reviewSelectedImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  reviewTextField: {
    alignItems: 'flex-end',
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
  },
  reviewTextInput: {
    color: '#42302A',
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    paddingBottom: 0,
    paddingTop: 0,
  },
  reviewSendIcon: {
    height: 19,
    marginBottom: 2,
    marginLeft: 10,
    opacity: 0.7,
    width: 20,
  },
  reviewHelperText: {
    color: '#868686',
    fontFamily: 'sans-serif',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  reviewButtonStack: {
    gap: 8,
    width: '100%',
  },
  reviewPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  reviewPrimaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  reviewSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
  },
  reviewSecondaryButtonLabel: {
    color: '#979691',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  petSwitchModalRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  petSwitchModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
  },
  petSwitchModalCard: {
    backgroundColor: '#F7F6F4',
    borderRadius: 24,
    maxHeight: '84%',
    paddingHorizontal: 16,
    paddingTop: 28,
    width: '100%',
  },
  petSwitchCloseButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 18,
    width: 28,
    zIndex: 1,
  },
  petSwitchCloseButtonLabel: {
    color: '#534741',
    fontFamily: 'sans-serif',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  petSwitchHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  petSwitchTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'center',
  },
  petSwitchSubtitle: {
    color: '#A19895',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  petSwitchScrollContent: {
    gap: 20,
    paddingBottom: 12,
  },
  petSwitchSection: {
    gap: 10,
  },
  petSwitchSectionTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  petSwitchEmptyCard: {
    alignItems: 'center',
    backgroundColor: '#E1E0DE',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  petSwitchEmptyCardLabel: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  petSwitchAdditionalListScroll: {
    maxHeight: 328,
    width: '100%',
  },
  petSwitchAdditionalListContent: {
    gap: 10,
    width: '100%',
  },
  petSwitchCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  petSwitchCardActive: {
    backgroundColor: '#FFF7E8',
    borderColor: '#FFA94E',
    borderWidth: 2,
  },
  petSwitchCardLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  petSwitchAvatarCircle: {
    backgroundColor: '#ECE9E5',
    borderRadius: 20,
    height: 40,
    overflow: 'hidden',
    width: 40,
  },
  petSwitchAvatarCircleActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petSwitchAvatarImage: {
    height: 30,
    width: 30,
  },
  petSwitchAvatarImageCover: {
    resizeMode: 'cover',
  },
  petSwitchCardTextBlock: {
    flex: 1,
    gap: 3,
  },
  petSwitchCardName: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  petSwitchCardNameActive: {
    color: '#FD7E14',
  },
  petSwitchCardDetail: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  petSwitchCardDetailActive: {
    color: '#352622',
  },
  petSwitchCardRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginLeft: 12,
  },
  petSwitchCardStatus: {
    color: '#C5BFBA',
    fontFamily: 'sans-serif',
    fontSize: 10,
    lineHeight: 13,
  },
  petSwitchCardStatusActive: {
    color: '#FD7E14',
  },
  petSwitchCardChevron: {
    color: '#D8D3CD',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
  petSwitchCardChevronActive: {
    color: '#FFA94E',
  },
  petSwitchFooter: {
    gap: 12,
    paddingBottom: 20,
    paddingTop: 12,
  },
  petSwitchHelperText: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  petSwitchPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#F5A54B',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
  },
  petSwitchPrimaryButtonLabel: {
    color: '#FFFBEB',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  petSwitchConfirmModalRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  petSwitchConfirmModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
  },
  petSwitchConfirmModalCard: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 17,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    width: '100%',
  },
  petSwitchConfirmTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'center',
  },
  petSwitchConfirmTitleAccent: {
    color: '#FD7E14',
  },
  petSwitchConfirmAvatarWrapper: {
    marginTop: 18,
    marginBottom: 18,
  },
  petSwitchConfirmAvatarPlaceholder: {
    backgroundColor: '#C7C7C7',
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  petSwitchConfirmDescription: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 18,
    textAlign: 'center',
  },
  petSwitchConfirmButtonStack: {
    gap: 8,
    width: '100%',
  },
  petSwitchConfirmPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  petSwitchConfirmPrimaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  petSwitchConfirmSecondaryButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
  },
  petSwitchConfirmSecondaryButtonLabel: {
    color: '#979691',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  systemAlertRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  systemAlertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  systemAlertCard: {
    backgroundColor: 'rgba(245, 245, 245, 0.98)',
    borderRadius: 18,
    overflow: 'hidden',
    width: '100%',
  },
  systemAlertSplitCard: {
    backgroundColor: 'rgba(245, 245, 245, 0.98)',
    borderRadius: 18,
    overflow: 'hidden',
    width: 270,
  },
  systemAlertContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  systemAlertTitle: {
    color: '#111111',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  systemAlertDescription: {
    color: '#363636',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    textAlign: 'center',
  },
  systemAlertOption: {
    alignItems: 'center',
    borderTopColor: 'rgba(60, 60, 67, 0.2)',
    borderTopWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  systemAlertOptionLabel: {
    color: '#007AFF',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  systemAlertSplitRow: {
    borderTopColor: 'rgba(60, 60, 67, 0.2)',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  systemAlertSplitOption: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  actionSheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  actionSheetContainer: {
    paddingHorizontal: 20,
  },
  actionSheetCard: {
    backgroundColor: 'rgba(245, 245, 245, 0.98)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionSheetOption: {
    alignItems: 'center',
    borderTopColor: 'rgba(60, 60, 67, 0.2)',
    borderTopWidth: 1,
    justifyContent: 'center',
    minHeight: 60,
  },
  actionSheetOptionLabel: {
    color: '#007AFF',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  actionSheetCancelButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.98)',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 60,
  },
  actionSheetCancelLabel: {
    color: '#007AFF',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  galleryModalRoot: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  galleryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  galleryCloseButton: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  galleryCloseButtonLabel: {
    color: '#181818',
    fontFamily: 'sans-serif',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  gallerySegmentedControl: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 12,
    marginLeft: 84,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gallerySegmentActive: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    minWidth: 40,
    paddingHorizontal: 12,
  },
  gallerySegmentActiveLabel: {
    color: '#181818',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  gallerySegmentInactiveLabel: {
    color: '#181818',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginRight: 6,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  galleryGridItem: {
    height: 131,
    width: '33.3333%',
  },
  galleryTileSurface: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  galleryTileImage: {
    height: 92,
    width: 92,
  },
  cropModalRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  cropModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  cropModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 18,
    width: '100%',
  },
  cropModalTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 18,
    textAlign: 'center',
  },
  cropModalStage: {
    alignItems: 'center',
    backgroundColor: '#7A7777',
    height: 382,
    justifyContent: 'center',
    marginBottom: 22,
  },
  cropStageViewport: {
    height: profileCropStageSize,
    overflow: 'hidden',
    width: profileCropStageSize,
  },
  cropStageImage: {
    position: 'absolute',
  },
  cropTargetCircle: {
    borderColor: '#FFFFFF',
    position: 'absolute',
    borderWidth: 2,
  },
  cropTargetHandle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    height: 26,
    position: 'absolute',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    width: 26,
  },
  cropModalButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cropPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#F5A54B',
    borderRadius: 14,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  cropPrimaryButtonLabel: {
    color: '#FFFBEB',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  cropSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9D5D0',
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  cropSecondaryButtonLabel: {
    color: '#979691',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  homeOnboardingRoot: {
    flex: 1,
  },
  homeOnboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  homeOnboardingEmergencyAnchor: {
    position: 'absolute',
  },
  homeOnboardingEmergencyAnchorStepOne: {
    right: 20,
  },
  homeOnboardingEmergencyButton: {
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  homeOnboardingProfileAnchor: {
    position: 'absolute',
  },
  homeOnboardingProfileAnchorStepTwo: {
    right: 22,
  },
  homeOnboardingProfileOuter: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 54,
    height: 108,
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    width: 108,
  },
  homeOnboardingProfileInner: {
    alignItems: 'center',
    backgroundColor: '#F3F3F1',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 100,
  },
  homeOnboardingProfileImage: {
    height: 78,
    width: 78,
  },
  homeOnboardingConnector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    position: 'absolute',
    width: 2,
  },
  homeOnboardingConnectorStepOne: {
    height: 62,
    right: 43,
  },
  homeOnboardingConnectorStepTwo: {
    height: 54,
    right: 44,
  },
  homeOnboardingTextBlock: {
    alignItems: 'flex-end',
    position: 'absolute',
    width: 305,
  },
  homeOnboardingTextBlockOffset: {
    right: 24,
  },
  homeOnboardingTitle: {
    color: '#FFE599',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'right',
  },
  homeOnboardingDescription: {
    color: '#F9F9F9',
    fontFamily: 'sans-serif',
    fontSize: 14,
    lineHeight: 19,
    marginTop: 8,
    opacity: 0.96,
    textAlign: 'right',
  },
  homeOnboardingHint: {
    color: '#F9F9F9',
    fontFamily: 'sans-serif',
    fontSize: 14,
    lineHeight: 19,
    opacity: 0.85,
    position: 'absolute',
    textAlign: 'right',
  },
  homeOnboardingHintOffset: {
    right: 80,
  },
  homeOnboardingNextButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(188, 187, 183, 0.3)',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    width: 48,
  },
  homeOnboardingNextButtonOffset: {
    right: 22,
  },
  homeOnboardingNextButtonLabel: {
    color: '#F9F9F9',
    fontFamily: 'sans-serif',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 28,
    marginLeft: 2,
    marginTop: -1,
  },
});
