import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  BackHandler,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PetLifecycleStatus } from '../../core/entities/pet';
import { getCurrentDeviceCoordinates } from '../../infrastructure/native/location';
import { openAppSettings, requestLocationPermission } from '../../infrastructure/native/permissions';
import {
  type FuneralCompaniesState,
  readStoredFuneralCompaniesState,
  writeStoredFuneralCompaniesState,
} from '../../infrastructure/storage/funeralCompaniesStorage';
import {
  funeralCompaniesMockData,
  type FuneralCompaniesSortType,
  type FuneralCompanyDetail,
  type FuneralCompanyMock,
  type FuneralCompanyOptionId,
  type FuneralCompanyRegistrationType,
  funeralCompanyOptionDefinitions,
} from '../../shared/data/funeralCompaniesData';
import { FuneralCompanyMapView } from '../components/FuneralCompanyMapView';
import { resolveHomePreviewRoute } from '../navigation/resolveHomePreviewRoute';
import { useAppSessionStore } from '../stores/AppSessionStore';

const inactiveHomeAssetUri = 'https://www.figma.com/api/mcp/asset/9a1de914-5682-454b-8955-f7202bdb9562';
const inactiveFootprintAssetUri = 'https://www.figma.com/api/mcp/asset/588ce4ea-6b6d-49e9-84b9-dae34bc703c6';
const inactiveExploreAssetUri = 'https://www.figma.com/api/mcp/asset/85190583-627a-4f2c-ba44-b00dfb3fe342';
const inactiveSettingsAssetUri = 'https://www.figma.com/api/mcp/asset/00a9a881-da45-491e-a25e-8eabe68ce7de';
const seoulStationCoordinates = { latitude: 37.5559, longitude: 126.9723 };
const budgetMaxWon = 1_000_000;
const budgetStepWon = 50_000;
const mapBottomSheetMinHeight = 258;
const maxSavedCompanyCount = 5;
const maxBlockedCompanyCount = 15;
const maxRecentSearchCount = 10;
const toastDurationMs = 1800;

type FuneralCompaniesScreenMode = 'detail' | 'map' | 'options' | 'savedBlocked' | 'search';
type BottomNavTabId = 'explore' | 'footprints' | 'home' | 'settings';
type SavedBlockedTabId = 'blocked' | 'saved';
type MapFilterMenu = 'budget' | 'options' | 'sort' | null;

type PendingExternalAction = {
  actionLabel: string;
  url: string;
};

const sortOptions: Array<{
  icon: string;
  id: FuneralCompaniesSortType;
  label: string;
}> = [
  { icon: '📍', id: 'distance', label: '가까운 순' },
  { icon: '💸', id: 'cost', label: '비용 낮은 순' },
  { icon: '💬', id: 'reviews', label: '후기 많은 순' },
];

const optionSummaryLabels: Record<FuneralCompanyOptionId, string> = {
  freeBasicUrn: '기본 유골함',
  fullObservation: '참관',
  memorialStone: '스톤',
  open24Hours: '24시간',
  ossuary: '납골당/수목장',
  pickupService: '운구',
  privateMemorialRoom: '단독 추모실',
};

const bottomNavTabsByLifecycleStatus = (lifecycleStatus: PetLifecycleStatus): Array<{
  iconUri: string;
  id: BottomNavTabId;
  label: string;
}> => {
  const exploreLabel = lifecycleStatus === 'AFTER_FAREWELL' ? '이어보기' : '살펴보기';

  return [
    { iconUri: inactiveHomeAssetUri, id: 'home', label: '홈' },
    { iconUri: inactiveFootprintAssetUri, id: 'footprints', label: '발자국' },
    { iconUri: inactiveExploreAssetUri, id: 'explore', label: exploreLabel },
    { iconUri: inactiveSettingsAssetUri, id: 'settings', label: '설정' },
  ];
};

const formatBudgetLabel = (budgetMax: number) =>
  budgetMax >= budgetMaxWon
    ? '0원 - 1,000,000원 이상'
    : `0원 - ${budgetMax.toLocaleString('ko-KR')}원`;

const formatPriceLabel = (minPrice: number, maxPrice: number) =>
  `${Math.round(minPrice / 10_000)}~${Math.round(maxPrice / 10_000)}만원`;

const formatDistanceLabel = (distanceKm: number | null) => {
  if (distanceKm === null) {
    return '거리 미확인';
  }

  return distanceKm < 10 ? `${distanceKm.toFixed(1)}km` : `${Math.round(distanceKm)}km`;
};

const formatRatingLabel = (ratingAverage: number, ratingCount: number) =>
  `${ratingAverage.toFixed(1)} · 후기 ${ratingCount}`;

const buildRecentSearches = (recentSearches: string[], nextKeyword: string) => [
  nextKeyword.trim(),
  ...recentSearches.filter(keyword => keyword.trim() !== nextKeyword.trim()),
].filter(Boolean).slice(0, maxRecentSearchCount);

const getRegistrationType = (
  companyId: number,
  state: FuneralCompaniesState,
): FuneralCompanyRegistrationType => {
  if (state.savedCompanyIds.includes(companyId)) {
    return 'SAVED';
  }

  if (state.blockedCompanyIds.includes(companyId)) {
    return 'BLOCKED';
  }

  return null;
};

const getCompanyDetailLink = (company: FuneralCompanyMock, service: 'kakao' | 'naver') => {
  if (service === 'naver') {
    return `https://search.naver.com/search.naver?query=${encodeURIComponent(company.name)}`;
  }

  return `https://map.kakao.com/?q=${encodeURIComponent(company.name)}`;
};

const showBlockedLocationAlert = () => {
  Alert.alert('위치 권한이 필요해요', '주변 장례업체를 정확하게 안내하려면 설정에서 위치 권한을 허용해 주세요.', [
    { style: 'cancel', text: '닫기' },
    {
      onPress: () => {
        openAppSettings().catch(() => undefined);
      },
      text: '설정 열기',
    },
  ]);
};

const getVisibleOptionChips = (company: FuneralCompanyMock) =>
  funeralCompanyOptionDefinitions.filter(optionDefinition => company[optionDefinition.id]);

const getSearchRank = (company: FuneralCompanyMock, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  const normalizedName = company.name.toLowerCase();
  const normalizedAddress = company.location.toLowerCase();

  if (normalizedName === normalizedQuery) {
    return 0;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 2;
  }

  if (normalizedAddress.includes(normalizedQuery)) {
    return 3;
  }

  return null;
};

const getCompanySortValue = (company: FuneralCompanyDetail, sortType: FuneralCompaniesSortType) => {
  if (sortType === 'cost') {
    return company.priceEstimateMin;
  }

  if (sortType === 'reviews') {
    return company.ratingCount * -1;
  }

  return company.distanceKm ?? 999;
};

