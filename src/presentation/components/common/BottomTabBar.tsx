/**
 * 하단 탭 네비게이션 바 컴포넌트
 * 홈, 발자국, 살펴보기, 설정 4개 탭
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type TabId = 'home' | 'footprint' | 'explore' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  {id: 'home', label: '홈', icon: '🏠'},
  {id: 'footprint', label: '발자국', icon: '🐾'},
  {id: 'explore', label: '살펴보기', icon: '📋'},
  {id: 'settings', label: '설정', icon: '⚙️'},
];

interface BottomTabBarProps {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
}

export function BottomTabBar({
  activeTab = 'home',
  onTabPress,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingBottom: Math.max(insets.bottom, 8)}]}>
      <View style={styles.divider} />
      <View style={styles.tabRow}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress?.(tab.id)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}>
                <Text style={styles.icon}>{tab.icon}</Text>
              </View>
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E1E0DE',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  labelActive: {
    color: '#FFA94E',
  },
  labelInactive: {
    color: '#CECDCB',
  },
});
