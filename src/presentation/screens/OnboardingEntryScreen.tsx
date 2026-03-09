import { useEffect, useState } from 'react';

import { BackHandler, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';

import { writeStoredSignupLoadingAnimalType } from '../../infrastructure/storage/signupLoadingAnimalStorage';
import { theme } from '../../shared/styles/theme';
import { Button } from '../components/Button';
import { InviteCodePromptModal } from '../components/InviteCodePromptModal';
import { PetBreedPickerModal } from '../components/PetBreedPickerModal';
import { PetWeightBottomSheet } from '../components/PetWeightBottomSheet';
import { SignupCompletionLoadingScreen } from '../components/SignupCompletionLoadingScreen';
import { ScreenLayout } from '../components/ScreenLayout';
import { SectionCard } from '../components/SectionCard';
import { useAppSessionStore } from '../stores/AppSessionStore';

type SignupStageOptionId = 'beforeFarewell' | 'afterFarewell';
type OwnerAnimalTypeId = 'dog' | 'cat' | 'fish' | 'hamster' | 'turtle' | 'bird' | 'reptile' | 'other';
type OwnerPetGender = 'male' | 'female';
type CaregiverNicknameStatus = 'available' | 'duplicate' | 'idle' | 'invalid';
type CaregiverSourceOptionId = 'instagram' | 'offline' | 'other' | 'recommendation' | 'threads';
type SignupFlowType = 'guest' | 'owner';
type TemporaryOnboardingMode = 'ownerPetDetailStep' | 'ownerPetInfoStepOne' | 'ownerStepOne' | 'guestStepFour';

type FlowNotice = {
  message: string;
  tone: 'neutral' | 'success';
};

const inviteCodePattern = /^[A-Z0-9]{8}$/;
const ownerPetNamePattern = /^.{1,8}$/;
const caregiverNicknamePattern = /^[A-Za-z0-9가-힣]+$/;
const animalIconDog = 'https://www.figma.com/api/mcp/asset/91b5545d-67e0-415d-8a8d-ce69fc3992a1';
const animalIconCat = 'https://www.figma.com/api/mcp/asset/23559d36-d19d-49ed-a668-2fdb3ee664b0';
const animalIconFish = 'https://www.figma.com/api/mcp/asset/61a6df37-d7cf-4967-bfad-87e2eb526b81';
const animalIconHamster = 'https://www.figma.com/api/mcp/asset/00865043-3ba9-469a-80e8-4a0a1ea6c53b';
const animalIconTurtle = 'https://www.figma.com/api/mcp/asset/ad2d2a80-f8e2-43ca-a589-47bc489e2034';
const animalIconBird = 'https://www.figma.com/api/mcp/asset/c4142180-d415-4935-b6dd-143e4c7637b1';
const animalIconReptile = 'https://www.figma.com/api/mcp/asset/5717411b-d298-4b6b-a12e-9771af029074';
const animalIconOther = 'https://www.figma.com/api/mcp/asset/977bd18b-212d-41ef-832b-ef5f768d0683';
const searchIcon = 'https://www.figma.com/api/mcp/asset/0083b4c5-1294-40c5-b12d-350ac1152668';
const warningIcon = 'https://www.figma.com/api/mcp/asset/1302c5cd-7ca5-4989-ac7a-31d1eaffddb3';
const maleIcon = 'https://www.figma.com/api/mcp/asset/ebe2f910-e8c6-4c1f-91dc-c1c8494b619d';
const femaleIcon = 'https://www.figma.com/api/mcp/asset/00a77d7e-000d-41ee-95e2-46db51d642fc';
const mockTakenNicknames = new Set(['oops', '몽몽이', '초코맘', '보리엄마']);
const caregiverSourceOptions: Array<{ id: CaregiverSourceOptionId; label: string }> = [
  { id: 'recommendation', label: '주변에서 추천해서 가입했어요' },
  { id: 'threads', label: '쓰레드 보고 들어왔어요' },
  { id: 'instagram', label: '인스타그램 보고 들어왔어요' },
  { id: 'offline', label: '동물병원, 장례식장 등 오프라인에서 소개받았어요' },
  { id: 'other', label: '위 중에 없어요 (기타)' },
];

const previewLabels: Record<PreviewableAppFlow, string> = {
  afterFarewellHome: '이별 후 홈 골격 보기',
  beforeFarewellHome: '이별 전 홈 골격 보기',
  emergency: '긴급대처 골격 보기',
};

const signupStageOptions: Array<{
  cardTitle: string;
  description: string;
  id: SignupStageOptionId;
  stageLabel: string;
}> = [
  {
    cardTitle: '함께하는 시간에 집중해요',
    description: '막연한 불안은 저희에게 맡기고,\n아이와의 오늘에만 온전히 전념하세요.',
    id: 'beforeFarewell',
    stageLabel: '이별 전',
  },
  {
    cardTitle: '소중했던 시간을 기억해요',
    description: '지금 꼭 필요한 배웅의 안내부터,\n아이를 향한 그리움을 담는 공간까지.',
    id: 'afterFarewell',
    stageLabel: '이별 후',
  },
];

const ownerAnimalOptions: Array<{
  iconUri: string;
  id: OwnerAnimalTypeId;
  label: string;
}> = [
  { iconUri: animalIconDog, id: 'dog', label: '강아지' },
  { iconUri: animalIconCat, id: 'cat', label: '고양이' },
  { iconUri: animalIconFish, id: 'fish', label: '물고기' },
  { iconUri: animalIconHamster, id: 'hamster', label: '햄스터' },
  { iconUri: animalIconTurtle, id: 'turtle', label: '거북이' },
  { iconUri: animalIconBird, id: 'bird', label: '새' },
  { iconUri: animalIconReptile, id: 'reptile', label: '파충류' },
  { iconUri: animalIconOther, id: 'other', label: '기타' },
];

const defaultBreedByAnimalType: Record<OwnerAnimalTypeId, string> = {
  bird: '앵무새',
  cat: '코리안숏헤어',
  dog: '비숑 프리제',
  fish: '금붕어',
  hamster: '골든 햄스터',
  other: '기타',
  reptile: '도마뱀',
  turtle: '육지거북',
};

const weightRangeOptions = [
  '잘 모르겠어요.',
  '500g 미만',
  '500g 이상 - 1kg 미만 (소동물)',
  '1kg 이상 - 3kg 미만 (일반)',
  '3kg 이상 - 5kg 미만',
  '5kg 이상 - 8kg 미만',
  '8kg 이상 - 10kg 미만',
  '10kg 이상 - 13kg 미만',
  '13kg 이상 - 15kg 미만 (일반)',
  '15kg 이상 - 18kg 미만 (대형 동물)',
  '18kg 이상 - 20kg 미만',
  '20kg 이상 - 24kg 미만',
  '24kg 이상 - 28kg 미만',
  '28kg 이상 - 32kg 미만',
  '32kg 이상 - 37kg 미만',
  '37kg 이상 - 42kg 미만',
  '42kg 이상 - 48kg 미만',
  '48kg 이상 - 55kg 미만',
  '55kg 이상',
];
const breedOptionsByAnimalType: Record<OwnerAnimalTypeId, string[]> = {
  bird: ['앵무새', '문조', '카나리아', '코카틸'],
  cat: ['코리안숏헤어', '러시안블루', '페르시안', '브리티시숏헤어', '랙돌'],
  dog: ['비글', '비숑 프리제', '비즐라', '말티즈', '포메라니안', '푸들'],
  fish: ['금붕어', '구피', '베타', '코이'],
  hamster: ['골든 햄스터', '드워프 햄스터', '로보로브스키'],
  other: [
    '기타 (리스트에 없어요)',
    '알파카',
    '라쿤',
    '미어캣',
    '왈라비',
    '카피바라',
    '고슴도치',
    '페럿 (페릿)',
    '슈가글라이더 (유대하늘다람쥐)',
    '미국 남부 하늘다람쥐 (하늘다람쥐)',
    '토끼 (드워프/롭이어)',
    '팩맨 개구리 (뿔개구리)',
    '화이트 트리 프록 (호주청개구리)',
    '아홀로틀 (우파루파)',
    '파이어벨리 뉴트 (붉은배영원)',
    '타란툴라 (거미)',
    '전갈',
    '지네 (센티피드)',
    '소라게 (허밋 크랩)',
    '장수풍뎅이',
    '사슴벌레',
  ],
  reptile: ['도마뱀', '카멜레온', '레오파드 게코', '콘스네이크'],
  turtle: ['육지거북', '반수생 거북', '레드이어슬라이더'],
};

const normalizeInviteCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
const normalizeOwnerPetName = (value: string) => value.replace(/\s+/g, ' ').trimStart().slice(0, 8);
const normalizeDashedDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const wait = (durationMs: number) =>
  new Promise(resolve => {
    setTimeout(resolve, durationMs);
  });

const getAnimalTypeName = (animalType: OwnerAnimalTypeId | null) => {
  return ownerAnimalOptions.find(option => option.id === animalType)?.label ?? '반려동물';
};

const getGenderValue = (gender: OwnerPetGender | null) => {
  if (!gender) {
    return null;
  }

  return gender === 'male' ? 'MALE' : 'FEMALE';
};

const getWeightValue = (weightLabel: string) => {
  switch (weightLabel) {
    case '잘 모르겠어요.':
      return null;
    case '500g 미만':
      return 0.3;
    case '500g 이상 - 1kg 미만 (소동물)':
      return 0.75;
    case '1kg 이상 - 3kg 미만 (일반)':
      return 2;
    case '3kg 이상 - 5kg 미만':
      return 4;
    case '5kg 이상 - 8kg 미만':
      return 6.5;
    case '8kg 이상 - 10kg 미만':
      return 9;
    case '10kg 이상 - 13kg 미만':
      return 11.5;
    case '13kg 이상 - 15kg 미만 (일반)':
      return 14;
    case '15kg 이상 - 18kg 미만 (대형 동물)':
      return 16.5;
    case '18kg 이상 - 20kg 미만':
      return 19;
    case '20kg 이상 - 24kg 미만':
      return 22;
    case '24kg 이상 - 28kg 미만':
      return 26;
    case '28kg 이상 - 32kg 미만':
      return 30;
    case '32kg 이상 - 37kg 미만':
      return 34.5;
    case '37kg 이상 - 42kg 미만':
      return 39.5;
    case '42kg 이상 - 48kg 미만':
      return 45;
    case '48kg 이상 - 55kg 미만':
      return 51.5;
    case '55kg 이상':
      return 55;
    default:
      return null;
  }
};

const createDraftPetFromStage = (
  stage: SignupStageOptionId,
  ownerAnimalType: OwnerAnimalTypeId | null,
  ownerPetName: string,
  ownerPetBreed: string,
  ownerPetWeightLabel: string,
  ownerPetGender: OwnerPetGender | null,
): PetSummary => {
  if (stage === 'afterFarewell') {
    return {
      animalTypeName: getAnimalTypeName(ownerAnimalType),
      birthDate: '2017-09-01',
      breedName: ownerPetBreed || defaultBreedByAnimalType[ownerAnimalType ?? 'dog'],
      emergencyMode: false,
      gender: getGenderValue(ownerPetGender),
      id: -103,
      inviteCode: 'STEP0003',
      isOwner: true,
      lifecycleStatus: 'AFTER_FAREWELL',
      name: ownerPetName || '별이',
      profileImageUrl: null,
      selected: true,
      weight: getWeightValue(ownerPetWeightLabel),
    };
  }

  return {
    animalTypeName: getAnimalTypeName(ownerAnimalType),
    birthDate: '2020-05-18',
    breedName: ownerPetBreed || defaultBreedByAnimalType[ownerAnimalType ?? 'dog'],
    emergencyMode: false,
    gender: getGenderValue(ownerPetGender),
    id: -101,
    inviteCode: 'STEP0001',
    isOwner: true,
    lifecycleStatus: 'BEFORE_FAREWELL',
    name: ownerPetName || '보리',
    profileImageUrl: null,
    selected: true,
    weight: getWeightValue(ownerPetWeightLabel),
  };
};

const createMockGuestPet = (inviteCode: string): PetSummary => {
  const seed = inviteCode.charCodeAt(0) % 3;

  if (seed === 1) {
    return {
      animalTypeName: '강아지',
      birthDate: '2016-11-03',
      breedName: '포메라니안',
      emergencyMode: true,
      gender: 'FEMALE',
      id: -202,
      inviteCode,
      isOwner: false,
      lifecycleStatus: 'AFTER_FAREWELL',
      name: '초코',
      profileImageUrl: null,
      selected: true,
      weight: 3.1,
    };
  }

  if (seed === 2) {
    return {
      animalTypeName: '고양이',
      birthDate: '2015-02-17',
      breedName: '러시안블루',
      emergencyMode: false,
      gender: 'MALE',
      id: -203,
      inviteCode,
      isOwner: false,
      lifecycleStatus: 'AFTER_FAREWELL',
      name: '구름',
      profileImageUrl: null,
      selected: true,
      weight: 4.4,
    };
  }

  return {
    animalTypeName: '강아지',
    birthDate: '2019-08-26',
    breedName: '비숑 프리제',
    emergencyMode: false,
    gender: 'FEMALE',
    id: -201,
    inviteCode,
    isOwner: false,
    lifecycleStatus: 'BEFORE_FAREWELL',
    name: '하루',
    profileImageUrl: null,
    selected: true,
    weight: 5.3,
  };
};

const resolveCurrentPreviewRoute = (selectedPet: PetSummary | null): PreviewableAppFlow | null => {
  if (!selectedPet) {
    return null;
  }

  if (selectedPet.lifecycleStatus === 'AFTER_FAREWELL') {
    return selectedPet.emergencyMode ? 'emergency' : 'afterFarewellHome';
  }

  return 'beforeFarewellHome';
};

const getLifecycleStatusLabel = (pet: PetSummary) => {
  if (pet.lifecycleStatus === 'BEFORE_FAREWELL') {
    return '이별 전';
  }

  return pet.emergencyMode ? '이별 당시' : '이별 후';
};

export function OnboardingEntryScreen() {
  const insets = useSafeAreaInsets();
  const { openPreview, profile, selectedPet, session, signOut } = useAppSessionStore();

  const [mode, setMode] = useState<TemporaryOnboardingMode>(selectedPet ? 'guestStepFour' : 'ownerStepOne');
  const [signupFlowType, setSignupFlowType] = useState<SignupFlowType>(selectedPet && !selectedPet.isOwner ? 'guest' : 'owner');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeErrorMessage, setInviteCodeErrorMessage] = useState<string | null>(null);
  const [flowNotice, setFlowNotice] = useState<FlowNotice | null>(null);
  const [isInviteCodeModalVisible, setInviteCodeModalVisible] = useState(!selectedPet);
  const [isInviteCodeSubmitting, setInviteCodeSubmitting] = useState(false);
  const [isBreedPickerVisible, setBreedPickerVisible] = useState(false);
  const [isWeightSheetVisible, setWeightSheetVisible] = useState(false);
  const [isSignupCompletionLoadingVisible, setSignupCompletionLoadingVisible] = useState(false);
  const [mockedGuestPet, setMockedGuestPet] = useState<PetSummary | null>(null);
  const [ownerAnimalType, setOwnerAnimalType] = useState<OwnerAnimalTypeId | null>(null);
  const [ownerBreedSearchQuery, setOwnerBreedSearchQuery] = useState('');
  const [ownerPetName, setOwnerPetName] = useState('');
  const [ownerPetBreed, setOwnerPetBreed] = useState('');
  const [ownerPetBirthDate, setOwnerPetBirthDate] = useState('');
  const [ownerPetFarewellDate, setOwnerPetFarewellDate] = useState('');
  const [ownerPetWeightLabel, setOwnerPetWeightLabel] = useState('');
  const [ownerPetGender, setOwnerPetGender] = useState<OwnerPetGender | null>(null);
  const [ownerPetIsNeutered, setOwnerPetIsNeutered] = useState(false);
  const [caregiverNickname, setCaregiverNickname] = useState('');
  const [caregiverNicknameStatus, setCaregiverNicknameStatus] = useState<CaregiverNicknameStatus>('idle');
  const [caregiverSource, setCaregiverSource] = useState<CaregiverSourceOptionId | null>(null);
  const [selectedStage, setSelectedStage] = useState<SignupStageOptionId | null>(null);
  const hasSession = Boolean(session);
  const hasSelectedPet = Boolean(selectedPet);
  const sessionSelectedPetId = session?.selectedPetId ?? null;
  const sessionUserId = session?.userId ?? null;

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    if (hasSelectedPet) {
      setMode('guestStepFour');
      setInviteCodeModalVisible(false);
      setSignupFlowType(selectedPet?.isOwner ? 'owner' : 'guest');
      setSignupCompletionLoadingVisible(false);
      setCaregiverNickname('');
      setCaregiverNicknameStatus('idle');
      setCaregiverSource(null);
      return;
    }

    setMode('ownerStepOne');
    setSignupFlowType('owner');
    setInviteCode('');
    setInviteCodeErrorMessage(null);
    setInviteCodeModalVisible(true);
    setBreedPickerVisible(false);
    setWeightSheetVisible(false);
    setSignupCompletionLoadingVisible(false);
    setMockedGuestPet(null);
    setOwnerAnimalType(null);
    setOwnerBreedSearchQuery('');
    setOwnerPetName('');
    setOwnerPetBreed('');
    setOwnerPetBirthDate('');
    setOwnerPetFarewellDate('');
    setOwnerPetWeightLabel('');
    setOwnerPetGender(null);
    setOwnerPetIsNeutered(false);
    setCaregiverNickname('');
    setCaregiverNicknameStatus('idle');
    setCaregiverSource(null);
    setSelectedStage(null);
    setFlowNotice(null);
  }, [hasSelectedPet, hasSession, selectedPet?.isOwner, sessionSelectedPetId, sessionUserId]);

  useEffect(() => {
    if (selectedStage === 'beforeFarewell') {
      setOwnerPetFarewellDate('');
    }
  }, [selectedStage]);

  useEffect(() => {
    if (isInviteCodeModalVisible) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isBreedPickerVisible) {
        setBreedPickerVisible(false);
        return true;
      }

      if (isWeightSheetVisible) {
        setWeightSheetVisible(false);
        return true;
      }

      if (mode === 'ownerPetDetailStep') {
        setMode('ownerPetInfoStepOne');
        return true;
      }

      if (mode === 'guestStepFour') {
        if (signupFlowType === 'guest') {
          setMockedGuestPet(null);
          setInviteCode('');
          setInviteCodeErrorMessage(null);
          setInviteCodeModalVisible(true);
          return true;
        }

        setMode('ownerPetDetailStep');
        return true;
      }

      if (mode === 'ownerPetInfoStepOne') {
        setMode('ownerStepOne');
        return true;
      }

      return false;
    });

    return () => {
      subscription.remove();
    };
  }, [isBreedPickerVisible, isInviteCodeModalVisible, isWeightSheetVisible, mode, signupFlowType]);

  const draftOwnerPet = selectedStage
    ? createDraftPetFromStage(
        selectedStage,
        ownerAnimalType,
        ownerPetName,
        ownerPetBreed,
        ownerPetWeightLabel,
        ownerPetGender,
      )
    : null;
  const effectiveSelectedPet = selectedPet ?? mockedGuestPet ?? draftOwnerPet;
  const currentBreedOptions = ownerAnimalType ? breedOptionsByAnimalType[ownerAnimalType] ?? [] : breedOptionsByAnimalType.other;
  const currentPreviewRoute = resolveCurrentPreviewRoute(effectiveSelectedPet);
  const userLabel = profile?.nickname ?? profile?.name ?? `ID ${session?.userId ?? '-'}`;
  const ownerDisplayName = profile?.nickname ?? profile?.name ?? '보호자';
  const isOwnerPetInfoReady = Boolean(ownerAnimalType) && ownerPetNamePattern.test(ownerPetName.trim());
  const hasSelectedOwnerAnimalType = ownerAnimalType !== null;
  const shouldShowFarewellDate = selectedStage === 'afterFarewell';
  const isOwnerBirthDateValid = /^\d{4}-\d{2}-\d{2}$/.test(ownerPetBirthDate);
  const isOwnerFarewellDateValid = !shouldShowFarewellDate || /^\d{4}-\d{2}-\d{2}$/.test(ownerPetFarewellDate);
  const shouldShowFarewellDateError = shouldShowFarewellDate && ownerPetFarewellDate.length > 0 && !isOwnerFarewellDateValid;
  const trimmedCaregiverNickname = caregiverNickname.trim();
  const isCaregiverNicknameValid =
    trimmedCaregiverNickname.length > 0 && caregiverNicknamePattern.test(trimmedCaregiverNickname);
  const canCheckCaregiverNickname = trimmedCaregiverNickname.length > 0;
  const isOwnerPetDetailReady =
    ownerPetBreed.trim().length > 0 &&
    isOwnerBirthDateValid &&
    ownerPetWeightLabel.length > 0 &&
    ownerPetGender !== null &&
    isOwnerFarewellDateValid;
  const isCaregiverStepReady = caregiverNicknameStatus === 'available' && caregiverSource !== null;
  const caregiverPetName = (effectiveSelectedPet?.name ?? ownerPetName) || '몽몽이';
  const caregiverHelperMessage =
    caregiverNicknameStatus === 'invalid'
      ? '한글, 영문, 숫자만 입력할 수 있어요. (특수문자 불가)'
      : caregiverNicknameStatus === 'duplicate'
        ? '이미 사용 중인 닉네임입니다.'
        : caregiverNicknameStatus === 'available'
          ? '사용 가능한 닉네임입니다.'
          : null;

  const handleInviteCodeChange = (value: string) => {
    setInviteCode(normalizeInviteCode(value));

    if (inviteCodeErrorMessage) {
      setInviteCodeErrorMessage(null);
    }
  };

  const handleSkipInviteCode = () => {
    setSignupFlowType('owner');
    setInviteCodeModalVisible(false);
    setMode('ownerStepOne');
    setInviteCode('');
    setInviteCodeErrorMessage(null);
    setMockedGuestPet(null);
    setFlowNotice({
      message: '초대코드 없이 회원가입 1단계부터 진행합니다.',
      tone: 'neutral',
    });
  };

  const handleCompleteInviteCode = async () => {
    if (!inviteCodePattern.test(inviteCode)) {
      setInviteCodeErrorMessage('초대코드는 영문/숫자 8자리 형식으로 입력해 주세요.');
      return;
    }

    setInviteCodeSubmitting(true);

    try {
      await wait(260);

      const nextMockedGuestPet = createMockGuestPet(inviteCode);

      setMockedGuestPet(nextMockedGuestPet);
      setSignupFlowType('guest');
      setMode('guestStepFour');
      setInviteCode('');
      setInviteCodeErrorMessage(null);
      setInviteCodeModalVisible(false);
      setCaregiverNickname('');
      setCaregiverNicknameStatus('idle');
      setCaregiverSource(null);
    } finally {
      setInviteCodeSubmitting(false);
    }
  };

  const handleOpenInviteCodeModal = () => {
    setInviteCode('');
    setInviteCodeErrorMessage(null);
    setInviteCodeModalVisible(true);
  };

  const handleContinueOwnerSignup = () => {
    if (!selectedStage) {
      setFlowNotice({
        message: '이별 단계를 먼저 선택해 주세요.',
        tone: 'neutral',
      });
      return;
    }

    setSignupFlowType('owner');
    setMode('ownerPetInfoStepOne');
  };

  const handleOwnerPetNameChange = (value: string) => {
    setOwnerPetName(normalizeOwnerPetName(value));
  };

  const handleContinueOwnerPetInfo = () => {
    if (!isOwnerPetInfoReady) {
      return;
    }

    setOwnerPetBreed(current => current || defaultBreedByAnimalType[ownerAnimalType ?? 'dog']);
    setOwnerPetBirthDate(current => current || '2021-12-04');
    setMode('ownerPetDetailStep');
  };

  const handleOpenBreedPicker = () => {
    setOwnerBreedSearchQuery('');
    setBreedPickerVisible(true);
  };

  const handleCloseBreedPicker = () => {
    setBreedPickerVisible(false);
  };

  const handleSelectBreed = (value: string) => {
    setOwnerPetBreed(value);
    setOwnerBreedSearchQuery('');
    setBreedPickerVisible(false);
  };

  const handleOwnerBirthDateChange = (value: string) => {
    setOwnerPetBirthDate(normalizeDashedDate(value));
  };

  const handleOwnerFarewellDateChange = (value: string) => {
    setOwnerPetFarewellDate(normalizeDashedDate(value));
  };

  const handleOwnerWeightPress = () => {
    setWeightSheetVisible(true);
  };

  const handleCloseWeightSheet = () => {
    setWeightSheetVisible(false);
  };

  const handleSelectWeight = (value: string) => {
    setOwnerPetWeightLabel(value);
    setWeightSheetVisible(false);
  };

  const handleGoBackToOwnerPetInfo = () => {
    setMode('ownerPetInfoStepOne');
  };

  const handleContinueOwnerPetDetail = () => {
    if (!isOwnerPetDetailReady) {
      return;
    }

    setSignupFlowType('owner');
    setMode('guestStepFour');
  };

  const handleCaregiverNicknameChange = (value: string) => {
    setCaregiverNickname(value.slice(0, 12));

    if (!value.trim()) {
      setCaregiverNicknameStatus('idle');
      return;
    }

    if (!caregiverNicknamePattern.test(value.trim())) {
      setCaregiverNicknameStatus('invalid');
      return;
    }

    setCaregiverNicknameStatus('idle');
  };

  const handleCheckCaregiverNickname = () => {
    if (!canCheckCaregiverNickname) {
      return;
    }

    if (!isCaregiverNicknameValid) {
      setCaregiverNicknameStatus('invalid');
      return;
    }

    if (mockTakenNicknames.has(trimmedCaregiverNickname.toLowerCase())) {
      setCaregiverNicknameStatus('duplicate');
      return;
    }

    setCaregiverNicknameStatus('available');
  };

  const handleGoBackFromCaregiverStep = () => {
    if (signupFlowType === 'guest') {
      setMockedGuestPet(null);
      setInviteCode('');
      setInviteCodeErrorMessage(null);
      setInviteCodeModalVisible(true);
      return;
    }

    setMode('ownerPetDetailStep');
  };

  const handleContinueGuestSignup = () => {
    if (!isCaregiverStepReady) {
      return;
    }

    const completeSignup = async () => {
      await writeStoredSignupLoadingAnimalType(effectiveSelectedPet?.animalTypeName ?? '강아지');
      setSignupCompletionLoadingVisible(true);

      await wait(1000);

      setFlowNotice({
        message: '반려인 정보 임시 입력이 완료됐습니다. 현재 선택된 홈 골격으로 이동합니다.',
        tone: 'success',
      });
      setSignupCompletionLoadingVisible(false);

      if (currentPreviewRoute) {
        openPreview(currentPreviewRoute);
      }
    };

    completeSignup();
  };

  const handleInviteCodeRequestClose = () => {
    BackHandler.exitApp();
  };

  if (isInviteCodeModalVisible) {
    return (
      <View style={styles.inviteModalScreen}>
        <InviteCodePromptModal
          errorMessage={inviteCodeErrorMessage}
          isSubmitting={isInviteCodeSubmitting}
          onChangeText={handleInviteCodeChange}
          onRequestClose={handleInviteCodeRequestClose}
          onSkip={handleSkipInviteCode}
          onSubmit={handleCompleteInviteCode}
          value={inviteCode}
          visible
        />
      </View>
    );
  }

  if (isSignupCompletionLoadingVisible) {
    return <SignupCompletionLoadingScreen />;
  }

  if (mode === 'ownerPetDetailStep') {
    return (
      <View style={styles.ownerStepScreen}>
        <View style={[styles.ownerPetDetailContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.ownerPetDetailTop}>
            <View style={styles.ownerPetDetailStepperRow}>
              {[1, 2, 3].map((step, index) => {
                const isCompleted = index === 0;
                const isActive = index === 1;

                return (
                  <View key={step} style={styles.stepperItem}>
                    <View
                      style={[
                        styles.ownerPetDetailStepperCircle,
                        isCompleted ? styles.ownerPetDetailStepperCircleCompleted : null,
                        isActive ? styles.ownerPetDetailStepperCircleActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ownerPetDetailStepperLabel,
                          isCompleted || isActive ? styles.ownerPetDetailStepperLabelActive : null,
                          isActive ? styles.ownerPetDetailStepperLabelLarge : null,
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                    {index < 2 ? (
                      <View
                        style={[
                          styles.stepperConnector,
                          index === 0 ? styles.ownerPetDetailStepperConnectorActive : null,
                        ]}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.ownerPetDetailHero}>
              <Text style={styles.ownerPetDetailTitle}>
                <Text style={styles.ownerPetDetailTitleAccent}>{ownerPetName || '몽몽이'}</Text>
                이는
                {'\n'}
                어떤 아이인가요?
              </Text>
            </View>

            <View style={styles.ownerDetailFieldGroup}>
              <Text style={styles.ownerDetailFieldLabel}>세부 종을 등록해주세요</Text>
              <Pressable onPress={handleOpenBreedPicker} style={styles.ownerDetailInputShell}>
                <Text
                  style={[
                    styles.ownerDetailTextInput,
                    styles.ownerDetailPressableText,
                    ownerPetBreed ? null : styles.ownerDetailPlaceholderText,
                  ]}
                >
                  {ownerPetBreed || '반려동물의 종을 선택하거나 입력해주세요.'}
                </Text>
                <Image source={{ uri: searchIcon }} style={styles.ownerDetailTrailingIcon} />
              </Pressable>
            </View>

            <View style={styles.ownerDetailFieldGroup}>
              <Text style={styles.ownerDetailFieldLabel}>생일을 입력해주세요</Text>
                <View style={styles.ownerDetailInputShell}>
                  <TextInput
                    autoCorrect={false}
                    keyboardType="numeric"
                    maxLength={10}
                    onChangeText={handleOwnerBirthDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#A79189"
                    selectionColor="#FFA94E"
                    style={styles.ownerDetailTextInput}
                  value={ownerPetBirthDate}
                />
              </View>
            </View>

            {shouldShowFarewellDate ? (
              <View style={styles.ownerDetailFieldGroup}>
                <Text style={styles.ownerDetailFieldLabel}>이별한 날짜를 입력해주세요</Text>
                <View style={styles.ownerDetailInputShell}>
                  <TextInput
                    autoCorrect={false}
                    keyboardType="numeric"
                    maxLength={10}
                    onChangeText={handleOwnerFarewellDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#A79189"
                    selectionColor="#FFA94E"
                    style={styles.ownerDetailTextInput}
                    value={ownerPetFarewellDate}
                  />
                </View>
                {shouldShowFarewellDateError ? (
                  <View style={styles.ownerDetailHelperRow}>
                    <Image source={{ uri: warningIcon }} style={styles.ownerDetailWarningIcon} />
                    <Text style={styles.ownerDetailHelperText}>0000-00-00 형식에 맞춰서 작성해주세요.</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.ownerDetailFieldGroup}>
              <Text style={styles.ownerDetailFieldLabel}>몸무게를 입력해주세요</Text>
              <Pressable onPress={handleOwnerWeightPress} style={styles.ownerDetailInputShell}>
                <Text
                  style={[
                    styles.ownerDetailTextInput,
                    styles.ownerDetailPressableText,
                    ownerPetWeightLabel ? null : styles.ownerDetailPlaceholderText,
                  ]}
                >
                  {ownerPetWeightLabel || '몸무게 구간을 선택해주세요'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.ownerDetailGenderGroup}>
              <View style={styles.ownerDetailGenderHeader}>
                <Text style={styles.ownerDetailFieldLabel}>성별을 선택해주세요</Text>
                <Pressable onPress={() => setOwnerPetIsNeutered(current => !current)} style={styles.ownerDetailToggleRow}>
                  <View
                    style={[
                      styles.ownerDetailCheckbox,
                      ownerPetIsNeutered ? styles.ownerDetailCheckboxChecked : null,
                    ]}
                  />
                  <Text style={styles.ownerDetailToggleLabel}>중성화 수술을 했나요?</Text>
                </Pressable>
              </View>

              <View style={styles.ownerDetailGenderButtons}>
                <Pressable
                  onPress={() => setOwnerPetGender('male')}
                  style={[
                    styles.ownerDetailGenderButton,
                    ownerPetGender === 'male' ? styles.ownerDetailGenderButtonSelectedMale : null,
                  ]}
                >
                  <Image source={{ uri: maleIcon }} style={styles.ownerDetailGenderIcon} />
                  <Text
                    style={[
                      styles.ownerDetailGenderLabel,
                      ownerPetGender === 'male' ? styles.ownerDetailGenderLabelSelectedDark : null,
                    ]}
                  >
                    남아
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setOwnerPetGender('female')}
                  style={[
                    styles.ownerDetailGenderButton,
                    ownerPetGender === 'female' ? styles.ownerDetailGenderButtonSelectedFemale : null,
                  ]}
                >
                  <Image source={{ uri: femaleIcon }} style={styles.ownerDetailGenderIcon} />
                  <Text
                    style={[
                      styles.ownerDetailGenderLabel,
                      ownerPetGender === 'female' ? styles.ownerDetailGenderLabelSelectedDark : null,
                    ]}
                  >
                    여아
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.ownerFooter}>
            <Pressable onPress={handleGoBackToOwnerPetInfo} style={[styles.ownerFooterButton, styles.ownerBackButton]}>
              <Text style={styles.ownerBackButtonLabel}>이전</Text>
            </Pressable>
            <Pressable
              disabled={!isOwnerPetDetailReady}
              onPress={handleContinueOwnerPetDetail}
              style={[
                styles.ownerFooterButton,
                styles.ownerNextButton,
                isOwnerPetDetailReady ? styles.ownerNextButtonActive : styles.ownerNextButtonDisabled,
              ]}
            >
              <Text style={[styles.ownerNextButtonLabel, isOwnerPetDetailReady ? styles.ownerNextButtonLabelActive : null]}>
                다음으로
              </Text>
            </Pressable>
          </View>
        </View>

        <PetBreedPickerModal
          onChangeQuery={setOwnerBreedSearchQuery}
          onClose={handleCloseBreedPicker}
          onSelect={handleSelectBreed}
          options={currentBreedOptions}
          query={ownerBreedSearchQuery}
          visible={isBreedPickerVisible}
        />
        <PetWeightBottomSheet
          onClose={handleCloseWeightSheet}
          onSelect={handleSelectWeight}
          options={weightRangeOptions}
          selectedValue={ownerPetWeightLabel}
          visible={isWeightSheetVisible}
        />
      </View>
    );
  }

  if (mode === 'guestStepFour') {
    return (
      <View style={styles.ownerStepScreen}>
        <View style={[styles.caregiverStepContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.caregiverStepTop}>
            <View style={styles.ownerPetDetailStepperRow}>
              {[1, 2, 3].map((step, index) => {
                const isCompleted = index < 2;
                const isActive = index === 2;

                return (
                  <View key={step} style={styles.stepperItem}>
                    <View
                      style={[
                        styles.ownerPetDetailStepperCircle,
                        isCompleted ? styles.ownerPetDetailStepperCircleCompleted : null,
                        isActive ? styles.ownerPetDetailStepperCircleActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ownerPetDetailStepperLabel,
                          isCompleted || isActive ? styles.ownerPetDetailStepperLabelActive : null,
                          isActive ? styles.ownerPetDetailStepperLabelLarge : null,
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                    {index < 2 ? <View style={[styles.stepperConnector, styles.ownerPetDetailStepperConnectorActive]} /> : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.ownerPetDetailHero}>
              <Text style={styles.ownerPetDetailTitle}>
                <Text style={styles.ownerPetDetailTitleAccent}>{caregiverPetName}</Text>
                만큼
                {'\n'}
                보호자님도 소중해요
              </Text>
            </View>

            <View style={styles.caregiverFieldGroup}>
              <Text style={styles.caregiverFieldLabel}>닉네임을 등록해주세요</Text>
              <View style={styles.caregiverNicknameField}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={12}
                  onChangeText={handleCaregiverNicknameChange}
                  placeholder="다른 반려인들과 소통할 때 사용돼요. (변경 가능)"
                  placeholderTextColor="#A79189"
                  selectionColor="#FFA94E"
                  style={styles.caregiverNicknameInput}
                  value={caregiverNickname}
                />
                <Pressable
                  disabled={!canCheckCaregiverNickname}
                  onPress={handleCheckCaregiverNickname}
                  style={[
                    styles.caregiverCheckButton,
                    canCheckCaregiverNickname ? styles.caregiverCheckButtonActive : styles.caregiverCheckButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.caregiverCheckButtonLabel,
                      canCheckCaregiverNickname ? styles.caregiverCheckButtonLabelActive : null,
                    ]}
                  >
                    중복 확인
                  </Text>
                </Pressable>
              </View>

              {caregiverHelperMessage ? (
                <View style={styles.ownerDetailHelperRow}>
                  {caregiverNicknameStatus === 'available' ? (
                    <View style={styles.caregiverSuccessDot}>
                      <Text style={styles.caregiverSuccessCheck}>✓</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: warningIcon }} style={styles.ownerDetailWarningIcon} />
                  )}
                  <Text style={styles.ownerDetailHelperText}>{caregiverHelperMessage}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.caregiverFieldGroup}>
              <Text style={styles.ownerDetailFieldLabel}>저희에게 닿게 된 소중한 경로를 알려주세요</Text>
              <View style={styles.caregiverSourceList}>
                {caregiverSourceOptions.map(option => {
                  const isSelected = caregiverSource === option.id;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setCaregiverSource(option.id)}
                      style={styles.caregiverSourceRow}
                    >
                      <View style={[styles.caregiverSourceCircle, isSelected ? styles.caregiverSourceCircleSelected : null]}>
                        {isSelected ? <View style={styles.caregiverSourceInnerDot} /> : null}
                      </View>
                      <Text style={[styles.caregiverSourceLabel, isSelected ? styles.caregiverSourceLabelSelected : null]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.ownerFooter}>
            <Pressable onPress={handleGoBackFromCaregiverStep} style={[styles.ownerFooterButton, styles.ownerBackButton]}>
              <Text style={styles.ownerBackButtonLabel}>이전</Text>
            </Pressable>
            <Pressable
              disabled={!isCaregiverStepReady}
              onPress={handleContinueGuestSignup}
              style={[
                styles.ownerFooterButton,
                styles.ownerNextButton,
                isCaregiverStepReady ? styles.ownerNextButtonActive : styles.ownerNextButtonDisabled,
              ]}
            >
              <Text style={[styles.ownerNextButtonLabel, isCaregiverStepReady ? styles.ownerNextButtonLabelActive : null]}>
                다음으로
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (mode === 'ownerPetInfoStepOne') {
    return (
      <View style={styles.ownerStepScreen}>
        <View style={[styles.ownerPetInfoContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.ownerPetInfoTop}>
            <View style={styles.ownerPetInfoStepperRow}>
              {[1, 2, 3].map((step, index) => {
                const isActive = index === 0;

                return (
                  <View key={step} style={styles.stepperItem}>
                    <View style={[styles.ownerPetInfoStepperCircle, isActive ? styles.ownerPetInfoStepperCircleActive : null]}>
                      <Text
                        style={[
                          styles.ownerPetInfoStepperLabel,
                          isActive ? styles.ownerPetInfoStepperLabelActive : null,
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                    {index < 2 ? <View style={styles.stepperConnector} /> : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.ownerPetInfoHero}>
              <Text style={styles.ownerPetInfoTitle}>
                반가워요{' '}
                <Text style={styles.ownerPetInfoTitleAccent}>{ownerDisplayName}</Text>
                님
                {'\n'}
                소중한 여정을 연결해드릴게요
              </Text>
              <Text style={styles.ownerPetInfoSubtitle}>
                알맞은 방식을 알아보기 위해 우리 아이를 등록해주세요
              </Text>
            </View>

            <View style={styles.ownerPetInfoSection}>
              <Text style={styles.ownerPetInfoSectionTitle}>어떤 반려동물을 키우고 계신가요?</Text>
              <View style={styles.ownerAnimalGrid}>
                {ownerAnimalOptions.map(option => {
                  const isSelected = ownerAnimalType === option.id;
                  const shouldBlur = hasSelectedOwnerAnimalType && !isSelected;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setOwnerAnimalType(option.id)}
                      style={styles.ownerAnimalItem}
                    >
                      <View style={[styles.ownerAnimalCircle, isSelected ? styles.ownerAnimalCircleSelected : null]}>
                        <Image
                          blurRadius={shouldBlur ? 10 : 0}
                          source={{ uri: option.iconUri }}
                          style={[styles.ownerAnimalIcon, shouldBlur ? styles.ownerAnimalIconMuted : null]}
                        />
                      </View>
                      <Text style={[styles.ownerAnimalLabel, isSelected ? styles.ownerAnimalLabelSelected : null]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.ownerPetNameSection}>
              <Text style={styles.ownerPetInfoSectionTitle}>아이의 이름을 알려주세요</Text>
              <TextInput
                autoCorrect={false}
                maxLength={8}
                onChangeText={handleOwnerPetNameChange}
                placeholder="1~8자 이내로 작성해주세요."
                placeholderTextColor="#A79189"
                selectionColor="#FFA94E"
                style={styles.ownerPetNameInput}
                value={ownerPetName}
              />
            </View>
          </View>

          <Pressable
            disabled={!isOwnerPetInfoReady}
            onPress={handleContinueOwnerPetInfo}
            style={[
              styles.ownerPetInfoNextButton,
              isOwnerPetInfoReady ? styles.ownerPetInfoNextButtonActive : styles.ownerPetInfoNextButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.ownerPetInfoNextButtonLabel,
                isOwnerPetInfoReady ? styles.ownerPetInfoNextButtonLabelActive : null,
              ]}
            >
              다음으로
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (mode === 'ownerStepOne') {
    return (
      <View style={styles.ownerStepScreen}>
        <View style={[styles.ownerStepContent, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.ownerStepTop}>
            <View style={styles.stepperBlock}>
              <View style={styles.stepperRow}>
                {[1, 2, 3].map((step, index) => (
                  <View key={step} style={styles.stepperItem}>
                    <View style={styles.stepperCircle}>
                      <Text style={styles.stepperCircleLabel}>{step}</Text>
                    </View>
                    {index < 2 ? <View style={styles.stepperConnector} /> : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.ownerHeroBlock}>
              <Text style={styles.ownerHeroTitle}>
                어플 사용 시기를
                {'\n'}
                선택해주세요.
              </Text>
              <Text style={styles.ownerHeroDescription}>알맞은 단계에서 시작하기 위해 사용돼요.</Text>
            </View>

            <View style={styles.ownerOptionList}>
              {signupStageOptions.map(option => {
                const isSelected = option.id === selectedStage;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSelectedStage(option.id)}
                    style={[styles.ownerOptionCard, isSelected ? styles.ownerOptionCardSelected : null]}
                  >
                    <Text style={styles.ownerOptionTitle}>{option.cardTitle}</Text>
                    <Text style={styles.ownerOptionDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.ownerFooter}>
            <Pressable onPress={handleOpenInviteCodeModal} style={[styles.ownerFooterButton, styles.ownerBackButton]}>
              <Text style={styles.ownerBackButtonLabel}>이전</Text>
            </Pressable>
            <Pressable
              disabled={!selectedStage}
              onPress={handleContinueOwnerSignup}
              style={[
                styles.ownerFooterButton,
                styles.ownerNextButton,
                selectedStage ? styles.ownerNextButtonActive : styles.ownerNextButtonDisabled,
              ]}
            >
              <Text style={[styles.ownerNextButtonLabel, selectedStage ? styles.ownerNextButtonLabelActive : null]}>
                다음으로
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{mode === 'guestStepFour' ? '회원가입 4 / 4' : '회원가입 1 / 4'}</Text>
        <Text style={styles.title}>
          {mode === 'guestStepFour' ? '초대코드가 확인된 이후 단계입니다.' : '아이의 현재 이별 단계를 먼저 선택해 주세요.'}
        </Text>
        <Text style={styles.description}>
          {mode === 'guestStepFour'
            ? 'Guest는 초대코드 확인 후 반려동물 관련 단계가 자동으로 채워지고, 반려인 정보 단계부터 이어집니다.'
            : 'Owner 흐름은 초대코드 확인을 지나면 회원가입 1단계부터 시작합니다. 현재 화면은 회의용 임시 화면과 목업 데이터 기준입니다.'}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, mode === 'guestStepFour' ? styles.progressFillFull : styles.progressFillQuarter]} />
        </View>
      </View>

      {flowNotice ? (
        <View
          style={[
            styles.noticeCard,
            flowNotice.tone === 'success' ? styles.noticeCardSuccess : styles.noticeCardNeutral,
          ]}
        >
          <Text style={styles.noticeLabel}>FLOW STATUS</Text>
          <Text style={styles.noticeText}>{flowNotice.message}</Text>
        </View>
      ) : null}

      <SectionCard title="4. 반려인 정보 입력 전 임시 화면">
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{effectiveSelectedPet?.name ?? '공유받은 아이'} 정보가 연결됐습니다.</Text>
          <Text style={styles.summaryText}>
            {effectiveSelectedPet
              ? `${effectiveSelectedPet.animalTypeName} · ${effectiveSelectedPet.breedName} · ${getLifecycleStatusLabel(effectiveSelectedPet)}`
              : '초대코드 확인 후 공유받은 아이 정보가 여기에 표시됩니다.'}
          </Text>
          <Text style={styles.summaryText}>
            회원 구분: {effectiveSelectedPet?.isOwner ? 'Owner' : 'Guest'} / 초대코드:{' '}
            {effectiveSelectedPet?.inviteCode ?? '없음'}
          </Text>
        </View>

        <View style={styles.checklist}>
          <Text style={styles.checklistItem}>- 1~3단계 반려동물 정보는 초대코드 기준 자동 채움 처리</Text>
          <Text style={styles.checklistItem}>- 다음 단계는 반려인 정보 입력 임시 화면으로 연결 예정</Text>
          <Text style={styles.checklistItem}>- 현재는 회의용 목업 데이터로 흐름만 먼저 확인</Text>
        </View>

        <View style={styles.buttonRow}>
          <Button onPress={handleOpenInviteCodeModal} variant="secondary">
            초대코드 다시 입력
          </Button>
          <Button onPress={handleContinueGuestSignup}>다음 단계 임시 이동</Button>
        </View>
      </SectionCard>

      <SectionCard title="현재 세션 / 미리보기">
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>사용자</Text>
          <Text style={styles.metricValue}>{userLabel}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>isNewUser</Text>
          <Text style={styles.metricValue}>{session?.isNewUser ? 'true' : 'false'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>선택된 반려동물</Text>
          <Text style={styles.metricValue}>
            {effectiveSelectedPet
              ? `${effectiveSelectedPet.name} / ${getLifecycleStatusLabel(effectiveSelectedPet)}`
              : '아직 선택 안 됨'}
          </Text>
        </View>
        <View style={styles.previewButtonGroup}>
          <Button
            disabled={!currentPreviewRoute}
            onPress={() => currentPreviewRoute && openPreview(currentPreviewRoute)}
            variant="secondary"
          >
            {currentPreviewRoute ? '현재 선택 기준 홈 골격 보기' : '단계 또는 초대코드 선택 후 홈 골격 보기'}
          </Button>
          <Button onPress={() => openPreview('beforeFarewellHome')} variant="secondary">
            {previewLabels.beforeFarewellHome}
          </Button>
          <Button onPress={() => openPreview('emergency')} variant="secondary">
            {previewLabels.emergency}
          </Button>
          <Button onPress={() => openPreview('afterFarewellHome')} variant="secondary">
            {previewLabels.afterFarewellHome}
          </Button>
        </View>
      </SectionCard>

      <Button onPress={signOut} variant="secondary">
        인증 화면으로 돌아가기
      </Button>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  inviteModalScreen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  ownerStepScreen: {
    backgroundColor: '#F9F9F9',
    flex: 1,
  },
  ownerPetInfoContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  ownerPetDetailContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  caregiverStepContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  ownerPetDetailTop: {
    gap: 22,
  },
  caregiverStepTop: {
    gap: 32,
  },
  ownerPetInfoTop: {
    gap: 32,
  },
  ownerPetDetailStepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 12,
  },
  ownerPetDetailStepperCircle: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#BCBBB7',
    borderRadius: 16,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  ownerPetDetailStepperCircleCompleted: {
    backgroundColor: '#FFA94E',
    borderColor: '#FFA94E',
  },
  ownerPetDetailStepperCircleActive: {
    backgroundColor: '#FFA94E',
    borderColor: '#FFA94E',
    height: 32,
    width: 32,
  },
  ownerPetDetailStepperLabel: {
    color: '#BCBBB7',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  ownerPetDetailStepperLabelActive: {
    color: '#FFFFFF',
  },
  ownerPetDetailStepperLabelLarge: {
    fontSize: 18,
    lineHeight: 22,
  },
  ownerPetDetailStepperConnectorActive: {
    backgroundColor: '#FFA94E',
  },
  ownerPetInfoStepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 12,
  },
  ownerPetInfoStepperCircle: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#BCBBB7',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  ownerPetInfoStepperCircleActive: {
    backgroundColor: '#FFA94E',
    borderColor: '#FFA94E',
  },
  ownerPetInfoStepperLabel: {
    color: '#BCBBB7',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  ownerPetInfoStepperLabelActive: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  ownerPetInfoHero: {
    gap: 12,
  },
  ownerPetDetailHero: {
    gap: 12,
  },
  ownerPetDetailTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.48,
    lineHeight: 29,
  },
  ownerPetDetailTitleAccent: {
    color: '#FD7E14',
  },
  ownerPetInfoTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.48,
    lineHeight: 29,
  },
  ownerPetInfoTitleAccent: {
    color: '#FD7E14',
  },
  ownerPetInfoSubtitle: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  ownerPetInfoSection: {
    gap: 16,
    paddingVertical: 16,
  },
  ownerPetInfoSectionTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  ownerAnimalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  ownerAnimalItem: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    width: '25%',
  },
  ownerAnimalCircle: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  ownerAnimalCircleSelected: {
    backgroundColor: '#FFF4E8',
    borderColor: '#FFA94E',
  },
  ownerAnimalIcon: {
    height: 58,
    resizeMode: 'contain',
    width: 58,
  },
  ownerAnimalIconMuted: {
    opacity: 0.72,
  },
  ownerAnimalLabel: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 10,
    lineHeight: 15,
  },
  ownerAnimalLabelSelected: {
    color: '#494844',
    fontWeight: '700',
  },
  ownerPetNameSection: {
    gap: 12,
    paddingVertical: 16,
  },
  ownerDetailFieldGroup: {
    gap: 8,
    paddingBottom: 12,
  },
  ownerDetailFieldLabel: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  caregiverFieldGroup: {
    gap: 8,
  },
  caregiverFieldLabel: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  caregiverNicknameField: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    paddingHorizontal: 13,
  },
  caregiverNicknameInput: {
    color: '#42302A',
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    paddingLeft: 1,
    paddingRight: 12,
    paddingVertical: 0,
  },
  caregiverCheckButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 35,
    justifyContent: 'center',
    width: 61,
  },
  caregiverCheckButtonDisabled: {
    backgroundColor: '#E1E0DE',
  },
  caregiverCheckButtonActive: {
    backgroundColor: '#FFA94E',
  },
  caregiverCheckButtonLabel: {
    color: '#979691',
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  caregiverCheckButtonLabelActive: {
    color: '#FFFBEB',
  },
  caregiverSuccessDot: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 999,
    height: 12,
    justifyContent: 'center',
    width: 12,
  },
  caregiverSuccessCheck: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 8,
  },
  caregiverSourceList: {
    gap: 6,
    paddingTop: 8,
  },
  caregiverSourceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingVertical: 8,
  },
  caregiverSourceCircle: {
    alignItems: 'center',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  caregiverSourceCircleSelected: {
    borderColor: '#FFA94E',
  },
  caregiverSourceInnerDot: {
    backgroundColor: '#FFA94E',
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  caregiverSourceLabel: {
    color: '#352622',
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 14,
    lineHeight: 21,
  },
  caregiverSourceLabelSelected: {
    color: '#121212',
  },
  ownerDetailInputShell: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    paddingHorizontal: 15,
  },
  ownerDetailTextInput: {
    color: '#42302A',
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    paddingVertical: 0,
  },
  ownerDetailPressableText: {
    color: '#42302A',
    paddingVertical: 15,
  },
  ownerDetailPlaceholderText: {
    color: '#A79189',
    fontWeight: '400',
  },
  ownerDetailTrailingIcon: {
    height: 20,
    tintColor: '#D8D4CD',
    width: 20,
  },
  ownerDetailHelperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ownerDetailWarningIcon: {
    height: 12,
    width: 12,
  },
  ownerDetailHelperText: {
    color: '#E8580C',
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  ownerDetailGenderGroup: {
    gap: 8,
    paddingBottom: 12,
  },
  ownerDetailGenderHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ownerDetailToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ownerDetailCheckbox: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderRadius: 5,
    borderWidth: 1,
    height: 17,
    width: 17,
  },
  ownerDetailCheckboxChecked: {
    backgroundColor: '#FFA94E',
    borderColor: '#FFA94E',
  },
  ownerDetailToggleLabel: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  ownerDetailGenderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerDetailGenderButton: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#EFEFEE',
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    height: 52,
    justifyContent: 'center',
  },
  ownerDetailGenderButtonSelectedMale: {
    backgroundColor: '#EEF4FF',
    borderColor: '#B9D1FF',
  },
  ownerDetailGenderButtonSelectedFemale: {
    backgroundColor: '#FFEC99',
    borderColor: '#FFEC99',
  },
  ownerDetailGenderIcon: {
    height: 16,
    width: 16,
  },
  ownerDetailGenderLabel: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  ownerDetailGenderLabelSelectedDark: {
    color: '#352622',
  },
  ownerPetNameInput: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 1,
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 12,
    height: 50,
    paddingHorizontal: 16,
  },
  ownerPetInfoNextButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
  },
  ownerPetInfoNextButtonDisabled: {
    backgroundColor: '#E1E0DE',
  },
  ownerPetInfoNextButtonActive: {
    backgroundColor: '#FFA94E',
  },
  ownerPetInfoNextButtonLabel: {
    color: '#979691',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  ownerPetInfoNextButtonLabelActive: {
    color: '#FFFFFF',
  },
  ownerStepContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  ownerStepTop: {
    gap: 32,
  },
  stepperBlock: {
    gap: 14,
    width: 140,
  },
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepperItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepperCircle: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderColor: '#BCBBB7',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  stepperCircleLabel: {
    color: '#BCBBB7',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  stepperConnector: {
    backgroundColor: '#D5D3CF',
    borderRadius: 999,
    height: 3,
    marginHorizontal: 6,
    width: 15,
  },
  ownerHeroBlock: {
    gap: 12,
  },
  ownerHeroTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.48,
    lineHeight: 29,
  },
  ownerHeroDescription: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  ownerOptionList: {
    gap: 16,
  },
  ownerOptionCard: {
    backgroundColor: '#F9F9F9',
    borderColor: '#EFEFEE',
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 120,
    paddingHorizontal: 22,
    paddingVertical: 27,
  },
  ownerOptionCardSelected: {
    backgroundColor: '#FFF6ED',
    borderColor: '#FFA94E',
  },
  ownerOptionTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  ownerOptionDescription: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 13,
    letterSpacing: 0.26,
    lineHeight: 18,
  },
  ownerFooter: {
    flexDirection: 'row',
    gap: 14,
  },
  ownerFooterButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
  },
  ownerBackButton: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderWidth: 2,
    width: 106,
  },
  ownerBackButtonLabel: {
    color: '#494844',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  ownerNextButton: {
    flex: 1,
  },
  ownerNextButtonDisabled: {
    backgroundColor: '#E1E0DE',
  },
  ownerNextButtonActive: {
    backgroundColor: '#FFA94E',
  },
  ownerNextButtonLabel: {
    color: '#979691',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  ownerNextButtonLabelActive: {
    color: '#FFFFFF',
  },
  content: {
    gap: theme.spacing.lg,
  },
  hero: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1D8CF',
    borderRadius: 999,
    color: '#9A4A2C',
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 1.2,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  title: {
    color: theme.colors.ink,
    fontFamily: theme.typography.display.fontFamily,
    fontSize: 32,
    fontWeight: theme.typography.display.fontWeight,
    letterSpacing: theme.typography.display.letterSpacing,
    lineHeight: 40,
  },
  description: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 24,
  },
  progressTrack: {
    backgroundColor: '#E8DED2',
    borderRadius: 999,
    height: 8,
    marginTop: theme.spacing.xs,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: '#FFA94E',
    borderRadius: 999,
    height: '100%',
  },
  progressFillQuarter: {
    width: '25%',
  },
  progressFillFull: {
    width: '100%',
  },
  noticeCard: {
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  noticeCardNeutral: {
    backgroundColor: '#EFE6DA',
  },
  noticeCardSuccess: {
    backgroundColor: '#F7E1C5',
  },
  noticeLabel: {
    color: '#9A4A2C',
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 1.2,
  },
  noticeText: {
    color: '#42302A',
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionDescription: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  optionList: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    backgroundColor: '#FFFDFC',
    borderColor: '#E4D8CA',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  optionCardSelected: {
    backgroundColor: '#FFF1E1',
    borderColor: '#FFA94E',
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  optionTitle: {
    color: theme.colors.ink,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 18,
    fontWeight: theme.typography.title.fontWeight,
  },
  optionTitleSelected: {
    color: '#9A4A2C',
  },
  optionRouteChip: {
    backgroundColor: '#F6F0E7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  optionRouteChipSelected: {
    backgroundColor: '#FFA94E',
  },
  optionRouteLabel: {
    color: '#86746E',
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
  },
  optionRouteLabelSelected: {
    color: '#FFFFFF',
  },
  optionDescription: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: '#6E5144',
  },
  summaryCard: {
    backgroundColor: '#FFFDFC',
    borderColor: '#E4D8CA',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  summaryTitle: {
    color: theme.colors.ink,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 18,
    fontWeight: theme.typography.title.fontWeight,
    lineHeight: 24,
  },
  summaryText: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  checklist: {
    gap: theme.spacing.xs,
  },
  checklistItem: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    gap: theme.spacing.sm,
  },
  metricRow: {
    gap: theme.spacing.xs,
  },
  metricLabel: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 1.2,
  },
  metricValue: {
    color: theme.colors.ink,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 22,
  },
  previewButtonGroup: {
    gap: theme.spacing.sm,
  },
});
