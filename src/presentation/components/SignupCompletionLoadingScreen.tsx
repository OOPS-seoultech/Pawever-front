import { useEffect, useState } from 'react';

import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';

import { readStoredSignupLoadingAnimalType } from '../../infrastructure/storage/signupLoadingAnimalStorage';

const dogLoadingAssetUri = 'https://www.figma.com/api/mcp/asset/78855b05-f0dc-4bb6-8215-8ac2c3045abe';
const catLoadingAssetUri = 'https://www.figma.com/api/mcp/asset/59fece4e-483f-4ac9-a30d-72cfe7ee3266';

const resolveLoadingAssetUri = (animalTypeName: string | null | undefined) => {
  if (animalTypeName?.includes('고양이')) {
    return catLoadingAssetUri;
  }

  return dogLoadingAssetUri;
};

export function SignupCompletionLoadingScreen() {
  const [animalTypeName, setAnimalTypeName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateAnimalType = async () => {
      const storedAnimalTypeName = await readStoredSignupLoadingAnimalType();

      if (!isMounted) {
        return;
      }

      setAnimalTypeName(storedAnimalTypeName);
    };

    hydrateAnimalType();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#FFFBEB" barStyle="dark-content" />
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.content}>
        <Image resizeMode="contain" source={{ uri: resolveLoadingAssetUri(animalTypeName) }} style={styles.petImage} />
        <Text style={styles.title}>회원 가입을 진행하고 있어요 !</Text>
        <Text style={styles.description}>알맞은 서비스를 추천해드릴게요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backgroundGlowTop: {
    backgroundColor: '#FFF4DA',
    borderRadius: 240,
    height: 420,
    opacity: 0.6,
    position: 'absolute',
    top: -120,
    width: 420,
  },
  backgroundGlowBottom: {
    backgroundColor: '#FAE5CF',
    borderRadius: 300,
    bottom: -180,
    height: 520,
    opacity: 0.85,
    position: 'absolute',
    width: 520,
  },
  content: {
    alignItems: 'center',
    marginTop: -8,
  },
  petImage: {
    height: 180,
    marginBottom: 22,
    width: 180,
  },
  title: {
    color: '#FD7E14',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 29,
    marginBottom: 12,
  },
  description: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
  },
});
