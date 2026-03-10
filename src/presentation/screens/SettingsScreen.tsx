import {
  ActionSheetIOS,
  Alert,
  BackHandler,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PetSummary } from '../../core/entities/pet';
import type { UserProfile } from '../../core/entities/user';
import {
  openAppSettings,
  requestCameraPermission,
  requestNotificationPermission,
  requestPhotoLibraryPermission,
} from '../../infrastructure/native/permissions';
import {
  readStoredBeforeFarewellHomeSnapshot,
  writeStoredBeforeFarewellHomeSnapshot,
} from '../../infrastructure/storage/beforeFarewellHomeStorage';
import { clearStoredEmergencyModeStates } from '../../infrastructure/storage/emergencyModeStorage';
import { clearStoredFarewellPreviewStates } from '../../infrastructure/storage/farewellPreviewStorage';
import { clearStoredFuneralCompaniesStates } from '../../infrastructure/storage/funeralCompaniesStorage';
import {
  appendStoredAddedInvitePet,
  readStoredAddedInvitePets,
  readStoredMockInvitePet,
  removeStoredAddedInvitePet,
  removeStoredMockInvitePet,
  writeStoredMockInvitePet,
} from '../../infrastructure/storage/mockInvitePetsStorage';
import {
  readStoredSettingsState,
  writeStoredSettingsState,
} from '../../infrastructure/storage/settingsStorage';
import { resolvePetEmojiAssetUri } from '../../shared/assets/petEmojiAssets';
import { AppBottomNavigation } from '../components/AppBottomNavigation';
import { resolveHomePreviewRoute } from '../navigation/resolveHomePreviewRoute';
import { useAppSessionStore } from '../stores/AppSessionStore';

type SettingsScreenMode =
  | 'main'
  | 'profile'
  | 'share'
  | 'notifications'
  | 'qna'
  | 'petSwitch'
  | 'terms'
  | 'privacy'
  | 'withdraw';

type ImageTarget = 'pet' | 'user' | null;

type CombinedPetEntry = {
  detail: string;
  id: string;
  isOwner: boolean;
  name: string;
  pet: PetSummary;
  profileImageUri: string;
  statusLabel: string;
};

type EditablePetForm = {
  birthDate: string;
  breedName: string;
  farewellDate: string;
  gender: string;
  name: string;
  weight: string;
};

const settingsHeaderTitles: Record<SettingsScreenMode, string> = {
  main: '설정',
  notifications: '알림',
  petSwitch: '반려동물 전환하기',
  privacy: '개인정보처리방침',
  profile: '정보 수정하기',
  qna: '자주 묻는 질문',
  share: '같이 기록하기',
  terms: '이용약관',
  withdraw: '탈퇴하기',
};

const qnaItems = [
  {
    answer: '정보 수정하기에서 현재 보고 있는 반려동물 이름, 세부 종, 생년월일, 몸무게와 성별을 수정할 수 있어요.',
    question: '반려동물 정보를 어디서 바꿀 수 있나요?',
  },
  {
    answer: '같이 기록하기에서 초대코드를 복사하거나 공유하고, 다른 아이의 초대코드를 입력해 새 아이를 연결할 수 있어요.',
    question: '다른 사람과 기록을 함께 남기려면 어떻게 하나요?',
  },
  {
    answer: '알림 페이지에서 댓글과 서비스 안내 알림을 각각 켜고 끌 수 있어요. 최초 허용 시 OS 권한 팝업이 함께 표시돼요.',
    question: '알림은 어떤 식으로 관리되나요?',
  },
] as const;

const termsContent = [
  '포에버 서비스는 반려동물과의 시간을 기록하고, 이별 전후에 필요한 정보를 제공하기 위해 운영됩니다.',
  '회원은 자신의 계정과 반려동물 정보를 최신 상태로 유지할 책임이 있습니다.',
  '서비스 내 작성한 댓글과 후기는 정책에 따라 보관될 수 있으며, 신고된 콘텐츠는 별도로 검토됩니다.',
  '탈퇴 시 일부 기록은 정책상 일정 기간 보관될 수 있습니다.',
].join('\n\n');

const privacyContent = [
  '포에버는 회원 식별과 서비스 제공을 위해 최소한의 개인정보를 수집합니다.',
  '반려동물 정보와 프로필 이미지는 사용자의 서비스 이용 흐름을 위해 저장됩니다.',
  '알림 수신 여부, 댓글 작성 정보, 공유 기록 등은 기능 제공과 안정성 확보를 위해 보관될 수 있습니다.',
  '회원은 언제든지 탈퇴를 요청할 수 있으며, 법령 또는 내부 보관정책에 따라 일부 정보는 일정 기간 유지될 수 있습니다.',
].join('\n\n');

const normalizeDashedDate = (value: string) => {
  const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 8);

  if (digitsOnly.length <= 4) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 6) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
  }

  return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6)}`;
};

const formatKoreanDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일`;
};

