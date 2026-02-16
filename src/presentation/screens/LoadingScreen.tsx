/**
 * 로딩(스플래시) 화면
 * Figma 디자인: 0_1_로딩
 */

import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, StatusBar} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';

const BRAND = {
  background: '#FFA94E',
  foreground: '#FFFCEA',
} as const;

/** 발자국 모양의 둥근 별 SVG 경로 (Figma Star + Ellipses 재현) */
const PAW_STAR_PATH =
  'M 40.27,29.14 Q 45.40,23.00 50.53,29.14 ' +
  'L 57.90,37.99 Q 63.03,44.13 70.45,47.11 ' +
  'L 81.15,51.39 Q 88.57,54.37 84.31,61.15 ' +
  'L 78.19,70.89 Q 73.93,77.67 73.39,85.65 ' +
  'L 72.63,97.14 Q 72.09,105.12 64.33,103.17 ' +
  'L 53.16,100.35 Q 45.40,98.40 37.64,100.35 ' +
  'L 26.47,103.17 Q 18.71,105.12 18.17,97.14 ' +
  'L 17.41,85.65 Q 16.87,77.67 12.61,70.89 ' +
  'L 6.49,61.15 Q 2.23,54.37 9.65,51.39 ' +
  'L 20.35,47.11 Q 27.77,44.13 32.90,37.99 Z';

interface PawIconProps {
  size?: number;
  color?: string;
}

function PawIcon({size = 120, color = BRAND.foreground}: PawIconProps) {
  const scale = size / 91;
  const viewHeight = 114 * scale;

  return (
    <Svg width={size} height={viewHeight} viewBox="0 0 91 114">
      {/* 둥근 별 (메인 패드) */}
      <Path d={PAW_STAR_PATH} fill={color} />
      {/* 윗발가락 (큰 원 2개) */}
      <Circle cx={61.58} cy={10.44} r={10.44} fill={color} />
      <Circle cx={28.18} cy={10.44} r={10.44} fill={color} />
      {/* 옆발가락 (작은 원 2개) */}
      <Circle cx={81.41} cy={34.49} r={8.35} fill={color} />
      <Circle cx={8.35} cy={34.49} r={8.35} fill={color} />
    </Svg>
  );
}

export function LoadingScreen(): React.JSX.Element {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.background} />
      <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
        <PawIcon size={120} />

        <Text style={styles.logoText}>PAW-EVER</Text>

        <Text style={styles.subtitle}>
          {'후회없는 시간을 위해\n펫로스 통합 지원 서비스, 포에버가 함께합니다'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: -60,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.foreground,
    letterSpacing: 3,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.foreground,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 16,
  },
});
