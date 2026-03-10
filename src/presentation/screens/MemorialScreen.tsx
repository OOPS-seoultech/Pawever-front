import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PetSummary } from '../../core/entities/pet';
import { openAppSettings, requestNotificationPermission } from '../../infrastructure/native/permissions';
import { readStoredBeforeFarewellHomeSnapshot } from '../../infrastructure/storage/beforeFarewellHomeStorage';
import {
  readStoredMemorialState,
  writeStoredMemorialState,
} from '../../infrastructure/storage/memorialStorage';
import {
  type MemorialComment,
  type MemorialConstellationPattern,
  type MemorialProfile,
  memorialConstellationPatterns,
  mockMemorialCommentsByPetId,
  mockMemorialProfiles,
} from '../../shared/data/memorialData';
import { resolvePetEmojiAssetUri } from '../../shared/assets/petEmojiAssets';
import { AppBottomNavigation } from '../components/AppBottomNavigation';
import { useAppSessionStore } from '../stores/AppSessionStore';

const memorialSkyBackgroundUri = 'https://www.figma.com/api/mcp/asset/e878bdf1-06db-4e18-94e6-bcf8ed6f1599';
const featuredStarAssetUri = 'https://www.figma.com/api/mcp/asset/75bc9c54-63b1-44e6-87de-315cf4099879';
const backgroundHaloAssetUri = 'https://www.figma.com/api/mcp/asset/54260a44-f1a2-4f54-b386-392d7841a724';
const smallStarAssetUri = 'https://www.figma.com/api/mcp/asset/89f25b75-2ab3-4bae-baf0-1be4d879cf5d';
const tinyStarAssetUri = 'https://www.figma.com/api/mcp/asset/afb050a9-39fb-44ec-8eb3-a163cf6731ae';
const glowStarAssetUri = 'https://www.figma.com/api/mcp/asset/ea842f88-0071-4583-8306-2c93cccb1186';

type DisplayMemorialProfile = MemorialProfile & {
  badgeCount: number;
  effectiveProfileImageUri: string;
  isCurrentPet: boolean;
};

type MemorialConstellationPage = {
  featuredProfile: DisplayMemorialProfile;
  id: string;
  orbitProfiles: DisplayMemorialProfile[];
  pattern: MemorialConstellationPattern;
};

type ProfileActionTarget = {
  profile: DisplayMemorialProfile;
};

const guideSteps = [
  {
    body: '떠나간 아이들을 별로 기억하고 서로의 마음을 조용히 나눌 수 있어요.',
    title: '별자리 추모관에서는',
  },
  {
    body: '별을 눌러 추모관을 열고 댓글을 남기거나, 다른 추모관을 방문하고 신고할 수 있어요.',
    title: '이렇게 이용해보세요',
  },
] as const;

const reportReasonOptions = [
  '욕설 또는 비방',
  '스팸 또는 도배',
  '부적절한 표현',
  '기타',
] as const;

const cloudPositions = [
  { leftRatio: 0.16, size: 14, topRatio: 0.08 },
  { leftRatio: 0.85, size: 18, topRatio: 0.18 },
  { leftRatio: 0.71, size: 12, topRatio: 0.49 },
];

const decorativeTwinkles = [
  { assetUri: smallStarAssetUri, leftRatio: 0.18, size: 18, topRatio: 0.42 },
  { assetUri: glowStarAssetUri, leftRatio: 0.47, size: 14, topRatio: 0.33 },
  { assetUri: tinyStarAssetUri, leftRatio: 0.11, size: 12, topRatio: 0.12 },
  { assetUri: tinyStarAssetUri, leftRatio: 0.84, size: 12, topRatio: 0.64 },
];

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