const calculateDaysSinceDate = (dateString: string | null | undefined) => {
  if (!dateString) {
    return 0;
  }

  const parsedDate = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = startOfToday.getTime() - parsedDate.getTime();

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const getPetGenderLabel = (gender: string | null | undefined) => {
  if (!gender) {
    return '성별';
  }

  if (gender.toUpperCase().includes('MALE')) {
    return '남아';
  }

  if (gender.toUpperCase().includes('FEMALE')) {
    return '여아';
  }

  return '성별';
};

const getPetStatusLabel = (pet: PetSummary) => {
  if (pet.lifecycleStatus === 'BEFORE_FAREWELL') {
    return `함께한 지 ${calculateDaysSinceDate(pet.birthDate)}일`;
  }

  if (pet.emergencyMode) {
    return '긴급 대처 모드';
  }

  return `추억한 지 ${calculateDaysSinceDate(pet.birthDate)}일`;
};

const generateInviteCode = () => String(Math.floor(10000000 + Math.random() * 90000000));

const showBlockedPermissionAlert = (title: string, message: string) => {
  Alert.alert(title, message, [
    { style: 'cancel', text: '닫기' },
    {
      text: '설정 열기',
      onPress: () => {
        openAppSettings().catch(() => undefined);
      },
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
    buttonIndex => {
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

const toCombinedPetEntry = (pet: PetSummary): CombinedPetEntry => ({
  detail: `${pet.breedName || '종'}/${getPetGenderLabel(pet.gender)}`,
  id: `${pet.id}:${pet.inviteCode}`,
  isOwner: pet.isOwner,
  name: pet.name,
  pet,
  profileImageUri: pet.profileImageUrl ?? resolvePetEmojiAssetUri(pet.animalTypeName),
  statusLabel: getPetStatusLabel(pet),
});

const dedupePets = (pets: PetSummary[]) => {
  const seenKeys = new Set<string>();

  return pets.filter(pet => {
    const key = `${pet.id}:${pet.inviteCode}`;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
};

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    closePreview,
    profile,
    replacePreview,
    selectedPet,
    session,
    signOut,
    switchSelectedPet,
    updateProfileLocally,
    updateSelectedPetLocally,
  } = useAppSessionStore();

  const [addedInvitePets, setAddedInvitePets] = useState<PetSummary[]>([]);
  const [imageTarget, setImageTarget] = useState<ImageTarget>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isImageSheetVisible, setImageSheetVisible] = useState(false);
  const [isInviteModalVisible, setInviteModalVisible] = useState(false);
  const [isLeavePetConfirmVisible, setLeavePetConfirmVisible] = useState(false);
  const [isLogoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [isMemberRemovalVisible, setMemberRemovalVisible] = useState(false);
  const [isResetFarewellConfirmVisible, setResetFarewellConfirmVisible] = useState(false);
  const [isSwitchConfirmVisible, setSwitchConfirmVisible] = useState(false);
  const [isWithdrawalConfirmVisible, setWithdrawalConfirmVisible] = useState(false);
  const [marketingNotificationEnabled, setMarketingNotificationEnabled] = useState(false);
  const [mode, setMode] = useState<SettingsScreenMode>('main');
  const [nicknameEditCount, setNicknameEditCount] = useState(0);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [openQnaQuestion, setOpenQnaQuestion] = useState<string | null>(null);
  const [pendingInvitePet, setPendingInvitePet] = useState<PetSummary | null>(null);
  const [pendingMemberRemovalPet, setPendingMemberRemovalPet] = useState<PetSummary | null>(null);
  const [pendingSwitchPet, setPendingSwitchPet] = useState<PetSummary | null>(null);
  const [profileForm, setProfileForm] = useState<EditablePetForm>({
    birthDate: '',
    breedName: '',
    farewellDate: '',
    gender: 'FEMALE',
    name: '',
    weight: '',
  });
  const [selectedUserImageUri, setSelectedUserImageUri] = useState<string | null>(null);
  const [storedGuardianName, setStoredGuardianName] = useState<string | null>(null);
  const [storedPetFarewellDate, setStoredPetFarewellDate] = useState<string | null>(null);
  const [storedPetImageUri, setStoredPetImageUri] = useState<string | null>(null);
  const [storedRegisteredOwnerPet, setStoredRegisteredOwnerPet] = useState<PetSummary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userNicknameDraft, setUserNicknameDraft] = useState('');
  const [withdrawalAgreed, setWithdrawalAgreed] = useState(false);

  const effectiveNickname = userNicknameDraft.trim()
    || profile?.nickname?.trim()
    || profile?.name?.trim()
    || storedGuardianName
    || '보호자';
  const effectiveUserProfileUri = selectedUserImageUri
    || profile?.profileImageUrl
    || resolvePetEmojiAssetUri(selectedPet?.animalTypeName);
  const effectivePetImageUri = storedPetImageUri
    || selectedPet?.profileImageUrl
    || resolvePetEmojiAssetUri(selectedPet?.animalTypeName);
  const isOwner = Boolean(selectedPet?.isOwner);
  const isAfterFarewell = selectedPet?.lifecycleStatus === 'AFTER_FAREWELL' && !selectedPet?.emergencyMode;
  const canEditPetInfo = isOwner;
  const canEditNickname = nicknameEditCount < 2;
  const ownerPetEntries = useMemo(
    () => dedupePets([
      ...(selectedPet?.isOwner && selectedPet ? [selectedPet] : []),
      ...(storedRegisteredOwnerPet ? [storedRegisteredOwnerPet] : []),
    ]).map(toCombinedPetEntry),
    [selectedPet, storedRegisteredOwnerPet],
  );
  const guestPetEntries = useMemo(
    () => dedupePets([
      ...(!selectedPet?.isOwner && selectedPet ? [selectedPet] : []),
      ...addedInvitePets,
    ]).map(toCombinedPetEntry),
    [addedInvitePets, selectedPet],
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateSettingsScreen = async () => {
      const [settingsState, homeSnapshot, storedAddedPets] = await Promise.all([
        readStoredSettingsState(),
        readStoredBeforeFarewellHomeSnapshot(),
        readStoredAddedInvitePets(),
      ]);

      if (!isMounted) {
        return;
      }

      setAddedInvitePets(storedAddedPets);
      setMarketingNotificationEnabled(settingsState.marketingNotificationEnabled);
      setNicknameEditCount(settingsState.nicknameEditCount);
      setNotificationEnabled(settingsState.notificationEnabled);
      setSelectedUserImageUri(settingsState.userProfileImageUri);
      setStoredGuardianName(homeSnapshot.guardianName);
      setStoredPetFarewellDate(homeSnapshot.petFarewellDate);
      setStoredPetImageUri(homeSnapshot.petProfileImageUri);
      setStoredRegisteredOwnerPet(homeSnapshot.registeredOwnerPet);
      setUserNicknameDraft(settingsState.userNicknameOverride
        || profile?.nickname?.trim()
        || profile?.name?.trim()
        || homeSnapshot.guardianName
        || '');
    };

    hydrateSettingsScreen();

    return () => {
      isMounted = false;
    };
  }, [profile?.name, profile?.nickname, selectedPet?.id]);

  useEffect(() => {
    setProfileForm({
      birthDate: normalizeDashedDate(selectedPet?.birthDate || ''),
      breedName: selectedPet?.breedName || '',
      farewellDate: normalizeDashedDate(storedPetFarewellDate || ''),
      gender: selectedPet?.gender?.toUpperCase().includes('MALE') ? 'MALE' : 'FEMALE',
      name: selectedPet?.name || '',
      weight: selectedPet?.weight ? String(selectedPet.weight) : '',
    });
  }, [selectedPet, storedPetFarewellDate]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 1800);

    return () => {
      clearTimeout(timeout);
    };
  }, [toastMessage]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode !== 'main') {
        setMode('main');
        return true;
      }

      closePreview();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [closePreview, mode]);

  const persistSettingsState = async (nextState: {
    marketingNotificationEnabled?: boolean;
    nicknameEditCount?: number;
    notificationEnabled?: boolean;
    userNicknameOverride?: string | null;
    userProfileImageUri?: string | null;
  }) => {
    await writeStoredSettingsState(nextState);
  };

  const handleSelectImageAsset = (asset: Asset) => {
    if (!asset.uri) {
      return;
    }

    if (imageTarget === 'user') {
      setSelectedUserImageUri(asset.uri);
    }

    if (imageTarget === 'pet') {
      setStoredPetImageUri(asset.uri);
    }

    setImageTarget(null);
  };

  const handleOpenGallery = async () => {
    setImageSheetVisible(false);
    const permissionResult = await requestPhotoLibraryPermission();

    if (!permissionResult.granted) {
      if (permissionResult.blocked) {
        showBlockedPermissionAlert(
          '사진 권한이 필요해요',
          '이미지를 변경하려면 설정에서 사진 권한을 허용해 주세요.',
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
    setImageSheetVisible(false);
    const permissionResult = await requestCameraPermission();

    if (!permissionResult.granted) {
      if (permissionResult.blocked) {
        showBlockedPermissionAlert(
          '카메라 권한이 필요해요',
          '이미지를 촬영하려면 설정에서 카메라 권한을 허용해 주세요.',
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

  const handleOpenImagePicker = (target: ImageTarget) => {
    setImageTarget(target);

    if (showNativeImageSourceActionSheet({
      onAlbumPress: handleOpenGallery,
      onCameraPress: handleOpenCamera,
      onCancel: () => {
        setImageTarget(null);
      },
    })) {
      return;
    }

    setImageSheetVisible(true);
  };

  const handleSaveProfileChanges = async () => {
    if (!selectedPet) {
      return;
    }

    const trimmedNickname = userNicknameDraft.trim();
    const previousNickname = profile?.nickname?.trim() || profile?.name?.trim() || storedGuardianName || '';
    const hasNicknameChanged = trimmedNickname.length > 0 && trimmedNickname !== previousNickname;
    const nextNicknameEditCount = hasNicknameChanged ? Math.min(2, nicknameEditCount + 1) : nicknameEditCount;

    if (hasNicknameChanged && nicknameEditCount >= 2) {
      setToastMessage('닉네임은 최대 2회까지 수정할 수 있어요');
      return;
    }

    const nextProfileImageUri = selectedUserImageUri || profile?.profileImageUrl || null;

    await persistSettingsState({
      nicknameEditCount: nextNicknameEditCount,
      userNicknameOverride: trimmedNickname || previousNickname,
      userProfileImageUri: nextProfileImageUri,
    });

    if (hasNicknameChanged || nextProfileImageUri !== profile?.profileImageUrl) {
      updateProfileLocally((currentProfile): UserProfile | null => {
        if (!currentProfile) {
          return currentProfile;
        }

        return {
          ...currentProfile,
          nickname: trimmedNickname || currentProfile.nickname,
          profileImageUrl: nextProfileImageUri,
        };
      });
      setNicknameEditCount(nextNicknameEditCount);
    }

    if (canEditPetInfo) {
      const normalizedBirthDate = normalizeDashedDate(profileForm.birthDate);
      const normalizedFarewellDate = normalizeDashedDate(profileForm.farewellDate);
      const nextWeight = Number(profileForm.weight.replace(/[^0-9.]/g, ''));
      const nextPet: PetSummary = {
        ...selectedPet,
        birthDate: normalizedBirthDate || null,
        breedName: profileForm.breedName.trim() || selectedPet.breedName,
        gender: profileForm.gender === 'MALE' ? 'MALE' : 'FEMALE',
        name: profileForm.name.trim() || selectedPet.name,
        profileImageUrl: storedPetImageUri || selectedPet.profileImageUrl,
        weight: Number.isFinite(nextWeight) && profileForm.weight.trim() ? nextWeight : null,
      };

      updateSelectedPetLocally(() => nextPet);

      await writeStoredBeforeFarewellHomeSnapshot({
        guardianName: trimmedNickname || previousNickname || null,
        petBirthDate: nextPet.birthDate,
        petFarewellDate: isAfterFarewell ? (normalizedFarewellDate || storedPetFarewellDate) : null,
        petName: nextPet.name,
        petProfileImageHeight: 0,
        petProfileImageUri: storedPetImageUri,
        petProfileImageWidth: 0,
        registeredOwnerPet: selectedPet.isOwner ? nextPet : undefined,
      });
    }

    setToastMessage('정보가 저장되었어요');
    setMode('main');
  };

  const applyLocalPetSelection = async (pet: PetSummary) => {
    updateSelectedPetLocally(() => ({ ...pet, selected: true }));

    await writeStoredBeforeFarewellHomeSnapshot({
      petBirthDate: pet.birthDate,
      petFarewellDate: pet.lifecycleStatus === 'AFTER_FAREWELL' && !pet.emergencyMode ? storedPetFarewellDate : null,
      petName: pet.name,
      petProfileImageUri: pet.profileImageUrl,
      registeredOwnerPet: pet.isOwner ? pet : undefined,
    });

    setStoredPetImageUri(pet.profileImageUrl);
    setStoredPetFarewellDate(pet.lifecycleStatus === 'AFTER_FAREWELL' ? storedPetFarewellDate : null);
  };

  const handleConfirmSwitchPet = async () => {
    if (!pendingSwitchPet) {
      return;
    }

    try {
      if (pendingSwitchPet.id > 0 && session) {
        await switchSelectedPet(pendingSwitchPet.id);
      } else {
        await applyLocalPetSelection(pendingSwitchPet);
      }

      setSwitchConfirmVisible(false);
      setPendingSwitchPet(null);
      setToastMessage(`${pendingSwitchPet.name}로 전환했어요`);
      replacePreview(resolveHomePreviewRoute(pendingSwitchPet));
    } catch {
      setToastMessage('반려동물 전환에 실패했어요');
    }
  };

  const handleOpenInviteCodeRegistration = () => {
    setInviteCodeInput('');
    setPendingInvitePet(null);
    setInviteModalVisible(true);
  };

  const handleValidateInviteCode = async () => {
    const normalizedInviteCode = inviteCodeInput.trim().toUpperCase();

    if (normalizedInviteCode.length !== 8) {
      setToastMessage('8자리 초대코드를 입력해 주세요');
      return;
    }

    if (normalizedInviteCode === selectedPet?.inviteCode) {
      setToastMessage('현재 보고 있는 아이의 초대코드입니다');
      return;
    }

    const mockPet = await readStoredMockInvitePet(normalizedInviteCode);

    if (!mockPet) {
      setToastMessage('유효한 초대코드를 찾지 못했어요');
      return;
    }

    setPendingInvitePet({ ...mockPet, selected: false });
  };

  const handleRegisterInvitePet = async (shouldOpenProfile: boolean) => {
    if (!pendingInvitePet) {
      return;
    }

    await appendStoredAddedInvitePet(pendingInvitePet);
    const nextAddedPets = await readStoredAddedInvitePets();
    setAddedInvitePets(nextAddedPets);
    setInviteModalVisible(false);
    setPendingInvitePet(null);
    setInviteCodeInput('');
    setToastMessage(`${pendingInvitePet.name}가 추가되었어요`);

    if (shouldOpenProfile) {
      await applyLocalPetSelection({ ...pendingInvitePet, selected: true });
      setMode('profile');
    }
  };

  const handleReissueInviteCode = async () => {
    if (!selectedPet || !isOwner) {
      return;
    }

    const nextInviteCode = generateInviteCode();
    const nextPet = {
      ...selectedPet,
      inviteCode: nextInviteCode,
    };

    if (selectedPet.inviteCode) {
      await removeStoredMockInvitePet(selectedPet.inviteCode);
    }

    await writeStoredMockInvitePet(nextInviteCode, nextPet);
    updateSelectedPetLocally(() => nextPet);
    setToastMessage('초대코드를 재발급했어요');
  };

  const handleCopyInviteCode = () => {
    if (!selectedPet?.inviteCode) {
      return;
    }

    setToastMessage('초대코드를 복사했어요');
  };

  const handleShareInviteCode = () => {
    if (!selectedPet?.inviteCode) {
      return;
    }

    Share.share({
      message: `포에버에서 함께 기록해요. 초대코드: ${selectedPet.inviteCode}`,
      title: '우리 아이 초대코드',
    }).catch(() => undefined);
  };

  const handleRemoveMember = async () => {
    if (!pendingMemberRemovalPet) {
      return;
    }

    await removeStoredAddedInvitePet(pendingMemberRemovalPet.id);
    const nextAddedPets = await readStoredAddedInvitePets();
    setAddedInvitePets(nextAddedPets);
    setMemberRemovalVisible(false);
    setPendingMemberRemovalPet(null);
    setToastMessage('기록 공유를 중단했어요');
  };

  const handleToggleNotification = async (nextValue: boolean, type: 'main' | 'marketing') => {
    if (nextValue) {
      const permissionResult = await requestNotificationPermission();

      if (!permissionResult.granted) {
        if (permissionResult.blocked) {
          showBlockedPermissionAlert(
            '알림 권한이 필요해요',
            '알림을 받으려면 설정에서 알림 권한을 허용해 주세요.',
          );
        }
        return;
      }
    }

    if (type === 'main') {
      setNotificationEnabled(nextValue);
      await persistSettingsState({ notificationEnabled: nextValue });
      setToastMessage(nextValue
        ? '알림 설정 완료! 소중한 순간들을 놓치지 마세요.'
        : `${formatKoreanDate(new Date())} 알림 수신이 거부되었습니다.`);
      return;
    }

    setMarketingNotificationEnabled(nextValue);
    await persistSettingsState({ marketingNotificationEnabled: nextValue });
    setToastMessage(nextValue
      ? '새로운 기능이 추가되면 안내드릴게요!'
      : `${formatKoreanDate(new Date())} 알림 수신이 거부되었습니다.`);
  };

  const handleConfirmResetFarewell = async () => {
    if (!selectedPet) {
      return;
    }

    const nextPet: PetSummary = {
      ...selectedPet,
      emergencyMode: false,
      lifecycleStatus: 'BEFORE_FAREWELL',
    };

    await Promise.all([
      clearStoredEmergencyModeStates(),
      clearStoredFarewellPreviewStates(),
      clearStoredFuneralCompaniesStates(),
      writeStoredBeforeFarewellHomeSnapshot({
        petFarewellDate: null,
        petName: nextPet.name,
        registeredOwnerPet: selectedPet.isOwner ? nextPet : undefined,
      }),
    ]);

    updateSelectedPetLocally(() => nextPet);
    setStoredPetFarewellDate(null);
    setResetFarewellConfirmVisible(false);
    replacePreview('beforeFarewellHome');
  };

  const handleConfirmLeavePet = async () => {
    if (!selectedPet || !selectedPet.isOwner) {
      return;
    }

    const guestPet = {
      ...selectedPet,
      isOwner: false,
      selected: true,
    };

    await appendStoredAddedInvitePet(guestPet);
    await writeStoredBeforeFarewellHomeSnapshot({
      registeredOwnerPet: null,
    });
    updateSelectedPetLocally(() => guestPet);
    setStoredRegisteredOwnerPet(null);
    setAddedInvitePets(await readStoredAddedInvitePets());
    setLeavePetConfirmVisible(false);
    setToastMessage('이제 이 아이는 함께 기록 중인 아이로 이동했어요');
  };

  const handleConfirmWithdraw = () => {
    const withdrawalToast = `${formatKoreanDate(new Date())} 포에버 서비스 회원탈퇴가 완료되었습니다.`;
    setToastMessage(withdrawalToast);
    setWithdrawalConfirmVisible(false);

    setTimeout(() => {
      signOut();
    }, 800);
  };

  const renderPanelHeader = ({
    eyebrow,
    title,
    description,
  }: {
    description?: string;
    eyebrow?: string;
    title: string;
  }) => (
    <View style={styles.panelHeader}>
      {eyebrow ? <Text style={styles.panelEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.panelTitle}>{title}</Text>
      {description ? <Text style={styles.panelDescription}>{description}</Text> : null}
    </View>
  );

  const renderMenuRow = ({
    tag,
    title,
    description,
    onPress,
    tone = 'soft',
    isFirst = false,
  }: {
    description: string;
    isFirst?: boolean;
    onPress: () => void;
    tag: string;
    title: string;
    tone?: 'accent' | 'danger' | 'soft';
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.menuListRow, !isFirst ? styles.menuListRowBorder : null]}
    >
      <View
        style={[
          styles.menuTag,
          tone === 'accent' ? styles.menuTagAccent : null,
          tone === 'danger' ? styles.menuTagDanger : null,
        ]}
      >
        <Text
          style={[
            styles.menuTagLabel,
            tone === 'accent' ? styles.menuTagLabelAccent : null,
            tone === 'danger' ? styles.menuTagLabelDanger : null,
          ]}
        >
          {tag}
        </Text>
      </View>
      <View style={styles.menuRowContent}>
        <Text style={[styles.menuRowTitle, tone === 'danger' ? styles.menuRowTitleDanger : null]}>{title}</Text>
        <Text style={styles.menuRowDescription}>{description}</Text>
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );

  const renderMainPage = () => (
    <View style={styles.sectionGroup}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadgeRow}>
          <View style={[styles.heroPill, isOwner ? styles.heroPillPrimary : styles.heroPillMuted]}>
            <Text style={[styles.heroPillLabel, isOwner ? styles.heroPillLabelPrimary : null]}>
              {isOwner ? 'Owner' : 'Guest'}
            </Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillLabel}>
              {selectedPet?.emergencyMode ? '긴급 대처 모드' : isAfterFarewell ? '이별 후' : '이별 전'}
            </Text>
          </View>
        </View>
        <View style={styles.heroIdentityRow}>
          <Image source={{ uri: effectiveUserProfileUri }} style={styles.userAvatar} />
          <View style={styles.profileSummaryBody}>
            <Text style={styles.profileSummaryName}>{effectiveNickname}</Text>
            <Text style={styles.profileSummaryCaption}>
              {selectedPet
                ? `${selectedPet.name}와 함께 기록을 이어가고 있어요`
                : '연결된 반려동물이 없어요'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => setMode('profile')} style={styles.heroActionButton}>
          <Text style={styles.heroActionButtonLabel}>정보 수정하기</Text>
        </Pressable>
      </View>

      <View style={styles.menuGroupPanel}>
        <View style={styles.menuGroupHeader}>
          {renderPanelHeader({
            eyebrow: 'CONNECT',
            title: '기록과 연결을 정리해요',
            description: '지금 함께 기록 중인 사람과 반려동물 연결 상태를 관리해요.',
          })}
        </View>
        {renderMenuRow({
          description: '초대코드 공유와 연결된 멤버를 관리해요',
          isFirst: true,
          onPress: () => setMode('share'),
          tag: '공유',
          title: '같이 기록하기',
          tone: 'accent',
        })}
        {renderMenuRow({
          description: '등록한 아이와 추가한 아이 사이를 전환해요',
          onPress: () => setMode('petSwitch'),
          tag: '전환',
          title: '반려동물 전환하기',
        })}
      </View>

      <View style={styles.menuGroupPanel}>
        <View style={styles.menuGroupHeader}>
          {renderPanelHeader({
            eyebrow: 'SERVICE',
            title: '앱 사용 환경을 조정해요',
            description: '알림, 자주 묻는 질문, 서비스 안내 문서를 한곳에서 볼 수 있어요.',
          })}
        </View>
        {renderMenuRow({
          description: '댓글과 서비스 소식을 받는 방식을 조정해요',
          isFirst: true,
          onPress: () => setMode('notifications'),
          tag: '알림',
          title: '알림',
        })}
        {renderMenuRow({
          description: '자주 문의되는 내용을 빠르게 확인해요',
          onPress: () => setMode('qna'),
          tag: 'Q&A',
          title: '자주 묻는 질문',
        })}
        {renderMenuRow({
          description: '서비스 이용 기준과 보관 정책을 확인해요',
          onPress: () => setMode('terms'),
          tag: '약관',
          title: '이용약관',
        })}
        {renderMenuRow({
          description: '개인정보 수집과 이용 기준을 확인해요',
          onPress: () => setMode('privacy'),
          tag: '정책',
          title: '개인정보처리방침',
        })}
      </View>

      <View style={styles.menuGroupPanel}>
        <View style={styles.menuGroupHeader}>
          {renderPanelHeader({
            eyebrow: 'ACCOUNT',
            title: '계정 상태를 관리해요',
            description: '로그아웃과 같은 계정 액션을 정리할 수 있어요.',
          })}
        </View>
        {renderMenuRow({
          description: '현재 기기에서 로그인 정보를 해제하고 처음 화면으로 돌아가요',
          isFirst: true,
          onPress: () => setLogoutConfirmVisible(true),
          tag: '계정',
          title: '로그아웃',
          tone: 'danger',
        })}
      </View>

      <Text style={styles.versionLabel}>버전 0.0.1</Text>
    </View>
  );

  const renderProfilePage = () => (
    <View style={styles.sectionGroup}>
      <View style={styles.profileHeroCard}>
        <View style={styles.heroIdentityRow}>
          <Image source={{ uri: effectiveUserProfileUri }} style={styles.largeAvatar} />
          <View style={styles.profileSummaryBody}>
            <Text style={styles.profileSummaryName}>{effectiveNickname}</Text>
            <Text style={styles.profileSummaryCaption}>
              {selectedPet
                ? `${selectedPet.name}의 정보와 내 프로필을 함께 관리해요`
                : '내 정보만 수정할 수 있어요'}
            </Text>
          </View>
        </View>
        <View style={styles.heroBadgeRow}>
          <View style={[styles.heroPill, isOwner ? styles.heroPillPrimary : styles.heroPillMuted]}>
            <Text style={[styles.heroPillLabel, isOwner ? styles.heroPillLabelPrimary : null]}>
              {isOwner ? '반려동물 정보 수정 가능' : '반려동물 정보 조회 전용'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.editorCard}>
        {renderPanelHeader({
          eyebrow: 'PROFILE',
          title: '내 정보',
          description: '닉네임과 프로필 이미지를 관리해요.',
        })}
        <View style={styles.avatarEditorRow}>
          <Pressable onPress={() => handleOpenImagePicker('user')} style={styles.avatarEditorButton}>
            <Image source={{ uri: effectiveUserProfileUri }} style={styles.largeAvatar} />
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditLabel}>✎</Text>
            </View>
          </Pressable>
          <View style={styles.editorMeta}>
            <Text style={styles.fieldLabel}>닉네임</Text>
            <TextInput
              editable={canEditNickname}
              onChangeText={setUserNicknameDraft}
              placeholder="닉네임을 입력해 주세요"
              placeholderTextColor="#A29284"
              style={[styles.fieldInput, !canEditNickname ? styles.fieldInputDisabled : null]}
              value={userNicknameDraft}
            />
            <Text style={styles.helperText}>
              {canEditNickname ? `남은 수정 횟수 ${2 - nicknameEditCount}회` : '닉네임은 최대 2회까지 수정할 수 있어요'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.editorCard, !canEditPetInfo ? styles.disabledPetCard : null]}>
        {renderPanelHeader({
          eyebrow: 'PET',
          title: '반려동물 정보',
          description: canEditPetInfo
            ? '현재 보고 있는 반려동물의 기본 정보를 수정할 수 있어요.'
            : '초대코드로 함께하는 경우 반려동물 정보는 조회만 가능해요.',
        })}
        {!canEditPetInfo ? (
          <Text style={styles.helperText}>Owner만 반려동물 정보를 수정할 수 있어요.</Text>
        ) : null}
        <View style={styles.petEditorHeader}>
          <Pressable
            disabled={!canEditPetInfo}
            onPress={() => handleOpenImagePicker('pet')}
            style={styles.petAvatarEditorButton}
          >
            <Image source={{ uri: effectivePetImageUri }} style={styles.petAvatarPreview} />
            {canEditPetInfo ? (
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditLabel}>✎</Text>
              </View>
            ) : null}
          </Pressable>
          <View style={styles.petEditorSummary}>
            <Text style={styles.petEditorName}>{selectedPet?.name ?? '반려동물'}</Text>
            <Text style={styles.petEditorSummaryText}>
              {selectedPet ? `${selectedPet.animalTypeName} · ${selectedPet.breedName}` : '연결된 아이 정보가 없어요'}
            </Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>이름</Text>
        <TextInput
          editable={canEditPetInfo}
          onChangeText={value => setProfileForm(currentForm => ({ ...currentForm, name: value }))}
          placeholder="이름을 입력해 주세요"
          placeholderTextColor="#A29284"
          style={[styles.fieldInput, !canEditPetInfo ? styles.fieldInputDisabled : null]}
          value={profileForm.name}
        />

        <Text style={styles.fieldLabel}>세부 종</Text>
        <TextInput
          editable={canEditPetInfo}
          onChangeText={value => setProfileForm(currentForm => ({ ...currentForm, breedName: value }))}
          placeholder="세부 종을 입력해 주세요"
          placeholderTextColor="#A29284"
          style={[styles.fieldInput, !canEditPetInfo ? styles.fieldInputDisabled : null]}
          value={profileForm.breedName}
        />

        <Text style={styles.fieldLabel}>생년월일</Text>
        <TextInput
          editable={canEditPetInfo}
          keyboardType="number-pad"
          maxLength={10}
          onChangeText={value => setProfileForm(currentForm => ({ ...currentForm, birthDate: normalizeDashedDate(value) }))}
          placeholder="0000-00-00"
          placeholderTextColor="#A29284"
          style={[styles.fieldInput, !canEditPetInfo ? styles.fieldInputDisabled : null]}
          value={profileForm.birthDate}
        />

        {isAfterFarewell ? (
          <>
            <Text style={styles.fieldLabel}>이별일자</Text>
            <TextInput
              editable={canEditPetInfo}
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={value => setProfileForm(currentForm => ({ ...currentForm, farewellDate: normalizeDashedDate(value) }))}
              placeholder="0000-00-00"
              placeholderTextColor="#A29284"
              style={[styles.fieldInput, !canEditPetInfo ? styles.fieldInputDisabled : null]}
              value={profileForm.farewellDate}
            />
          </>
        ) : null}

        <Text style={styles.fieldLabel}>몸무게(kg)</Text>
        <TextInput
          editable={canEditPetInfo}
          keyboardType="decimal-pad"
          onChangeText={value => setProfileForm(currentForm => ({ ...currentForm, weight: value.replace(/[^0-9.]/g, '') }))}
          placeholder="예: 4.2"
          placeholderTextColor="#A29284"
          style={[styles.fieldInput, !canEditPetInfo ? styles.fieldInputDisabled : null]}
          value={profileForm.weight}
        />

        <Text style={styles.fieldLabel}>성별</Text>
        <View style={styles.genderButtonRow}>
          {[
            { label: '남아', value: 'MALE' },
            { label: '여아', value: 'FEMALE' },
          ].map(option => (
            <Pressable
              key={option.value}
              disabled={!canEditPetInfo}
              onPress={() => setProfileForm(currentForm => ({ ...currentForm, gender: option.value }))}
              style={[
                styles.genderButton,
                profileForm.gender === option.value ? styles.genderButtonActive : null,
                !canEditPetInfo ? styles.genderButtonDisabled : null,
              ]}
            >
              <Text
                style={[
                  styles.genderButtonLabel,
                  profileForm.gender === option.value ? styles.genderButtonLabelActive : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {selectedPet?.lifecycleStatus === 'AFTER_FAREWELL' ? (
        <Pressable
          disabled={!selectedPet?.isOwner}
          onPress={() => setResetFarewellConfirmVisible(true)}
          style={[
            styles.outlineWarningButton,
            !selectedPet?.isOwner ? styles.outlineWarningButtonDisabled : null,
          ]}
        >
          <Text style={styles.outlineWarningButtonLabel}>아이가 아직 곁에 있나요?</Text>
        </Pressable>
      ) : null}

      {selectedPet?.isOwner ? (
        <Pressable onPress={() => setLeavePetConfirmVisible(true)} style={styles.secondaryMenuCard}>
          <Text style={styles.secondaryMenuTitle}>반려동물 탈퇴하기</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={() => setMode('withdraw')} style={styles.secondaryMenuCard}>
        <Text style={styles.secondaryMenuTitle}>탈퇴하기</Text>
      </Pressable>

      <Pressable onPress={() => handleSaveProfileChanges().catch(() => undefined)} style={styles.primaryFooterButton}>
        <Text style={styles.primaryFooterButtonLabel}>완료</Text>
      </Pressable>
    </View>
  );

  const renderSharePage = () => {
    const memberEntries = [
      ...(ownerPetEntries.length > 0 ? ownerPetEntries : []),
      ...guestPetEntries.filter(entry => !entry.pet.isOwner),
    ];

    return (
      <View style={styles.sectionGroup}>
        <View style={styles.inviteHighlightCard}>
          {renderPanelHeader({
            eyebrow: 'INVITE',
            title: '우리 아이 초대 코드',
            description: '초대코드를 공유해 같은 아이의 기록을 함께 남길 수 있어요.',
          })}
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeLabel}>{selectedPet?.inviteCode ?? '--------'}</Text>
          </View>
          <View style={styles.dualActionRow}>
            <Pressable onPress={handleCopyInviteCode} style={styles.dualActionButtonMuted}>
              <Text style={styles.dualActionButtonMutedLabel}>초대코드 복사하기</Text>
            </Pressable>
            <Pressable onPress={handleShareInviteCode} style={styles.dualActionButtonPrimary}>
              <Text style={styles.dualActionButtonPrimaryLabel}>카카오톡으로 공유하기</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.editorCard}>
          {renderPanelHeader({
            eyebrow: 'MEMBERS',
            title: '같이 기록 중인 멤버',
            description: 'Owner와 Guest를 구분해서 현재 연결된 멤버를 확인할 수 있어요.',
          })}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.memberRow}>
              {memberEntries.map(entry => (
                <View key={entry.id} style={styles.memberCard}>
                  <View style={styles.memberAvatarWrap}>
                    <Image source={{ uri: entry.profileImageUri }} style={styles.memberAvatar} />
                    {entry.isOwner ? <Text style={styles.memberCrown}>👑</Text> : null}
                  </View>
                  <Text style={styles.memberName}>{entry.name}</Text>
                  <Text style={styles.memberCaption}>{entry.isOwner ? 'Owner' : 'Guest'}</Text>
                  {isOwner && !entry.isOwner ? (
                    <Pressable
                      onPress={() => {
                        setPendingMemberRemovalPet(entry.pet);
                        setMemberRemovalVisible(true);
                      }}
                      style={styles.memberRemoveButton}
                    >
                      <Text style={styles.memberRemoveButtonLabel}>제거</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.editorCard}>
          {renderPanelHeader({
            eyebrow: 'ADD PET',
            title: '다른 아이와 연결하기',
            description: '다른 반려동물의 초대코드를 입력해 추가로 기록을 이어갈 수 있어요.',
          })}
          <Pressable onPress={handleOpenInviteCodeRegistration} style={styles.menuCard}>
            <Text style={styles.menuTitle}>초대코드로 다른 아이 등록하기</Text>
            <Text style={styles.menuDescription}>다른 아이의 초대코드를 입력해서 함께 기록해요</Text>
          </Pressable>
          {isOwner ? (
            <Pressable onPress={() => handleReissueInviteCode().catch(() => undefined)} style={styles.secondaryMenuCard}>
              <Text style={styles.secondaryMenuTitle}>초대코드 재발급</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderNotificationsPage = () => (
    <View style={styles.sectionGroup}>
      <View style={styles.menuGroupPanel}>
        <View style={styles.menuGroupHeader}>
          {renderPanelHeader({
            eyebrow: 'NOTIFICATION',
            title: '알림 수신 범위를 선택해요',
            description: 'OS 권한을 허용하면 필요한 순간에만 알림을 받을 수 있어요.',
          })}
        </View>
        <View style={styles.toggleCard}>
          <View style={styles.toggleMeta}>
            <Text style={styles.menuTitle}>알림 수신</Text>
            <Text style={styles.menuDescription}>댓글과 추모관 소식을 받아볼 수 있어요</Text>
          </View>
          <Switch
            onValueChange={value => {
              handleToggleNotification(value, 'main').catch(() => undefined);
            }}
            trackColor={{ false: '#D0C3B8', true: '#FFD67A' }}
            value={notificationEnabled}
          />
        </View>
        <View style={[styles.toggleCard, styles.toggleCardBorder]}>
          <View style={styles.toggleMeta}>
            <Text style={styles.menuTitle}>마케팅 수신</Text>
            <Text style={styles.menuDescription}>새 기능과 서비스 소식을 받아볼 수 있어요</Text>
          </View>
          <Switch
            onValueChange={value => {
              handleToggleNotification(value, 'marketing').catch(() => undefined);
            }}
            trackColor={{ false: '#D0C3B8', true: '#FFD67A' }}
            value={marketingNotificationEnabled}
          />
        </View>
      </View>
    </View>
  );

  const renderQnaPage = () => (
    <View style={styles.sectionGroup}>
      <View style={styles.sectionIntroCard}>
        {renderPanelHeader({
          eyebrow: 'HELP',
          title: '자주 묻는 질문',
          description: '설정과 연결, 알림 관련 질문을 먼저 확인해 보세요.',
        })}
      </View>
      {qnaItems.map(item => {
        const isOpen = openQnaQuestion === item.question;

        return (
          <Pressable
            key={item.question}
            onPress={() => setOpenQnaQuestion(currentQuestion => currentQuestion === item.question ? null : item.question)}
            style={styles.qnaCard}
          >
            <View style={styles.qnaHeader}>
              <Text style={styles.qnaQuestion}>{item.question}</Text>
              <Text style={styles.qnaToggle}>{isOpen ? '−' : '+'}</Text>
            </View>
            {isOpen ? <Text style={styles.qnaAnswer}>{item.answer}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );

  const renderPetSwitchPage = () => (
    <View style={styles.sectionGroup}>
      <View style={styles.editorCard}>
        {renderPanelHeader({
          eyebrow: 'OWNER PETS',
          title: '내가 등록한 아이 프로필',
          description: '직접 등록한 반려동물은 이 섹션에서 먼저 확인해요.',
        })}
        {ownerPetEntries.length > 0 ? ownerPetEntries.map(entry => (
          <Pressable
            key={entry.id}
            onPress={() => {
              setPendingSwitchPet(entry.pet);
              setSwitchConfirmVisible(true);
            }}
            style={[
              styles.petSwitchCard,
              selectedPet?.id === entry.pet.id ? styles.petSwitchCardActive : null,
            ]}
          >
            <Image source={{ uri: entry.profileImageUri }} style={styles.switchPetAvatar} />
            <View style={styles.switchPetMeta}>
              <Text style={styles.switchPetName}>{entry.name}</Text>
              <Text style={styles.switchPetDetail}>{entry.detail}</Text>
              <Text style={styles.switchPetStatus}>{entry.statusLabel}</Text>
            </View>
            {selectedPet?.id === entry.pet.id ? (
              <View style={styles.currentPetChip}>
                <Text style={styles.currentPetChipLabel}>현재</Text>
              </View>
            ) : null}
          </Pressable>
        )) : (
          <View style={styles.emptyPetCard}>
            <Text style={styles.emptyPetTitle}>내가 등록한 아이가 없어요</Text>
          </View>
        )}
      </View>

      <View style={styles.editorCard}>
        {renderPanelHeader({
          eyebrow: 'GUEST PETS',
          title: '추가한 아이 프로필',
          description: '초대코드로 함께 기록 중인 반려동물은 이 섹션에 모여요.',
        })}
        {guestPetEntries.length > 0 ? guestPetEntries.map(entry => (
          <Pressable
            key={entry.id}
            onPress={() => {
              setPendingSwitchPet(entry.pet);
              setSwitchConfirmVisible(true);
            }}
            style={[
              styles.petSwitchCard,
              selectedPet?.id === entry.pet.id ? styles.petSwitchCardActive : null,
            ]}
          >
            <Image source={{ uri: entry.profileImageUri }} style={styles.switchPetAvatar} />
            <View style={styles.switchPetMeta}>
              <Text style={styles.switchPetName}>{entry.name}</Text>
              <Text style={styles.switchPetDetail}>{entry.detail}</Text>
              <Text style={styles.switchPetStatus}>{entry.statusLabel}</Text>
            </View>
            {selectedPet?.id === entry.pet.id ? (
              <View style={styles.currentPetChip}>
                <Text style={styles.currentPetChipLabel}>현재</Text>
              </View>
            ) : null}
          </Pressable>
        )) : (
          <View style={styles.emptyPetCard}>
            <Text style={styles.emptyPetTitle}>추가한 아이 프로필이 없어요</Text>
          </View>
        )}
      </View>

      <Pressable onPress={handleOpenInviteCodeRegistration} style={styles.menuCard}>
        <Text style={styles.menuTitle}>초대코드로 새로 등록하기</Text>
        <Text style={styles.menuDescription}>다른 반려동물의 초대코드를 입력해서 추가해요</Text>
      </Pressable>
    </View>
  );

  const renderDocumentPage = (content: string) => (
    <View style={styles.sectionGroup}>
      <View style={styles.sectionIntroCard}>
        {renderPanelHeader({
          eyebrow: 'DOCUMENT',
          title: settingsHeaderTitles[mode],
          description: '현재 서비스 운영 기준과 보관 정책을 확인할 수 있어요.',
        })}
      </View>
      <View style={styles.documentCard}>
        <Text style={styles.documentText}>{content}</Text>
      </View>
    </View>
  );

  const renderWithdrawPage = () => (
    <View style={styles.sectionGroup}>
      <View style={styles.withdrawHeroCard}>
        {renderPanelHeader({
          eyebrow: 'WITHDRAW',
          title: '정말 탈퇴하시겠어요?',
          description: '탈퇴 전, 현재 계정과 반려동물 연결에 어떤 변화가 생기는지 확인해 주세요.',
        })}
      </View>
      <View style={styles.editorCard}>
        <Text style={styles.withdrawTitle}>정말 탈퇴하시겠어요?</Text>
        <Text style={styles.withdrawBody}>
          {selectedPet?.isOwner
            ? 'Owner 탈퇴 시 현재 반려동물 정보와 연결된 기록도 함께 정리됩니다.'
            : 'Guest 탈퇴 시 반려동물 정보는 유지되고, 내 계정 연결만 해제됩니다.'}
        </Text>
        <Pressable
          onPress={() => setWithdrawalAgreed(currentValue => !currentValue)}
          style={styles.withdrawCheckboxRow}
        >
          <View style={[styles.withdrawCheckbox, withdrawalAgreed ? styles.withdrawCheckboxChecked : null]}>
            {withdrawalAgreed ? <Text style={styles.withdrawCheckboxMark}>✓</Text> : null}
          </View>
          <Text style={styles.withdrawCheckboxLabel}>안내 내용을 모두 확인했습니다</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={!withdrawalAgreed}
        onPress={() => setWithdrawalConfirmVisible(true)}
        style={[styles.primaryFooterButton, !withdrawalAgreed ? styles.primaryFooterButtonDisabled : null]}
      >
        <Text style={styles.primaryFooterButtonLabel}>탈퇴하기</Text>
      </Pressable>
    </View>
  );

  const renderBody = () => {
    switch (mode) {
      case 'main':
        return renderMainPage();
      case 'profile':
        return renderProfilePage();
      case 'share':
        return renderSharePage();
      case 'notifications':
        return renderNotificationsPage();
      case 'qna':
        return renderQnaPage();
      case 'petSwitch':
        return renderPetSwitchPage();
      case 'terms':
        return renderDocumentPage(termsContent);
      case 'privacy':
        return renderDocumentPage(privacyContent);
      case 'withdraw':
        return renderWithdrawPage();
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#FFF7EF" barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            if (mode === 'main') {
              closePreview();
              return;
            }

            setMode('main');
          }}
          style={styles.headerBackButton}
        >
          <Text style={styles.headerBackLabel}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{settingsHeaderTitles[mode]}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 12) + 108 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderBody()}
      </ScrollView>

      <AppBottomNavigation activeTabId="settings" />

      {toastMessage ? (
        <View style={[styles.toast, { bottom: Math.max(insets.bottom, 12) + 92 }]}>
          <Text style={styles.toastLabel}>{toastMessage}</Text>
        </View>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setImageSheetVisible(false);
          setImageTarget(null);
        }}
        statusBarTranslucent
        transparent
        visible={Platform.OS === 'android' && isImageSheetVisible}
      >
        <Pressable onPress={() => {
          setImageSheetVisible(false);
          setImageTarget(null);
        }} style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <Pressable onPress={() => handleOpenGallery().catch(() => undefined)} style={styles.bottomSheetButton}>
              <Text style={styles.bottomSheetButtonLabel}>앨범</Text>
            </Pressable>
            <Pressable onPress={() => handleOpenCamera().catch(() => undefined)} style={styles.bottomSheetButton}>
              <Text style={styles.bottomSheetButtonLabel}>카메라</Text>
            </Pressable>
            <Pressable onPress={() => {
              setImageSheetVisible(false);
              setImageTarget(null);
            }} style={styles.bottomSheetCancelButton}>
              <Text style={styles.bottomSheetCancelButtonLabel}>취소</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isInviteModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            {!pendingInvitePet ? (
              <>
                <Text style={styles.dialogTitle}>다른 아이의 초대코드가 있나요?</Text>
                <TextInput
                  autoCapitalize="characters"
                  keyboardType="default"
                  maxLength={8}
                  onChangeText={value => setInviteCodeInput(value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="8자리 초대코드"
                  placeholderTextColor="#A69789"
                  style={styles.fieldInput}
                  value={inviteCodeInput}
                />
                <View style={styles.dialogButtonRow}>
                  <Pressable onPress={() => setInviteModalVisible(false)} style={styles.dialogSecondaryButton}>
                    <Text style={styles.dialogSecondaryButtonLabel}>닫기</Text>
                  </Pressable>
                  <Pressable onPress={() => handleValidateInviteCode().catch(() => undefined)} style={styles.dialogPrimaryButton}>
                    <Text style={styles.dialogPrimaryButtonLabel}>확인</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.dialogTitle}>{pendingInvitePet.name}와 연결할까요?</Text>
                <Text style={styles.dialogDescription}>초대코드가 확인되었어요. 함께 기록을 시작할 수 있어요.</Text>
                <Pressable
                  onPress={() => handleRegisterInvitePet(false).catch(() => undefined)}
                  style={styles.dialogPrimaryButton}
                >
                  <Text style={styles.dialogPrimaryButtonLabel}>잘 부탁해</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRegisterInvitePet(true).catch(() => undefined)}
                  style={styles.dialogSecondaryButton}
                >
                  <Text style={styles.dialogSecondaryButtonLabel}>바로 보러가기</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setSwitchConfirmVisible(false)} statusBarTranslucent transparent visible={isSwitchConfirmVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>{pendingSwitchPet?.name ?? '아이'}로 전환할까요?</Text>
            <Text style={styles.dialogDescription}>현재 보고 있는 아이를 이 반려동물로 바꾸게 됩니다.</Text>
            <Pressable onPress={() => handleConfirmSwitchPet().catch(() => undefined)} style={styles.dialogPrimaryButton}>
              <Text style={styles.dialogPrimaryButtonLabel}>네</Text>
            </Pressable>
            <Pressable onPress={() => setSwitchConfirmVisible(false)} style={styles.dialogSecondaryButton}>
              <Text style={styles.dialogSecondaryButtonLabel}>아니요</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setLogoutConfirmVisible(false)} statusBarTranslucent transparent visible={isLogoutConfirmVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>로그아웃할까요?</Text>
            <Text style={styles.dialogDescription}>현재 계정에서 로그아웃하고 로그인 화면으로 돌아가요.</Text>
            <Pressable onPress={signOut} style={styles.dialogPrimaryButton}>
              <Text style={styles.dialogPrimaryButtonLabel}>로그아웃</Text>
            </Pressable>
            <Pressable onPress={() => setLogoutConfirmVisible(false)} style={styles.dialogSecondaryButton}>
              <Text style={styles.dialogSecondaryButtonLabel}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setResetFarewellConfirmVisible(false)} statusBarTranslucent transparent visible={isResetFarewellConfirmVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>이별 상태를 되돌릴까요?</Text>
            <Text style={styles.dialogDescription}>이별 후에서 이별 전으로 돌아가며 관련 가이드 진행 상태가 초기화됩니다.</Text>
            <Pressable onPress={() => handleConfirmResetFarewell().catch(() => undefined)} style={styles.dialogPrimaryButton}>
              <Text style={styles.dialogPrimaryButtonLabel}>네, 다음에 할게요</Text>
            </Pressable>
            <Pressable onPress={() => setResetFarewellConfirmVisible(false)} style={styles.dialogSecondaryButton}>
              <Text style={styles.dialogSecondaryButtonLabel}>더 해볼게요</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setLeavePetConfirmVisible(false)} statusBarTranslucent transparent visible={isLeavePetConfirmVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>반려동물 기록에서 나갈까요?</Text>
            <Text style={styles.dialogDescription}>Owner 권한은 사라지고, 이 아이는 함께 기록 중인 Guest 상태로 남게 됩니다.</Text>
            <Pressable onPress={() => handleConfirmLeavePet().catch(() => undefined)} style={styles.dialogPrimaryButton}>
              <Text style={styles.dialogPrimaryButtonLabel}>네, 나갈게요</Text>
            </Pressable>
            <Pressable onPress={() => setLeavePetConfirmVisible(false)} style={styles.dialogSecondaryButton}>
              <Text style={styles.dialogSecondaryButtonLabel}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setMemberRemovalVisible(false)} statusBarTranslucent transparent visible={isMemberRemovalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>{pendingMemberRemovalPet?.name ?? '멤버'}와의 기록 공유를 중단할까요?</Text>
            <Text style={styles.dialogDescription}>이 멤버는 더 이상 현재 초대코드로 연결된 기록을 볼 수 없어요.</Text>
            <Pressable onPress={() => handleRemoveMember().catch(() => undefined)} style={styles.dialogPrimaryButton}>
              <Text style={styles.dialogPrimaryButtonLabel}>예</Text>
            </Pressable>
            <Pressable onPress={() => setMemberRemovalVisible(false)} style={styles.dialogSecondaryButton}>
              <Text style={styles.dialogSecondaryButtonLabel}>아니오</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setWithdrawalConfirmVisible(false)} statusBarTranslucent transparent visible={isWithdrawalConfirmVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>정말 탈퇴하시겠어요?</Text>
            <Text style={styles.dialogDescription}>
              {selectedPet?.isOwner
                ? '현재 반려동물과 연결 정보도 함께 정리되고 로그인 화면으로 이동합니다.'
                : '현재 계정 연결만 해제되고 로그인 화면으로 이동합니다.'}
            </Text>
            <Pressable onPress={handleConfirmWithdraw} style={styles.dialogPrimaryButton}>
              <Text style={styles.dialogPrimaryButtonLabel}>탈퇴하기</Text>
            </Pressable>
            <Pressable onPress={() => setWithdrawalConfirmVisible(false)} style={styles.dialogSecondaryButton}>
              <Text style={styles.dialogSecondaryButtonLabel}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarEditBadge: {
    alignItems: 'center',
    backgroundColor: '#FFF0D4',
    borderRadius: 14,
    bottom: 4,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    width: 28,
  },
  avatarEditLabel: {
    color: '#8F6115',
    fontSize: 13,
    fontWeight: '800',
  },
  avatarEditorButton: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  avatarEditorRow: {
    flexDirection: 'row',
    gap: 16,
  },
  bottomSheet: {
    backgroundColor: '#FFF9F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  bottomSheetButton: {
    alignItems: 'center',
    backgroundColor: '#FFF2E0',
    borderRadius: 16,
    marginTop: 10,
    minHeight: 52,
    justifyContent: 'center',
  },
  bottomSheetButtonLabel: {
    color: '#3D2E25',
    fontSize: 15,
    fontWeight: '800',
  },
  bottomSheetCancelButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EAD9C8',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  bottomSheetCancelButtonLabel: {
    color: '#7A6D63',
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  dialogButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogCard: {
    backgroundColor: '#FFF9F2',
    borderRadius: 28,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 22,
    width: 318,
  },
  dialogDescription: {
    color: '#6D6258',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  dialogPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#F4A147',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
  },
  dialogPrimaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dialogSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFF1DF',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
  },
  dialogSecondaryButtonLabel: {
    color: '#7B5C35',
    fontSize: 15,
    fontWeight: '800',
  },
  dialogTitle: {
    color: '#2E241D',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
  },
  disabledPetCard: {
    opacity: 0.56,
  },
  dualActionButtonMuted: {
    alignItems: 'center',
    backgroundColor: '#FFF6ED',
    borderColor: '#E8D8C7',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  dualActionButtonMutedLabel: {
    color: '#775F45',
    fontSize: 14,
    fontWeight: '800',
  },
  dualActionButtonPrimary: {
    alignItems: 'center',
    backgroundColor: '#F4A147',
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  dualActionButtonPrimaryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  documentCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E1D2',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  documentText: {
    color: '#4B4037',
    fontSize: 14,
    lineHeight: 24,
  },
  editorCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E1D2',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  editorMeta: {
    flex: 1,
    gap: 6,
  },
  emptyPetCard: {
    alignItems: 'center',
    backgroundColor: '#FFF6ED',
    borderRadius: 20,
    justifyContent: 'center',
    minHeight: 88,
  },
  emptyPetTitle: {
    color: '#7D6E62',
    fontSize: 14,
    fontWeight: '700',
  },
  fieldInput: {
    backgroundColor: '#FFF3E6',
    borderRadius: 16,
    color: '#372A22',
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  fieldInputDisabled: {
    backgroundColor: '#F1E6DB',
  },
  fieldLabel: {
    color: '#5C4D42',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  genderButton: {
    alignItems: 'center',
    backgroundColor: '#FFF2E5',
    borderRadius: 16,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#FFE0B3',
  },
  genderButtonDisabled: {
    opacity: 0.6,
  },
  genderButtonLabel: {
    color: '#7D6B5B',
    fontSize: 14,
    fontWeight: '700',
  },
  genderButtonLabelActive: {
    color: '#AF5D00',
  },
  genderButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFF7EF',
    borderBottomColor: '#F1E2D2',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBackButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerBackLabel: {
    color: '#2F231D',
    fontSize: 38,
    lineHeight: 38,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    color: '#2F231D',
    fontSize: 20,
    fontWeight: '800',
  },
  helperText: {
    color: '#8E8074',
    fontSize: 12,
    lineHeight: 18,
  },
  heroActionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F4A147',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
  },
  heroActionButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroCard: {
    backgroundColor: '#FFEBD2',
    borderRadius: 32,
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroIdentityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 12,
  },
  heroPillLabel: {
    color: '#735B45',
    fontSize: 12,
    fontWeight: '800',
  },
  heroPillLabelPrimary: {
    color: '#A15809',
  },
  heroPillMuted: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  heroPillPrimary: {
    backgroundColor: '#FFF7E8',
  },
  inlineActionChip: {
    alignItems: 'center',
    backgroundColor: '#FFF2E0',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
  },
  inlineActionChipLabel: {
    color: '#7B5E38',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inviteHighlightCard: {
    backgroundColor: '#FFF0DE',
    borderRadius: 30,
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  inviteCodeBox: {
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    borderColor: '#F2DAB8',
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 82,
  },
  inviteCodeLabel: {
    color: '#AF5D00',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  largeAvatar: {
    backgroundColor: '#F7F1EA',
    borderRadius: 42,
    height: 84,
    width: 84,
  },
  memberAvatar: {
    backgroundColor: '#F7F1EA',
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  memberAvatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  memberCaption: {
    color: '#9A8B7E',
    fontSize: 11,
    fontWeight: '700',
  },
  memberCard: {
    alignItems: 'center',
    backgroundColor: '#FFF6ED',
    borderRadius: 22,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    width: 108,
  },
  memberCrown: {
    fontSize: 18,
    position: 'absolute',
    right: -6,
    top: -10,
  },
  memberName: {
    color: '#372A22',
    fontSize: 14,
    fontWeight: '800',
  },
  memberRemoveButton: {
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  memberRemoveButtonLabel: {
    color: '#D05C3D',
    fontSize: 11,
    fontWeight: '800',
  },
  memberRow: {
    flexDirection: 'row',
    gap: 10,
  },
  menuCard: {
    backgroundColor: '#FFF6ED',
    borderRadius: 24,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  menuChevron: {
    color: '#B48A61',
    fontSize: 28,
    lineHeight: 28,
    marginLeft: 8,
  },
  menuDescription: {
    color: '#85786D',
    fontSize: 13,
    lineHeight: 18,
  },
  menuGroupPanel: {
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E1D2',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuGroupHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
  },
  menuListRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuListRowBorder: {
    borderTopColor: '#F3E7DA',
    borderTopWidth: 1,
  },
  menuRowContent: {
    flex: 1,
    gap: 4,
  },
  menuRowDescription: {
    color: '#8A7B70',
    fontSize: 13,
    lineHeight: 18,
  },
  menuRowTitle: {
    color: '#2F251E',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  menuRowTitleDanger: {
    color: '#B25039',
  },
  menuSection: {
    gap: 12,
  },
  menuTag: {
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 30,
    minWidth: 46,
    paddingHorizontal: 8,
  },
  menuTagAccent: {
    backgroundColor: '#FFE5C0',
  },
  menuTagDanger: {
    backgroundColor: '#FFE7E0',
  },
  menuTagLabel: {
    color: '#9B744C',
    fontSize: 11,
    fontWeight: '800',
  },
  menuTagLabelAccent: {
    color: '#AF5D00',
  },
  menuTagLabelDanger: {
    color: '#C25840',
  },
  menuTitle: {
    color: '#2F251E',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.36)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineWarningButton: {
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    borderColor: '#F0CDAA',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  outlineWarningButtonDisabled: {
    opacity: 0.6,
  },
  outlineWarningButtonLabel: {
    color: '#B05B00',
    fontSize: 14,
    fontWeight: '800',
  },
  panelDescription: {
    color: '#8B7D71',
    fontSize: 13,
    lineHeight: 18,
  },
  panelEyebrow: {
    color: '#B1814D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  panelHeader: {
    gap: 6,
  },
  panelTitle: {
    color: '#2D241C',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  petAvatarEditorButton: {
    position: 'relative',
  },
  petAvatarPreview: {
    backgroundColor: '#F7F1EA',
    borderRadius: 36,
    height: 72,
    width: 72,
  },
  petEditorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  petEditorName: {
    color: '#30251D',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  petEditorSummary: {
    flex: 1,
    gap: 4,
  },
  petEditorSummaryText: {
    color: '#8F8277',
    fontSize: 13,
    lineHeight: 18,
  },
  petSwitchCard: {
    alignItems: 'center',
    backgroundColor: '#FFF6ED',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  petSwitchCardActive: {
    borderColor: '#F3B463',
    borderWidth: 1,
  },
  primaryFooterButton: {
    alignItems: 'center',
    backgroundColor: '#F4A147',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryFooterButtonDisabled: {
    backgroundColor: '#D7C2AE',
  },
  primaryFooterButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  profileSummaryBody: {
    flex: 1,
    gap: 4,
  },
  profileSummaryCaption: {
    color: '#87786E',
    fontSize: 13,
    lineHeight: 18,
  },
  profileHeroCard: {
    backgroundColor: '#FFF0DE',
    borderRadius: 30,
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  profileSummaryCard: {
    alignItems: 'center',
    backgroundColor: '#FFF0DE',
    borderRadius: 28,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  profileSummaryName: {
    color: '#2D241C',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  qnaAnswer: {
    color: '#6E635B',
    fontSize: 14,
    lineHeight: 22,
  },
  qnaCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#F0E1D2',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  qnaHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qnaQuestion: {
    color: '#2E251E',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    paddingRight: 12,
  },
  qnaToggle: {
    color: '#B06A22',
    fontSize: 24,
    fontWeight: '700',
  },
  root: {
    backgroundColor: '#FFF7EF',
    flex: 1,
  },
  sectionIntroCard: {
    backgroundColor: '#FFF1DF',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionGroup: {
    gap: 14,
  },
  sectionTitle: {
    color: '#2D241C',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 24,
  },
  secondaryMenuCard: {
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderColor: '#EEDFD0',
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryMenuTitle: {
    color: '#55473F',
    fontSize: 15,
    fontWeight: '800',
  },
  switchPetAvatar: {
    backgroundColor: '#F7F1EA',
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  currentPetChip: {
    alignItems: 'center',
    backgroundColor: '#FFF1D8',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 10,
  },
  currentPetChipLabel: {
    color: '#A75C0F',
    fontSize: 11,
    fontWeight: '800',
  },
  switchPetDetail: {
    color: '#87786F',
    fontSize: 12,
    lineHeight: 16,
  },
  switchPetMeta: {
    flex: 1,
    gap: 2,
  },
  switchPetName: {
    color: '#2F261D',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  switchPetStatus: {
    color: '#AF6C22',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: 'rgba(24,24,24,0.86)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'absolute',
  },
  toastLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  toggleCard: {
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  toggleCardBorder: {
    borderTopColor: '#F3E7DA',
    borderTopWidth: 1,
  },
  toggleMeta: {
    flex: 1,
    gap: 4,
    paddingRight: 16,
  },
  userAvatar: {
    backgroundColor: '#F7F1EA',
    borderRadius: 38,
    height: 76,
    width: 76,
  },
  versionLabel: {
    color: '#B19D8D',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  withdrawBody: {
    color: '#6E6259',
    fontSize: 14,
    lineHeight: 21,
  },
  withdrawHeroCard: {
    backgroundColor: '#FFF1E9',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  withdrawCheckbox: {
    alignItems: 'center',
    backgroundColor: '#FFF3E5',
    borderColor: '#D8C2AE',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  withdrawCheckboxChecked: {
    backgroundColor: '#F4A147',
    borderColor: '#F4A147',
  },
  withdrawCheckboxLabel: {
    color: '#55463C',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  withdrawCheckboxMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  withdrawCheckboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  withdrawTitle: {
    color: '#2D251E',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
});
