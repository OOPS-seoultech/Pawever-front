import { useEffect, useMemo, useState } from 'react';

import {
  BackHandler,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PetLifecycleStatus } from '../../core/entities/pet';
import {
  computeFarewellPreviewProgress,
  type FarewellPreviewAdminItemId,
  type FarewellPreviewBelongingsOptionId,
  type FarewellPreviewState,
  type FarewellPreviewStepId,
  type FarewellPreviewSupportItemId,
  readStoredFarewellPreviewState,
  writeStoredFarewellPreviewState,
} from '../../infrastructure/storage/farewellPreviewStorage';
import { writeStoredBeforeFarewellHomeSnapshot } from '../../infrastructure/storage/beforeFarewellHomeStorage';
import { resolvePetEmojiAssetUri } from '../../shared/assets/petEmojiAssets';
import { resolveHomePreviewRoute } from '../navigation/resolveHomePreviewRoute';
import { useAppSessionStore } from '../stores/AppSessionStore';

const inactiveHomeAssetUri = 'https://www.figma.com/api/mcp/asset/9a1de914-5682-454b-8955-f7202bdb9562';
const inactiveFootprintAssetUri = 'https://www.figma.com/api/mcp/asset/588ce4ea-6b6d-49e9-84b9-dae34bc703c6';
const inactiveExploreAssetUri = 'https://www.figma.com/api/mcp/asset/85190583-627a-4f2c-ba44-b00dfb3fe342';
const inactiveSettingsAssetUri = 'https://www.figma.com/api/mcp/asset/00a9a881-da45-491e-a25e-8eabe68ce7de';

const previewSteps: Array<{ id: FarewellPreviewStepId; label: string }> = [
  { id: 'funeral', label: '이별방법' },
  { id: 'resting', label: '안치준비' },
  { id: 'administration', label: '행정처리' },
  { id: 'belongings', label: '물건정리' },
  { id: 'support', label: '지원사업' },
];

const restingDetailSteps = [
  {
    body: [
      '아이의 호흡과 심장 박동을 먼저 확인해 주세요.',
      '움직임이 없다면 조용히 곁을 지키며 다음 준비를 이어가면 됩니다.',
    ],
    title: '아이의 상태를 확인합니다',
  },
  {
    body: [
      '깨끗한 수건, 배변패드, 미지근한 물을 준비해 주세요.',
      '익숙한 담요가 있다면 아이 곁에 함께 두어도 좋아요.',
    ],
    title: '준비물을 확인합니다',
  },
  {
    body: [
      '손끝으로 눈두덩을 천천히 쓸어 눈을 감겨 주세요.',
      '힘이 들어간다면 수건으로 덮어 잠시 시간을 둬도 괜찮아요.',
    ],
    title: '눈을 감겨주세요',
  },
  {
    body: [
      '입 주위의 이물질을 거즈나 수건으로 부드럽게 닦아 주세요.',
      '입을 억지로 닫으려 하기보다 편안한 모양을 우선해 주세요.',
    ],
    title: '입 주변을 정리해주세요',
  },
  {
    body: [
      '배변물이나 체액이 남아 있을 수 있어요.',
      '무리하지 말고 물티슈로 항문 주변을 깨끗하게 닦아 주세요.',
    ],
    title: '분비물 예방 - 항문 닦기',
  },
  {
    body: [
      '배변패드나 수건을 몸 아래에 넉넉하게 깔아 주세요.',
      '추가 배출에 대비해 교체용 패드도 함께 준비하면 좋아요.',
    ],
    title: '배변패드를 깔아주세요',
  },
];

const illegalMethodNotices = [
  '공원이나 산, 하천에 임의로 매장하거나 유기하는 방식은 불법일 수 있어요.',
  '종량제 봉투, 재활용 봉투, 생활폐기물과 함께 버리는 행위도 금지됩니다.',
  '지역 조례에 따라 과태료와 형사 처벌이 발생할 수 있으니 꼭 합법적인 절차를 확인해 주세요.',
];

const administrationItems: Array<{
  actionButtons: Array<{
    actionLabel: string;
    kind: 'browser';
    targetLabel: string;
    value: string;
  }>;
  bodyLines: string[];
  description: string;
  durationLabel: string;
  id: FarewellPreviewAdminItemId;
  title: string;
}> = [
  {
    actionButtons: [
      {
        actionLabel: '동물보호관리시스템 바로가기',
        kind: 'browser',
        targetLabel: '동물보호관리시스템',
        value: 'https://www.animal.go.kr',
      },
    ],
    bodyLines: [
      '동물등록증 또는 등록번호를 준비해 주세요.',
      '동물보호관리시스템에서 조회할 수 있어요.',
    ],
    description: '우리 아이의 등록번호를 확인해요.',
    durationLabel: '5분',
    id: 'registryNumber',
    title: '1. 동물등록번호 확인하기',
  },
  {
    actionButtons: [
      {
        actionLabel: '정부24 안내 보기',
        kind: 'browser',
        targetLabel: '정부24',
        value: 'https://www.gov.kr',
      },
    ],
    bodyLines: [
      '거주지 관할 시, 군, 구청 정보를 확인해 주세요.',
      '온라인 신고는 정부24 또는 정부 사이트에서 가능해요.',
    ],
    description: '신고 지역의 등록 담당 기관을 찾아요.',
    durationLabel: '2분',
    id: 'reportOffice',
    title: '2. 사망신고 접수처 선택하기',
  },
  {
    actionButtons: [],
    bodyLines: [
      '신분증, 동물등록증, 진단서나 확인 서류를 미리 챙겨 주세요.',
      '서류가 없는 경우 접수처에 대체 서류를 확인해도 좋아요.',
    ],
    description: '사망신고에 필요한 서류를 준비합니다.',
    durationLabel: '10분',
    id: 'documents',
    title: '3. 필요 서류 준비하기',
  },
  {
    actionButtons: [],
    bodyLines: [
      '준비한 서류로 사망신고를 접수해 주세요.',
      '온라인 신고 시 등록번호와 보호자 정보가 필요할 수 있어요.',
    ],
    description: '준비한 서류로 사망신고를 접수합니다.',
    durationLabel: '15분',
    id: 'submitReport',
    title: '4. 사망신고 접수하기',
  },
  {
    actionButtons: [
      {
        actionLabel: '사망처리 현황 확인하기',
        kind: 'browser',
        targetLabel: '정부24',
        value: 'https://www.gov.kr',
      },
    ],
    bodyLines: [
      '신고 접수 후에는 처리완료 여부를 다시 확인해 주세요.',
      '등록번호 삭제까지는 영업일 기준 며칠이 걸릴 수 있어요.',
    ],
    description: '사망신고가 정상적으로 처리되었는지 확인합니다.',
    durationLabel: '즉시',
    id: 'verifyReport',
    title: '5. 신고 완료 확인하기',
  },
];

