import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
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

import type { PetSummary } from '../../core/entities/pet';
import {
  clearStoredEmergencyModeStates,
  readStoredEmergencyModeState,
  type EmergencyModeEntrySource,
  type EmergencyModeRestingTaskId,
  type EmergencyModeState,
  type EmergencyModeStepId,
  writeStoredEmergencyModeState,
} from '../../infrastructure/storage/emergencyModeStorage';
import { writeStoredBeforeFarewellHomeSnapshot } from '../../infrastructure/storage/beforeFarewellHomeStorage';
import { readStoredFuneralCompaniesState, clearStoredFuneralCompaniesStates } from '../../infrastructure/storage/funeralCompaniesStorage';
import { funeralCompaniesMockData } from '../../shared/data/funeralCompaniesData';
import { SignupCompletionLoadingScreen } from '../components/SignupCompletionLoadingScreen';
import { useAppSessionStore } from '../stores/AppSessionStore';

const emergencyHeroAssetUri = 'https://www.figma.com/api/mcp/asset/0845a960-0364-4a69-9581-43817bae6a1f';
const noticeAssetUri = 'https://www.figma.com/api/mcp/asset/7371051e-9511-404e-9e48-135f7302141d';

const emergencyVisibleStepOrder: Array<Exclude<EmergencyModeStepId, 'companyDetail'>> = ['intro', 'resting', 'funeral'];

const restingTaskDefinitions: Array<{
  body: string;
  id: EmergencyModeRestingTaskId;
  title: string;
}> = [
  { body: '숨과 맥박, 체온 변화를 차분히 살펴보며 현재 상태를 확인해 주세요.', id: 'checkCondition', title: '아이 상태 확인' },
  { body: '배변패드, 휴지, 물티슈, 수건처럼 곁에 둘 준비물을 먼저 챙겨 주세요.', id: 'prepareSupplies', title: '준비물 확인' },
  { body: '눈을 천천히 감겨 주며 마지막 인사를 나눠 주세요.', id: 'closeEyes', title: '눈을 감겨주세요' },
  { body: '입 주변을 정돈하며 흐르는 침이나 체액을 부드럽게 닦아 주세요.', id: 'cleanMouth', title: '입주변을 정리해주세요' },
  { body: '항문 주변과 몸을 정리해 아이가 편안한 모습으로 머물 수 있게 해 주세요.', id: 'washBody', title: '항문 닦기' },
  { body: '배변패드를 깔아 체액이 새어도 주변을 깨끗하게 유지할 수 있게 준비해 주세요.', id: 'preparePad', title: '배변패트 깔기' },
];

const wait = (durationMs: number) =>
  new Promise(resolve => {
    setTimeout(resolve, durationMs);
  });

const formatDistanceLabel = (distanceKm: number | null) => {
  if (distanceKm === null) {
    return '거리 미확인';
  }

  return distanceKm < 10 ? `${distanceKm.toFixed(1)}km` : `${Math.round(distanceKm)}km`;
};

const getEmergencyIdentity = (pet: PetSummary | null) => ({
  inviteCode: pet?.inviteCode ?? null,
  petId: pet?.id ?? null,
});

const buildFallbackEmergencyPet = (snapshot: Awaited<ReturnType<typeof readStoredBeforeFarewellHomeSnapshot>>): PetSummary | null => {
  if (snapshot.registeredOwnerPet) {
    return {
      ...snapshot.registeredOwnerPet,
      emergencyMode: true,
      lifecycleStatus: 'AFTER_FAREWELL',
      selected: true,
    };
  }

  if (!snapshot.petName) {
    return null;
  }

  return {
    animalTypeName: '강아지',
    birthDate: snapshot.petBirthDate,
    breedName: '말티즈',
    emergencyMode: true,
    gender: null,
    id: -1004,
    inviteCode: 'LOCAL-EMERGENCY',
    isOwner: true,
    lifecycleStatus: 'AFTER_FAREWELL',
    name: snapshot.petName,
    profileImageUrl: null,
    selected: true,
    weight: null,
  };
};

const getStepIndex = (stepId: EmergencyModeStepId) => {
  const visibleIndex = emergencyVisibleStepOrder.indexOf(stepId as Exclude<EmergencyModeStepId, 'companyDetail'>);

  if (visibleIndex >= 0) {
    return visibleIndex;
  }

  return emergencyVisibleStepOrder.length - 1;
};

