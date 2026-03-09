import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolvePetEmojiAssetUri } from '../../shared/assets/petEmojiAssets';
import { useAppSessionStore } from '../stores/AppSessionStore';

const pawMarkAssetUri = 'https://www.figma.com/api/mcp/asset/51adb77a-4b60-4189-9655-eaffb6a37860';
const footprintsCardBackgroundAssetUri = 'https://www.figma.com/api/mcp/asset/8c7df408-88d0-492c-a4c7-8116865f7209';
const memorialStarsAssetUri = 'https://www.figma.com/api/mcp/asset/8d7fb7c8-b5a6-430c-80e9-5bfb232538db';
const funeralSearchAssetUri = 'https://www.figma.com/api/mcp/asset/7371051e-9511-404e-9e48-135f7302141d';
const funeralSearchHighlightAssetUri = 'https://www.figma.com/api/mcp/asset/0845a960-0364-4a69-9581-43817bae6a1f';
const reviewAssetUri = 'https://www.figma.com/api/mcp/asset/4350f5bd-ce1c-4b68-b8c8-322f700453a3';
const activeHomeAssetUri = 'https://www.figma.com/api/mcp/asset/855d3b5a-8734-4106-8221-5abcb69983b8';
const inactiveFootprintAssetUri = 'https://www.figma.com/api/mcp/asset/e45100c4-7197-402f-9ca8-ce3569c1f9ba';
const inactiveExploreAssetUri = 'https://www.figma.com/api/mcp/asset/85190583-627a-4f2c-ba44-b00dfb3fe342';
const inactiveSettingsAssetUri = 'https://www.figma.com/api/mcp/asset/28f037a3-f943-4a7d-89ba-3260c74670f1';

const dayMs = 1000 * 60 * 60 * 24;

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

export function BeforeFarewellHomeScreen() {
  const insets = useSafeAreaInsets();
  const { openPreview, profile, selectedPet } = useAppSessionStore();
  const ownerName = profile?.nickname ?? profile?.name ?? '보호자';
  const petName = selectedPet?.name ?? '설탕';
  const petImageUri = selectedPet?.profileImageUrl ?? resolvePetEmojiAssetUri(selectedPet?.animalTypeName);
  const daysTogether = calculateDaysTogether(selectedPet?.birthDate);

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
            <View style={styles.heroTextBlock}>
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
            </View>

            <View style={styles.profileFrame}>
              <View style={styles.profileCircle}>
                <Image resizeMode="contain" source={{ uri: petImageUri }} style={styles.profileImage} />
              </View>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeLabel}>+</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>아이의 곁을 지키는 가장 세심한 방법</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </View>
            <Text style={styles.progressCaption}>
              전체 단계 중 <Text style={styles.progressCaptionAccent}>20%</Text> 진행되었어요
            </Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.footprintsCard}>
            <Image source={{ uri: footprintsCardBackgroundAssetUri }} style={styles.footprintsBackgroundImage} />
            <View style={styles.footprintsOverlay} />
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.footprintsTitle}>발자국 남기기</Text>
                <Pressable style={styles.ctaButton}>
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
                  <Text style={styles.stampCounterAccent}>3</Text>
                  <Text style={styles.stampCounterLabel}> / 18 달성!</Text>
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

          <View style={styles.infoCard}>
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
          </View>

          <Text style={styles.sectionTitle}>다른 분들에게도 도움을 나눠주세요</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoCardRow}>
              <Image source={{ uri: reviewAssetUri }} style={styles.reviewIcon} />
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoTitle}>후기 남기기</Text>
                <Text style={styles.infoDescription}>이용 경험을 자유롭게 남겨주세요</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomNavRow}>
          <View style={styles.bottomNavItem}>
            <Image source={{ uri: activeHomeAssetUri }} style={styles.bottomNavIcon} />
            <Text style={styles.bottomNavLabelActive}>홈</Text>
          </View>
          <View style={styles.bottomNavItem}>
            <Image source={{ uri: inactiveFootprintAssetUri }} style={styles.bottomNavIcon} />
            <Text style={styles.bottomNavLabelInactive}>발자국</Text>
          </View>
          <View style={styles.bottomNavItem}>
            <Image source={{ uri: inactiveExploreAssetUri }} style={styles.bottomNavIcon} />
            <Text style={styles.bottomNavLabelInactive}>살펴보기</Text>
          </View>
          <View style={styles.bottomNavItem}>
            <Image source={{ uri: inactiveSettingsAssetUri }} style={styles.bottomNavIcon} />
            <Text style={styles.bottomNavLabelInactive}>설정</Text>
          </View>
        </View>
      </View>
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
    width: '20%',
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
  bottomNavIcon: {
    height: 28,
    resizeMode: 'contain',
    width: 31,
  },
  bottomNavLabelActive: {
    color: '#FFA94E',
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  bottomNavLabelInactive: {
    color: '#CECDCB',
    fontFamily: 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
});
