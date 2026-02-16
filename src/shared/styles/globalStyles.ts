/**
 * 글로벌 스타일 (base.css + main.css에 대응)
 * 앱 전체에서 재사용되는 공통 스타일 패턴
 */

import {StyleSheet} from 'react-native';
import {colors, fontSize, fontWeight, spacing, borderRadius, shadow} from './theme';

export const globalStyles = StyleSheet.create({
  /** 레이아웃 */
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /** 카드 */
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadow.md,
  },

  /** 텍스트 */
  textHero: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  textTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  textHeading: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  textBody: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
  },
  textCaption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
  },
  textSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: colors.textTertiary,
  },

  /** 인풋 */
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.middleGray,
    color: colors.textPrimary,
  },

  /** 버튼 */
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  /** 에러 텍스트 */
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    textAlign: 'center',
  },

  /** 빈 상태 */
  emptyText: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.huge,
    fontSize: fontSize.base,
  },

  /** 구분선 */
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
});