const belongingsOptions: Array<{
  bullets: string[];
  emoji: string;
  id: FarewellPreviewBelongingsOptionId;
  title: string;
}> = [
  {
    bullets: ['사진과 함께 메모리 박스를 만들 수 있어요.', '작은 물건만 남겨도 충분히 의미가 있어요.'],
    emoji: '📦',
    id: 'keep',
    title: '보관하기',
  },
  {
    bullets: ['동물보호단체나 구조센터에 문의해 볼 수 있어요.', '유기동물 보호소에 필요한 물품인지 먼저 확인해 주세요.'],
    emoji: '🤲',
    id: 'donate',
    title: '기부하기',
  },
  {
    bullets: ['약품, 의료용품은 분리배출 방법을 먼저 확인해 주세요.', '대형 용품은 구청 생활폐기물 안내를 참고하면 좋아요.'],
    emoji: '🗑',
    id: 'dispose',
    title: '처리하기',
  },
  {
    bullets: ['사진, 꽃, 편지, 발바닥 도장으로 작은 추모 공간을 만들 수 있어요.', '집 안 한 켠에 두고 천천히 정리해도 괜찮아요.'],
    emoji: '🕯',
    id: 'memorialSpace',
    title: '추모 공간 만들기',
  },
];

const supportItems: Array<{
  actionButtons: Array<{
    actionLabel: string;
    kind: 'browser' | 'phone';
    targetLabel: string;
    value: string;
  }>;
  badgeLabel: string;
  bodyLines: string[];
  description: string;
  id: FarewellPreviewSupportItemId;
  title: string;
}> = [
  {
    actionButtons: [
      {
        actionLabel: '청년정책정보통 바로가기',
        kind: 'browser',
        targetLabel: '청년정책정보통',
        value: 'https://youth.seoul.go.kr',
      },
      {
        actionLabel: '전화 걸기',
        kind: 'phone',
        targetLabel: '02-2144-1195',
        value: '02-2144-1195',
      },
    ],
    badgeLabel: '전액 무료',
    bodyLines: ['서울시 청년을 대상으로 심리 상담을 지원해요.', '자격 요건과 신청 기간을 먼저 확인해 주세요.'],
    description: '서울시 청년을 대상으로 하는 심리 상담 지원',
    id: 'seoulYouthMind',
    title: '서울시 청년 마음건강 지원 사업',
  },
  {
    actionButtons: [
      {
        actionLabel: '복지로 바로가기',
        kind: 'browser',
        targetLabel: '복지로',
        value: 'https://www.bokjiro.go.kr',
      },
      {
        actionLabel: '전화 걸기',
        kind: 'phone',
        targetLabel: '129',
        value: '129',
      },
    ],
    badgeLabel: '일부 부담',
    bodyLines: ['보건복지부가 운영하는 청년 마음건강 지원사업이에요.', '소득과 연령 조건에 따라 본인부담금이 달라져요.'],
    description: '보건복지부 청년 마음건강 지원 사업',
    id: 'youthMind',
    title: '청년 마음건강 지원사업',
  },
  {
    actionButtons: [
      {
        actionLabel: '전화 걸기',
        kind: 'phone',
        targetLabel: '129',
        value: '129',
      },
    ],
    badgeLabel: '전액 무료',
    bodyLines: ['전 국민 대상 정신건강 상담 및 병원 방문 연계가 가능해요.', '거주 지역 정신건강복지센터와 함께 확인하면 더 빨라요.'],
    description: '전국민 대상 마음투자 지원 사업',
    id: 'nationalMind',
    title: '전국민 마음투자 지원사업',
  },
  {
    actionButtons: [
      {
        actionLabel: '02-2144-1195',
        kind: 'phone',
        targetLabel: '02-2144-1195',
        value: '02-2144-1195',
      },
      {
        actionLabel: '02-901-8619',
        kind: 'phone',
        targetLabel: '02-901-8619',
        value: '02-901-8619',
      },
      {
        actionLabel: '02-2602-3275',
        kind: 'phone',
        targetLabel: '02-2602-3275',
        value: '02-2602-3275',
      },
      {
        actionLabel: '02-959-8004',
        kind: 'phone',
        targetLabel: '02-959-8004',
        value: '02-959-8004',
      },
    ],
    badgeLabel: '전액 무료',
    bodyLines: ['서울시 4개 권역 심리지원센터 전화 상담 안내예요.', '가까운 권역을 선택해 편한 시간에 문의해 주세요.'],
    description: '서울심리지원센터(4개 권역)',
    id: 'seoulMentalCenter',
    title: '서울심리지원센터 (4개 권역)',
  },
];

type ExternalActionRequest = {
  actionLabel: string;
  kind: 'browser' | 'phone';
  targetLabel: string;
  value: string;
};

type FarewellPreviewBottomNavTab = {
  iconUri: string;
  id: 'explore' | 'footprints' | 'home' | 'settings';
  label: string;
};

const getCurrentStepLabel = (stepId: FarewellPreviewStepId) =>
  previewSteps.find(step => step.id === stepId)?.label ?? '다음 단계';

const uniqueValues = <T extends string>(values: T[]) => Array.from(new Set(values));

const isStepCompleted = (
  previewState: FarewellPreviewState,
  stepId: FarewellPreviewStepId,
) => {
  if (previewState.completedStepIds.includes(stepId)) {
    return true;
  }

  if (stepId === 'funeral') {
    return previewState.funeralCompanyConfirmed;
  }

  if (stepId === 'resting') {
    return previewState.restingCompletedStepCount >= restingDetailSteps.length;
  }

  if (stepId === 'administration') {
    return previewState.administrationCompletedItemIds.length === administrationItems.length;
  }

  if (stepId === 'belongings') {
    return previewState.belongingsConfirmed;
  }

  return previewState.supportConfirmed;
};

