/**
 * 회원가입 로딩 화면
 * Figma: 0_9_로딩_개
 * 회원가입 데이터 전송 중 표시
 */

import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Easing} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRegistrationStore} from '@presentation/stores/registrationStore';
import {useAuthStore} from '@presentation/stores';
import {colors} from '@shared/styles';
import {useSignupBackHandler} from '@shared/hooks/useSignupBackHandler';

const DOG_EMOJI = '🐶';

export function SignupLoadingScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {completeRegistration} = useAuthStore();
  const reset = useRegistrationStore(s => s.reset);

  // 뒤로가기 차단
  useSignupBackHandler(0);

  // 페이드인 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 등장 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 캐릭터 바운스 (반복)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -12,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 점 애니메이션 (반복)
    Animated.loop(
      Animated.timing(dotsAnim, {
        toValue: 3,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();

    // TODO: 실제 API 호출로 대체
    // 시뮬레이션: 2.5초 후 회원가입 완료 처리
    const timer = setTimeout(() => {
      completeRegistration();
      reset();
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, bounceAnim, dotsAnim, completeRegistration, reset]);

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <View style={styles.content}>
        {/* 캐릭터 이미지 영역 */}
        <Animated.View
          style={[
            styles.characterContainer,
            {
              opacity: fadeAnim,
              transform: [
                {scale: scaleAnim},
                {translateY: bounceAnim},
              ],
            },
          ]}>
          {/* TODO: 실제 캐릭터 이미지 에셋으로 교체 */}
          {/* <Image source={require('@assets/images/loading_dog.png')} style={styles.characterImage} /> */}
          <Text style={styles.characterEmoji}>{DOG_EMOJI}</Text>
        </Animated.View>

        {/* 텍스트 영역 */}
        <Animated.View style={[styles.textContainer, {opacity: fadeAnim}]}>
          <Text style={styles.title}>회원 가입을 진행하고 있어요 !</Text>
          <Text style={styles.subtitle}>알맞은 서비스를 추천해드릴게요.</Text>
        </Animated.View>

        {/* 로딩 인디케이터 */}
        <Animated.View style={[styles.loadingContainer, {opacity: fadeAnim}]}>
          <LoadingDots />
        </Animated.View>
      </View>
    </View>
  );
}

function LoadingDots(): React.JSX.Element {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );

    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, {opacity: dot1}]} />
      <Animated.View style={[styles.dot, {opacity: dot2}]} />
      <Animated.View style={[styles.dot, {opacity: dot3}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  characterContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  characterEmoji: {
    fontSize: 120,
  },
  characterImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FD7E14',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.brandBeige,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FD7E14',
  },
});
