/**
 * 홈 화면 온보딩 가이드 오버레이 (2단계)
 * Step 1: Figma 1_10_홈화면_온보딩_긴급버튼 안내 (무지개 다리 → 긴급 대처 모드)
 * Step 2: 사진 등록 안내 (우리 아이 사진 등록 유도)
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, {Path, Circle, Line} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export type OnboardingStep = 1 | 2;

interface OnboardingOverlayProps {
  visible: boolean;
  step: OnboardingStep;
  onNext: () => void;
  onComplete: () => void;
}

export function OnboardingOverlay({
  visible,
  step,
  onNext,
  onComplete,
}: OnboardingOverlayProps): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  if (step === 1) {
    return (
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <Step1Content insets={insets} onNext={onNext} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
      <Step2Content insets={insets} onComplete={onComplete} />
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────
 *  Step 1: 긴급 대처 모드 버튼 안내
 * ───────────────────────────────────────────── */
function Step1Content({
  insets,
  onNext,
}: {
  insets: {top: number; bottom: number};
  onNext: () => void;
}) {
  return (
    <>
      <View style={[styles.highlightBtnArea, {top: insets.top + 20}]}>
        <View style={styles.emergencyBtnHighlight}>
          <View style={styles.emergencyIconWrap}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Circle cx="7" cy="7" r="6" stroke="#FFFFFF" strokeWidth={1.5} />
              <Path
                d="M7 4v4"
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Circle cx="7" cy="10" r="0.75" fill="#FFFFFF" />
            </Svg>
          </View>
          <Text style={styles.emergencyText}>긴급 대처 모드</Text>
        </View>
        <View style={styles.dashedLineContainer}>
          <Svg width={2} height={40} viewBox="0 0 2 40">
            <Line
              x1="1"
              y1="0"
              x2="1"
              y2="40"
              stroke="#BCBBB7"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          </Svg>
        </View>
      </View>

      <View style={[styles.guideTextArea, {top: insets.top + 105}]}>
        <Text style={styles.guideTitle}>
          혹시, 아이가 무지개 다리를 건너게 되면
        </Text>
        <Text style={styles.guideDesc}>
          {'긴급 대처 모드로 전환 해주세요.\n계획대로 진행하실 수 있도록 도와드려요.'}
        </Text>
      </View>

      <View style={[styles.bottomGuide, {bottom: insets.bottom + 100}]}>
        <Text style={styles.bottomGuideText}>아래 버튼을 클릭해주세요!</Text>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.8}>
          <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <Path
              d="M10 6l8 8-8 8"
              stroke="#42302A"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </>
  );
}

/* ─────────────────────────────────────────────
 *  Step 2: 사진 등록 안내
 *  프로필 = 홈과 동일 위치, 텍스트 배경 없음(1단계처럼), 화살표 = 1단계와 동일 점선
 * ───────────────────────────────────────────── */
function Step2Content({
  insets,
  onComplete,
}: {
  insets: {top: number; bottom: number};
  onComplete: () => void;
}) {
  const profileTop = insets.top + 66;
  const profileRight = SCREEN_WIDTH - 20;
  const tooltipTop = profileTop + 120;
  // 시작: 프로필 우측 끝에서 조금 왼쪽 / 끝: 원형에 닿지 않도록 짧게
  const lineStartX = profileRight - 18;
  const lineStartY = tooltipTop;
  const lineEndX = lineStartX;
  const lineEndY = profileTop + 108;

  return (
    <>
      {/* 프로필 링: 홈 화면과 동일 위치 (topBar 12+46 + welcomeRow 8 = 66) */}
      <View style={[styles.step2ProfileArea, {top: profileTop}]}>
        <View style={styles.step2ProfileRing}>
          <Text style={styles.step2DogEmoji}>🐶</Text>
        </View>
      </View>

      {/* 화살표: 프로필 우측 끝에서 살짝 왼쪽 시작, 원에 닿지 않게 짧게 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          style={StyleSheet.absoluteFill}>
          <Line
            x1={lineStartX}
            y1={lineStartY}
            x2={lineEndX}
            y2={lineEndY}
            stroke="#BCBBB7"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        </Svg>
      </View>

      {/* 툴팁: 배경 없음, 우측 정렬 텍스트만 (1단계처럼) */}
      <View style={[styles.step2TooltipArea, {top: tooltipTop}]}>
        <Text style={styles.step2TooltipTitle}>
          먼저, 우리 아이의 사진을 등록해주세요!
        </Text>
        <Text style={styles.step2TooltipDesc}>
          다른 반려인들도 보는 사진이에요
        </Text>
        <Text style={styles.step2TooltipDesc}>
          설정 {'>'} 정보 수정하기에서 언제든 바꿀 수 있어요
        </Text>
      </View>

      {/* 하단: 안내 문구 + 화살표 버튼 (검정 배지 없음) */}
      <View style={[styles.bottomGuide, {bottom: insets.bottom + 100}]}>
        <Text style={styles.bottomGuideText}>아래 버튼을 클릭해주세요!</Text>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onComplete}
          activeOpacity={0.8}>
          <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <Path
              d="M10 6l8 8-8 8"
              stroke="#42302A"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 100,
  },

  /* ── Step 1: 긴급 버튼 ── */
  highlightBtnArea: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  emergencyBtnHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB8E76',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  emergencyIconWrap: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dashedLineContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  guideTextArea: {
    position: 'absolute',
    right: 20,
    left: 20,
    alignItems: 'flex-end',
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFE599',
    textAlign: 'right',
    lineHeight: 20,
  },
  guideDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: '#F9F9F9',
    textAlign: 'right',
    lineHeight: 18,
    marginTop: 8,
  },
  /* ── 공통: 하단 안내 ── */
  bottomGuide: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  bottomGuideText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#F9F9F9',
    marginBottom: 12,
  },
  nextButton: {
    width: 48,
    height: 48,
    borderRadius: 99,
    backgroundColor: 'rgba(188, 187, 183, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Step 2: 사진 등록 안내 ── */
  step2ProfileArea: {
    position: 'absolute',
    right: 20,
  },
  step2ProfileRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F3F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  step2DogEmoji: {
    fontSize: 48,
  },
  step2TooltipArea: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  step2TooltipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFE599',
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'right',
  },
  step2TooltipDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'right',
  },
});