const getCompanySortComparator = (sortType: FuneralCompaniesSortType) => (
  leftCompany: FuneralCompanyDetail,
  rightCompany: FuneralCompanyDetail,
) => {
  const leftRegistrationPriority = leftCompany.userRegistrationType === 'SAVED'
    ? 0
    : leftCompany.userRegistrationType === 'BLOCKED'
      ? 2
      : 1;
  const rightRegistrationPriority = rightCompany.userRegistrationType === 'SAVED'
    ? 0
    : rightCompany.userRegistrationType === 'BLOCKED'
      ? 2
      : 1;

  if (leftRegistrationPriority !== rightRegistrationPriority) {
    return leftRegistrationPriority - rightRegistrationPriority;
  }

  const leftSortValue = getCompanySortValue(leftCompany, sortType);
  const rightSortValue = getCompanySortValue(rightCompany, sortType);

  if (leftSortValue !== rightSortValue) {
    return leftSortValue - rightSortValue;
  }

  return leftCompany.name.localeCompare(rightCompany.name, 'ko-KR');
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const calculateDistanceKm = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) => {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2)
    + Math.cos(toRadians(latitudeA))
    * Math.cos(toRadians(latitudeB))
    * Math.sin(deltaLongitude / 2)
    * Math.sin(deltaLongitude / 2);

  return Number((2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

const getOptionSummaryLabel = (selectedOptionIds: FuneralCompanyOptionId[]) => {
  if (selectedOptionIds.length === 0) {
    return '옵션';
  }

  const [firstOptionId, ...restOptionIds] = selectedOptionIds;
  const baseLabel = optionSummaryLabels[firstOptionId] ?? '옵션';

  return restOptionIds.length > 0 ? `${baseLabel} +${restOptionIds.length}` : baseLabel;
};

type FuneralCompanyCardProps = {
  company: FuneralCompanyDetail;
  disabledActions?: boolean;
  onOpenDetail: (companyId: number) => void;
  onToggleBlocked?: (companyId: number) => void;
  onToggleSaved?: (companyId: number) => void;
};

function FuneralCompanyCard({
  company,
  disabledActions = false,
  onOpenDetail,
  onToggleBlocked,
  onToggleSaved,
}: FuneralCompanyCardProps) {
  const isSaved = company.userRegistrationType === 'SAVED';
  const isBlocked = company.userRegistrationType === 'BLOCKED';

  return (
    <Pressable onPress={() => onOpenDetail(company.id)} style={[styles.companyCard, isBlocked ? styles.companyCardBlocked : null]}>
      <View style={styles.companyCardHeaderRow}>
        <View style={styles.companyCardTitleBlock}>
          <Text style={styles.companyCardTitle}>{company.name}</Text>
          <Text numberOfLines={2} style={styles.companyCardAddress}>{company.location}</Text>
        </View>

        {disabledActions ? (
          <View style={styles.companyReadOnlyPill}>
            <Text style={styles.companyReadOnlyPillLabel}>저장 목록</Text>
          </View>
        ) : (
          <View style={styles.companyActionRow}>
            <Pressable
              hitSlop={8}
              onPress={() => onToggleSaved?.(company.id)}
              style={[styles.companyActionPill, isSaved ? styles.companyActionPillSaved : null]}
            >
              <Text style={[styles.companyActionPillLabel, isSaved ? styles.companyActionPillLabelSaved : null]}>
                저장
              </Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => onToggleBlocked?.(company.id)}
              style={[styles.companyActionPill, isBlocked ? styles.companyActionPillBlocked : null]}
            >
              <Text style={[styles.companyActionPillLabel, isBlocked ? styles.companyActionPillLabelBlocked : null]}>
                피하기
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.companyMetaRow}>
        <View style={styles.companyMetaChip}>
          <Text style={styles.companyMetaChipLabel}>{formatDistanceLabel(company.distanceKm)}</Text>
        </View>
        <View style={styles.companyMetaChip}>
          <Text style={styles.companyMetaChipLabel}>{formatPriceLabel(company.priceEstimateMin, company.priceEstimateMax)}</Text>
        </View>
        <View style={styles.companyMetaChip}>
          <Text style={styles.companyMetaChipLabel}>{formatRatingLabel(company.ratingAverage, company.ratingCount)}</Text>
        </View>
      </View>

      {isBlocked ? (
        <View style={styles.companyBlockedBanner}>
          <Text style={styles.companyBlockedBannerLabel}>피한 업체는 지도에서도 잘 보이지 않아요!</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function FuneralCompaniesScreen() {
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  const { closePreview, openPreview, selectedPet } = useAppSessionStore();
  const lifecycleStatus = selectedPet?.lifecycleStatus ?? 'BEFORE_FAREWELL';
  const isAfterFarewell = lifecycleStatus === 'AFTER_FAREWELL';
  const homePreviewRoute = resolveHomePreviewRoute(selectedPet);
  const bottomNavTabs = useMemo(
    () => bottomNavTabsByLifecycleStatus(lifecycleStatus),
    [lifecycleStatus],
  );
  const mapBottomSheetMaxHeight = Math.min(dimensions.height * 0.62, 520);
  const budgetTrackWidth = Math.max(220, dimensions.width - 94);
  const budgetProgressRatioRef = useRef(1);
  const budgetMenuProgressRatioRef = useRef(1);
  const sheetHeightRef = useRef(mapBottomSheetMinHeight + 48);

  const [isHydrating, setHydrating] = useState(true);
  const [draftState, setDraftState] = useState<FuneralCompaniesState | null>(null);
  const [screenMode, setScreenMode] = useState<FuneralCompaniesScreenMode>('options');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedSavedBlockedTabId, setSelectedSavedBlockedTabId] = useState<SavedBlockedTabId>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMapFilterMenu, setActiveMapFilterMenu] = useState<MapFilterMenu>(null);
  const [pendingBudgetMax, setPendingBudgetMax] = useState(budgetMaxWon);
  const [isLeaveModalVisible, setLeaveModalVisible] = useState(false);
  const [isClearRecentSearchesModalVisible, setClearRecentSearchesModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingExternalAction, setPendingExternalAction] = useState<PendingExternalAction | null>(null);
  const [mapBottomSheetHeight, setMapBottomSheetHeight] = useState(mapBottomSheetMinHeight + 48);

  const storageIdentity = useMemo(
    () => ({
      inviteCode: selectedPet?.inviteCode ?? null,
      lifecycleStatus,
      petId: selectedPet?.id ?? null,
    }),
    [lifecycleStatus, selectedPet?.id, selectedPet?.inviteCode],
  );

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const nextStoredState = await readStoredFuneralCompaniesState(storageIdentity);

      if (!isMounted) {
        return;
      }

      setDraftState(nextStoredState);
      setSelectedSavedBlockedTabId(nextStoredState.savedCompanyIds.length > 0 ? 'saved' : 'blocked');
      setScreenMode(
        isAfterFarewell || nextStoredState.hasCompletedOptions
          ? 'map'
          : 'options',
      );
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
  }, [isAfterFarewell, storageIdentity]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, toastDurationMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [toastMessage]);

  useEffect(() => {
    let isMounted = true;

    if (
      isHydrating
      || !draftState
      || isAfterFarewell
      || draftState.hasCompletedOptions
      || draftState.locationPermission !== 'unknown'
    ) {
      return () => {
        isMounted = false;
      };
    }

    const requestInitialLocationPermission = async () => {
      const permissionResult = await requestLocationPermission();

      if (!isMounted) {
        return;
      }

      if (!permissionResult.granted) {
        setDraftState(current => (current ? {
          ...current,
          currentLatitude: null,
          currentLongitude: null,
          locationPermission: 'denied',
        } : current));
        setToastMessage('위치 권한을 허용하면 가까운 업체를 더 정확하게 보여드릴 수 있어요.');

        if (permissionResult.blocked) {
          showBlockedLocationAlert();
        }

        return;
      }

      try {
        const coordinates = await getCurrentDeviceCoordinates();

        if (!isMounted) {
          return;
        }

        setDraftState(current => (current ? {
          ...current,
          currentLatitude: coordinates.latitude,
          currentLongitude: coordinates.longitude,
          locationPermission: 'granted',
        } : current));
      } catch {
        if (!isMounted) {
          return;
        }

        setDraftState(current => (current ? {
          ...current,
          currentLatitude: null,
          currentLongitude: null,
          locationPermission: 'granted',
        } : current));
        setToastMessage('현재 위치를 확인하지 못해 서울역 기준으로 보여드려요.');
      }
    };

    requestInitialLocationPermission().catch(() => {
      if (!isMounted) {
        return;
      }

      setDraftState(current => (current ? {
        ...current,
        currentLatitude: null,
        currentLongitude: null,
        locationPermission: 'denied',
      } : current));
      setToastMessage('위치 권한을 확인하지 못해 서울역 기준으로 보여드려요.');
    });

    return () => {
      isMounted = false;
    };
  }, [
    draftState,
    isAfterFarewell,
    isHydrating,
  ]);

  useEffect(() => {
    let isMounted = true;

    if (
      draftState?.locationPermission !== 'granted'
      || (draftState.currentLatitude !== null && draftState.currentLongitude !== null)
    ) {
      return () => {
        isMounted = false;
      };
    }

    getCurrentDeviceCoordinates()
      .then(coordinates => {
        if (!isMounted) {
          return;
        }

        setDraftState(current => (current ? {
          ...current,
          currentLatitude: coordinates.latitude,
          currentLongitude: coordinates.longitude,
        } : current));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setToastMessage('현재 위치를 확인하지 못해 서울역 기준으로 보여드려요.');
      });

    return () => {
      isMounted = false;
    };
  }, [
    draftState?.currentLatitude,
    draftState?.currentLongitude,
    draftState?.locationPermission,
  ]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pendingExternalAction) {
        setPendingExternalAction(null);
        return true;
      }

      if (activeMapFilterMenu) {
        setActiveMapFilterMenu(null);
        return true;
      }

      if (isLeaveModalVisible) {
        setLeaveModalVisible(false);
        return true;
      }

      if (isClearRecentSearchesModalVisible) {
        setClearRecentSearchesModalVisible(false);
        return true;
      }

      if (screenMode === 'detail' || screenMode === 'savedBlocked' || screenMode === 'search') {
        setScreenMode('map');
        return true;
      }

      if (screenMode === 'map') {
        setLeaveModalVisible(true);
        return true;
      }

      openPreview(homePreviewRoute);
      return true;
    });

    return () => {
      backHandler.remove();
    };
  }, [
    activeMapFilterMenu,
    homePreviewRoute,
    isClearRecentSearchesModalVisible,
    isLeaveModalVisible,
    openPreview,
    pendingExternalAction,
    screenMode,
  ]);

  const userCoordinates = useMemo(
    () => (
      draftState?.locationPermission === 'granted'
        ? {
            latitude: draftState.currentLatitude ?? seoulStationCoordinates.latitude,
            longitude: draftState.currentLongitude ?? seoulStationCoordinates.longitude,
          }
        : seoulStationCoordinates
    ),
    [draftState?.currentLatitude, draftState?.currentLongitude, draftState?.locationPermission],
  );

  const companiesWithRegistrations = useMemo<FuneralCompanyDetail[]>(() => {
    if (!draftState) {
      return [];
    }

    return funeralCompaniesMockData.map(company => ({
      ...company,
      distanceKm: calculateDistanceKm(
        userCoordinates.latitude,
        userCoordinates.longitude,
        company.latitude,
        company.longitude,
      ),
      userRegistrationType: getRegistrationType(company.id, draftState),
    }));
  }, [draftState, userCoordinates.latitude, userCoordinates.longitude]);

  const filteredCompanies = useMemo(() => {
    if (!draftState) {
      return [] as FuneralCompanyDetail[];
    }

    const baseCompanies = companiesWithRegistrations.filter(company => {
      if (isAfterFarewell) {
        return company.userRegistrationType === 'SAVED';
      }

      if (company.priceEstimateMin > draftState.budgetMax) {
        return false;
      }

      if (draftState.selectedOptionIds.length === 0) {
        return true;
      }

      return draftState.selectedOptionIds.every(optionId => company[optionId]);
    });

    const radiusCutoffCompanies = baseCompanies.filter(company => (company.distanceKm ?? 999) <= 50);
    const visibleCompanies = radiusCutoffCompanies.length > 0
      ? radiusCutoffCompanies
      : baseCompanies.filter(company => (company.distanceKm ?? 999) <= 100);

    return [...visibleCompanies].sort(getCompanySortComparator(draftState.sortType));
  }, [companiesWithRegistrations, draftState, isAfterFarewell]);

  const searchResults = useMemo(() => {
    if (!draftState) {
      return [] as FuneralCompanyDetail[];
    }

    const searchBase = companiesWithRegistrations.filter(company => {
      if (isAfterFarewell) {
        return company.userRegistrationType === 'SAVED';
      }

      if (company.priceEstimateMin > draftState.budgetMax) {
        return false;
      }

      if (draftState.selectedOptionIds.length === 0) {
        return true;
      }

      return draftState.selectedOptionIds.every(optionId => company[optionId]);
    });

    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return searchBase.slice(0, 10);
    }

    return [...searchBase]
      .map(company => ({
        company,
        rank: getSearchRank(company, normalizedQuery),
      }))
      .filter(result => result.rank !== null)
      .sort((leftResult, rightResult) => {
        if (leftResult.rank !== rightResult.rank) {
          return (leftResult.rank ?? 99) - (rightResult.rank ?? 99);
        }

        return getCompanySortComparator(draftState.sortType)(leftResult.company, rightResult.company);
      })
      .slice(0, 10)
      .map(result => result.company);
  }, [companiesWithRegistrations, draftState, isAfterFarewell, searchQuery]);

  const savedCompanies = useMemo(
    () => companiesWithRegistrations.filter(company => company.userRegistrationType === 'SAVED'),
    [companiesWithRegistrations],
  );
  const blockedCompanies = useMemo(
    () => companiesWithRegistrations.filter(company => company.userRegistrationType === 'BLOCKED'),
    [companiesWithRegistrations],
  );
  const selectedCompany = useMemo(
    () => companiesWithRegistrations.find(company => company.id === selectedCompanyId) ?? null,
    [companiesWithRegistrations, selectedCompanyId],
  );
  const displayedCompanies = screenMode === 'search' ? searchResults : filteredCompanies;
  const mapMarkers = useMemo(
    () => displayedCompanies.map(company => ({
      id: company.id,
      isBlocked: company.userRegistrationType === 'BLOCKED',
      isSaved: company.userRegistrationType === 'SAVED',
      label: company.name.replace(/ .*/, ''),
      latitude: company.latitude,
      longitude: company.longitude,
    })),
    [displayedCompanies],
  );

  const updateDraftState = (updater: (current: FuneralCompaniesState) => FuneralCompaniesState) => {
    setDraftState(current => {
      if (!current) {
        return current;
      }

      return updater(current);
    });
  };

  const persistDraftState = async (nextState: FuneralCompaniesState) => {
    await writeStoredFuneralCompaniesState(storageIdentity, nextState);
    setDraftState(nextState);
  };

  const handleToggleOption = (optionId: FuneralCompanyOptionId) => {
    if (isAfterFarewell) {
      return;
    }

    updateDraftState(current => ({
      ...current,
      selectedOptionIds: current.selectedOptionIds.includes(optionId)
        ? current.selectedOptionIds.filter(currentOptionId => currentOptionId !== optionId)
        : [...current.selectedOptionIds, optionId],
    }));
  };

  const handleSelectRegistration = (
    companyId: number,
    nextRegistrationType: Exclude<FuneralCompanyRegistrationType, null>,
  ) => {
    if (!draftState || isAfterFarewell) {
      return;
    }

    const isSaved = draftState.savedCompanyIds.includes(companyId);
    const isBlocked = draftState.blockedCompanyIds.includes(companyId);

    if (nextRegistrationType === 'SAVED') {
      if (isSaved) {
        updateDraftState(current => ({
          ...current,
          savedCompanyIds: current.savedCompanyIds.filter(savedCompanyId => savedCompanyId !== companyId),
        }));
        return;
      }

      if (draftState.savedCompanyIds.length >= maxSavedCompanyCount) {
        setToastMessage('저장한 업체는 최대 5곳까지 담을 수 있어요.');
        return;
      }

      updateDraftState(current => ({
        ...current,
        blockedCompanyIds: current.blockedCompanyIds.filter(blockedCompanyId => blockedCompanyId !== companyId),
        savedCompanyIds: [companyId, ...current.savedCompanyIds.filter(savedCompanyId => savedCompanyId !== companyId)],
      }));
      return;
    }

    if (isBlocked) {
      updateDraftState(current => ({
        ...current,
        blockedCompanyIds: current.blockedCompanyIds.filter(blockedCompanyId => blockedCompanyId !== companyId),
      }));
      return;
    }

    if (draftState.blockedCompanyIds.length >= maxBlockedCompanyCount) {
      setToastMessage('피한 업체는 최대 15곳까지 담을 수 있어요.');
      return;
    }

    updateDraftState(current => ({
      ...current,
      blockedCompanyIds: [companyId, ...current.blockedCompanyIds.filter(blockedCompanyId => blockedCompanyId !== companyId)],
      savedCompanyIds: current.savedCompanyIds.filter(savedCompanyId => savedCompanyId !== companyId),
    }));
  };

  const handleCompleteOptions = async () => {
    if (!draftState) {
      return;
    }

    const nextState = {
      ...draftState,
      hasCompletedOptions: true,
      locationPermission: draftState.locationPermission === 'unknown' ? 'denied' : draftState.locationPermission,
    };

    await persistDraftState(nextState);
    setScreenMode('map');
    setToastMessage('선택한 조건으로 장례업체를 불러왔어요.');
  };

  const handleSaveAndClose = async () => {
    if (!draftState) {
      closePreview();
      return;
    }

    await persistDraftState(draftState);
    closePreview();
  };

  const handleSaveCurrentChanges = async () => {
    if (!draftState) {
      return;
    }

    await persistDraftState(draftState);
    setToastMessage('저장한 업체와 피하기 목록을 업데이트했어요.');
  };

  const handleCommitRecentSearch = (keyword: string) => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      return;
    }

    updateDraftState(current => ({
      ...current,
      recentSearches: buildRecentSearches(current.recentSearches, trimmedKeyword),
    }));
  };

  const handleSelectSearchResult = (companyId: number) => {
    handleCommitRecentSearch(searchQuery);
    setSelectedCompanyId(companyId);
    setScreenMode('detail');
  };

  const handleTapRecentSearch = (keyword: string) => {
    setSearchQuery(keyword);
  };

  const handleChangeBudgetByRatio = (ratio: number) => {
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    const nextBudget = Math.round(((clampedRatio * budgetMaxWon) / budgetStepWon)) * budgetStepWon;
    budgetProgressRatioRef.current = clampedRatio;

    updateDraftState(current => ({
      ...current,
      budgetMax: Math.min(budgetMaxWon, Math.max(0, nextBudget)),
    }));
  };

  const handleChangePendingBudgetByRatio = (ratio: number) => {
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    const nextBudget = Math.round(((clampedRatio * budgetMaxWon) / budgetStepWon)) * budgetStepWon;
    budgetMenuProgressRatioRef.current = clampedRatio;
    setPendingBudgetMax(Math.min(budgetMaxWon, Math.max(0, nextBudget)));
  };

  const budgetSliderPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      budgetProgressRatioRef.current = (draftState?.budgetMax ?? budgetMaxWon) / budgetMaxWon;
    },
    onPanResponderMove: (_, gestureState) => {
      const nextRatio = budgetProgressRatioRef.current + (gestureState.dx / budgetTrackWidth);
      handleChangeBudgetByRatio(nextRatio);
    },
  });

  const budgetMenuPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      budgetMenuProgressRatioRef.current = pendingBudgetMax / budgetMaxWon;
    },
    onPanResponderMove: (_, gestureState) => {
      const nextRatio = budgetMenuProgressRatioRef.current + (gestureState.dx / budgetTrackWidth);
      handleChangePendingBudgetByRatio(nextRatio);
    },
  });

  const mapSheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 6,
        onPanResponderGrant: () => {
          sheetHeightRef.current = mapBottomSheetHeight;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextHeight = sheetHeightRef.current - gestureState.dy;
          setMapBottomSheetHeight(Math.min(mapBottomSheetMaxHeight, Math.max(mapBottomSheetMinHeight, nextHeight)));
        },
        onPanResponderRelease: () => {
          const midpoint = (mapBottomSheetMinHeight + mapBottomSheetMaxHeight) / 2;
          setMapBottomSheetHeight(currentHeight =>
            currentHeight < midpoint ? mapBottomSheetMinHeight : mapBottomSheetMaxHeight);
        },
      }),
    [mapBottomSheetHeight, mapBottomSheetMaxHeight],
  );

  const handlePressMapBack = () => {
    setActiveMapFilterMenu(null);
    setLeaveModalVisible(true);
  };

  const handleOpenMapFilterMenu = (nextMenu: Exclude<MapFilterMenu, null>) => {
    setActiveMapFilterMenu(currentMenu => {
      const resolvedMenu = currentMenu === nextMenu ? null : nextMenu;

      if (resolvedMenu === 'budget' && draftState) {
        setPendingBudgetMax(draftState.budgetMax);
      }

      return resolvedMenu;
    });
  };

  const handleApplyMapBudget = () => {
    updateDraftState(current => ({
      ...current,
      budgetMax: pendingBudgetMax,
    }));
    setActiveMapFilterMenu(null);
  };

  const renderMapFilterMenu = () => {
    if (!draftState || !activeMapFilterMenu || isAfterFarewell) {
      return null;
    }

    if (activeMapFilterMenu === 'sort') {
      return (
        <View style={[styles.mapFilterMenuCard, styles.mapSortMenuCard]}>
          {sortOptions.map(sortOption => {
            const isActive = draftState.sortType === sortOption.id;

            return (
              <Pressable
                key={sortOption.id}
                onPress={() => {
                  updateDraftState(current => ({ ...current, sortType: sortOption.id }));
                  setActiveMapFilterMenu(null);
                }}
                style={styles.mapMenuListButton}
              >
                <Text style={styles.mapMenuListCheck}>{isActive ? '✓' : ' '}</Text>
                <Text style={[styles.mapMenuListLabel, isActive ? styles.mapMenuListLabelActive : null]}>
                  {sortOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (activeMapFilterMenu === 'options') {
      return (
        <View style={[styles.mapFilterMenuCard, styles.mapOptionsMenuCard]}>
          {funeralCompanyOptionDefinitions.map(optionDefinition => {
            const isSelected = draftState.selectedOptionIds.includes(optionDefinition.id);

            return (
              <Pressable
                key={optionDefinition.id}
                onPress={() => handleToggleOption(optionDefinition.id)}
                style={styles.mapMenuListButton}
              >
                <Text style={styles.mapMenuOptionEmoji}>{optionDefinition.label.split(' ')[0]}</Text>
                <Text style={[styles.mapMenuListLabel, isSelected ? styles.mapMenuListLabelActive : null]}>
                  {optionSummaryLabels[optionDefinition.id]}
                </Text>
                <Text style={styles.mapMenuListCheck}>{isSelected ? '✓' : ' '}</Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    const budgetProgressWidth = `${(pendingBudgetMax / budgetMaxWon) * 100}%`;

    return (
      <View style={[styles.mapFilterMenuCard, styles.mapBudgetMenuCard]}>
        <Text style={styles.mapBudgetMenuLabel}>{formatBudgetLabel(pendingBudgetMax)}</Text>
        <Pressable
          onPress={event => {
            const nextRatio = event.nativeEvent.locationX / budgetTrackWidth;
            handleChangePendingBudgetByRatio(nextRatio);
          }}
          style={[styles.budgetTrack, styles.mapBudgetTrack, { width: budgetTrackWidth }]}
        >
          <View style={[styles.budgetTrackFill, { width: budgetProgressWidth }]} />
          <View style={[styles.budgetHandle, { left: budgetProgressWidth }]} {...budgetMenuPanResponder.panHandlers} />
        </Pressable>
        <View style={styles.mapBudgetButtonRow}>
          <Pressable onPress={handleApplyMapBudget} style={styles.mapBudgetApplyButton}>
            <Text style={styles.mapBudgetApplyButtonLabel}>적용</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setPendingBudgetMax(draftState.budgetMax);
              setActiveMapFilterMenu(null);
            }}
            style={styles.mapBudgetCloseButton}
          >
            <Text style={styles.mapBudgetCloseButtonLabel}>닫기</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderBottomNavigation = () => (
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
                }
              }}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomNavIconFrame, isActive ? styles.bottomNavIconFrameActive : null]}>
                <Text style={styles.bottomNavActiveEmoji}>{isActive ? '•' : ' '}</Text>
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
  );

  const renderHeader = (
    title: string,
    onPressBack: () => void,
    rightAction?: {
      label: string;
      onPress: () => void;
    },
  ) => (
    <View style={[styles.headerCard, { paddingTop: insets.top + 14 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={onPressBack} style={styles.headerBackButton}>
          <Text style={styles.headerBackButtonLabel}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.headerActionButton}>
            <Text style={styles.headerActionButtonLabel}>{rightAction.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>
    </View>
  );

  const renderOptionsScreen = () => {
    if (!draftState) {
      return null;
    }

    const budgetProgressWidth = `${((draftState.budgetMax ?? budgetMaxWon) / budgetMaxWon) * 100}%`;

    return (
      <View style={styles.root}>
        <StatusBar backgroundColor="#F9F9F9" barStyle="dark-content" />

        {renderHeader('옵션 선택', () => openPreview(homePreviewRoute))}

        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.optionsContent,
            { paddingBottom: insets.bottom + 112 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionSection}>
            <Text style={styles.optionSectionTitle}>정렬 방식</Text>
            <View style={styles.optionRadioGroup}>
              {sortOptions.map(sortOption => {
                const isActive = draftState.sortType === sortOption.id;

                return (
                  <Pressable
                    key={sortOption.id}
                    onPress={() => updateDraftState(current => ({ ...current, sortType: sortOption.id }))}
                    style={styles.optionRadioRow}
                  >
                    <View style={styles.optionRadioLabelRow}>
                      <Text style={styles.optionRadioEmoji}>{sortOption.icon}</Text>
                      <Text style={[styles.optionRadioLabel, isActive ? styles.optionRadioLabelActive : null]}>
                        {sortOption.label}
                      </Text>
                    </View>
                    <View style={[styles.optionRadioCircle, isActive ? styles.optionRadioCircleActive : null]}>
                      {isActive ? <View style={styles.optionRadioCircleInner} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.optionSection}>
            <Text style={styles.optionSectionTitle}>예산</Text>
            <Text style={styles.budgetLabel}>{formatBudgetLabel(draftState.budgetMax)}</Text>
            <Pressable
              onPress={event => {
                const nextRatio = event.nativeEvent.locationX / budgetTrackWidth;
                handleChangeBudgetByRatio(nextRatio);
              }}
              style={[styles.budgetTrack, { width: budgetTrackWidth }]}
            >
              <View style={[styles.budgetTrackFill, { width: budgetProgressWidth }]} />
              <View style={[styles.budgetHandle, { left: budgetProgressWidth }]} {...budgetSliderPanResponder.panHandlers} />
            </Pressable>
          </View>

          <View style={styles.optionSection}>
            <Text style={styles.optionSectionTitle}>옵션</Text>
            <View style={styles.optionChipWrap}>
              {funeralCompanyOptionDefinitions.map(optionDefinition => {
                const isSelected = draftState.selectedOptionIds.includes(optionDefinition.id);

                return (
                  <Pressable
                    key={optionDefinition.id}
                    onPress={() => handleToggleOption(optionDefinition.id)}
                    style={[styles.optionChip, isSelected ? styles.optionChipSelected : null]}
                  >
                    <Text style={[styles.optionChipLabel, isSelected ? styles.optionChipLabelSelected : null]}>
                      {optionDefinition.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.primaryFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable onPress={handleCompleteOptions} style={styles.primaryFooterButton}>
            <Text style={styles.primaryFooterButtonLabel}>다음으로</Text>
          </Pressable>
        </View>

        {renderBottomNavigation()}
      </View>
    );
  };

  const renderMapScreen = () => {
    if (!draftState) {
      return null;
    }

    const mapHeight = Math.max(246, dimensions.height * 0.28);

    return (
      <View style={styles.root}>
        <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />

        {renderHeader('장례업체 찾기', handlePressMapBack, {
          label: '저장/피하기',
          onPress: () => setScreenMode('savedBlocked'),
        })}

        <View style={styles.mapContent}>
          {isAfterFarewell ? (
            <View style={styles.afterFarewellBanner}>
              <Text style={styles.afterFarewellBannerTitle}>긴급 대처 모드에서는 이별 전에 저장한 업체만 보여드려요.</Text>
              <Text style={styles.afterFarewellBannerBody}>저장 목록이 비어 있으면 먼저 미리 살펴보기에서 장례업체를 저장해 주세요.</Text>
            </View>
          ) : null}

          <View style={styles.mapControlsRow}>
            <Pressable onPress={() => setScreenMode('search')} style={styles.searchLauncher}>
              <Text style={styles.searchLauncherPlaceholder}>업체명으로 검색하기</Text>
            </Pressable>
          </View>

          {!isAfterFarewell ? (
            <ScrollView
              contentContainerStyle={styles.filterChipRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Pressable
                onPress={() => handleOpenMapFilterMenu('sort')}
                style={[
                  styles.filterSummaryChip,
                  activeMapFilterMenu === 'sort' ? styles.filterSummaryChipActive : null,
                ]}
              >
                <Text style={[
                  styles.filterSummaryChipLabel,
                  activeMapFilterMenu === 'sort' ? styles.filterSummaryChipLabelActive : null,
                ]}>
                  {sortOptions.find(option => option.id === draftState.sortType)?.label ?? '가까운 순'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleOpenMapFilterMenu('options')}
                style={[
                  styles.filterSummaryChip,
                  activeMapFilterMenu === 'options' ? styles.filterSummaryChipActive : null,
                ]}
              >
                <Text style={[
                  styles.filterSummaryChipLabel,
                  activeMapFilterMenu === 'options' ? styles.filterSummaryChipLabelActive : null,
                ]}>
                  {getOptionSummaryLabel(draftState.selectedOptionIds)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleOpenMapFilterMenu('budget')}
                style={[
                  styles.filterSummaryChip,
                  activeMapFilterMenu === 'budget' ? styles.filterSummaryChipActive : null,
                ]}
              >
                <Text style={[
                  styles.filterSummaryChipLabel,
                  activeMapFilterMenu === 'budget' ? styles.filterSummaryChipLabelActive : null,
                ]}>
                  예산
                </Text>
              </Pressable>
              <Pressable onPress={() => setScreenMode('savedBlocked')} style={styles.filterSummaryChip}>
                <Text style={styles.filterSummaryChipLabel}>{`저장한 업체 ${draftState.savedCompanyIds.length}`}</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <View style={styles.filterChipRowStatic}>
              <Pressable onPress={() => setScreenMode('savedBlocked')} style={styles.filterSummaryChip}>
                <Text style={styles.filterSummaryChipLabel}>{`저장한 업체 ${draftState.savedCompanyIds.length}`}</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.mapPanel, { height: mapHeight }]}>
            <FuneralCompanyMapView
              markers={mapMarkers}
              onPressMarker={companyId => {
                setSelectedCompanyId(companyId);
                setScreenMode('detail');
              }}
              selectedCompanyId={selectedCompanyId}
              style={styles.mapViewSurface}
              userCoordinates={userCoordinates}
            />

            <View style={styles.mapStatusNote}>
              <Text style={styles.mapStatusNoteLabel}>
                {draftState.locationPermission === 'granted'
                  ? '현재 위치 기준 50km 안의 업체를 우선 보여드려요.'
                  : '위치 권한이 없어 서울역 기준으로 정렬했어요.'}
              </Text>
            </View>

            {activeMapFilterMenu ? (
              <>
                <Pressable onPress={() => setActiveMapFilterMenu(null)} style={styles.mapFilterMenuBackdrop} />
                {renderMapFilterMenu()}
              </>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.mapBottomSheet,
            {
              bottom: Math.max(insets.bottom, 12) + 70,
              height: mapBottomSheetHeight,
            },
          ]}
        >
          <Pressable style={styles.mapBottomSheetHandleArea} {...mapSheetPanResponder.panHandlers}>
            <View style={styles.mapBottomSheetHandle} />
          </Pressable>
          <View style={styles.mapBottomSheetHeaderRow}>
            <View>
              <Text style={styles.mapBottomSheetTitle}>
                {isAfterFarewell ? '저장한 업체' : '장례업체 리스트'}
              </Text>
              <Text style={styles.mapBottomSheetSubtitle}>{`${displayedCompanies.length}곳을 확인할 수 있어요`}</Text>
            </View>
            {!isAfterFarewell ? (
              <Pressable onPress={handleSaveCurrentChanges} style={styles.mapBottomSheetSaveButton}>
                <Text style={styles.mapBottomSheetSaveButtonLabel}>업체 저장하기</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={styles.mapBottomSheetContent}
            showsVerticalScrollIndicator={false}
          >
            {displayedCompanies.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>
                  {isAfterFarewell ? '이별 전에 저장한 장례업체가 아직 없어요.' : '조건에 맞는 장례업체가 아직 없어요.'}
                </Text>
                <Text style={styles.emptyStateBody}>
                  {isAfterFarewell
                    ? '미리 살펴보기에서 저장해 둔 장례업체가 있으면 이곳에 다시 보여드릴게요.'
                    : '정렬 방식, 예산, 옵션을 조금만 넓혀 보면 더 많은 업체를 볼 수 있어요.'}
                </Text>
              </View>
            ) : null}

            {displayedCompanies.map(company => (
              <FuneralCompanyCard
                key={company.id}
                company={company}
                disabledActions={isAfterFarewell}
                onOpenDetail={companyId => {
                  setSelectedCompanyId(companyId);
                  setScreenMode('detail');
                }}
                onToggleBlocked={companyId => handleSelectRegistration(companyId, 'BLOCKED')}
                onToggleSaved={companyId => handleSelectRegistration(companyId, 'SAVED')}
              />
            ))}
          </ScrollView>
        </View>

        {renderBottomNavigation()}
      </View>
    );
  };

  const renderSearchScreen = () => {
    if (!draftState) {
      return null;
    }

    return (
      <View style={styles.root}>
        <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />
        {renderHeader('업체 검색', () => setScreenMode('map'))}

        <View style={styles.searchScreenContent}>
          <View style={styles.searchInputWrap}>
            <TextInput
              autoFocus
              onChangeText={setSearchQuery}
              placeholder="장례업체 이름을 입력해 주세요"
              placeholderTextColor="#BCBBB7"
              style={styles.searchInput}
              value={searchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} style={styles.searchInputClearButton}>
                <Text style={styles.searchInputClearButtonLabel}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            contentContainerStyle={[styles.searchContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {searchQuery.trim() ? (
              <>
                <Text style={styles.searchSectionTitle}>검색 결과</Text>
                {searchResults.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>{`"${searchQuery.trim()}"에 대한 검색 결과가 없어요.`}</Text>
                    <Text style={styles.emptyStateBody}>업체명 또는 주소 일부로 다시 검색해 주세요.</Text>
                  </View>
                ) : (
                  searchResults.map(company => (
                    <Pressable
                      key={company.id}
                      onPress={() => handleSelectSearchResult(company.id)}
                      style={styles.searchResultRow}
                    >
                      <View style={styles.searchResultTextBlock}>
                        <Text style={styles.searchResultTitle}>{company.name}</Text>
                        <Text style={styles.searchResultSubtitle}>{company.location}</Text>
                      </View>
                      <Text style={styles.searchResultDistance}>{formatDistanceLabel(company.distanceKm)}</Text>
                    </Pressable>
                  ))
                )}
              </>
            ) : (
              <>
                <View style={styles.searchSectionHeaderRow}>
                  <Text style={styles.searchSectionTitle}>최근 검색어</Text>
                  {draftState.recentSearches.length > 0 ? (
                    <Pressable onPress={() => setClearRecentSearchesModalVisible(true)}>
                      <Text style={styles.clearAllSearchesLabel}>전체 삭제</Text>
                    </Pressable>
                  ) : null}
                </View>

                {draftState.recentSearches.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateTitle}>최근 검색어가 없어요.</Text>
                    <Text style={styles.emptyStateBody}>업체를 검색하면 최근 검색어를 최대 10개까지 저장해 둘게요.</Text>
                  </View>
                ) : (
                  draftState.recentSearches.map(keyword => (
                    <View key={keyword} style={styles.recentSearchRow}>
                      <Pressable onPress={() => handleTapRecentSearch(keyword)} style={styles.recentSearchKeywordButton}>
                        <Text style={styles.recentSearchKeyword}>{keyword}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          updateDraftState(current => ({
                            ...current,
                            recentSearches: current.recentSearches.filter(currentKeyword => currentKeyword !== keyword),
                          }))}
                        style={styles.recentSearchRemoveButton}
                      >
                        <Text style={styles.recentSearchRemoveButtonLabel}>×</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderSavedBlockedScreen = () => {
    const targetCompanies = selectedSavedBlockedTabId === 'saved' ? savedCompanies : blockedCompanies;

    return (
      <View style={styles.root}>
        <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />
        {renderHeader('저장 / 피하기', () => setScreenMode('map'))}

        <View style={styles.savedBlockedScreenContent}>
          <View style={styles.savedBlockedTabRow}>
            <Pressable
              onPress={() => setSelectedSavedBlockedTabId('saved')}
              style={[
                styles.savedBlockedTabButton,
                selectedSavedBlockedTabId === 'saved' ? styles.savedBlockedTabButtonActive : null,
              ]}
            >
              <Text style={[
                styles.savedBlockedTabButtonLabel,
                selectedSavedBlockedTabId === 'saved' ? styles.savedBlockedTabButtonLabelActive : null,
              ]}>
                {`저장한 업체 ${savedCompanies.length}`}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedSavedBlockedTabId('blocked')}
              style={[
                styles.savedBlockedTabButton,
                selectedSavedBlockedTabId === 'blocked' ? styles.savedBlockedTabButtonActive : null,
              ]}
            >
              <Text style={[
                styles.savedBlockedTabButtonLabel,
                selectedSavedBlockedTabId === 'blocked' ? styles.savedBlockedTabButtonLabelActive : null,
              ]}>
                {`피한 업체 ${blockedCompanies.length}`}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[styles.savedBlockedList, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {targetCompanies.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>
                  {selectedSavedBlockedTabId === 'saved' ? '저장한 장례업체가 아직 없어요.' : '피한 장례업체가 아직 없어요.'}
                </Text>
                <Text style={styles.emptyStateBody}>
                  {selectedSavedBlockedTabId === 'saved'
                    ? '지도 리스트나 상세 화면에서 최대 5곳까지 저장할 수 있어요.'
                    : '불편하거나 원하지 않는 업체는 최대 15곳까지 피하기에 넣을 수 있어요.'}
                </Text>
              </View>
            ) : null}

            {targetCompanies.map(company => (
              <View key={company.id} style={styles.savedBlockedRow}>
                <Pressable
                  onPress={() => {
                    setSelectedCompanyId(company.id);
                    setScreenMode('detail');
                  }}
                  style={styles.savedBlockedRowMain}
                >
                  <Text style={styles.savedBlockedRowTitle}>{company.name}</Text>
                  <Text style={styles.savedBlockedRowSubtitle}>{company.location}</Text>
                </Pressable>
                {!isAfterFarewell ? (
                  <Pressable
                    onPress={() =>
                      handleSelectRegistration(
                        company.id,
                        selectedSavedBlockedTabId === 'saved' ? 'SAVED' : 'BLOCKED',
                      )}
                    style={styles.savedBlockedRemoveButton}
                  >
                    <Text style={styles.savedBlockedRemoveButtonLabel}>삭제</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderDetailScreen = () => {
    if (!selectedCompany) {
      return null;
    }

    return (
      <View style={styles.root}>
        <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />
        {renderHeader(selectedCompany.name, () => setScreenMode('map'))}

        <ScrollView
          contentContainerStyle={[styles.detailContent, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            contentContainerStyle={styles.detailImageRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {selectedCompany.imageCards.map(imageCard => (
              <View
                key={`${selectedCompany.id}-${imageCard.label}`}
                style={[styles.detailImageCard, { backgroundColor: imageCard.backgroundColor }]}
              >
                <Text style={styles.detailImageEmoji}>{imageCard.emoji}</Text>
                <Text style={styles.detailImageLabel}>{imageCard.label}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.detailHeroCard}>
            <Text style={styles.detailTitle}>{selectedCompany.name}</Text>
            <Text style={styles.detailDescription}>{selectedCompany.introduction}</Text>
            <View style={styles.detailMetaRow}>
              <View style={styles.detailMetaChip}>
                <Text style={styles.detailMetaChipLabel}>{formatDistanceLabel(selectedCompany.distanceKm)}</Text>
              </View>
              <View style={styles.detailMetaChip}>
                <Text style={styles.detailMetaChipLabel}>{formatPriceLabel(selectedCompany.priceEstimateMin, selectedCompany.priceEstimateMax)}</Text>
              </View>
              <View style={styles.detailMetaChip}>
                <Text style={styles.detailMetaChipLabel}>{formatRatingLabel(selectedCompany.ratingAverage, selectedCompany.ratingCount)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>제공 옵션</Text>
            <View style={styles.optionChipWrap}>
              {getVisibleOptionChips(selectedCompany).map(optionDefinition => (
                <View key={optionDefinition.id} style={[styles.optionChip, styles.optionChipSelected]}>
                  <Text style={[styles.optionChipLabel, styles.optionChipLabelSelected]}>{optionDefinition.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>업체 안내</Text>
            <Text style={styles.detailSectionBody}>{selectedCompany.guideText}</Text>
            <Text style={styles.detailSectionBody}>{selectedCompany.serviceDescription}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>연락과 위치</Text>
            <Pressable
              onPress={() => setPendingExternalAction({ actionLabel: '전화 걸기', url: `tel:${selectedCompany.phone}` })}
              style={styles.detailActionRow}
            >
              <Text style={styles.detailActionLabel}>{selectedCompany.phone}</Text>
              <Text style={styles.detailActionChevron}>{'>'}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setToastMessage('주소를 복사했어요. 현재는 목업 동작이에요.');
              }}
              style={styles.detailActionRow}
            >
              <Text style={styles.detailActionLabel}>{selectedCompany.roadAddress}</Text>
              <Text style={styles.detailActionChevron}>복사</Text>
            </Pressable>
            <Pressable
              onPress={() => setPendingExternalAction({ actionLabel: '네이버지도 리뷰 보기', url: getCompanyDetailLink(selectedCompany, 'naver') })}
              style={styles.detailActionRow}
            >
              <Text style={styles.detailActionLabel}>네이버지도 리뷰 보러가기</Text>
              <Text style={styles.detailActionChevron}>{'>'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setPendingExternalAction({ actionLabel: '카카오맵 리뷰 보기', url: getCompanyDetailLink(selectedCompany, 'kakao') })}
              style={styles.detailActionRow}
            >
              <Text style={styles.detailActionLabel}>카카오맵 리뷰 보러가기</Text>
              <Text style={styles.detailActionChevron}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>포에버 후기</Text>
            {selectedCompany.reviews.length === 0 ? (
              <View style={styles.emptyReviewCard}>
                <Text style={styles.emptyReviewTitle}>포에버 등록 후기가 없어요.</Text>
                <Text style={styles.emptyReviewBody}>외부 지도 리뷰도 함께 확인해 보세요.</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.reviewCardRow}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {selectedCompany.reviews.map(review => (
                  <View key={review.reviewId} style={styles.reviewCard}>
                    <Text style={styles.reviewCardRating}>{'★'.repeat(review.rating)}</Text>
                    <Text style={styles.reviewCardBody}>{review.content}</Text>
                    <Text style={styles.reviewCardMeta}>{`${review.userNickname} · ${review.petName}`}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {!isAfterFarewell ? (
            <View style={styles.detailPrimaryActions}>
              <Pressable
                onPress={() => handleSelectRegistration(selectedCompany.id, 'SAVED')}
                style={[
                  styles.detailPrimaryActionButton,
                  selectedCompany.userRegistrationType === 'SAVED' ? styles.detailPrimaryActionButtonActive : null,
                ]}
              >
                <Text style={[
                  styles.detailPrimaryActionButtonLabel,
                  selectedCompany.userRegistrationType === 'SAVED' ? styles.detailPrimaryActionButtonLabelActive : null,
                ]}>
                  {selectedCompany.userRegistrationType === 'SAVED' ? '저장 해제하기' : '저장하기'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleSelectRegistration(selectedCompany.id, 'BLOCKED')}
                style={[
                  styles.detailSecondaryActionButton,
                  selectedCompany.userRegistrationType === 'BLOCKED' ? styles.detailSecondaryActionButtonBlocked : null,
                ]}
              >
                <Text style={[
                  styles.detailSecondaryActionButtonLabel,
                  selectedCompany.userRegistrationType === 'BLOCKED' ? styles.detailSecondaryActionButtonLabelBlocked : null,
                ]}>
                  {selectedCompany.userRegistrationType === 'BLOCKED' ? '피하기 해제하기' : '피하기'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  };

  if (isHydrating || !draftState) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar backgroundColor="#F6F4F1" barStyle="dark-content" />
        <Text style={styles.loadingLabel}>장례업체 정보를 준비하고 있어요.</Text>
      </View>
    );
  }

  return (
    <>
      {screenMode === 'options' ? renderOptionsScreen() : null}
      {screenMode === 'map' ? renderMapScreen() : null}
      {screenMode === 'search' ? renderSearchScreen() : null}
      {screenMode === 'savedBlocked' ? renderSavedBlockedScreen() : null}
      {screenMode === 'detail' ? renderDetailScreen() : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setLeaveModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isLeaveModalVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setLeaveModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.confirmModalCard}>
            <Text style={styles.confirmModalTitle}>장례업체 선택을 마칠까요?</Text>
            <Text style={styles.confirmModalBody}>저장하고 닫기를 누르면 현재 선택한 업체와 피하기 목록이 반영됩니다.</Text>
            <View style={styles.confirmModalButtonRow}>
              <Pressable
                onPress={() => {
                  setLeaveModalVisible(false);
                  closePreview();
                }}
                style={[styles.confirmModalButton, styles.confirmModalButtonSecondary]}
              >
                <Text style={styles.confirmModalButtonSecondaryLabel}>닫기</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setLeaveModalVisible(false);
                  handleSaveAndClose().catch(() => {
                    setToastMessage('장례업체 정보를 저장하지 못했어요.');
                  });
                }}
                style={[styles.confirmModalButton, styles.confirmModalButtonPrimary]}
              >
                <Text style={styles.confirmModalButtonPrimaryLabel}>저장하고 닫기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setClearRecentSearchesModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isClearRecentSearchesModalVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setClearRecentSearchesModalVisible(false)} style={styles.modalOverlay} />
          <View style={styles.confirmModalCard}>
            <Text style={styles.confirmModalTitle}>최근 검색어를 모두 지울까요?</Text>
            <Text style={styles.confirmModalBody}>삭제한 검색어는 다시 되돌릴 수 없어요.</Text>
            <View style={styles.confirmModalButtonRow}>
              <Pressable
                onPress={() => setClearRecentSearchesModalVisible(false)}
                style={[styles.confirmModalButton, styles.confirmModalButtonSecondary]}
              >
                <Text style={styles.confirmModalButtonSecondaryLabel}>취소</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setClearRecentSearchesModalVisible(false);
                  updateDraftState(current => ({ ...current, recentSearches: [] }));
                }}
                style={[styles.confirmModalButton, styles.confirmModalButtonPrimary]}
              >
                <Text style={styles.confirmModalButtonPrimaryLabel}>전체 삭제</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setPendingExternalAction(null)}
        statusBarTranslucent
        transparent
        visible={pendingExternalAction !== null}
      >
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setPendingExternalAction(null)} style={styles.modalOverlay} />
          <View style={styles.confirmModalCard}>
            <Text style={styles.confirmModalTitle}>{pendingExternalAction?.actionLabel}를 진행할까요?</Text>
            <Text style={styles.confirmModalBody}>
              {pendingExternalAction?.url}
            </Text>
            <View style={styles.confirmModalButtonRow}>
              <Pressable
                onPress={() => setPendingExternalAction(null)}
                style={[styles.confirmModalButton, styles.confirmModalButtonSecondary]}
              >
                <Text style={styles.confirmModalButtonSecondaryLabel}>다음에 할게요</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const nextUrl = pendingExternalAction?.url;
                  setPendingExternalAction(null);

                  if (!nextUrl) {
                    return;
                  }

                  Linking.openURL(nextUrl).catch(() => {
                    setToastMessage('현재 기기에서 해당 링크를 열지 못했어요.');
                  });
                }}
                style={[styles.confirmModalButton, styles.confirmModalButtonPrimary]}
              >
                <Text style={styles.confirmModalButtonPrimaryLabel}>네 이동할게요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {toastMessage ? (
        <View style={[styles.toast, { bottom: Math.max(insets.bottom, 12) + 24 }]}>
          <Text style={styles.toastLabel}>{toastMessage}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    alignItems: 'center',
    backgroundColor: '#F6F4F1',
    flex: 1,
    justifyContent: 'center',
  },
  loadingLabel: {
    color: '#7A6D66',
    fontSize: 15,
    fontWeight: '700',
  },
  root: {
    backgroundColor: '#F6F4F1',
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    shadowColor: '#AD8A69',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
  },
  headerBackButton: {
    alignItems: 'center',
    height: 31,
    justifyContent: 'center',
    width: 31,
  },
  headerBackButtonLabel: {
    color: '#BCBBB7',
    fontSize: 28,
    lineHeight: 31,
  },
  headerTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
  },
  headerActionButton: {
    alignItems: 'flex-end',
    height: 31,
    justifyContent: 'center',
    minWidth: 72,
  },
  headerActionButtonLabel: {
    color: '#FD7E14',
    fontSize: 13,
    fontWeight: '800',
  },
  headerPlaceholder: {
    width: 72,
  },
  optionsContent: {
    gap: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  optionSection: {
    gap: 16,
  },
  optionSectionTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
  },
  optionRadioGroup: {
    gap: 14,
  },
  optionRadioRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: 10,
  },
  optionRadioLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  optionRadioEmoji: {
    fontSize: 20,
  },
  optionRadioLabel: {
    color: '#352622',
    fontSize: 14,
    lineHeight: 21,
  },
  optionRadioLabelActive: {
    color: '#FD7E14',
    fontWeight: '700',
  },
  optionRadioCircle: {
    alignItems: 'center',
    borderColor: '#D9D4CF',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  optionRadioCircleActive: {
    borderColor: '#FFA94E',
  },
  optionRadioCircleInner: {
    backgroundColor: '#FFA94E',
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  budgetLabel: {
    color: '#352622',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  budgetTrack: {
    alignSelf: 'center',
    backgroundColor: '#E7D7C3',
    borderRadius: 999,
    height: 4,
    justifyContent: 'center',
    marginTop: 8,
    position: 'relative',
  },
  budgetTrackFill: {
    backgroundColor: '#FFA94E',
    borderRadius: 999,
    height: 4,
  },
  budgetHandle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFA94E',
    borderRadius: 12,
    borderWidth: 2,
    height: 20,
    marginLeft: -10,
    position: 'absolute',
    top: -8,
    width: 20,
  },
  optionChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E0DE',
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  optionChipSelected: {
    backgroundColor: '#FFF1DD',
    borderColor: '#FFA94E',
  },
  optionChipLabel: {
    color: '#352622',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  optionChipLabelSelected: {
    color: '#FD7E14',
  },
  primaryFooter: {
    left: 20,
    position: 'absolute',
    right: 20,
    zIndex: 4,
  },
  primaryFooterButton: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
  },
  primaryFooterButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  mapContent: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  afterFarewellBanner: {
    backgroundColor: '#FFF3E2',
    borderRadius: 18,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  afterFarewellBannerTitle: {
    color: '#7C5418',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  afterFarewellBannerBody: {
    color: '#8F7764',
    fontSize: 12,
    lineHeight: 18,
  },
  mapControlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchLauncher: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E0D7',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  searchLauncherPlaceholder: {
    color: '#BCBBB7',
    fontSize: 14,
  },
  filterChipRow: {
    gap: 8,
    paddingRight: 12,
  },
  filterChipRowStatic: {
    flexDirection: 'row',
  },
  filterSummaryChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E0DE',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  filterSummaryChipActive: {
    backgroundColor: '#FFF1DD',
    borderColor: '#FFA94E',
  },
  filterSummaryChipLabel: {
    color: '#6A5951',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSummaryChipLabelActive: {
    color: '#FD7E14',
  },
  mapPanel: {
    backgroundColor: '#F0ECE6',
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  mapViewSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  mapStatusNote: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 12,
  },
  mapStatusNoteLabel: {
    color: '#7A6D66',
    fontSize: 12,
    lineHeight: 17,
  },
  mapFilterMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  mapFilterMenuCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8DED4',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    position: 'absolute',
    shadowColor: '#8C6E56',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    top: 14,
    zIndex: 6,
  },
  mapSortMenuCard: {
    left: 18,
    width: 126,
  },
  mapOptionsMenuCard: {
    left: 112,
    width: 140,
  },
  mapBudgetMenuCard: {
    left: 18,
    paddingHorizontal: 18,
    paddingTop: 20,
    right: 18,
  },
  mapMenuListButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  mapMenuListCheck: {
    color: '#FD7E14',
    fontSize: 14,
    fontWeight: '800',
    width: 18,
  },
  mapMenuListLabel: {
    color: '#4F433D',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  mapMenuListLabelActive: {
    color: '#FD7E14',
  },
  mapMenuOptionEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  mapBudgetMenuLabel: {
    color: '#5A4031',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  mapBudgetTrack: {
    marginTop: 16,
  },
  mapBudgetButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingBottom: 6,
  },
  mapBudgetApplyButton: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 14,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  mapBudgetApplyButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  mapBudgetCloseButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFA94E',
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  mapBudgetCloseButtonLabel: {
    color: '#FD7E14',
    fontSize: 16,
    fontWeight: '800',
  },
  mapBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    left: 0,
    position: 'absolute',
    right: 0,
    shadowColor: '#000000',
    shadowOffset: { height: -6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  mapBottomSheetHandleArea: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 10,
  },
  mapBottomSheetHandle: {
    backgroundColor: '#DDD7D1',
    borderRadius: 999,
    height: 4,
    width: 56,
  },
  mapBottomSheetHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  mapBottomSheetTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
  },
  mapBottomSheetSubtitle: {
    color: '#8E7E76',
    fontSize: 12,
    marginTop: 4,
  },
  mapBottomSheetSaveButton: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 16,
  },
  mapBottomSheetSaveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  mapBottomSheetContent: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  companyCard: {
    backgroundColor: '#FFFDFC',
    borderColor: '#EEE7E0',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  companyCardBlocked: {
    opacity: 0.72,
  },
  companyCardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  companyCardTitleBlock: {
    flex: 1,
    gap: 6,
  },
  companyCardTitle: {
    color: '#352622',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  companyCardAddress: {
    color: '#85756D',
    fontSize: 12,
    lineHeight: 18,
  },
  companyActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  companyActionPill: {
    alignItems: 'center',
    backgroundColor: '#F5F2EF',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 52,
    paddingHorizontal: 12,
  },
  companyActionPillSaved: {
    backgroundColor: '#FFF1DD',
  },
  companyActionPillBlocked: {
    backgroundColor: '#EEE7E0',
  },
  companyActionPillLabel: {
    color: '#84746C',
    fontSize: 11,
    fontWeight: '800',
  },
  companyActionPillLabelSaved: {
    color: '#FD7E14',
  },
  companyActionPillLabelBlocked: {
    color: '#61514A',
  },
  companyReadOnlyPill: {
    alignItems: 'center',
    backgroundColor: '#FFF1DD',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 12,
  },
  companyReadOnlyPillLabel: {
    color: '#FD7E14',
    fontSize: 11,
    fontWeight: '800',
  },
  companyMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyMetaChip: {
    alignItems: 'center',
    backgroundColor: '#F6F2EE',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 26,
    paddingHorizontal: 10,
  },
  companyMetaChipLabel: {
    color: '#6F6059',
    fontSize: 11,
    fontWeight: '700',
  },
  companyBlockedBanner: {
    backgroundColor: '#F1EBE5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  companyBlockedBannerLabel: {
    color: '#6A5951',
    fontSize: 12,
    fontWeight: '700',
  },
  searchScreenContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  searchInputWrap: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6DFD8',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: '#352622',
    flex: 1,
    fontSize: 14,
    paddingVertical: 14,
  },
  searchInputClearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  searchInputClearButtonLabel: {
    color: '#BCBBB7',
    fontSize: 24,
    lineHeight: 28,
  },
  searchContent: {
    gap: 16,
    paddingTop: 20,
  },
  searchSectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchSectionTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
  },
  clearAllSearchesLabel: {
    color: '#BC7A2B',
    fontSize: 12,
    fontWeight: '700',
  },
  searchResultRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE7E0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchResultTextBlock: {
    flex: 1,
    gap: 4,
  },
  searchResultTitle: {
    color: '#352622',
    fontSize: 15,
    fontWeight: '800',
  },
  searchResultSubtitle: {
    color: '#89786F',
    fontSize: 12,
    lineHeight: 17,
  },
  searchResultDistance: {
    color: '#FD7E14',
    fontSize: 12,
    fontWeight: '800',
  },
  recentSearchRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE7E0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingLeft: 16,
    paddingRight: 10,
  },
  recentSearchKeywordButton: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  recentSearchKeyword: {
    color: '#352622',
    fontSize: 14,
    fontWeight: '700',
  },
  recentSearchRemoveButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  recentSearchRemoveButtonLabel: {
    color: '#BCBBB7',
    fontSize: 22,
    lineHeight: 26,
  },
  savedBlockedScreenContent: {
    flex: 1,
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  savedBlockedTabRow: {
    backgroundColor: '#EEE7E0',
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  savedBlockedTabButton: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  savedBlockedTabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  savedBlockedTabButtonLabel: {
    color: '#918077',
    fontSize: 13,
    fontWeight: '700',
  },
  savedBlockedTabButtonLabelActive: {
    color: '#FD7E14',
    fontWeight: '800',
  },
  savedBlockedList: {
    gap: 12,
  },
  savedBlockedRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE7E0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  savedBlockedRowMain: {
    flex: 1,
    gap: 4,
  },
  savedBlockedRowTitle: {
    color: '#352622',
    fontSize: 15,
    fontWeight: '800',
  },
  savedBlockedRowSubtitle: {
    color: '#8D7D74',
    fontSize: 12,
    lineHeight: 17,
  },
  savedBlockedRemoveButton: {
    alignItems: 'center',
    backgroundColor: '#F5F2EF',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 52,
    paddingHorizontal: 12,
  },
  savedBlockedRemoveButtonLabel: {
    color: '#8C796E',
    fontSize: 12,
    fontWeight: '800',
  },
  detailContent: {
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailImageRow: {
    gap: 12,
    paddingRight: 20,
  },
  detailImageCard: {
    alignItems: 'center',
    borderRadius: 22,
    gap: 8,
    height: 172,
    justifyContent: 'center',
    width: 220,
  },
  detailImageEmoji: {
    fontSize: 36,
  },
  detailImageLabel: {
    color: '#352622',
    fontSize: 14,
    fontWeight: '800',
  },
  detailHeroCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE7E0',
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  detailTitle: {
    color: '#352622',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  detailDescription: {
    color: '#7D6E66',
    fontSize: 13,
    lineHeight: 20,
  },
  detailMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailMetaChip: {
    alignItems: 'center',
    backgroundColor: '#FFF3E2',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 12,
  },
  detailMetaChipLabel: {
    color: '#BC7A2B',
    fontSize: 12,
    fontWeight: '800',
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE7E0',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  detailSectionTitle: {
    color: '#352622',
    fontSize: 16,
    fontWeight: '800',
  },
  detailSectionBody: {
    color: '#7C6D65',
    fontSize: 13,
    lineHeight: 20,
  },
  detailActionRow: {
    alignItems: 'center',
    borderColor: '#F0EBE5',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingTop: 12,
  },
  detailActionLabel: {
    color: '#352622',
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    paddingRight: 12,
  },
  detailActionChevron: {
    color: '#FD7E14',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyReviewCard: {
    backgroundColor: '#F8F3EE',
    borderRadius: 14,
    gap: 4,
    padding: 14,
  },
  emptyReviewTitle: {
    color: '#352622',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyReviewBody: {
    color: '#7F6F67',
    fontSize: 12,
    lineHeight: 18,
  },
  reviewCardRow: {
    gap: 12,
    paddingRight: 16,
  },
  reviewCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    gap: 8,
    minHeight: 140,
    padding: 16,
    width: 240,
  },
  reviewCardRating: {
    color: '#FD7E14',
    fontSize: 14,
    fontWeight: '800',
  },
  reviewCardBody: {
    color: '#453531',
    fontSize: 13,
    lineHeight: 20,
  },
  reviewCardMeta: {
    color: '#89796F',
    fontSize: 11,
  },
  detailPrimaryActions: {
    gap: 10,
  },
  detailPrimaryActionButton: {
    alignItems: 'center',
    backgroundColor: '#FFA94E',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
  },
  detailPrimaryActionButtonActive: {
    backgroundColor: '#FFF1DD',
    borderColor: '#FFA94E',
    borderWidth: 1,
  },
  detailPrimaryActionButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  detailPrimaryActionButtonLabelActive: {
    color: '#FD7E14',
  },
  detailSecondaryActionButton: {
    alignItems: 'center',
    backgroundColor: '#EEE7E0',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
  },
  detailSecondaryActionButtonBlocked: {
    backgroundColor: '#D9D0C8',
  },
  detailSecondaryActionButtonLabel: {
    color: '#6D5B52',
    fontSize: 14,
    fontWeight: '800',
  },
  detailSecondaryActionButtonLabelBlocked: {
    color: '#4A3D38',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE7E0',
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  emptyStateTitle: {
    color: '#352622',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  emptyStateBody: {
    color: '#84756D',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    bottom: 0,
    left: 0,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    shadowColor: '#AD8A69',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  bottomNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomNavItem: {
    alignItems: 'center',
    gap: 4,
    minHeight: 48,
    width: 54,
  },
  bottomNavIconFrame: {
    alignItems: 'center',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
    width: 28,
  },
  bottomNavIconFrameActive: {
    backgroundColor: '#FFF1DD',
  },
  bottomNavActiveEmoji: {
    color: '#FD7E14',
    fontSize: 26,
    lineHeight: 12,
    position: 'absolute',
    top: -2,
  },
  bottomNavImageWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  bottomNavIconImage: {
    height: 22,
    width: 22,
  },
  bottomNavIconImageActive: {
    tintColor: '#FD7E14',
  },
  bottomNavIconImageInactive: {
    tintColor: '#CECDCB',
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  confirmModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 10,
    padding: 20,
    width: 320,
  },
  confirmModalTitle: {
    color: '#352622',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
  },
  confirmModalBody: {
    color: '#7A6D66',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  confirmModalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  confirmModalButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  confirmModalButtonPrimary: {
    backgroundColor: '#FFA94E',
  },
  confirmModalButtonSecondary: {
    backgroundColor: '#F3EFEB',
  },
  confirmModalButtonPrimaryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmModalButtonSecondaryLabel: {
    color: '#6C5B52',
    fontSize: 14,
    fontWeight: '800',
  },
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(53, 38, 34, 0.92)',
    borderRadius: 999,
    left: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'absolute',
    right: 24,
  },
  toastLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