const getNextStepId = (stepId: EmergencyModeStepId): EmergencyModeStepId => {
  if (stepId === 'intro') {
    return 'resting';
  }

  if (stepId === 'resting') {
    return 'funeral';
  }

  return stepId;
};

const getCompanySearchLink = (companyName: string, service: 'kakao' | 'naver') => {
  if (service === 'naver') {
    return `https://search.naver.com/search.naver?query=${encodeURIComponent(companyName)}`;
  }

  return `https://map.kakao.com/?q=${encodeURIComponent(companyName)}`;
};

export function EmergencyModeScreen() {
  const insets = useSafeAreaInsets();
  const {
    openPreview,
    previewStack,
    replacePreview,
    selectedPet,
    updateSelectedPetLocally,
  } = useAppSessionStore();
  const [fallbackPet, setFallbackPet] = useState<PetSummary | null>(null);
  const [emergencyState, setEmergencyState] = useState<EmergencyModeState | null>(null);
  const [isHydrating, setHydrating] = useState(true);
  const [isNoticeVisible, setNoticeVisible] = useState(false);
  const [isReturnHomeModalVisible, setReturnHomeModalVisible] = useState(false);
  const [isSkipModalVisible, setSkipModalVisible] = useState(false);
  const [isFinishModalVisible, setFinishModalVisible] = useState(false);
  const [isLoadingVisible, setLoadingVisible] = useState(false);

  const effectivePet = selectedPet ?? fallbackPet;
  const identity = useMemo(() => getEmergencyIdentity(effectivePet), [effectivePet]);
  const defaultEntrySource: EmergencyModeEntrySource = selectedPet?.lifecycleStatus === 'BEFORE_FAREWELL'
    ? 'beforeFarewellHome'
    : 'afterFarewellSignup';
  const entrySource = emergencyState?.entrySource ?? defaultEntrySource;
  const canReturnToBeforeFarewellHome = entrySource === 'beforeFarewellHome';
  const shouldBlockInitialBack = !canReturnToBeforeFarewellHome;

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const storedSnapshot = await readStoredBeforeFarewellHomeSnapshot();
      const nextFallbackPet = buildFallbackEmergencyPet(storedSnapshot);
      const nextPet = selectedPet ?? nextFallbackPet;

      if (!nextPet) {
        if (!isMounted) {
          return;
        }

        setFallbackPet(nextFallbackPet);
        setHydrating(false);
        return;
      }

      const nextIdentity = getEmergencyIdentity(nextPet);
      const nextEntrySource = selectedPet?.lifecycleStatus === 'BEFORE_FAREWELL'
        ? 'beforeFarewellHome'
        : 'afterFarewellSignup';
      const storedEmergencyState = await readStoredEmergencyModeState(nextIdentity, nextEntrySource);
      if (!isMounted) {
        return;
      }

      setFallbackPet(nextFallbackPet);
      setEmergencyState(storedEmergencyState);
      setHydrating(false);
    };

    hydrate().catch(() => {
      if (!isMounted) {
        return;
      }

      setHydrating(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedPet]);

  useEffect(() => {
    let isMounted = true;

    if (!effectivePet) {
      return () => {
        isMounted = false;
      };
    }

    const hydrateSavedCompanies = async () => {
      const storedFuneralState = await readStoredFuneralCompaniesState({
        inviteCode: effectivePet.inviteCode,
        lifecycleStatus: effectivePet.lifecycleStatus,
        petId: effectivePet.id,
      });
      const nextSavedCompanies = funeralCompaniesMockData.filter(company =>
        storedFuneralState.savedCompanyIds.includes(company.id),
      );

      if (!isMounted) {
        return;
      }

      if (emergencyState && nextSavedCompanies.length > 0 && emergencyState.selectedFuneralCompanyId === null) {
        const nextSelectedCompanyId = nextSavedCompanies[0]?.id ?? null;
        setEmergencyState(current => (current ? {
          ...current,
          selectedFuneralCompanyId: nextSelectedCompanyId,
        } : current));
        await writeStoredEmergencyModeState(identity, {
          selectedFuneralCompanyId: nextSelectedCompanyId,
        }, entrySource);
      }
    };

    hydrateSavedCompanies().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [effectivePet, emergencyState, entrySource, identity]);

  useEffect(() => {
    let isMounted = true;

    if (!effectivePet) {
      return () => {
        isMounted = false;
      };
    }

    const readSavedCompanies = async () => {
      const storedFuneralState = await readStoredFuneralCompaniesState({
        inviteCode: effectivePet.inviteCode,
        lifecycleStatus: effectivePet.lifecycleStatus,
        petId: effectivePet.id,
      });
      const nextSavedCompanyIds = storedFuneralState.savedCompanyIds;
      const nextSavedCompanies = funeralCompaniesMockData.filter(company => nextSavedCompanyIds.includes(company.id));

      if (!isMounted) {
        return;
      }

      setSavedCompanyList(nextSavedCompanies);
    };

    readSavedCompanies().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [effectivePet, previewStack]);

  const [savedCompanyList, setSavedCompanyList] = useState<typeof funeralCompaniesMockData>([]);

  const selectedFuneralCompany = useMemo(
    () => savedCompanyList.find(company => company.id === emergencyState?.selectedFuneralCompanyId) ?? savedCompanyList[0] ?? null,
    [emergencyState?.selectedFuneralCompanyId, savedCompanyList],
  );
  const currentStepId = emergencyState?.currentStepId ?? 'intro';
  const currentStepIndex = getStepIndex(currentStepId);
  const currentStepNumber = currentStepIndex + 1;
  const currentStepLabel = currentStepId === 'resting'
    ? '안치 준비'
    : currentStepId === 'funeral'
      ? '장례업체'
      : currentStepId === 'companyDetail'
        ? '업체 상세'
        : '긴급 안내';

  const persistEmergencyState = useCallback(async (patch: Partial<EmergencyModeState>) => {
    const nextState = {
      ...(emergencyState ?? {
        completedRestingTaskIds: [],
        currentStepId: 'intro' as EmergencyModeStepId,
        entrySource: defaultEntrySource,
        farewellDate: null,
        hasCompletedIntro: false,
        hasVisitedFuneralCompanies: false,
        lastViewedStepId: 'intro' as EmergencyModeStepId,
        selectedFuneralCompanyId: null,
      }),
      ...patch,
    };

    setEmergencyState(nextState);

    await writeStoredEmergencyModeState(identity, nextState, entrySource);
  }, [defaultEntrySource, emergencyState, entrySource, identity]);

  const handleMoveToStep = useCallback(async (nextStepId: EmergencyModeStepId) => {
    await persistEmergencyState({
      currentStepId: nextStepId,
      hasCompletedIntro: nextStepId !== 'intro' ? true : emergencyState?.hasCompletedIntro ?? false,
      lastViewedStepId: nextStepId,
    });
  }, [emergencyState?.hasCompletedIntro, persistEmergencyState]);

  const handleToggleRestingTask = async (taskId: EmergencyModeRestingTaskId) => {
    const currentTaskIds = emergencyState?.completedRestingTaskIds ?? [];
    const nextTaskIds = currentTaskIds.includes(taskId)
      ? currentTaskIds.filter(currentTaskId => currentTaskId !== taskId)
      : [...currentTaskIds, taskId];

    await persistEmergencyState({
      completedRestingTaskIds: nextTaskIds,
      currentStepId: 'resting',
      lastViewedStepId: 'resting',
    });
  };

  const handleConfirmReturnHome = async () => {
    setReturnHomeModalVisible(false);
    setLoadingVisible(true);
    await clearStoredEmergencyModeStates();
    await wait(400);

    if (previewStack.length > 0) {
      replacePreview('beforeFarewellHome');
    } else {
      updateSelectedPetLocally(currentPet => (currentPet ? {
        ...currentPet,
        emergencyMode: false,
        lifecycleStatus: 'BEFORE_FAREWELL',
      } : currentPet));
    }

    setLoadingVisible(false);
  };

  const handleCompleteEmergencyMode = async () => {
    setFinishModalVisible(false);
    setLoadingVisible(true);
    await writeStoredBeforeFarewellHomeSnapshot({
      hasCompletedHomeOnboarding: true,
      petFarewellDate: emergencyState?.farewellDate ?? new Date().toISOString().slice(0, 10),
    });
    await Promise.all([
      clearStoredEmergencyModeStates(),
      clearStoredFarewellPreviewStates(),
      clearStoredFuneralCompaniesStates(),
    ]);
    await wait(1000);

    if (previewStack.length > 0) {
      replacePreview('afterFarewellHome');
    } else {
      updateSelectedPetLocally(currentPet => (currentPet ? {
        ...currentPet,
        emergencyMode: false,
        lifecycleStatus: 'AFTER_FAREWELL',
      } : currentPet));
    }

    setLoadingVisible(false);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isLoadingVisible) {
        return true;
      }

      if (isNoticeVisible) {
        setNoticeVisible(false);
        return true;
      }

      if (isFinishModalVisible) {
        setFinishModalVisible(false);
        return true;
      }

      if (isSkipModalVisible) {
        setSkipModalVisible(false);
        return true;
      }

      if (isReturnHomeModalVisible) {
        setReturnHomeModalVisible(false);
        return true;
      }

      if (currentStepId === 'companyDetail') {
        handleMoveToStep('funeral').catch(() => undefined);
        return true;
      }

      if (currentStepId === 'funeral') {
        handleMoveToStep('resting').catch(() => undefined);
        return true;
      }

      if (currentStepId === 'resting') {
        handleMoveToStep('intro').catch(() => undefined);
        return true;
      }

      if (shouldBlockInitialBack) {
        return true;
      }

      setReturnHomeModalVisible(true);
      return true;
    });

    return () => {
      backHandler.remove();
    };
  }, [
    currentStepId,
    isFinishModalVisible,
    isLoadingVisible,
    isNoticeVisible,
    isReturnHomeModalVisible,
    isSkipModalVisible,
    shouldBlockInitialBack,
    handleMoveToStep,
  ]);

  if (isHydrating || !effectivePet || !emergencyState) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar backgroundColor="#F7F0E7" barStyle="dark-content" />
        <Text style={styles.loadingLabel}>긴급대처모드를 준비하고 있어요.</Text>
      </View>
    );
  }

  if (isLoadingVisible) {
    return (
      <SignupCompletionLoadingScreen
        description={currentStepId === 'funeral' ? '아이를 기억하는 공간으로 이동할게요.' : '지금 필요한 단계로 안내할게요.'}
        title={currentStepId === 'funeral' ? '이별 후 공간을 준비하고 있어요' : '긴급대처모드를 준비하고 있어요'}
      />
    );
  }

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerLeft}>
        {canReturnToBeforeFarewellHome ? (
          <Pressable onPress={() => setReturnHomeModalVisible(true)} style={styles.headerRoundButton}>
            <Text style={styles.headerRoundButtonLabel}>홈</Text>
          </Pressable>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      <Text style={styles.headerTitle}>긴급대처모드</Text>

      <Pressable
        onPress={() => {
          if (currentStepId === 'companyDetail' || currentStepId === 'funeral') {
            setFinishModalVisible(true);
            return;
          }

          setSkipModalVisible(true);
        }}
        style={styles.headerSkipButton}
      >
        <Text style={styles.headerSkipButtonLabel}>건너뛰기</Text>
      </Pressable>
    </View>
  );

  const renderStepper = () => (
    <View style={styles.stepperRow}>
      {emergencyVisibleStepOrder.map((stepId, index) => {
        const isCompleted = currentStepIndex > index || currentStepId === 'companyDetail' && stepId === 'funeral';
        const isActive = currentStepIndex === index || currentStepId === 'companyDetail' && stepId === 'funeral';

        return (
          <View key={stepId} style={styles.stepperItem}>
            <View style={[
              styles.stepperCircle,
              isCompleted ? styles.stepperCircleCompleted : null,
              isActive ? styles.stepperCircleActive : null,
            ]}>
              <Text style={[
                styles.stepperCircleLabel,
                isCompleted || isActive ? styles.stepperCircleLabelActive : null,
              ]}>
                {isCompleted && !isActive ? '✓' : index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepperText,
              isActive ? styles.stepperTextActive : null,
            ]}>
              {stepId === 'intro' ? '가이드' : stepId === 'resting' ? '안치 준비' : '장례업체'}
            </Text>
            {index < emergencyVisibleStepOrder.length - 1 ? (
              <View style={[
                styles.stepperConnector,
                currentStepIndex > index ? styles.stepperConnectorActive : null,
              ]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );

  const renderIntroStep = () => (
    <View style={styles.stepCard}>
      <View style={styles.heroCard}>
        <Image resizeMode="contain" source={{ uri: emergencyHeroAssetUri }} style={styles.heroIllustration} />
        <Text style={styles.heroTitle}>아이를 먼저 편안하게 보내는{'\n'}순서를 함께 따라갈게요.</Text>
        <Text style={styles.heroBody}>
          지금 이 순간을 혼자 감당하지 않도록,{'\n'}
          필요한 절차를 차분하게 안내해 드릴게요.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>현재 단계</Text>
        <Text style={styles.summaryTitle}>{currentStepNumber}. {currentStepLabel}</Text>
        <Text style={styles.summaryBody}>
          안치 준비부터 장례업체 확인까지,{'\n'}
          지금 필요한 순서만 빠르게 이어서 볼 수 있어요.
        </Text>
      </View>

      <Pressable
        onPress={() => handleMoveToStep('resting')}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonLabel}>시작하기</Text>
      </Pressable>
    </View>
  );

  const renderRestingStep = () => (
    <View style={styles.stepCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionEyebrow}>안치 준비</Text>
          <Text style={styles.sectionTitle}>아이를 편안히 보내기 위한 준비예요</Text>
        </View>
        <Pressable onPress={() => setNoticeVisible(true)} style={styles.noticeButton}>
          <Image resizeMode="contain" source={{ uri: noticeAssetUri }} style={styles.noticeButtonIcon} />
        </Pressable>
      </View>

      <View style={styles.restingTaskList}>
        {restingTaskDefinitions.map((taskDefinition, index) => {
          const isCompleted = emergencyState.completedRestingTaskIds.includes(taskDefinition.id);

          return (
            <Pressable
              key={taskDefinition.id}
              onPress={() => handleToggleRestingTask(taskDefinition.id)}
              style={[styles.restingTaskCard, isCompleted ? styles.restingTaskCardCompleted : null]}
            >
              <View style={styles.restingTaskHeader}>
                <View style={[styles.restingTaskIndex, isCompleted ? styles.restingTaskIndexCompleted : null]}>
                  <Text style={[styles.restingTaskIndexLabel, isCompleted ? styles.restingTaskIndexLabelCompleted : null]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.restingTaskTextWrap}>
                  <Text style={styles.restingTaskTitle}>{taskDefinition.title}</Text>
                  <Text style={styles.restingTaskBody}>{taskDefinition.body}</Text>
                </View>
                <View style={[styles.restingTaskCheck, isCompleted ? styles.restingTaskCheckCompleted : null]}>
                  <Text style={[styles.restingTaskCheckLabel, isCompleted ? styles.restingTaskCheckLabelCompleted : null]}>
                    {isCompleted ? '✓' : ''}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dualButtonRow}>
        <Pressable onPress={() => handleMoveToStep('intro')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>이전으로</Text>
        </Pressable>
        <Pressable onPress={() => handleMoveToStep('funeral')} style={styles.primaryButtonCompact}>
          <Text style={styles.primaryButtonLabel}>다음으로</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderFuneralStep = () => (
    <View style={styles.stepCard}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionEyebrow}>장례업체</Text>
        <Text style={styles.sectionTitle}>필요한 경우 곧바로 이어서 살펴볼 수 있어요</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>저장한 장례업체 {savedCompanyList.length}곳</Text>
        <Text style={styles.summaryBody}>
          이별 전 홈이나 장례업체 찾기에서 저장한 업체가 있으면{'\n'}
          여기서 다시 이어서 확인할 수 있어요.
        </Text>
      </View>

      {savedCompanyList.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.savedCompanyRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {savedCompanyList.map(company => {
            const isSelected = company.id === selectedFuneralCompany?.id;

            return (
              <Pressable
                key={company.id}
                onPress={() => {
                  persistEmergencyState({
                    currentStepId: 'funeral',
                    lastViewedStepId: 'funeral',
                    selectedFuneralCompanyId: company.id,
                  }).catch(() => undefined);
                }}
                style={[styles.savedCompanyCard, isSelected ? styles.savedCompanyCardSelected : null]}
              >
                <View style={[
                  styles.savedCompanyImageCard,
                  { backgroundColor: company.imageCards[0]?.backgroundColor ?? '#F7E3D1' },
                ]}>
                  <Text style={styles.savedCompanyImageEmoji}>{company.imageCards[0]?.emoji ?? '🏛️'}</Text>
                </View>
                <Text numberOfLines={1} style={styles.savedCompanyName}>{company.name}</Text>
                <Text style={styles.savedCompanyMeta}>{company.serviceDescription}</Text>
                <Text style={styles.savedCompanyDistance}>{formatDistanceLabel(company.distanceKm ?? 0)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyCompanyCard}>
          <Text style={styles.emptyCompanyTitle}>저장한 장례업체가 아직 없어요.</Text>
          <Text style={styles.emptyCompanyBody}>
            장례업체 더 알아보기에서 업체를 저장한 뒤 다시 돌아오면{'\n'}
            이곳에서 바로 이어서 확인할 수 있어요.
          </Text>
        </View>
      )}

      <Pressable onPress={() => openPreview('funeralCompanies')} style={styles.linkCard}>
        <Text style={styles.linkCardTitle}>장례업체 더 알아보기</Text>
        <Text style={styles.linkCardBody}>옵션과 위치 기준으로 업체를 보고, 저장 후 다시 돌아올 수 있어요.</Text>
      </Pressable>

      <View style={styles.dualButtonRow}>
        <Pressable onPress={() => setFinishModalVisible(true)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>건너뛰기</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (savedCompanyList.length > 0) {
              handleMoveToStep('companyDetail').catch(() => undefined);
              return;
            }

            persistEmergencyState({
              currentStepId: 'funeral',
              hasVisitedFuneralCompanies: true,
              lastViewedStepId: 'funeral',
            }).catch(() => undefined);
            openPreview('funeralCompanies');
          }}
          style={styles.primaryButtonCompact}
        >
          <Text style={styles.primaryButtonLabel}>
            {savedCompanyList.length > 0 ? '해당 업체로 진행' : '장례업체 더 알아보기'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderCompanyDetailStep = () => {
    if (!selectedFuneralCompany) {
      return renderFuneralStep();
    }

    return (
      <View style={styles.stepCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionEyebrow}>업체 상세</Text>
            <Text style={styles.sectionTitle}>{selectedFuneralCompany.name}</Text>
          </View>
          <Pressable onPress={() => handleMoveToStep('funeral')} style={styles.headerRoundButton}>
            <Text style={styles.headerRoundButtonLabel}>{'<'}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.detailImageRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {selectedFuneralCompany.imageCards.map(imageCard => (
            <View
              key={`${selectedFuneralCompany.id}-${imageCard.label}`}
              style={[styles.detailImageCard, { backgroundColor: imageCard.backgroundColor }]}
            >
              <Text style={styles.detailImageEmoji}>{imageCard.emoji}</Text>
              <Text style={styles.detailImageLabel}>{imageCard.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{selectedFuneralCompany.introduction}</Text>
          <Text style={styles.summaryBody}>{selectedFuneralCompany.guideText}</Text>
        </View>

        <View style={styles.detailActionGroup}>
          <Pressable
            onPress={() => {
              Alert.alert(
                '전화걸기',
                `${selectedFuneralCompany.phone}(으)로 전화하시겠어요?`,
                [
                  { style: 'cancel', text: '취소' },
                  {
                    onPress: () => {
                      Linking.openURL(`tel:${selectedFuneralCompany.phone}`).catch(() => undefined);
                    },
                    text: '전화걸기',
                  },
                ],
              );
            }}
            style={styles.detailActionRow}
          >
            <Text style={styles.detailActionTitle}>바로 전화하기</Text>
            <Text style={styles.detailActionValue}>{selectedFuneralCompany.phone}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const reviewLink = getCompanySearchLink(selectedFuneralCompany.name, 'naver');
              Linking.openURL(reviewLink).catch(() => undefined);
            }}
            style={styles.detailActionRow}
          >
            <Text style={styles.detailActionTitle}>리뷰 보러가기</Text>
            <Text style={styles.detailActionValue}>네이버지도 / 카카오맵</Text>
          </Pressable>
        </View>

        <View style={styles.dualButtonRow}>
          <Pressable onPress={() => handleMoveToStep('funeral')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonLabel}>더 둘러볼게요</Text>
          </Pressable>
          <Pressable onPress={() => setFinishModalVisible(true)} style={styles.primaryButtonCompact}>
            <Text style={styles.primaryButtonLabel}>완료</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#F7F0E7" barStyle="dark-content" />
      {renderHeader()}
      {renderStepper()}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {currentStepId === 'intro' ? renderIntroStep() : null}
        {currentStepId === 'resting' ? renderRestingStep() : null}
        {currentStepId === 'funeral' ? renderFuneralStep() : null}
        {currentStepId === 'companyDetail' ? renderCompanyDetailStep() : null}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isNoticeVisible}
        onRequestClose={() => setNoticeVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setNoticeVisible(false)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>주의해주세요</Text>
            <Text style={styles.modalBody}>
              아이를 정리하는 과정에서 무리하게 자세를 바꾸기보다,{'\n'}
              보호자님의 속도에 맞춰 천천히 진행해 주세요.
            </Text>
            <Pressable onPress={() => setNoticeVisible(false)} style={styles.modalPrimaryButton}>
              <Text style={styles.modalPrimaryButtonLabel}>확인했어요</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isReturnHomeModalVisible}
        onRequestClose={() => setReturnHomeModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setReturnHomeModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>이별 전 홈 화면으로 이동할까요?</Text>
            <Text style={styles.modalBody}>네, 다음에 할게요를 누르면 긴급대처모드에서 나가며 이별 전 홈으로 돌아가요.</Text>
            <View style={styles.modalButtonRow}>
              <Pressable onPress={() => setReturnHomeModalVisible(false)} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryButtonLabel}>더 해볼게요</Text>
              </Pressable>
              <Pressable onPress={() => handleConfirmReturnHome().catch(() => undefined)} style={styles.modalPrimaryButtonCompact}>
                <Text style={styles.modalPrimaryButtonLabel}>네, 다음에 할게요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isSkipModalVisible}
        onRequestClose={() => setSkipModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setSkipModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>다음 단계로 넘어갈까요?</Text>
            <Text style={styles.modalBody}>현재 단계를 마치지 않아도 다음 단계로 바로 이동할 수 있어요.</Text>
            <View style={styles.modalButtonRow}>
              <Pressable onPress={() => setSkipModalVisible(false)} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryButtonLabel}>더 해볼게요</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSkipModalVisible(false);
                  handleMoveToStep(getNextStepId(currentStepId)).catch(() => undefined);
                }}
                style={styles.modalPrimaryButtonCompact}
              >
                <Text style={styles.modalPrimaryButtonLabel}>네, 넘어갈게요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isFinishModalVisible}
        onRequestClose={() => setFinishModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setFinishModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>아이를 기억하는 공간으로 이동하시겠어요?</Text>
            <Text style={styles.modalBody}>
              긴급대처모드를 마치면 이별 후 홈으로 이동하고,{'\n'}
              관련 준비 데이터는 정리돼요.
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable onPress={() => setFinishModalVisible(false)} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryButtonLabel}>더 해볼게요</Text>
              </Pressable>
              <Pressable onPress={() => handleCompleteEmergencyMode().catch(() => undefined)} style={styles.modalPrimaryButtonCompact}>
                <Text style={styles.modalPrimaryButtonLabel}>네, 이동할게요</Text>
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
    backgroundColor: '#F7F0E7',
    flex: 1,
  },
  loadingRoot: {
    alignItems: 'center',
    backgroundColor: '#F7F0E7',
    flex: 1,
    justifyContent: 'center',
  },
  loadingLabel: {
    color: '#7C6556',
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#F7F0E7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    minWidth: 54,
  },
  headerPlaceholder: {
    width: 54,
  },
  headerTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
  },
  headerRoundButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DDD3',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    minWidth: 48,
    paddingHorizontal: 10,
  },
  headerRoundButtonLabel: {
    color: '#7B685C',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSkipButton: {
    alignItems: 'flex-end',
    minWidth: 72,
  },
  headerSkipButtonLabel: {
    color: '#C56A33',
    fontSize: 14,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 18,
  },
  stepperItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepperCircle: {
    alignItems: 'center',
    backgroundColor: '#EFE7DD',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
    zIndex: 2,
  },
  stepperCircleCompleted: {
    backgroundColor: '#FFB362',
  },
  stepperCircleActive: {
    backgroundColor: '#FD7E14',
    transform: [{ scale: 1.08 }],
  },
  stepperCircleLabel: {
    color: '#97857A',
    fontSize: 13,
    fontWeight: '800',
  },
  stepperCircleLabelActive: {
    color: '#FFFFFF',
  },
  stepperText: {
    color: '#97857A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  stepperTextActive: {
    color: '#352622',
  },
  stepperConnector: {
    backgroundColor: '#E6DDD2',
    height: 2,
    position: 'absolute',
    right: '-50%',
    top: 15,
    width: '100%',
    zIndex: 1,
  },
  stepperConnectorActive: {
    backgroundColor: '#FFB362',
  },
  content: {
    gap: 20,
    paddingHorizontal: 20,
  },
  stepCard: {
    gap: 18,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 28,
  },
  heroIllustration: {
    height: 180,
    marginBottom: 18,
    width: 180,
  },
  heroTitle: {
    color: '#352622',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    textAlign: 'center',
  },
  heroBody: {
    color: '#816E63',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE6DB',
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  summaryEyebrow: {
    color: '#C8834A',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  summaryBody: {
    color: '#7C6A5E',
    fontSize: 13,
    lineHeight: 21,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
  },
  primaryButtonCompact: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 18,
    flex: 1,
    height: 54,
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 4,
  },
  sectionEyebrow: {
    color: '#C8834A',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#352622',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  noticeButton: {
    alignItems: 'center',
    backgroundColor: '#FFF7EC',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    marginLeft: 12,
    width: 38,
  },
  noticeButtonIcon: {
    height: 18,
    width: 18,
  },
  restingTaskList: {
    gap: 10,
  },
  restingTaskCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE6DB',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  restingTaskCardCompleted: {
    borderColor: '#FFB362',
    backgroundColor: '#FFF6EA',
  },
  restingTaskHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  restingTaskIndex: {
    alignItems: 'center',
    backgroundColor: '#F2ECE6',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    marginRight: 12,
    width: 28,
  },
  restingTaskIndexCompleted: {
    backgroundColor: '#FFA94E',
  },
  restingTaskIndexLabel: {
    color: '#8F7A6D',
    fontSize: 12,
    fontWeight: '800',
  },
  restingTaskIndexLabelCompleted: {
    color: '#FFFFFF',
  },
  restingTaskTextWrap: {
    flex: 1,
    gap: 4,
  },
  restingTaskTitle: {
    color: '#352622',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  restingTaskBody: {
    color: '#7C6A5E',
    fontSize: 13,
    lineHeight: 20,
  },
  restingTaskCheck: {
    alignItems: 'center',
    borderColor: '#D9CFC5',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 26,
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 2,
    width: 26,
  },
  restingTaskCheckCompleted: {
    backgroundColor: '#FFB362',
    borderColor: '#FFB362',
  },
  restingTaskCheckLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  restingTaskCheckLabelCompleted: {
    color: '#FFFFFF',
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D6CA',
    borderRadius: 18,
    borderWidth: 1.5,
    flex: 1,
    height: 54,
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    color: '#7D6A5E',
    fontSize: 16,
    fontWeight: '800',
  },
  savedCompanyRow: {
    gap: 12,
    paddingRight: 20,
  },
  savedCompanyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE6DB',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    width: 210,
  },
  savedCompanyCardSelected: {
    borderColor: '#FFA94E',
    backgroundColor: '#FFF7EC',
  },
  savedCompanyImageCard: {
    alignItems: 'center',
    borderRadius: 16,
    height: 100,
    justifyContent: 'center',
    marginBottom: 12,
  },
  savedCompanyImageEmoji: {
    fontSize: 34,
  },
  savedCompanyName: {
    color: '#352622',
    fontSize: 16,
    fontWeight: '800',
  },
  savedCompanyMeta: {
    color: '#7C6A5E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  savedCompanyDistance: {
    color: '#C8834A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyCompanyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE6DB',
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 26,
    paddingHorizontal: 22,
  },
  emptyCompanyTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCompanyBody: {
    color: '#7C6A5E',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
  },
  linkCard: {
    backgroundColor: '#FFF8F0',
    borderColor: '#F3DFC8',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  linkCardTitle: {
    color: '#352622',
    fontSize: 16,
    fontWeight: '800',
  },
  linkCardBody: {
    color: '#7C6A5E',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  detailImageRow: {
    gap: 12,
    paddingRight: 24,
  },
  detailImageCard: {
    alignItems: 'center',
    borderRadius: 24,
    height: 170,
    justifyContent: 'center',
    width: 220,
  },
  detailImageEmoji: {
    fontSize: 42,
  },
  detailImageLabel: {
    color: '#5B4638',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  detailActionGroup: {
    gap: 10,
  },
  detailActionRow: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE6DB',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  detailActionTitle: {
    color: '#352622',
    fontSize: 15,
    fontWeight: '800',
  },
  detailActionValue: {
    color: '#7C6A5E',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  modalRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(39, 24, 16, 0.42)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    gap: 12,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    color: '#352622',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 29,
    textAlign: 'center',
  },
  modalBody: {
    color: '#7C6A5E',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  modalSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D6CA',
    borderRadius: 16,
    borderWidth: 1.5,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  modalSecondaryButtonLabel: {
    color: '#7D6A5E',
    fontSize: 15,
    fontWeight: '800',
  },
  modalPrimaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#FFA94E',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    marginTop: 8,
  },
  modalPrimaryButtonCompact: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 16,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  modalPrimaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
