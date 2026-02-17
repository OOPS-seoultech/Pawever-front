/**
 * 이미지 자르기 모달 (Figma: 1_10-5_홈화면_온보딩_사진 등록_이미지자르기_모달)
 * - 이미지는 고정, 그 위에 프로필에 반영될 원(크롭 영역)만 표시
 * - 원 밖: 반투명 검정 오버레이
 * - 원: 한 손가락으로 이동 (이미지 밖으로 나가면 안 됨), 두 손가락 핀치로 크기 조절
 */

import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Svg, {Defs, Mask, Rect, Circle as SvgCircle} from 'react-native-svg';
import {colors, fontSize, borderRadius} from '@shared/styles';

const STAGE = 308;
const RADIUS_MIN = 40;
const RADIUS_MAX = 154; // STAGE/2
const RADIUS_INITIAL = 100;

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
}

function clampCirclePosition(
  cx: number,
  cy: number,
  r: number,
): {cx: number; cy: number} {
  const cxClamp = Math.max(r, Math.min(STAGE - r, cx));
  const cyClamp = Math.max(r, Math.min(STAGE - r, cy));
  return {cx: cxClamp, cy: cyClamp};
}

function clampRadius(cx: number, cy: number, r: number): number {
  const maxFromCenter = Math.min(cx, STAGE - cx, cy, STAGE - cy, RADIUS_MAX);
  return Math.max(RADIUS_MIN, Math.min(maxFromCenter, r));
}

