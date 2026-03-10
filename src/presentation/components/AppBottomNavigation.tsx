import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PetLifecycleStatus } from '../../core/entities/pet';

import { resolveHomePreviewRoute } from '../navigation/resolveHomePreviewRoute';
import { useAppSessionStore } from '../stores/AppSessionStore';

const inactiveHomeAssetUri = 'https://www.figma.com/api/mcp/asset/9a1de914-5682-454b-8955-f7202bdb9562';
const inactiveFootprintAssetUri = 'https://www.figma.com/api/mcp/asset/588ce4ea-6b6d-49e9-84b9-dae34bc703c6';
const inactiveExploreAssetUri = 'https://www.figma.com/api/mcp/asset/85190583-627a-4f2c-ba44-b00dfb3fe342';
const inactiveSettingsAssetUri = 'https://www.figma.com/api/mcp/asset/00a9a881-da45-491e-a25e-8eabe68ce7de';

export type AppBottomNavigationTabId = 'explore' | 'footprints' | 'home' | 'memorial' | 'settings';

type AppBottomNavigationProps = {
  activeTabId: AppBottomNavigationTabId | null;
  hidden?: boolean;
  lifecycleStatus?: PetLifecycleStatus;
  showMemorialNotification?: boolean;
};

type BottomNavigationTab = {
  iconUri?: string;
  id: AppBottomNavigationTabId;
  label: string;
};

const getBottomNavigationTabs = (lifecycleStatus: PetLifecycleStatus): BottomNavigationTab[] => {
  if (lifecycleStatus === 'AFTER_FAREWELL') {
    return [
      { iconUri: inactiveHomeAssetUri, id: 'home', label: '홈' },
      { id: 'memorial', label: '별자리' },
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

export function AppBottomNavigation({
  activeTabId,
  hidden = false,
  lifecycleStatus,
  showMemorialNotification = false,
}: AppBottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const { openPreview, previewStack, selectedPet } = useAppSessionStore();
  const effectiveLifecycleStatus = lifecycleStatus ?? selectedPet?.lifecycleStatus ?? 'BEFORE_FAREWELL';
  const isEmergencyLocked = hidden || Boolean(selectedPet?.emergencyMode) || previewStack.includes('emergency');
  const tabs = getBottomNavigationTabs(effectiveLifecycleStatus);

  if (isEmergencyLocked) {
    return null;
  }

  const handlePressTab = (tabId: AppBottomNavigationTabId) => {
    if (tabId === activeTabId) {
      return;
    }

    if (tabId === 'home') {
      openPreview(resolveHomePreviewRoute(selectedPet));
      return;
    }

    if (tabId === 'footprints') {
      openPreview('footprints');
      return;
    }

    if (tabId === 'explore') {
      openPreview('farewellPreview');
      return;
    }

    if (tabId === 'memorial') {
      openPreview('memorial');
      return;
    }

    Alert.alert('준비 중', '설정 화면은 다음 단계에서 연결할 예정이에요.');
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bottomNavRow}>
        {tabs.map(tab => {
          const isActive = activeTabId === tab.id;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handlePressTab(tab.id)}
              style={styles.bottomNavItem}
            >
              <View style={[styles.bottomNavIconFrame, isActive ? styles.bottomNavIconFrameActive : null]}>
                {tab.id === 'memorial' ? (
                  <View style={styles.memorialIconWrap}>
                    <Text style={[styles.memorialIcon, isActive ? styles.memorialIconActive : styles.memorialIconInactive]}>
                      ✦
                    </Text>
                    {showMemorialNotification ? <View style={styles.memorialNotificationDot} /> : null}
                  </View>
                ) : tab.iconUri ? (
                  <Image
                    resizeMode="contain"
                    source={{ uri: tab.iconUri }}
                    style={[
                      styles.bottomNavIconImage,
                      isActive ? styles.bottomNavIconImageActive : styles.bottomNavIconImageInactive,
                    ]}
                  />
                ) : null}
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
}

const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#F1E4D8',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  bottomNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  bottomNavIconFrame: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  bottomNavIconFrameActive: {
    backgroundColor: '#FFE5CF',
    borderColor: '#F6C59A',
  },
  bottomNavIconImage: {
    height: 22,
    width: 22,
  },
  bottomNavIconImageActive: {
    opacity: 1,
  },
  bottomNavIconImageInactive: {
    opacity: 0.38,
  },
  memorialIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  memorialIcon: {
    fontSize: 18,
    lineHeight: 20,
  },
  memorialIconActive: {
    color: '#FB7A00',
  },
  memorialIconInactive: {
    color: '#B8B0A8',
  },
  memorialNotificationDot: {
    backgroundColor: '#FF5A36',
    borderColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    position: 'absolute',
    right: -2,
    top: -1,
    width: 10,
  },
  bottomNavLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.24,
    lineHeight: 16,
  },
  bottomNavLabelActive: {
    color: '#FB7A00',
  },
  bottomNavLabelInactive: {
    color: '#B8B0A8',
  },
});
