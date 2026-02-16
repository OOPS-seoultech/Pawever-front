/**
 * 회원가입 (반려동물 등록) 상태 관리 Store
 * 다단계 폼 데이터를 관리
 */

import {create} from 'zustand';

export type PetType =
  | 'dog'
  | 'cat'
  | 'fish'
  | 'hamster'
  | 'turtle'
  | 'bird'
  | 'reptile'
  | 'other';

export type PetGender = 'male' | 'female';

export type ReferralSource =
  | 'recommendation'
  | 'threads'
  | 'instagram'
  | 'offline'
  | 'other';

export interface ReferralOption {
  id: ReferralSource;
  label: string;
}

export const REFERRAL_OPTIONS: ReferralOption[] = [
  {id: 'recommendation', label: '주변에서 추천해서 가입했어요'},
  {id: 'threads', label: '쓰레드 보고 들어왔어요'},
  {id: 'instagram', label: '인스타그램 보고 들어왔어요'},
  {id: 'offline', label: '동물병원, 장례식장 등 오프라인에서 소개 받았어요'},
  {id: 'other', label: '위 중에 없어요 (기타)'},
];

export type UsageStage = 'prepare' | 'farewell' | 'memorial';

export interface UsageStageOption {
  id: UsageStage;
  title: string;
  description: string;
}

export const USAGE_STAGE_OPTIONS: UsageStageOption[] = [
  {
    id: 'prepare',
    title: '마지막을 미리 준비해요',
    description: '알아보는 것 만으로도 슬플 때, 빠르고 간편하게 계획하고 관리할 수 있어요.',
  },
  {
    id: 'farewell',
    title: '이별 직후, 빠른 대처가 필요해요',
    description: '장례 방법, 예약, 주의사항 등을\n빠르게 정리하여 안내해드려요.',
  },
  {
    id: 'memorial',
    title: '별이 된 아이를 추모해요',
    description: '별이 된 아이를 추억하고,\n나의 마음을 돌볼 수 있어요.',
  },
];

export interface PetTypeOption {
  id: PetType;
  label: string;
  emoji: string;
}

export const PET_TYPE_OPTIONS: PetTypeOption[] = [
  {id: 'dog', label: '강아지', emoji: '🐶'},
  {id: 'cat', label: '고양이', emoji: '🐱'},
  {id: 'fish', label: '물고기', emoji: '🐟'},
  {id: 'hamster', label: '햄스터', emoji: '🐹'},
  {id: 'turtle', label: '거북이', emoji: '🐢'},
  {id: 'bird', label: '새', emoji: '🐦'},
  {id: 'reptile', label: '파충류', emoji: '🦎'},
  {id: 'other', label: '기타', emoji: '···'},
];

interface RegistrationState {
  /** Step 1 */
  petType: PetType | null;
  petName: string;

  /** Step 2 */
  petBreed: string;
  petBirthday: string;
  petWeight: string;
  petGender: PetGender | null;
  isNeutered: boolean;

  /** Step 3 */
  nickname: string;
  referralSource: ReferralSource | null;

  /** 사용 시기 */
  usageStage: UsageStage | null;

  /** 현재 스텝 */
  currentStep: number;

  /** 도달한 최대 스텝 (이전에 완료한 스텝 추적) */
  maxReachedStep: number;

  /** Step 1 Actions */
  setPetType: (type: PetType) => void;
  setPetName: (name: string) => void;

  /** Step 2 Actions */
  setPetBreed: (breed: string) => void;
  setPetBirthday: (birthday: string) => void;
  setPetWeight: (weight: string) => void;
  setPetGender: (gender: PetGender) => void;
  setIsNeutered: (value: boolean) => void;

  /** Step 3 Actions */
  setNickname: (name: string) => void;
  setReferralSource: (source: ReferralSource) => void;

  /** Usage Stage Actions */
  setUsageStage: (stage: UsageStage) => void;

  /** Navigation */
  nextStep: () => void;
  prevStep: () => void;
  advanceToStep: (step: number) => void;
  reset: () => void;

  /** Validation */
  isStep1Valid: () => boolean;
  isStep2Valid: () => boolean;
  isStep3Valid: () => boolean;
}

const PET_NAME_REGEX = /^[가-힣a-zA-Z0-9]+$/;
const PET_NAME_MAX = 8;
const BIRTHDAY_REGEX = /^\d{8}$/;

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  petType: null,
  petName: '',
  petBreed: '',
  petBirthday: '',
  petWeight: '',
  petGender: null,
  isNeutered: false,
  nickname: '',
  referralSource: null,
  usageStage: null,
  currentStep: 1,
  maxReachedStep: 1,

  setPetType: (type: PetType) => set({petType: type}),

  setPetName: (name: string) => {
    if (name.length <= PET_NAME_MAX) {
      set({petName: name});
    }
  },

  setPetBreed: (breed: string) => set({petBreed: breed}),

  setPetBirthday: (birthday: string) => {
    const digitsOnly = birthday.replace(/\D/g, '');
    if (digitsOnly.length <= 8) {
      set({petBirthday: digitsOnly});
    }
  },

  setPetWeight: (weight: string) => set({petWeight: weight}),

  setPetGender: (gender: PetGender) => set({petGender: gender}),

  setIsNeutered: (value: boolean) => set({isNeutered: value}),

  setNickname: (name: string) => {
    if (name.length <= 12) {
      set({nickname: name});
    }
  },

  setReferralSource: (source: ReferralSource) => set({referralSource: source}),

  setUsageStage: (stage: UsageStage) => set({usageStage: stage}),

  nextStep: () => set(state => ({currentStep: Math.min(state.currentStep + 1, 3)})),

  prevStep: () => set(state => ({currentStep: Math.max(state.currentStep - 1, 1)})),

  advanceToStep: (step: number) =>
    set(state => ({maxReachedStep: Math.max(state.maxReachedStep, step)})),

  reset: () =>
    set({
      petType: null,
      petName: '',
      petBreed: '',
      petBirthday: '',
      petWeight: '',
      petGender: null,
      isNeutered: false,
      nickname: '',
      referralSource: null,
      usageStage: null,
      currentStep: 1,
      maxReachedStep: 1,
    }),

  isStep1Valid: () => {
    const {petType, petName} = get();
    if (!petType) {
      return false;
    }
    if (petName.length === 0 || petName.length > PET_NAME_MAX) {
      return false;
    }
    return PET_NAME_REGEX.test(petName);
  },

  isStep2Valid: () => {
    const {petBreed, petBirthday, petWeight, petGender} = get();
    if (!petBreed) {
      return false;
    }
    if (!BIRTHDAY_REGEX.test(petBirthday)) {
      return false;
    }
    if (!petWeight) {
      return false;
    }
    if (!petGender) {
      return false;
    }
    return true;
  },

  isStep3Valid: () => {
    const {nickname, referralSource} = get();
    if (!nickname || nickname.trim().length === 0) {
      return false;
    }
    if (!referralSource) {
      return false;
    }
    return true;
  },
}));