export function ImageCropModal({
  visible,
  imageUri,
  onConfirm,
  onCancel,
}: ImageCropModalProps): React.JSX.Element | null {
  const viewShotRef = useRef<ViewShot>(null);
  const [capturing, setCapturing] = useState(false);

  const [circleX, setCircleX] = useState(STAGE / 2);
  const [circleY, setCircleY] = useState(STAGE / 2);
  const [circleRadius, setCircleRadius] = useState(RADIUS_INITIAL);

  const baseCircleX = useRef(STAGE / 2);
  const baseCircleY = useRef(STAGE / 2);
  const baseRadius = useRef(RADIUS_INITIAL);
  const lastPinchDistance = useRef<number | null>(null);
  const lastGestureWasPinch = useRef(false);

  const resetCircle = useCallback(() => {
    const cx = STAGE / 2;
    const cy = STAGE / 2;
    const r = RADIUS_INITIAL;
    const rClamp = clampRadius(cx, cy, r);
    baseCircleX.current = cx;
    baseCircleY.current = cy;
    baseRadius.current = rClamp;
    setCircleX(cx);
    setCircleY(cy);
    setCircleRadius(rClamp);
    lastPinchDistance.current = null;
  }, []);

  useEffect(() => {
    if (visible && imageUri) {
      resetCircle();
    }
  }, [visible, imageUri, resetCircle]);

  const getDistance = (touches: {pageX: number; pageY: number}[]) => {
    if (touches.length < 2) return 0;
    return Math.hypot(
      touches[1].pageX - touches[0].pageX,
      touches[1].pageY - touches[0].pageY,
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        const touches = evt?.nativeEvent?.touches;
        if (touches && touches.length === 2) {
          lastPinchDistance.current = getDistance(touches);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt?.nativeEvent?.touches;
        if (!touches) return;

        if (touches.length === 2 && lastPinchDistance.current != null) {
          lastGestureWasPinch.current = true;
          const dist = getDistance(touches);
          const scale = dist / lastPinchDistance.current;
          const newR = clampRadius(
            baseCircleX.current,
            baseCircleY.current,
            baseRadius.current * scale,
          );
          baseRadius.current = newR;
          setCircleRadius(newR);
          lastPinchDistance.current = dist;
        } else if (touches.length === 1) {
          lastGestureWasPinch.current = false;
          const cx = baseCircleX.current + gestureState.dx;
          const cy = baseCircleY.current + gestureState.dy;
          const r = baseRadius.current;
          const {cx: cxClamp, cy: cyClamp} = clampCirclePosition(cx, cy, r);
          const rClamp = clampRadius(cxClamp, cyClamp, r);
          setCircleX(cxClamp);
          setCircleY(cyClamp);
          setCircleRadius(rClamp);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        lastPinchDistance.current = null;
        if (lastGestureWasPinch.current) {
          lastGestureWasPinch.current = false;
          return;
        }
        const cx = baseCircleX.current + gestureState.dx;
        const cy = baseCircleY.current + gestureState.dy;
        const r = baseRadius.current;
        const {cx: cxClamp, cy: cyClamp} = clampCirclePosition(cx, cy, r);
        const rClamp = clampRadius(cxClamp, cyClamp, r);
        baseCircleX.current = cxClamp;
        baseCircleY.current = cyClamp;
        baseRadius.current = rClamp;
        setCircleX(cxClamp);
        setCircleY(cyClamp);
        setCircleRadius(rClamp);
      },
    }),
  ).current;

  const handleCrop = useCallback(async () => {
    const shot = viewShotRef.current;
    if (!shot || capturing || typeof shot.capture !== 'function') return;
    setCapturing(true);
    try {
      const uri = await shot.capture();
      if (uri) {
        onConfirm(uri);
      }
    } catch {
      onConfirm(imageUri);
    } finally {
      setCapturing(false);
    }
  }, [imageUri, onConfirm, capturing]);

  if (!visible) return null;

  const diameter = circleRadius * 2;
  const shotLeft = circleX - circleRadius;
  const shotTop = circleY - circleRadius;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>이미지 자르기</Text>

          <View style={[styles.stageWrap, {width: STAGE, height: STAGE}]} {...panResponder.panHandlers}>
            {/* 1) 고정 이미지 (전체) */}
            <View style={[styles.stageImage, {width: STAGE, height: STAGE}]}>
              <Image
                source={{uri: imageUri}}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>

            {/* 2) 캡처용 원형 창: 원 위치에 맞는 이미지 조각만 보이도록 시프트한 뷰 */}
            <ViewShot
              ref={viewShotRef}
              options={{
                format: 'png',
                quality: 1,
                result: 'tmpfile',
                width: diameter,
                height: diameter,
              }}
              style={[
                styles.captureCircle,
                {
                  left: shotLeft,
                  top: shotTop,
                  width: diameter,
                  height: diameter,
                  borderRadius: circleRadius,
                },
              ]}>
              <View
                style={[
                  styles.captureImageShift,
                  {left: -shotLeft, top: -shotTop},
                ]}>
                <Image
                  source={{uri: imageUri}}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            </ViewShot>

            {/* 3) 원 밖 반투명 검정 오버레이 (원형 구멍) */}
            <View style={styles.darkOverlayWrap} pointerEvents="none">
              <Svg width={STAGE} height={STAGE}>
                <Defs>
                  <Mask id="cropHole">
                    <Rect x={0} y={0} width={STAGE} height={STAGE} fill="white" />
                    <SvgCircle cx={circleX} cy={circleY} r={circleRadius} fill="black" />
                  </Mask>
                </Defs>
                <Rect
                  x={0}
                  y={0}
                  width={STAGE}
                  height={STAGE}
                  fill="rgba(0,0,0,0.65)"
                  mask="url(#cropHole)"
                />
              </Svg>
            </View>

            {/* 4) 원 테두리 */}
            <View
              style={[
                styles.circleBorder,
                {
                  left: shotLeft,
                  top: shotTop,
                  width: diameter,
                  height: diameter,
                  borderRadius: circleRadius,
                },
              ]}
              pointerEvents="none"
            />
          </View>

          <Text style={styles.hint}>한 손가락: 원 이동 · 두 손가락: 원 크기</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.buttonCrop}
              onPress={handleCrop}
              disabled={capturing}
              activeOpacity={0.8}>
              <Text style={styles.buttonCropText}>{capturing ? '저장 중…' : '자르기'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonClose}
              onPress={onCancel}
              disabled={capturing}
              activeOpacity={0.8}>
              <Text style={styles.buttonCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.background,
    borderRadius: 17,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brandBrown,
    marginBottom: 16,
    textAlign: 'center',
  },
  stageWrap: {
    position: 'relative',
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 8,
  },
  stageImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: STAGE,
    height: STAGE,
  },
  captureCircle: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  captureImageShift: {
    position: 'absolute',
    width: STAGE,
    height: STAGE,
  },
  darkOverlayWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  circleBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: 'transparent',
  },
  hint: {
    fontSize: 12,
    color: colors.brandBeige,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  buttonCrop: {
    width: 150,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCropText: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.white,
  },
  buttonClose: {
    width: 150,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.middleGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCloseText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.darkGray,
  },
});