const formatCommentTimestamp = (dateString: string) => {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return '방금 전';
  }

  return `${parsedDate.getMonth() + 1}.${parsedDate.getDate()} ${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;
};

const dedupeProfiles = (profiles: DisplayMemorialProfile[]) => {
  const seenIds = new Set<number>();

  return profiles.filter(profile => {
    if (seenIds.has(profile.id)) {
      return false;
    }

    seenIds.add(profile.id);
    return true;
  });
};

const buildConstellationPages = (profiles: DisplayMemorialProfile[]) => {
  if (profiles.length === 0) {
    return [] as MemorialConstellationPage[];
  }

  const pages: MemorialConstellationPage[] = [];

  for (let index = 0; index < profiles.length; index += 5) {
    const pageProfiles = profiles.slice(index, index + 5);
    const featuredProfile = pageProfiles[0] ?? profiles[0];
    const orbitProfiles = pageProfiles.slice(1);

    pages.push({
      featuredProfile,
      id: `constellation-${index}`,
      orbitProfiles,
      pattern: memorialConstellationPatterns[(pages.length) % memorialConstellationPatterns.length],
    });
  }

  if (pages.length === 1) {
    pages.push({
      ...pages[0],
      id: `${pages[0].id}-clone`,
      pattern: memorialConstellationPatterns[1],
    });
  }

  return pages;
};

const buildCurrentPetSeedComments = (
  selectedPet: PetSummary | null,
  ownerDisplayName: string,
): MemorialComment[] => {
  if (!selectedPet || selectedPet.lifecycleStatus !== 'AFTER_FAREWELL' || selectedPet.emergencyMode) {
    return [];
  }

  return [
    {
      authorDisplayName: ownerDisplayName,
      authorId: `pet-owner:${selectedPet.id}`,
      authorPetId: selectedPet.id,
      authorPetName: selectedPet.name,
      authorRole: 'OWNER',
      createdAt: new Date().toISOString(),
      id: `seed-${selectedPet.id}`,
      text: `${selectedPet.name}를 기억하는 마음이 이곳에서 오래 반짝이길 바라요`,
    },
  ];
};

const buildCurrentPetProfile = (
  selectedPet: PetSummary | null,
  guardianName: string | null,
  storedFarewellDate: string | null,
  storedProfileImageUri: string | null,
): DisplayMemorialProfile | null => {
  if (!selectedPet) {
    return null;
  }

  return {
    animalTypeName: selectedPet.animalTypeName,
    badgeCount: 0,
    effectiveProfileImageUri: storedProfileImageUri ?? selectedPet.profileImageUrl ?? resolvePetEmojiAssetUri(selectedPet.animalTypeName),
    farewellDate: storedFarewellDate,
    id: selectedPet.id,
    inviteCode: selectedPet.inviteCode,
    isCurrentPet: true,
    lifecycleStatus: selectedPet.lifecycleStatus,
    memorialExists: selectedPet.lifecycleStatus === 'AFTER_FAREWELL' && !selectedPet.emergencyMode,
    name: selectedPet.name,
    ownerDisplayName: guardianName?.trim() || '보호자',
    profileImageUrl: storedProfileImageUri ?? selectedPet.profileImageUrl,
  };
};

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

export function MemorialScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    closePreview,
    profile,
    selectedPet,
    session,
  } = useAppSessionStore();

  const [commentsByPetId, setCommentsByPetId] = useState<Record<string, MemorialComment[]>>({});
  const [detailModalStack, setDetailModalStack] = useState<number[]>([]);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [isGuideVisible, setGuideVisible] = useState(false);
  const [isInfoEditModalVisible, setInfoEditModalVisible] = useState(false);
  const [isNotificationPromptVisible, setNotificationPromptVisible] = useState(false);
  const [notificationCountByPetId, setNotificationCountByPetId] = useState<Record<string, number>>({});
  const [pendingDeleteComment, setPendingDeleteComment] = useState<MemorialComment | null>(null);
  const [pendingProfileAction, setPendingProfileAction] = useState<ProfileActionTarget | null>(null);
  const [reportText, setReportText] = useState('');
  const [selectedReportReasons, setSelectedReportReasons] = useState<string[]>([]);
  const [storedGuardianName, setStoredGuardianName] = useState<string | null>(null);
  const [storedPetFarewellDate, setStoredPetFarewellDate] = useState<string | null>(null);
  const [storedPetProfileImageUri, setStoredPetProfileImageUri] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleConstellationIndex, setVisibleConstellationIndex] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');
  const [submissionTimestamps, setSubmissionTimestamps] = useState<number[]>([]);

  const constellationListRef = useRef<FlatList<MemorialConstellationPage>>(null);

  const currentUserKey = session ? `user:${session.userId}` : 'guest:local';
  const currentPetProfile = buildCurrentPetProfile(
    selectedPet,
    storedGuardianName ?? profile?.nickname ?? profile?.name ?? null,
    storedPetFarewellDate,
    storedPetProfileImageUri,
  );

  const mergedProfiles = dedupeProfiles([
    ...(currentPetProfile ? [currentPetProfile] : []),
    ...mockMemorialProfiles.map(mockProfile => ({
      ...mockProfile,
      badgeCount: 0,
      effectiveProfileImageUri: mockProfile.profileImageUrl ?? resolvePetEmojiAssetUri(mockProfile.animalTypeName),
      isCurrentPet: false,
    })),
  ]);

  const memorialProfiles = mergedProfiles
    .map(profileItem => ({
      ...profileItem,
      badgeCount: notificationCountByPetId[String(profileItem.id)] ?? 0,
    }))
    .filter(profileItem => profileItem.memorialExists)
    .sort((left, right) => calculateDaysSinceDate(left.farewellDate) - calculateDaysSinceDate(right.farewellDate));

  const constellationPages = buildConstellationPages(memorialProfiles);
  const repeatedConstellationPages = constellationPages.length > 0
    ? [0, 1, 2].flatMap(repeatIndex => (
      constellationPages.map((page, pageIndex) => ({
        ...page,
        id: `${page.id}-repeat-${repeatIndex}-${pageIndex}`,
      }))
    ))
    : [];
  const constellationBaseIndex = constellationPages.length;
  const activeMemorialPetId = detailModalStack[detailModalStack.length - 1] ?? null;
  const activeMemorialProfile = mergedProfiles.find(profileItem => profileItem.id === activeMemorialPetId) ?? null;
  const activeMemorialComments = activeMemorialProfile
    ? commentsByPetId[String(activeMemorialProfile.id)] ?? []
    : [];
  const currentPetNotificationCount = currentPetProfile
    ? notificationCountByPetId[String(currentPetProfile.id)] ?? 0
    : 0;
  const isAfterFarewellSelectedPet = selectedPet?.lifecycleStatus === 'AFTER_FAREWELL' && !selectedPet?.emergencyMode;
  const currentPetDaysAfterFarewell = calculateDaysSinceDate(currentPetProfile?.farewellDate);

  useEffect(() => {
    let isMounted = true;

    const hydrateMemorialState = async () => {
      const [snapshot, memorialState] = await Promise.all([
        readStoredBeforeFarewellHomeSnapshot(),
        readStoredMemorialState(),
      ]);

      if (!isMounted) {
        return;
      }

      const guardianName = snapshot.guardianName?.trim()
        || profile?.nickname?.trim()
        || profile?.name?.trim()
        || '보호자';
      const seedCommentsByPetId: Record<string, MemorialComment[]> = {
        ...Object.entries(mockMemorialCommentsByPetId).reduce<Record<string, MemorialComment[]>>((accumulator, [petId, comments]) => {
          accumulator[petId] = comments;
          return accumulator;
        }, {}),
      };

      if (selectedPet) {
        const currentSeedComments = buildCurrentPetSeedComments(selectedPet, guardianName);

        if (currentSeedComments.length > 0 && !memorialState.commentsByPetId[String(selectedPet.id)]) {
          seedCommentsByPetId[String(selectedPet.id)] = currentSeedComments;
        }
      }

      const nextNotificationCounts = {
        ...memorialState.notificationCountByPetId,
      };

      if (selectedPet?.lifecycleStatus === 'AFTER_FAREWELL' && !selectedPet?.emergencyMode && nextNotificationCounts[String(selectedPet.id)] === undefined) {
        nextNotificationCounts[String(selectedPet.id)] = 3;
      }

      setCommentsByPetId({
        ...seedCommentsByPetId,
        ...memorialState.commentsByPetId,
      });
      setGuideVisible(!memorialState.hasCompletedGuide);
      setGuideStepIndex(0);
      setNotificationCountByPetId(nextNotificationCounts);
      setStoredGuardianName(snapshot.guardianName);
      setStoredPetFarewellDate(snapshot.petFarewellDate);
      setStoredPetProfileImageUri(snapshot.petProfileImageUri);
    };

    hydrateMemorialState();

    return () => {
      isMounted = false;
    };
  }, [profile?.name, profile?.nickname, selectedPet]);

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
    setCommentDraft('');
    setDetailModalStack([]);
    setPendingDeleteComment(null);
    setPendingProfileAction(null);
    setReportText('');
    setSelectedReportReasons([]);
  }, [selectedPet?.id]);

  useEffect(() => {
    if (constellationPages.length === 0) {
      return;
    }

    setVisibleConstellationIndex(0);

    requestAnimationFrame(() => {
      constellationListRef.current?.scrollToOffset({
        animated: false,
        offset: width * constellationBaseIndex,
      });
    });
  }, [constellationBaseIndex, constellationPages.length, width]);

  const persistMemorialState = async ({
    nextCommentsByPetId,
    nextGuideCompleted,
    nextNotificationCounts,
  }: {
    nextCommentsByPetId?: Record<string, MemorialComment[]>;
    nextGuideCompleted?: boolean;
    nextNotificationCounts?: Record<string, number>;
  }) => {
    await writeStoredMemorialState({
      commentsByPetId: nextCommentsByPetId,
      hasCompletedGuide: nextGuideCompleted,
      notificationCountByPetId: nextNotificationCounts,
    });
  };

  const handleOpenGuide = () => {
    setGuideStepIndex(0);
    setGuideVisible(true);
  };

  const handleCloseGuideWithX = () => {
    setGuideVisible(false);
  };

  const handleAdvanceGuide = () => {
    if (guideStepIndex < guideSteps.length - 1) {
      setGuideStepIndex(currentIndex => currentIndex + 1);
      return;
    }

    setNotificationPromptVisible(true);
  };

  const completeGuide = async () => {
    await persistMemorialState({ nextGuideCompleted: true });
    setGuideVisible(false);
    setNotificationPromptVisible(false);
  };

  const handleAcceptNotifications = async () => {
    const permissionResult = await requestNotificationPermission();

    if (!permissionResult.granted && permissionResult.blocked) {
      showBlockedPermissionAlert(
        '알림 권한이 필요해요',
        '새 댓글과 새로운 추모 소식을 받으려면 설정에서 알림 권한을 허용해 주세요.',
      );
    }

    await completeGuide();
  };

  const handleSkipNotifications = () => {
    completeGuide().catch(() => undefined);
  };

  const openMemorialDetail = (profileItem: DisplayMemorialProfile) => {
    if (!profileItem.memorialExists) {
      setToastMessage('해당 반려동물의 추모관이 존재하지 않습니다');
      return;
    }

    setDetailModalStack(currentStack => [...currentStack, profileItem.id]);

    if (profileItem.isCurrentPet) {
      const nextNotificationCounts = {
        ...notificationCountByPetId,
        [String(profileItem.id)]: 0,
      };

      setNotificationCountByPetId(nextNotificationCounts);
      persistMemorialState({ nextNotificationCounts }).catch(() => undefined);
    }
  };

  const handleOpenCurrentPetMemorial = () => {
    if (!currentPetProfile) {
      return;
    }

    openMemorialDetail(currentPetProfile);
  };

  const handleConstellationMomentumEnd = (offsetX: number) => {
    if (constellationPages.length === 0) {
      return;
    }

    const rawIndex = Math.round(offsetX / width);
    const logicalIndex = ((rawIndex % constellationPages.length) + constellationPages.length) % constellationPages.length;

    setVisibleConstellationIndex(logicalIndex);

    if (rawIndex < constellationBaseIndex || rawIndex >= constellationBaseIndex * 2) {
      requestAnimationFrame(() => {
        constellationListRef.current?.scrollToOffset({
          animated: false,
          offset: width * (constellationBaseIndex + logicalIndex),
        });
      });
    }
  };

  const handleCloseTopMemorial = () => {
    setDetailModalStack(currentStack => currentStack.slice(0, -1));
    setCommentDraft('');
  };

  const handleRefreshMemorial = () => {
    setToastMessage('별자리를 새로 불러왔어요');
  };

  const handleSubmitComment = () => {
    if (!activeMemorialProfile) {
      return;
    }

    const trimmedComment = commentDraft.trim();

    if (!trimmedComment) {
      return;
    }

    const now = Date.now();
    const recentTimestamps = submissionTimestamps.filter(timestamp => now - timestamp < 60_000);

    if (recentTimestamps.length >= 8) {
      setToastMessage('악의적 도배 방지를 위해 채팅은 1분당 최대 8번까지 가능해요');
      return;
    }

    const nextComment: MemorialComment = {
      authorDisplayName: profile?.nickname?.trim() || profile?.name?.trim() || '나',
      authorId: currentUserKey,
      authorPetId: selectedPet?.id ?? -1,
      authorPetName: selectedPet?.name ?? '우리 아이',
      authorRole: activeMemorialProfile.id === selectedPet?.id && selectedPet?.isOwner ? 'OWNER' : 'GUEST',
      createdAt: new Date(now).toISOString(),
      id: `comment-${activeMemorialProfile.id}-${now}`,
      text: trimmedComment,
    };

    const nextCommentsByPetId = {
      ...commentsByPetId,
      [String(activeMemorialProfile.id)]: [
        ...(commentsByPetId[String(activeMemorialProfile.id)] ?? []),
        nextComment,
      ],
    };

    setCommentsByPetId(nextCommentsByPetId);
    setCommentDraft('');
    setSubmissionTimestamps([...recentTimestamps, now]);
    persistMemorialState({ nextCommentsByPetId }).catch(() => undefined);
  };

  const handleDeleteComment = () => {
    if (!activeMemorialProfile || !pendingDeleteComment) {
      return;
    }

    const nextCommentsByPetId = {
      ...commentsByPetId,
      [String(activeMemorialProfile.id)]: (commentsByPetId[String(activeMemorialProfile.id)] ?? [])
        .filter(comment => comment.id !== pendingDeleteComment.id),
    };

    setCommentsByPetId(nextCommentsByPetId);
    setPendingDeleteComment(null);
    setToastMessage('작성하신 댓글이 삭제되었습니다.');
    persistMemorialState({ nextCommentsByPetId }).catch(() => undefined);
  };

  const handleOpenProfileAction = (profileItem: DisplayMemorialProfile) => {
    setPendingProfileAction({ profile: profileItem });
  };

  const handleVisitProfileMemorial = () => {
    if (!pendingProfileAction) {
      return;
    }

    const nextProfile = mergedProfiles.find(profileItem => profileItem.id === pendingProfileAction.profile.id);

    if (!nextProfile?.memorialExists) {
      setToastMessage('해당 반려동물의 추모관이 존재하지 않습니다');
      setPendingProfileAction(null);
      return;
    }

    setPendingProfileAction(null);
    openMemorialDetail(nextProfile);
  };

  const handleToggleReportReason = (reason: string) => {
    setSelectedReportReasons(currentReasons => (
      currentReasons.includes(reason)
        ? currentReasons.filter(currentReason => currentReason !== reason)
        : [...currentReasons, reason]
    ));
  };

  const handleSubmitReport = () => {
    setPendingProfileAction(null);
    setSelectedReportReasons([]);
    setReportText('');
    setToastMessage('신고가 정상적으로 접수되었어요');
  };

  const renderConstellationPage = ({ item }: { item: MemorialConstellationPage }) => {
    const skyHeight = 500;

    return (
      <View style={[styles.constellationPage, { width }]}>
        <View style={[styles.skyCanvas, { height: skyHeight }]}>
          {decorativeTwinkles.map((twinkle, index) => (
            <Image
              key={`${item.id}-twinkle-${index}`}
              resizeMode="contain"
              source={{ uri: twinkle.assetUri }}
              style={{
                height: twinkle.size,
                left: width * twinkle.leftRatio,
                position: 'absolute',
                top: skyHeight * twinkle.topRatio,
                width: twinkle.size,
              }}
            />
          ))}

          {cloudPositions.map((cloud, index) => (
            <View
              key={`${item.id}-cloud-${index}`}
              style={[
                styles.cloudGlow,
                {
                  height: cloud.size * 4.8,
                  left: width * cloud.leftRatio,
                  top: skyHeight * cloud.topRatio,
                  width: cloud.size * 6.2,
                },
              ]}
            />
          ))}

          {item.pattern.orbitStars.map((position, index) => {
            const orbitProfile = item.orbitProfiles[index];

            if (!orbitProfile) {
              return null;
            }

            return (
              <Pressable
                key={`${item.id}-${orbitProfile.id}`}
                onPress={() => openMemorialDetail(orbitProfile)}
                style={[
                  styles.orbitStarButton,
                  {
                    left: width * position.leftRatio - (position.size / 2),
                    top: skyHeight * position.topRatio,
                  },
                ]}
              >
                <View style={[styles.orbitStarHalo, { height: position.size, width: position.size }]}>
                  <Image
                    resizeMode="contain"
                    source={{ uri: orbitProfile.effectiveProfileImageUri }}
                    style={{ height: position.size * 0.74, opacity: 0.95, width: position.size * 0.74 }}
                  />
                </View>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => openMemorialDetail(item.featuredProfile)}
            style={[
              styles.featuredStarWrap,
              {
                left: width * item.pattern.featured.leftRatio - (item.pattern.featured.size / 2),
                top: skyHeight * item.pattern.featured.topRatio,
              },
            ]}
          >
            <Image
              resizeMode="contain"
              source={{ uri: featuredStarAssetUri }}
              style={{ height: item.pattern.featured.size, width: item.pattern.featured.size }}
            />
            <Text style={styles.featuredStarLabel}>
              {item.featuredProfile.name}의 별
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <ImageBackground source={{ uri: memorialSkyBackgroundUri }} style={styles.background} resizeMode="cover">
        <View style={[styles.overlay, { paddingTop: insets.top + 20 }]}>
          <View style={styles.header}>
            <Pressable hitSlop={12} onPress={closePreview} style={styles.headerIconButton}>
              <Text style={styles.headerBackText}>‹</Text>
            </Pressable>
            <Text style={styles.headerTitle}>별자리 추모관</Text>
            <Pressable hitSlop={12} onPress={handleOpenGuide} style={styles.headerQuestionButton}>
              <Text style={styles.headerQuestionText}>?</Text>
            </Pressable>
          </View>

          {constellationPages.length > 0 ? (
            <>
              <FlatList
                data={repeatedConstellationPages}
                horizontal
                initialNumToRender={3}
                keyExtractor={item => item.id}
                onMomentumScrollEnd={(event) => handleConstellationMomentumEnd(event.nativeEvent.contentOffset.x)}
                pagingEnabled
                ref={constellationListRef}
                renderItem={renderConstellationPage}
                showsHorizontalScrollIndicator={false}
              />
              <View style={styles.pageIndicatorRow}>
                {constellationPages.map((page, index) => (
                  <View
                    key={page.id}
                    style={[
                      styles.pageIndicator,
                      visibleConstellationIndex === index ? styles.pageIndicatorActive : null,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.currentPetSection}>
            <Pressable
              disabled={!currentPetProfile?.memorialExists}
              onPress={handleOpenCurrentPetMemorial}
              style={[styles.currentPetButton, !currentPetProfile?.memorialExists ? styles.currentPetButtonDisabled : null]}
            >
              <Image resizeMode="contain" source={{ uri: backgroundHaloAssetUri }} style={styles.currentPetHalo} />
              {currentPetProfile ? (
                <Image
                  resizeMode="contain"
                  source={{ uri: currentPetProfile.effectiveProfileImageUri }}
                  style={styles.currentPetImage}
                />
              ) : null}
              {currentPetProfile?.memorialExists ? (
                <>
                  <Text style={styles.currentPetBadge}>👑</Text>
                  {currentPetNotificationCount > 0 ? (
                    <View style={styles.currentPetNotificationBadge}>
                      <Text style={styles.currentPetNotificationLabel}>
                        {currentPetNotificationCount > 99 ? '99+' : currentPetNotificationCount}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : null}
            </Pressable>
            <Text style={styles.currentPetLabel}>
              {currentPetProfile?.memorialExists
                ? `${currentPetProfile.name}의 별`
                : '이별 후 우리 아이의 별이 생겨요'}
            </Text>
            {currentPetProfile?.memorialExists ? (
              <Text style={styles.currentPetCaption}>추억한 지 +{currentPetDaysAfterFarewell}일 째</Text>
            ) : (
              <Text style={styles.currentPetCaption}>댓글과 위로 나누기는 계속할 수 있어요</Text>
            )}
          </View>
        </View>
      </ImageBackground>

      <AppBottomNavigation
        activeTabId={isAfterFarewellSelectedPet ? 'memorial' : null}
        showMemorialNotification={currentPetNotificationCount > 0}
      />

      {toastMessage ? (
        <View style={[styles.toast, { bottom: Math.max(insets.bottom, 12) + 92 }]}>
          <Text style={styles.toastLabel}>{toastMessage}</Text>
        </View>
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={handleCloseGuideWithX}
        statusBarTranslucent
        transparent
        visible={isGuideVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.guideCard}>
            <Pressable hitSlop={12} onPress={handleCloseGuideWithX} style={styles.guideCloseButton}>
              <Text style={styles.guideCloseText}>✕</Text>
            </Pressable>
            <Text style={styles.guideEyebrow}>별자리 추모관 안내</Text>
            <Text style={styles.guideTitle}>{guideSteps[guideStepIndex].title}</Text>
            <Text style={styles.guideBody}>{guideSteps[guideStepIndex].body}</Text>
            <View style={styles.guideIndicatorRow}>
              {guideSteps.map((step, index) => (
                <View
                  key={step.title}
                  style={[styles.guideIndicator, guideStepIndex === index ? styles.guideIndicatorActive : null]}
                />
              ))}
            </View>
            <Pressable onPress={handleAdvanceGuide} style={styles.primaryActionButton}>
              <Text style={styles.primaryActionLabel}>
                {guideStepIndex === guideSteps.length - 1 ? '완료' : '다음으로'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={handleSkipNotifications}
        statusBarTranslucent
        transparent
        visible={isNotificationPromptVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationPromptCard}>
            <Text style={styles.notificationPromptTitle}>새 소식을 알림으로 받아보시겠어요?</Text>
            <Text style={styles.notificationPromptBody}>
              새로운 댓글과 위로의 메시지가 도착했을 때 빠르게 확인할 수 있어요.
            </Text>
            <Pressable onPress={() => handleAcceptNotifications().catch(() => undefined)} style={styles.primaryActionButton}>
              <Text style={styles.primaryActionLabel}>알림으로 받아볼게요</Text>
            </Pressable>
            <Pressable onPress={handleSkipNotifications} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionLabel}>허용 안 함</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {activeMemorialProfile ? (
        <View pointerEvents="box-none" style={styles.inlineDetailLayer}>
          <View style={[styles.detailOverlay, { bottom: Math.max(insets.bottom, 12) + 92 }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.detailContainer}
            >
              <ImageBackground source={{ uri: memorialSkyBackgroundUri }} style={styles.detailBackground} resizeMode="cover">
                <View style={styles.detailHeader}>
                  <Pressable hitSlop={12} onPress={handleCloseTopMemorial} style={styles.detailHeaderButton}>
                    <Text style={styles.detailHeaderButtonText}>✕</Text>
                  </Pressable>
                  <Text style={styles.detailHeaderTitle}>{activeMemorialProfile.name}의 추모관</Text>
                  <Pressable hitSlop={12} onPress={handleRefreshMemorial} style={styles.detailHeaderButton}>
                    <Text style={styles.detailHeaderButtonText}>↻</Text>
                  </Pressable>
                </View>

                <View style={styles.detailHero}>
                  <Pressable
                    disabled={!activeMemorialProfile.isCurrentPet}
                    onPress={() => setInfoEditModalVisible(true)}
                    style={styles.detailAvatarWrap}
                  >
                    <Image resizeMode="contain" source={{ uri: backgroundHaloAssetUri }} style={styles.detailAvatarHalo} />
                    <Image source={{ uri: activeMemorialProfile.effectiveProfileImageUri }} style={styles.detailAvatar} />
                    {activeMemorialProfile.isCurrentPet ? <Text style={styles.detailAvatarCrown}>👑</Text> : null}
                    {activeMemorialProfile.isCurrentPet && selectedPet?.isOwner ? (
                      <View style={styles.detailAvatarEditBadge}>
                        <Text style={styles.detailAvatarEditLabel}>✎</Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <Text style={styles.detailHeroTitle}>{activeMemorialProfile.name}</Text>
                  <Text style={styles.detailHeroSubtitle}>
                    {activeMemorialProfile.farewellDate
                      ? `추억한 지 +${calculateDaysSinceDate(activeMemorialProfile.farewellDate)}일 째`
                      : '추모관이 아직 준비되지 않았어요'}
                  </Text>
                </View>

                <ScrollView
                  contentContainerStyle={styles.commentsContent}
                  showsVerticalScrollIndicator={false}
                  style={styles.commentsScroll}
                >
                  {activeMemorialComments.map(comment => {
                    const commentProfile = mergedProfiles.find(profileItem => profileItem.id === comment.authorPetId) ?? null;
                    const isOwnComment = comment.authorId === currentUserKey;
                    const isOwnerComment = comment.authorRole === 'OWNER';

                    return (
                      <View
                        key={comment.id}
                        style={[
                          styles.commentRow,
                          isOwnerComment ? styles.commentRowOwner : styles.commentRowGuest,
                        ]}
                      >
                        <Pressable
                          disabled={!commentProfile}
                          onPress={() => {
                            if (commentProfile) {
                              handleOpenProfileAction(commentProfile);
                            }
                          }}
                          style={styles.commentProfile}
                        >
                          {commentProfile ? (
                            <Image source={{ uri: commentProfile.effectiveProfileImageUri }} style={styles.commentProfileAvatar} />
                          ) : (
                            <View style={styles.commentProfileAvatarPlaceholder} />
                          )}
                        </Pressable>

                        <View style={[styles.commentBubble, isOwnerComment ? styles.commentBubbleOwner : styles.commentBubbleGuest]}>
                          <View style={styles.commentMetaRow}>
                            <Text style={styles.commentAuthorName}>{comment.authorDisplayName}</Text>
                            <Text style={styles.commentTimestamp}>{formatCommentTimestamp(comment.createdAt)}</Text>
                          </View>
                          <Text style={styles.commentText}>{comment.text}</Text>
                          {isOwnComment ? (
                            <Pressable onPress={() => setPendingDeleteComment(comment)} style={styles.commentDeleteButton}>
                              <Text style={styles.commentDeleteLabel}>삭제</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.commentComposer}>
                  <TextInput
                    maxLength={50}
                    onChangeText={setCommentDraft}
                    placeholder="50자 이내로 마음을 남겨보세요"
                    placeholderTextColor="#B5C4E8"
                    style={styles.commentInput}
                    value={commentDraft}
                  />
                  <Pressable
                    disabled={!commentDraft.trim()}
                    onPress={handleSubmitComment}
                    style={[styles.commentSubmitButton, !commentDraft.trim() ? styles.commentSubmitButtonDisabled : null]}
                  >
                    <Text style={styles.commentSubmitLabel}>보내기</Text>
                  </Pressable>
                </View>
              </ImageBackground>
            </KeyboardAvoidingView>
          </View>
        </View>
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setPendingProfileAction(null)}
        statusBarTranslucent
        transparent
        visible={Boolean(pendingProfileAction)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileActionCard}>
            <Text style={styles.profileActionTitle}>{pendingProfileAction?.profile.name ?? '아이'}의 정보</Text>
            <Text style={styles.profileActionBody}>
              추모관을 방문하거나, 부적절한 댓글을 신고할 수 있어요.
            </Text>
            <Pressable onPress={handleVisitProfileMemorial} style={styles.primaryActionButton}>
              <Text style={styles.primaryActionLabel}>추모관 방문하기</Text>
            </Pressable>
            <Pressable onPress={() => setPendingProfileAction(null)} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionLabel}>닫기</Text>
            </Pressable>
            <Text style={styles.textActionLabel}>신고하기</Text>
            <View style={styles.reportReasonList}>
              {reportReasonOptions.map(reason => (
                <Pressable
                  key={reason}
                  onPress={() => handleToggleReportReason(reason)}
                  style={[
                    styles.reportReasonChip,
                    selectedReportReasons.includes(reason) ? styles.reportReasonChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.reportReasonLabel,
                      selectedReportReasons.includes(reason) ? styles.reportReasonLabelActive : null,
                    ]}
                  >
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              maxLength={70}
              multiline
              onChangeText={setReportText}
              placeholder="신고 사유를 직접 적어도 괜찮아요"
              placeholderTextColor="#908980"
              style={styles.reportInput}
              value={reportText}
            />
            <Text style={styles.reportHelperText}>
              {reportText.length >= 70 ? '한 번에 최대 70자까지 입력 가능해요.' : `${reportText.length}/70`}
            </Text>
            <Pressable
              disabled={selectedReportReasons.length === 0 && !reportText.trim()}
              onPress={handleSubmitReport}
              style={[
                styles.primaryActionButton,
                selectedReportReasons.length === 0 && !reportText.trim() ? styles.primaryActionButtonDisabled : null,
              ]}
            >
              <Text style={styles.primaryActionLabel}>신고 접수하기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setPendingDeleteComment(null)}
        statusBarTranslucent
        transparent
        visible={Boolean(pendingDeleteComment)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>댓글을 삭제할까요?</Text>
            <Text style={styles.confirmBody}>삭제한 댓글은 다시 복구할 수 없어요.</Text>
            <Pressable onPress={handleDeleteComment} style={styles.primaryActionButton}>
              <Text style={styles.primaryActionLabel}>댓글 삭제</Text>
            </Pressable>
            <Pressable onPress={() => setPendingDeleteComment(null)} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionLabel}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setInfoEditModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isInfoEditModalVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>정보 수정하기로 이동하시겠어요?</Text>
            <Text style={styles.confirmBody}>현재는 설정의 내 정보 수정하기 페이지가 아직 준비 중이에요.</Text>
            <Pressable onPress={() => setInfoEditModalVisible(false)} style={styles.primaryActionButton}>
              <Text style={styles.primaryActionLabel}>아니요</Text>
            </Pressable>
            <Pressable onPress={() => setInfoEditModalVisible(false)} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionLabel}>이동할게요</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  cloudGlow: {
    backgroundColor: 'rgba(231,239,255,0.16)',
    borderRadius: 999,
    position: 'absolute',
  },
  commentAuthorName: {
    color: '#F9FBFF',
    fontSize: 13,
    fontWeight: '800',
  },
  commentBubble: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentBubbleGuest: {
    backgroundColor: 'rgba(9, 36, 73, 0.82)',
  },
  commentBubbleOwner: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  commentComposer: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 24, 53, 0.88)',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  commentDeleteButton: {
    alignSelf: 'flex-end',
  },
  commentDeleteLabel: {
    color: '#FFE083',
    fontSize: 11,
    fontWeight: '800',
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    color: '#F9FBFF',
    flex: 1,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  commentMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentProfile: {
    marginTop: 8,
  },
  commentProfileAvatar: {
    backgroundColor: '#F4F7FF',
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  commentProfileAvatarPlaceholder: {
    backgroundColor: '#AAB9D5',
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commentRowGuest: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  commentRowOwner: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  commentSubmitButton: {
    alignItems: 'center',
    backgroundColor: '#FFD760',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#7C8AA9',
  },
  commentSubmitLabel: {
    color: '#0B2344',
    fontSize: 14,
    fontWeight: '800',
  },
  commentText: {
    color: '#F9FBFF',
    fontSize: 14,
    lineHeight: 20,
  },
  commentTimestamp: {
    color: '#C7D3EB',
    fontSize: 11,
    fontWeight: '600',
  },
  commentsContent: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentsScroll: {
    flex: 1,
  },
  confirmBody: {
    color: '#6B6158',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  confirmCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 28,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: 312,
  },
  confirmTitle: {
    color: '#2E221C',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
  },
  constellationPage: {
    paddingHorizontal: 20,
  },
  currentPetBadge: {
    fontSize: 28,
    position: 'absolute',
    right: 24,
    top: 8,
  },
  currentPetButton: {
    alignItems: 'center',
    height: 248,
    justifyContent: 'flex-end',
    width: 266,
  },
  currentPetButtonDisabled: {
    opacity: 0.62,
  },
  currentPetCaption: {
    color: '#D6E0F5',
    fontSize: 13,
    lineHeight: 18,
  },
  currentPetHalo: {
    bottom: 28,
    height: 188,
    position: 'absolute',
    width: 264,
  },
  currentPetImage: {
    height: 162,
    marginBottom: 12,
    width: 162,
  },
  currentPetLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 8,
  },
  currentPetNotificationBadge: {
    alignItems: 'center',
    backgroundColor: '#FF6D4D',
    borderColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: 6,
    position: 'absolute',
    right: 18,
    top: 44,
  },
  currentPetNotificationLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  currentPetSection: {
    alignItems: 'center',
    marginTop: -18,
    paddingBottom: 18,
  },
  detailAvatar: {
    backgroundColor: '#F4F8FF',
    borderRadius: 52,
    height: 104,
    width: 104,
  },
  detailAvatarCrown: {
    fontSize: 24,
    left: 6,
    position: 'absolute',
    top: 0,
  },
  detailAvatarEditBadge: {
    alignItems: 'center',
    backgroundColor: '#FFF4D1',
    borderRadius: 14,
    bottom: 4,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    width: 28,
  },
  detailAvatarEditLabel: {
    color: '#7F5515',
    fontSize: 13,
    fontWeight: '800',
  },
  detailAvatarHalo: {
    height: 156,
    position: 'absolute',
    width: 176,
  },
  detailAvatarWrap: {
    alignItems: 'center',
    height: 156,
    justifyContent: 'center',
    marginBottom: 4,
    width: 176,
  },
  detailBackground: {
    borderRadius: 0,
    flex: 1,
    overflow: 'hidden',
  },
  detailContainer: {
    flex: 1,
    paddingTop: 0,
  },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  detailHeaderButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(249,249,249,0.18)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  detailHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  detailHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  detailHero: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 18,
  },
  detailHeroSubtitle: {
    color: '#D7E3FA',
    fontSize: 13,
    lineHeight: 18,
  },
  detailHeroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  detailOverlay: {
    backgroundColor: 'rgba(0,0,0,0.36)',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  featuredStarLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  featuredStarWrap: {
    alignItems: 'center',
    position: 'absolute',
  },
  guideBody: {
    color: '#6F635C',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  guideCard: {
    backgroundColor: '#FFF8EF',
    borderRadius: 32,
    gap: 16,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    width: 322,
  },
  guideCloseButton: {
    alignSelf: 'flex-end',
  },
  guideCloseText: {
    color: '#8E8178',
    fontSize: 18,
    fontWeight: '800',
  },
  guideEyebrow: {
    color: '#F08A15',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  guideIndicator: {
    backgroundColor: '#E9D9CC',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  guideIndicatorActive: {
    backgroundColor: '#F4A147',
    width: 26,
  },
  guideIndicatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  guideTitle: {
    color: '#2D221D',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBackText: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 40,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  headerQuestionButton: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  headerQuestionText: {
    color: '#101010',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  headerTitle: {
    color: '#F9F9F9',
    fontSize: 18,
    fontWeight: '800',
  },
  inlineDetailLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  notificationPromptBody: {
    color: '#6F635C',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  notificationPromptCard: {
    backgroundColor: '#FFF8EF',
    borderRadius: 28,
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 24,
    width: 322,
  },
  notificationPromptTitle: {
    color: '#2E221C',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
  },
  orbitStarButton: {
    position: 'absolute',
  },
  orbitStarHalo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pageIndicator: {
    backgroundColor: 'rgba(249,249,249,0.28)',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  pageIndicatorActive: {
    backgroundColor: '#FFD760',
    width: 22,
  },
  pageIndicatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: -6,
  },
  primaryActionButton: {
    alignItems: 'center',
    backgroundColor: '#F4A147',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  primaryActionButtonDisabled: {
    backgroundColor: '#CDB7A3',
  },
  primaryActionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  profileActionBody: {
    color: '#6E655D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  profileActionCard: {
    backgroundColor: '#FFF8EF',
    borderRadius: 28,
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 22,
    width: 332,
  },
  profileActionTitle: {
    color: '#2F231C',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
    textAlign: 'center',
  },
  reportHelperText: {
    color: '#8D837A',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
  reportInput: {
    backgroundColor: '#FFF2E5',
    borderRadius: 18,
    color: '#3D3129',
    fontSize: 14,
    minHeight: 88,
    paddingHorizontal: 14,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  reportReasonChip: {
    alignItems: 'center',
    backgroundColor: '#F5EBE2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reportReasonChipActive: {
    backgroundColor: '#FFE2BE',
  },
  reportReasonLabel: {
    color: '#7B6E65',
    fontSize: 12,
    fontWeight: '700',
  },
  reportReasonLabelActive: {
    color: '#B85F00',
  },
  reportReasonList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  root: {
    backgroundColor: '#041123',
    flex: 1,
  },
  secondaryActionButton: {
    alignItems: 'center',
    backgroundColor: '#FFF2E5',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryActionLabel: {
    color: '#8A6A3C',
    fontSize: 15,
    fontWeight: '800',
  },
  skyCanvas: {
    overflow: 'hidden',
    position: 'relative',
  },
  textActionLabel: {
    color: '#E36239',
    fontSize: 14,
    fontWeight: '800',
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
});
