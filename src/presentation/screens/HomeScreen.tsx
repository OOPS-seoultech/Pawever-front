/**
 * 홈 화면
 */

import React, {useEffect} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {usePetStore} from '@presentation/stores';
import {PetCard} from '@presentation/components/pet/PetCard';
import {LoadingSpinner} from '@presentation/components/common/LoadingSpinner';
import {colors, fontSize, fontWeight, spacing, globalStyles} from '@shared/styles';

export function HomeScreen(): React.JSX.Element {
  const {pets, isLoading, error, fetchPets} = usePetStore();

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={globalStyles.center}>
        <Text style={globalStyles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={styles.title}>내 반려동물</Text>
      <FlatList
        data={pets}
        keyExtractor={item => item.id}
        renderItem={({item}) => <PetCard pet={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={globalStyles.emptyText}>등록된 반려동물이 없습니다.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    padding: spacing.xl,
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
});
