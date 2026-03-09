import AsyncStorage from '@react-native-async-storage/async-storage';

const SIGNUP_LOADING_ANIMAL_STORAGE_KEY = '@pawever/signup-loading-animal-type';

export async function readStoredSignupLoadingAnimalType() {
  return AsyncStorage.getItem(SIGNUP_LOADING_ANIMAL_STORAGE_KEY);
}

export async function writeStoredSignupLoadingAnimalType(animalTypeName: string) {
  await AsyncStorage.setItem(SIGNUP_LOADING_ANIMAL_STORAGE_KEY, animalTypeName);
}

export async function clearStoredSignupLoadingAnimalType() {
  await AsyncStorage.removeItem(SIGNUP_LOADING_ANIMAL_STORAGE_KEY);
}