const getBottomNavTabs = (lifecycleStatus: PetLifecycleStatus): FarewellPreviewBottomNavTab[] => {
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

const createFallbackPreviewState = (
  lifecycleStatus: PetLifecycleStatus,
): FarewellPreviewState => ({
  administrationCompletedItemIds: [],
  belongingsConfirmed: false,
  belongingsSelectedOptionIds: [],
  completedStepIds: [],
  currentStepId: lifecycleStatus === 'AFTER_FAREWELL' ? 'administration' : 'funeral',
  enteredStepIds: [lifecycleStatus === 'AFTER_FAREWELL' ? 'administration' : 'funeral'],
  funeralCompanyConfirmed: false,
  hasCompletedGuide: lifecycleStatus === 'AFTER_FAREWELL',
  lifecycleStatus,
  restingActiveStepNumber: 0,
  restingCompletedStepCount: 0,
  supportCompletedItemIds: [],
  supportConfirmed: false,
});

type StepperProps = {
  currentStepId: FarewellPreviewStepId;
  disabled: boolean;
  lifecycleStatus: PetLifecycleStatus;
  onPressStep: (stepId: FarewellPreviewStepId) => void;
  previewState: FarewellPreviewState;
};

function Stepper({
  currentStepId,
  disabled,
  lifecycleStatus,
  onPressStep,
  previewState,
}: StepperProps) {
  const isAfterFarewell = lifecycleStatus === 'AFTER_FAREWELL';

  return (
    <View style={styles.stepperRoot}>
      <View style={styles.stepperRow}>
        {previewSteps.map((step, index) => {
          const isCurrent = currentStepId === step.id;
          const isCompleted = isStepCompleted(previewState, step.id);
          const isDisabled = disabled
            || (isAfterFarewell && (step.id === 'funeral' || step.id === 'resting'));
          const circleStyle = isDisabled
            ? styles.stepperCircleDisabled
            : isCompleted
              ? styles.stepperCircleCompleted
              : isCurrent
                ? styles.stepperCircleCurrent
                : styles.stepperCircleDefault;
          const labelStyle = isDisabled
            ? styles.stepperLabelDisabled
            : isCurrent
              ? styles.stepperLabelCurrent
              : isCompleted
                ? styles.stepperLabelCompleted
                : styles.stepperLabelDefault;
          const circleText = isCompleted ? '✓' : `${index + 1}`;

          return (
            <View key={step.id} style={styles.stepperItem}>
              <Pressable
                disabled={isDisabled}
                onPress={() => onPressStep(step.id)}
                style={styles.stepperPressable}
              >
                <View style={[styles.stepperCircle, circleStyle]}>
                  <Text style={[styles.stepperCircleLabel, isDisabled ? styles.stepperCircleLabelDisabled : null]}>
                    {circleText}
                  </Text>
                </View>
                <Text style={[styles.stepperLabel, labelStyle]}>
                  {isCompleted ? '완료' : step.label}
                </Text>
              </Pressable>

              {index < previewSteps.length - 1 ? (
                <View style={styles.stepperConnector}>
                  <View style={styles.stepperConnectorDot} />
                  <View style={styles.stepperConnectorDot} />
                  <View style={styles.stepperConnectorDot} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function FarewellPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { openPreview, selectedPet } = useAppSessionStore();
  const [isHydrating, setHydrating] = useState(true);
  const [previewState, setPreviewState] = useState<FarewellPreviewState | null>(null);
  const [isSkipModalVisible, setSkipModalVisible] = useState(false);
  const [skipTargetStepId, setSkipTargetStepId] = useState<FarewellPreviewStepId | null>(null);
  const [isExitModalVisible, setExitModalVisible] = useState(false);
  const [isIllegalMethodSheetVisible, setIllegalMethodSheetVisible] = useState(false);
  const [isRestingNoticeVisible, setRestingNoticeVisible] = useState(false);
  const [pendingExternalAction, setPendingExternalAction] = useState<ExternalActionRequest | null>(null);
  const [expandedAdministrationItemIds, setExpandedAdministrationItemIds] = useState<FarewellPreviewAdminItemId[]>([]);
  const [expandedSupportItemIds, setExpandedSupportItemIds] = useState<FarewellPreviewSupportItemId[]>([]);
  const lifecycleStatus = selectedPet?.lifecycleStatus ?? 'BEFORE_FAREWELL';
  const title = lifecycleStatus === 'AFTER_FAREWELL' ? '이어 살펴보기' : '미리 살펴보기';
  const isOwner = selectedPet?.isOwner ?? true;
  const petEmojiUri = resolvePetEmojiAssetUri(selectedPet?.animalTypeName);
  const homePreviewRoute = resolveHomePreviewRoute(selectedPet);
  const bottomNavTabs = useMemo(
    () => getBottomNavTabs(lifecycleStatus),
    [lifecycleStatus],
  );

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const nextPreviewState = await readStoredFarewellPreviewState({
        inviteCode: selectedPet?.inviteCode ?? null,
        lifecycleStatus,
        petId: selectedPet?.id ?? null,
      });

      if (!isMounted) {
        return;
      }

      setPreviewState(nextPreviewState);
      setHydrating(false);
    };

    hydrate().catch(() => {
      if (!isMounted) {
        return;
      }

      setPreviewState(createFallbackPreviewState(lifecycleStatus));
      setHydrating(false);
    });

    return () => {
      isMounted = false;
    };
  }, [lifecycleStatus, selectedPet?.id, selectedPet?.inviteCode]);

  const persistPreviewState = (nextPreviewState: FarewellPreviewState) => {
    setPreviewState(nextPreviewState);

    if (!isOwner) {
      return;
    }

    writeStoredFarewellPreviewState(
      {
        inviteCode: selectedPet?.inviteCode ?? null,
        lifecycleStatus,
        petId: selectedPet?.id ?? null,
      },
      nextPreviewState,
    ).catch(() => undefined);

    if (lifecycleStatus === 'BEFORE_FAREWELL') {
      writeStoredBeforeFarewellHomeSnapshot({
        progressPercent: computeFarewellPreviewProgress(nextPreviewState),
      }).catch(() => undefined);
    }
  };

  const applyPreviewState = (updater: (current: FarewellPreviewState) => FarewellPreviewState) => {
    if (!previewState) {
      return;
    }

    persistPreviewState(updater(previewState));
  };

  const showGuide = lifecycleStatus === 'BEFORE_FAREWELL' && !previewState?.hasCompletedGuide;
  const currentStepId = previewState?.currentStepId ?? (lifecycleStatus === 'AFTER_FAREWELL' ? 'administration' : 'funeral');
  const currentStepIsCompleted = previewState
    ? isStepCompleted(previewState, currentStepId)
    : false;
  const progressPercent = previewState ? computeFarewellPreviewProgress(previewState) : 0;

  const handleLeavePreview = () => {
    if (showGuide) {
      openPreview(homePreviewRoute);
      return;
    }

    setExitModalVisible(true);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showGuide) {
        openPreview(homePreviewRoute);
      } else {
        setExitModalVisible(true);
      }

      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [showGuide, homePreviewRoute, openPreview]);

  const moveToStep = (stepId: FarewellPreviewStepId) => {
    applyPreviewState(current => ({
      ...current,
      currentStepId: stepId,
      enteredStepIds: uniqueValues([...current.enteredStepIds, stepId]),
    }));
  };

  const handlePressStep = (stepId: FarewellPreviewStepId) => {
    if (!previewState || showGuide || currentStepId === stepId) {
      return;
    }

    const isDisabledInAfterFlow = lifecycleStatus === 'AFTER_FAREWELL'
      && (stepId === 'funeral' || stepId === 'resting');

    if (isDisabledInAfterFlow) {
      return;
    }

    if (!currentStepIsCompleted) {
      setSkipTargetStepId(stepId);
      setSkipModalVisible(true);
      return;
    }

    moveToStep(stepId);
  };

  const handleConfirmGuide = () => {
    applyPreviewState(current => ({
      ...current,
      currentStepId: 'funeral',
      enteredStepIds: uniqueValues([...current.enteredStepIds, 'funeral']),
      hasCompletedGuide: true,
    }));
  };

  const handleConfirmSkip = () => {
    if (!skipTargetStepId) {
      return;
    }

    moveToStep(skipTargetStepId);
    setSkipModalVisible(false);
    setSkipTargetStepId(null);
  };

  const handleToggleAdministrationItem = (itemId: FarewellPreviewAdminItemId) => {
    applyPreviewState(current => {
      const isCompleted = current.administrationCompletedItemIds.includes(itemId);
      const administrationCompletedItemIds = isCompleted
        ? current.administrationCompletedItemIds.filter(id => id !== itemId)
        : [...current.administrationCompletedItemIds, itemId];

      return {
        ...current,
        administrationCompletedItemIds: uniqueValues(administrationCompletedItemIds),
      };
    });
  };

  const handleCompleteAdministration = () => {
    if (!previewState || previewState.administrationCompletedItemIds.length !== administrationItems.length) {
      return;
    }

    applyPreviewState(current => ({
      ...current,
      completedStepIds: uniqueValues([...current.completedStepIds, 'administration']),
      currentStepId: 'belongings',
      enteredStepIds: uniqueValues([...current.enteredStepIds, 'belongings']),
    }));
  };

  const handleToggleBelongingsOption = (optionId: FarewellPreviewBelongingsOptionId) => {
    applyPreviewState(current => {
      const isSelected = current.belongingsSelectedOptionIds.includes(optionId);
      const belongingsSelectedOptionIds = isSelected
        ? current.belongingsSelectedOptionIds.filter(id => id !== optionId)
        : [...current.belongingsSelectedOptionIds, optionId];

      return {
        ...current,
        belongingsSelectedOptionIds: uniqueValues(belongingsSelectedOptionIds),
      };
    });
  };

  const handleConfirmBelongings = () => {
    if (!previewState || previewState.belongingsSelectedOptionIds.length === 0) {
      return;
    }

    applyPreviewState(current => ({
      ...current,
      belongingsConfirmed: true,
      completedStepIds: uniqueValues([...current.completedStepIds, 'belongings']),
      currentStepId: 'support',
      enteredStepIds: uniqueValues([...current.enteredStepIds, 'support']),
    }));
  };

  const handleToggleSupportItem = (itemId: FarewellPreviewSupportItemId) => {
    applyPreviewState(current => {
      const isCompleted = current.supportCompletedItemIds.includes(itemId);
      const supportCompletedItemIds = isCompleted
        ? current.supportCompletedItemIds.filter(id => id !== itemId)
        : [...current.supportCompletedItemIds, itemId];

      return {
        ...current,
        supportCompletedItemIds: uniqueValues(supportCompletedItemIds),
      };
    });
  };

  const handleConfirmSupport = () => {
    if (!previewState || previewState.supportCompletedItemIds.length !== supportItems.length) {
      return;
    }

    applyPreviewState(current => ({
      ...current,
      completedStepIds: uniqueValues([...current.completedStepIds, 'support']),
      supportConfirmed: true,
    }));
  };

  const handleConfirmFuneralMethod = () => {
    applyPreviewState(current => ({
      ...current,
      completedStepIds: uniqueValues([...current.completedStepIds, 'funeral']),
      currentStepId: 'resting',
      enteredStepIds: uniqueValues([...current.enteredStepIds, 'resting']),
      funeralCompanyConfirmed: true,
    }));
  };

  const handleStartRestingGuide = () => {
    applyPreviewState(current => ({
      ...current,
      restingActiveStepNumber: 1,
    }));
  };

  const handleMoveRestingBackward = () => {
    if (!previewState) {
      return;
    }

    if (previewState.restingActiveStepNumber === 0) {
      moveToStep('funeral');
      return;
    }

    applyPreviewState(current => ({
      ...current,
      restingActiveStepNumber: Math.max(0, current.restingActiveStepNumber - 1),
    }));
  };

  const handleMoveRestingForward = () => {
    if (!previewState || previewState.restingActiveStepNumber === 0) {
      return;
    }

    const currentRestingStepNumber = previewState.restingActiveStepNumber;

    if (currentRestingStepNumber >= restingDetailSteps.length) {
      applyPreviewState(current => ({
        ...current,
        completedStepIds: uniqueValues([...current.completedStepIds, 'resting']),
        currentStepId: 'administration',
        enteredStepIds: uniqueValues([...current.enteredStepIds, 'administration']),
        restingActiveStepNumber: restingDetailSteps.length,
        restingCompletedStepCount: restingDetailSteps.length,
      }));
      return;
    }

    applyPreviewState(current => ({
      ...current,
      restingActiveStepNumber: current.restingActiveStepNumber + 1,
      restingCompletedStepCount: Math.max(
        current.restingCompletedStepCount,
        current.restingActiveStepNumber,
      ),
    }));
  };

  const handleToggleAdministrationExpand = (itemId: FarewellPreviewAdminItemId) => {
    setExpandedAdministrationItemIds(current =>
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId],
    );
  };

  const handleToggleSupportExpand = (itemId: FarewellPreviewSupportItemId) => {
    setExpandedSupportItemIds(current =>
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId],
    );
  };

  const handleConfirmExternalAction = () => {
    if (!pendingExternalAction) {
      return;
    }

    const target = pendingExternalAction.kind === 'phone'
      ? `tel:${pendingExternalAction.value}`
      : pendingExternalAction.value;

    Linking.openURL(target).catch(() => undefined);
    setPendingExternalAction(null);
  };

  const renderGuideScreen = () => (
    <>
      <Text style={styles.heroTitle}>
        아이의 곁을 지키는 준비를
        {'\n'}
        차근차근 함께 살펴볼게요
      </Text>
      <Text style={styles.heroDescription}>
        미리 살펴보기는 지금 할 수 있는 준비와, 나중을 위한 절차를 한 흐름으로 안내해요.
      </Text>

      <View style={styles.guideEmojiFrame}>
        <Text style={styles.guideEmoji}>🌈</Text>
        <View style={styles.guideEmojiBadge}>
          <Text style={styles.guideEmojiBadgeLabel}>안내</Text>
        </View>
      </View>

      <View style={styles.guideSection}>
        <Text style={styles.guideSectionTitle}>'이별 전'에만 할 수 있는 일</Text>
        <View style={styles.guideInfoCard}>
          <Text style={styles.guideInfoTitle}>1. 장례 방법을 미리 알아봐요</Text>
          <Text style={styles.guideInfoBody}>장례업체, 절차, 비용을 미리 확인해 두면 갑작스러운 순간에도 덜 흔들릴 수 있어요.</Text>
        </View>
        <View style={styles.guideInfoCard}>
          <Text style={styles.guideInfoTitle}>2. 안치 준비를 차근차근 익혀요</Text>
          <Text style={styles.guideInfoBody}>아이를 편안하게 보내기 위한 준비물을 체크하고 순서를 익혀 둘 수 있어요.</Text>
        </View>
      </View>

      <View style={styles.guideSection}>
        <Text style={styles.guideSectionTitle}>'이별 후' 진행 내용</Text>
        <View style={styles.guideInfoCard}>
          <Text style={styles.guideInfoTitle}>행정 처리</Text>
          <Text style={styles.guideInfoBody}>신고 기한, 필요 서류, 접수 순서를 한 번에 확인할 수 있어요.</Text>
        </View>
        <View style={styles.guideInfoCard}>
          <Text style={styles.guideInfoTitle}>물건 정리와 지원사업</Text>
          <Text style={styles.guideInfoBody}>유품 정리 방향과 심리 지원 정보를 차례대로 살펴볼 수 있어요.</Text>
        </View>
      </View>

      <Pressable onPress={handleConfirmGuide} style={styles.primaryButton}>
        <Text style={styles.primaryButtonLabel}>네, 둘러볼게요</Text>
      </Pressable>
    </>
  );

  const renderFuneralStep = () => (
    <>
      <Text style={styles.sectionHeading}>장례업체 안내</Text>
      <Text style={styles.sectionSubheading}>합법적인 절차와 확인 포인트를 먼저 정리해 둘게요.</Text>

      <View style={styles.calloutCard}>
        <Text style={styles.calloutTitle}>이런 점이 좋아요</Text>
        <Text style={styles.calloutBody}>장례업체를 미리 알아두면 위치, 비용, 절차를 급하게 검색하지 않아도 돼요.</Text>
      </View>
      <View style={styles.calloutCard}>
        <Text style={styles.calloutTitle}>이런 점을 고려해 보세요</Text>
        <Text style={styles.calloutBody}>공식 등록 여부와 후기, 상담 시간, 이동 가능 거리 등을 함께 확인해 두면 좋아요.</Text>
      </View>

      <Pressable onPress={() => setIllegalMethodSheetVisible(true)} style={styles.warningRow}>
        <Text style={styles.warningRowText}>혹시 다른 방법을 생각하셨나요? 그건 불법일 수 있어요</Text>
        <Text style={styles.warningRowChevron}>{'>'}</Text>
      </Pressable>

      <Pressable onPress={() => openPreview('funeralCompanies')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonLabel}>장례업체 둘러보기</Text>
      </Pressable>

      <Pressable onPress={handleConfirmFuneralMethod} style={styles.primaryButton}>
        <Text style={styles.primaryButtonLabel}>이 방식을 고려해요</Text>
      </Pressable>
    </>
  );

  const renderRestingStep = () => {
    if (!previewState) {
      return null;
    }

    if (previewState.restingActiveStepNumber === 0) {
      return (
        <>
          <View style={styles.restingHeaderRow}>
            <Text style={styles.sectionHeading}>안치 준비 가이드</Text>
            <Pressable onPress={() => setRestingNoticeVisible(true)} style={styles.noticeTrigger}>
              <Text style={styles.noticeTriggerLabel}>주의</Text>
            </Pressable>
          </View>

          <View style={styles.restingEmojiFrame}>
            <Text style={styles.restingEmoji}>🐾</Text>
          </View>

          <Text style={styles.sectionHeading}>
            이별의 순간, 당황하지 않고
            {'\n'}
            온전히 배웅할 수 있도록
          </Text>
          <Text style={styles.sectionSubheading}>
            6가지 단계로 아이에게 줄 수 있는 마지막 돌봄을 천천히 준비해 볼게요.
          </Text>

          <Pressable onPress={handleStartRestingGuide} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>시작하기</Text>
          </Pressable>
        </>
      );
    }

    const activeRestingStep = restingDetailSteps[Math.max(0, previewState.restingActiveStepNumber - 1)];

    return (
      <>
        <View style={styles.restingHeaderRow}>
          <Text style={styles.stepChip}>{`Step.${previewState.restingActiveStepNumber}`}</Text>
          <Pressable onPress={() => setRestingNoticeVisible(true)} style={styles.noticeTrigger}>
            <Text style={styles.noticeTriggerLabel}>주의</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeading}>{activeRestingStep.title}</Text>
        <View style={styles.restingIllustrationCard}>
          <Text style={styles.restingIllustrationLabel}>아이 곁에서 차분히 진행해 주세요</Text>
        </View>
        {activeRestingStep.body.map(line => (
          <Text key={line} style={styles.sectionSubheading}>
            {line}
          </Text>
        ))}

        <View style={styles.bottomButtonRow}>
          <Pressable onPress={handleMoveRestingBackward} style={[styles.halfButton, styles.secondaryButtonCompact]}>
            <Text style={styles.secondaryButtonLabel}>이전으로</Text>
          </Pressable>
          <Pressable onPress={handleMoveRestingForward} style={[styles.halfButton, styles.primaryButtonCompact]}>
            <Text style={styles.primaryButtonLabel}>다음으로</Text>
          </Pressable>
        </View>
      </>
    );
  };

  const renderAdministrationStep = () => (
    <>
      <Text style={styles.sectionHeading}>
        힘든 시간이지만,
        {'\n'}
        마지막으로 해야 할 일들을 함께 정리해드릴게요
      </Text>
      <Text style={styles.sectionSubheading}>반려동물 사망일로부터 30일 이내 신고해야 해요.</Text>

      <View style={styles.deadlineCard}>
        <Text style={styles.deadlineCardTitle}>신고 기한 안내</Text>
        <Text style={styles.deadlineCardBody}>반려동물 사망일로부터 30일 이내에 신고해야 해요.</Text>
      </View>

      {administrationItems.map(item => {
        const isExpanded = expandedAdministrationItemIds.includes(item.id);
        const isCompleted = previewState?.administrationCompletedItemIds.includes(item.id) ?? false;

        return (
          <View key={item.id} style={styles.accordionCard}>
            <Pressable onPress={() => handleToggleAdministrationExpand(item.id)} style={styles.accordionHeader}>
              <View style={styles.accordionHeaderTextBlock}>
                <Text style={styles.accordionTitle}>{item.title}</Text>
                <Text style={styles.accordionSubtitle}>{item.description}</Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationBadgeLabel}>{item.durationLabel}</Text>
              </View>
            </Pressable>

            {isExpanded ? (
              <View style={styles.accordionBody}>
                {item.bodyLines.map(line => (
                  <Text key={line} style={styles.accordionBullet}>
                    {'• '}
                    {line}
                  </Text>
                ))}

                <View style={styles.actionButtonWrap}>
                  {item.actionButtons.map(actionButton => (
                    <Pressable
                      key={`${item.id}-${actionButton.actionLabel}`}
                      onPress={() => setPendingExternalAction(actionButton)}
                      style={[styles.inlineActionButton, styles.inlineActionButtonSecondary]}
                    >
                      <Text style={styles.inlineActionButtonLabel}>{actionButton.actionLabel}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => handleToggleAdministrationItem(item.id)}
                    style={[
                      styles.inlineActionButton,
                      isCompleted ? styles.inlineActionButtonPrimary : styles.inlineActionButtonSecondary,
                    ]}
                  >
                    <Text style={[styles.inlineActionButtonLabel, isCompleted ? styles.inlineActionButtonLabelPrimary : null]}>
                      완료 하기
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <Pressable
        disabled={(previewState?.administrationCompletedItemIds.length ?? 0) !== administrationItems.length}
        onPress={handleCompleteAdministration}
        style={[
          styles.primaryButton,
          (previewState?.administrationCompletedItemIds.length ?? 0) !== administrationItems.length
            ? styles.primaryButtonDisabled
            : null,
        ]}
      >
        <Text style={styles.primaryButtonLabel}>위 내용을 모두 확인했습니다</Text>
      </Pressable>
    </>
  );

  const renderBelongingsStep = () => (
    <>
      <Text style={styles.sectionHeading}>유품 정리 방법</Text>
      <Text style={styles.sectionSubheading}>마음이 준비되었을 때, 천천히 정리해 나가셔도 괜찮아요.</Text>

      <View style={styles.optionGrid}>
        {belongingsOptions.map(option => {
          const isSelected = previewState?.belongingsSelectedOptionIds.includes(option.id) ?? false;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleToggleBelongingsOption(option.id)}
              style={[styles.optionCard, isSelected ? styles.optionCardSelected : null]}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={styles.optionTitle}>{option.title}</Text>
              {option.bullets.map(line => (
                <Text key={line} style={styles.optionBullet}>
                  {'• '}
                  {line}
                </Text>
              ))}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={(previewState?.belongingsSelectedOptionIds.length ?? 0) === 0}
        onPress={handleConfirmBelongings}
        style={[
          styles.primaryButton,
          (previewState?.belongingsSelectedOptionIds.length ?? 0) === 0
            ? styles.primaryButtonDisabled
            : null,
        ]}
      >
        <Text style={styles.primaryButtonLabel}>이 방법으로 진행할게요</Text>
      </Pressable>
    </>
  );

  const renderSupportStep = () => (
    <>
      <Text style={styles.sectionHeading}>
        무료 및 저렴한 비용으로
        {'\n'}
        전문 상담을 받을 수 있습니다
      </Text>
      <Text style={styles.sectionSubheading}>자격 요건을 확인하고 바로 신청해봐요.</Text>

      {supportItems.map(item => {
        const isExpanded = expandedSupportItemIds.includes(item.id);
        const isCompleted = previewState?.supportCompletedItemIds.includes(item.id) ?? false;

        return (
          <View key={item.id} style={styles.accordionCard}>
            <Pressable onPress={() => handleToggleSupportExpand(item.id)} style={styles.accordionHeader}>
              <View style={styles.accordionHeaderTextBlock}>
                <Text style={styles.accordionTitle}>{item.title}</Text>
                <Text style={styles.accordionSubtitle}>{item.description}</Text>
              </View>
              <View style={styles.supportBadge}>
                <Text style={styles.supportBadgeLabel}>{item.badgeLabel}</Text>
              </View>
            </Pressable>

            {isExpanded ? (
              <View style={styles.accordionBody}>
                {item.bodyLines.map(line => (
                  <Text key={line} style={styles.accordionBullet}>
                    {'• '}
                    {line}
                  </Text>
                ))}

                <View style={styles.actionButtonWrap}>
                  {item.actionButtons.map(actionButton => (
                    <Pressable
                      key={`${item.id}-${actionButton.actionLabel}`}
                      onPress={() => setPendingExternalAction(actionButton)}
                      style={[styles.inlineActionButton, styles.inlineActionButtonSecondary]}
                    >
                      <Text style={styles.inlineActionButtonLabel}>{actionButton.actionLabel}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => handleToggleSupportItem(item.id)}
                    style={[
                      styles.inlineActionButton,
                      isCompleted ? styles.inlineActionButtonPrimary : styles.inlineActionButtonSecondary,
                    ]}
                  >
                    <Text style={[styles.inlineActionButtonLabel, isCompleted ? styles.inlineActionButtonLabelPrimary : null]}>
                      확인 완료
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <Pressable
        disabled={(previewState?.supportCompletedItemIds.length ?? 0) !== supportItems.length}
        onPress={handleConfirmSupport}
        style={[
          styles.primaryButton,
          (previewState?.supportCompletedItemIds.length ?? 0) !== supportItems.length
            ? styles.primaryButtonDisabled
            : null,
        ]}
      >
        <Text style={styles.primaryButtonLabel}>위 내용을 모두 확인했습니다</Text>
      </Pressable>
    </>
  );

  const renderStepContent = () => {
    if (!previewState) {
      return null;
    }

    if (showGuide) {
      return renderGuideScreen();
    }

    if (currentStepId === 'funeral') {
      return renderFuneralStep();
    }

    if (currentStepId === 'resting') {
      return renderRestingStep();
    }

    if (currentStepId === 'administration') {
      return renderAdministrationStep();
    }

    if (currentStepId === 'belongings') {
      return renderBelongingsStep();
    }

    return renderSupportStep();
  };

  if (isHydrating || !previewState) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />
        <Text style={styles.loadingLabel}>살펴보기 정보를 불러오고 있어요.</Text>
      </View>
    );
  }

  const restingNoticeTitle = previewState.restingActiveStepNumber === 0
    ? '꼭 기억해주세요'
    : '주의 내용을 먼저 확인해 주세요';
  const restingNoticeBody = previewState.restingActiveStepNumber === 0
    ? [
      '여름철에는 1~2일, 겨울철에는 3일 이내에 장례 절차를 진행하는 것이 좋아요.',
      '충분히 사랑받았다고 말해 주며 차분히 준비해 주세요.',
    ]
    : [
      '아이의 몸을 무리하게 움직이기보다 부드럽고 천천히 진행해 주세요.',
      '어려운 순간이면 잠시 멈춰도 괜찮습니다.',
    ];

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 112, paddingTop: insets.top + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={handleLeavePreview} style={styles.backButton}>
            <Text style={styles.backButtonLabel}>{'<'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Stepper
          currentStepId={currentStepId}
          disabled={showGuide}
          lifecycleStatus={lifecycleStatus}
          onPressStep={handlePressStep}
          previewState={previewState}
        />

        {!showGuide ? (
          <View style={styles.progressSummary}>
            <View style={styles.progressSummaryTextBlock}>
              <Text style={styles.progressSummaryLabel}>현재 진척도</Text>
              <Text style={styles.progressSummaryValue}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressSummaryTrack}>
              <View style={[styles.progressSummaryFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        ) : null}

        <View style={styles.petBanner}>
        <View style={styles.petBannerAvatar}>
          <Image resizeMode="contain" source={{ uri: petEmojiUri }} style={styles.petBannerAvatarImage} />
        </View>
          <View style={styles.petBannerTextBlock}>
            <Text style={styles.petBannerTitle}>{selectedPet?.name ?? '우리 아이'} 기준 안내</Text>
            <Text style={styles.petBannerBody}>
              {selectedPet?.lifecycleStatus === 'AFTER_FAREWELL'
                ? '이별 후 단계에 맞춰 꼭 필요한 절차부터 안내할게요.'
                : '현재 단계와 이후에 필요한 절차를 함께 준비할 수 있어요.'}
            </Text>
          </View>
        </View>

        <View style={styles.body}>{renderStepContent()}</View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setRestingNoticeVisible(false)}
        statusBarTranslucent
        transparent
        visible={isRestingNoticeVisible}
      >
        <View style={styles.noticeModalRoot}>
          <Pressable onPress={() => setRestingNoticeVisible(false)} style={styles.noticeModalOverlay} />

          <View style={[styles.noticeModalContainer, { paddingTop: insets.top + 84 }]}>
            <View style={styles.noticeCard}>
              <Text style={styles.noticeCardTitle}>{restingNoticeTitle}</Text>
              <Text style={styles.noticeCardBody}>
                {restingNoticeBody[0]}
                {'\n'}
                {restingNoticeBody[1]}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomNavRow}>
          {bottomNavTabs.map(tab => {
            const isActive = tab.id === 'explore';

            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  if (tab.id === 'home') {
                    openPreview(homePreviewRoute);
                    return;
                  }

                  if (tab.id === 'footprints') {
                    openPreview('footprints');
                    return;
                  }

                  if (tab.id === 'explore') {
                    return;
                  }
                }}
                style={styles.bottomNavItem}
              >
                <View style={[styles.bottomNavIconFrame, isActive ? styles.bottomNavIconFrameActive : null]}>
                  <Text style={styles.bottomNavActiveEmoji}>
                    {isActive ? '•' : ' '}
                  </Text>
                  <View style={styles.bottomNavImageWrap}>
                    <Image
                      resizeMode="contain"
                      source={{ uri: tab.iconUri }}
                      style={[
                        styles.bottomNavIconImage,
                        isActive ? styles.bottomNavIconImageActive : styles.bottomNavIconImageInactive,
                      ]}
                    />
                  </View>
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
        onRequestClose={() => setSkipModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isSkipModalVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setSkipModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              다음 단계({getCurrentStepLabel(skipTargetStepId ?? currentStepId)})로{'\n'}
              바로 넘어가시겠어요?
            </Text>
            <Text style={styles.modalDescription}>현재 보고 계신 단계는 완료 처리되지 않아요.</Text>
            <View style={styles.modalButtonRow}>
              <Pressable onPress={() => setSkipModalVisible(false)} style={[styles.modalButton, styles.modalButtonSecondary]}>
                <Text style={styles.modalButtonSecondaryLabel}>아니요</Text>
              </Pressable>
              <Pressable onPress={handleConfirmSkip} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={styles.modalButtonPrimaryLabel}>넘어갈래요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setExitModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isExitModalVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setExitModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>홈 화면으로 돌아가시겠어요?</Text>
            <Text style={styles.modalDescription}>지금은 여기까지 보고, 나중에 이어서 살펴볼 수 있어요.</Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => {
                  setExitModalVisible(false);
                  openPreview(homePreviewRoute);
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonSecondaryLabel}>다음에 할게요</Text>
              </Pressable>
              <Pressable onPress={() => setExitModalVisible(false)} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={styles.modalButtonPrimaryLabel}>더 해볼게요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setIllegalMethodSheetVisible(false)}
        statusBarTranslucent
        transparent
        visible={isIllegalMethodSheetVisible}
      >
        <View style={styles.bottomSheetRoot}>
          <Pressable onPress={() => setIllegalMethodSheetVisible(false)} style={styles.modalOverlay} />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>합법적인 장례 절차를 꼭 확인해 주세요</Text>
            {illegalMethodNotices.map(line => (
              <Text key={line} style={styles.bottomSheetBody}>
                {'• '}
                {line}
              </Text>
            ))}
            <Pressable onPress={() => setIllegalMethodSheetVisible(false)} style={styles.primaryButton}>
              <Text style={styles.primaryButtonLabel}>네 알겠습니다</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setPendingExternalAction(null)}
        statusBarTranslucent
        transparent
        visible={Boolean(pendingExternalAction)}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setPendingExternalAction(null)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingExternalAction?.targetLabel}
              {pendingExternalAction?.kind === 'phone' ? '(으)로 전화를 거시겠어요?' : '(으)로 이동하시겠어요?'}
            </Text>
            <Text style={styles.modalDescription}>
              {pendingExternalAction?.kind === 'phone'
                ? `${pendingExternalAction?.targetLabel}로 연결됩니다.`
                : `${pendingExternalAction?.value}\n새 페이지에서 창이 열립니다.`}
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable onPress={() => setPendingExternalAction(null)} style={[styles.modalButton, styles.modalButtonSecondary]}>
                <Text style={styles.modalButtonSecondaryLabel}>다음에 할게요</Text>
              </Pressable>
              <Pressable onPress={handleConfirmExternalAction} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={styles.modalButtonPrimaryLabel}>
                  {pendingExternalAction?.kind === 'phone' ? '전화 걸기' : '네 이동할게요'}
                </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    alignItems: 'flex-start',
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
  headerSpacer: {
    width: 28,
  },
  stepperRoot: {
    backgroundColor: '#F9F8F6',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    marginHorizontal: -20,
    marginTop: -4,
    paddingBottom: 18,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  stepperRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  stepperPressable: {
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
  },
  stepperCircle: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  stepperCircleDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6D1CD',
    borderWidth: 1.6,
  },
  stepperCircleCurrent: {
    backgroundColor: '#F7A74D',
  },
  stepperCircleCompleted: {
    backgroundColor: '#F7A74D',
  },
  stepperCircleDisabled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9D3CE',
    borderWidth: 1.6,
  },
  stepperCircleLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
  },
  stepperCircleLabelDisabled: {
    color: '#B8B2AD',
  },
  stepperLabel: {
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  stepperLabelDefault: {
    color: '#B8B2AD',
  },
  stepperLabelDisabled: {
    color: '#C7C2BD',
  },
  stepperLabelCurrent: {
    color: '#F29A38',
  },
  stepperLabelCompleted: {
    color: '#F29A38',
  },
  stepperConnector: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingTop: 12,
  },
  stepperConnectorDot: {
    backgroundColor: '#D9D3CE',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  progressSummary: {
    gap: 10,
    marginTop: 18,
  },
  progressSummaryTextBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSummaryLabel: {
    color: '#7E6B63',
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: '700',
  },
  progressSummaryValue: {
    color: '#F29A38',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '800',
  },
  progressSummaryTrack: {
    backgroundColor: '#E8E2DD',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressSummaryFill: {
    backgroundColor: '#F6AA4D',
    borderRadius: 999,
    height: '100%',
  },
  petBanner: {
    alignItems: 'center',
    backgroundColor: '#FFF7E7',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  petBannerAvatar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  petBannerAvatarImage: {
    height: 36,
    width: 36,
  },
  petBannerTextBlock: {
    flex: 1,
    gap: 4,
  },
  petBannerTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
  },
  petBannerBody: {
    color: '#7D6A62',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 18,
  },
  body: {
    gap: 14,
    paddingBottom: 40,
    paddingTop: 22,
  },
  heroTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 38,
    textAlign: 'center',
  },
  heroDescription: {
    color: '#8D7A72',
    fontFamily: 'sans-serif',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  guideEmojiFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  guideEmoji: {
    fontSize: 84,
  },
  guideEmojiBadge: {
    backgroundColor: '#FFE7C8',
    borderRadius: 999,
    marginTop: -10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  guideEmojiBadgeLabel: {
    color: '#F29A38',
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
  },
  guideSection: {
    gap: 10,
  },
  guideSectionTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
  },
  guideInfoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE9E3',
    borderWidth: 1,
    borderRadius: 18,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  guideInfoTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
  },
  guideInfoBody: {
    color: '#857168',
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: 20,
  },
  sectionHeading: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center',
  },
  sectionSubheading: {
    color: '#8F7C74',
    fontFamily: 'sans-serif',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  calloutCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE8E2',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  calloutTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
  },
  calloutBody: {
    color: '#856F65',
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: 20,
  },
  warningRow: {
    alignItems: 'center',
    backgroundColor: '#E7E3DF',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  warningRowText: {
    color: '#6D6662',
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  warningRowChevron: {
    color: '#7C746F',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#F6A84B',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  primaryButtonCompact: {
    minHeight: 50,
  },
  primaryButtonDisabled: {
    backgroundColor: '#E9DFC9',
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#F1A347',
    borderRadius: 14,
    borderWidth: 1.6,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  secondaryButtonCompact: {
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonLabel: {
    color: '#F1A347',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  restingHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noticeTrigger: {
    alignItems: 'center',
    backgroundColor: '#FDE6B7',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeTriggerLabel: {
    color: '#C57D19',
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
  },
  noticeModalRoot: {
    flex: 1,
  },
  noticeModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 22, 18, 0.22)',
  },
  noticeModalContainer: {
    paddingHorizontal: 20,
  },
  noticeCard: {
    backgroundColor: '#F8F1DD',
    borderRadius: 18,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  noticeCardTitle: {
    color: '#6F5A36',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
  },
  noticeCardBody: {
    color: '#7F6A4E',
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: 20,
  },
  restingEmojiFrame: {
    alignItems: 'center',
    marginVertical: 10,
  },
  restingEmoji: {
    fontSize: 86,
  },
  stepChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E68C6A',
    borderRadius: 999,
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  restingIllustrationCard: {
    alignItems: 'center',
    backgroundColor: '#EAF4F8',
    borderRadius: 24,
    justifyContent: 'center',
    minHeight: 180,
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  restingIllustrationLabel: {
    color: '#5B7787',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },
  bottomButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfButton: {
    flex: 1,
  },
  deadlineCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D4D0CB',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  deadlineCardTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '800',
  },
  deadlineCardBody: {
    color: '#7E6B63',
    fontFamily: 'sans-serif',
    fontSize: 12,
  },
  accordionCard: {
    backgroundColor: '#F4E4AE',
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accordionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  accordionHeaderTextBlock: {
    flex: 1,
    gap: 6,
  },
  accordionTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  accordionSubtitle: {
    color: '#856F65',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 18,
  },
  durationBadge: {
    backgroundColor: '#F49A7B',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationBadgeLabel: {
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
    fontSize: 11,
    fontWeight: '800',
  },
  supportBadge: {
    backgroundColor: '#FFF5EA',
    borderColor: '#F3A66A',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  supportBadgeLabel: {
    color: '#E88D57',
    fontFamily: 'sans-serif',
    fontSize: 11,
    fontWeight: '800',
  },
  accordionBody: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 14,
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  accordionBullet: {
    color: '#6E625A',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 18,
  },
  actionButtonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  inlineActionButton: {
    alignItems: 'center',
    borderRadius: 11,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
  },
  inlineActionButtonPrimary: {
    backgroundColor: '#F6A84B',
  },
  inlineActionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0A34A',
    borderWidth: 1.3,
  },
  inlineActionButtonLabel: {
    color: '#F0A34A',
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineActionButtonLabelPrimary: {
    color: '#FFFFFF',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE8E2',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minHeight: 208,
    paddingHorizontal: 14,
    paddingVertical: 16,
    width: '48%',
  },
  optionCardSelected: {
    backgroundColor: '#FFF2D6',
    borderColor: '#F3A64C',
    borderWidth: 1.4,
  },
  optionEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  optionTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  optionBullet: {
    color: '#7B6A62',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 18,
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
  bottomNavActiveEmoji: {
    color: '#F2A03B',
    fontSize: 4,
    lineHeight: 4,
    opacity: 0,
  },
  bottomNavImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
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
  bottomSheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: '#FBFAF8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  bottomSheetTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
  },
  bottomSheetBody: {
    color: '#7F6A61',
    fontFamily: 'sans-serif',
    fontSize: 13,
    lineHeight: 21,
  },
});
