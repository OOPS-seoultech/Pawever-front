/**
 * 반려동물 카드 컴포넌트
 */

import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {PetEntity} from '@core/entities';
import {calculateHumanAge} from '@core/usecases';
import {colors, fontSize, fontWeight, spacing, borderRadius, shadow} from '@shared/styles';

interface PetCardProps {
  pet: PetEntity;
  onPress?: (pet: PetEntity) => void;
}

const SPECIES_LABEL: Record<string, string> = {
  dog: '강아지',
  cat: '고양이',
  other: '기타',
};

export function PetCard({pet, onPress}: PetCardProps): React.JSX.Element {
  const humanAge = calculateHumanAge(pet);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(pet)}
      activeOpacity={0.8}>
      {pet.profileImageUrl ? (
        <Image source={{uri: pet.profileImageUrl}} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>🐾</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.details}>
          {SPECIES_LABEL[pet.species] ?? pet.species} · {pet.breed}
        </Text>
        <Text style={styles.age}>
          {pet.age}살 (사람 나이 약 {Math.round(humanAge)}살)
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.md,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: fontSize.title,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  details: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  age: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
});
