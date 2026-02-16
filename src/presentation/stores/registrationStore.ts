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
  isNicknameVerified: boolean;
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
  resetStep1: () => void;

  /** Step 2 Actions */
  setPetBreed: (breed: string) => void;
  setPetBirthday: (birthday: string) => void;
  setPetWeight: (weight: string) => void;
  setPetGender: (gender: PetGender) => void;
  setIsNeutered: (value: boolean) => void;
  resetStep2: () => void;

  /** Step 3 Actions */
  setNickname: (name: string) => void;
  setNicknameVerified: (verified: boolean) => void;
  setReferralSource: (source: ReferralSource) => void;
  resetStep3: () => void;

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

/**
 * 생일 유효성 검증
 * - YYYYMMDD 형식 8자리 숫자인지
 * - 실제 존재하는 날짜인지 (윤년, 월별 일수)
 * - 미래 날짜가 아닌지
 * - 100년 이내인지 (반려동물 수명 고려)
 */
export function isValidBirthday(value: string): boolean {
  if (!BIRTHDAY_REGEX.test(value)) {
    return false;
  }

  const year = parseInt(value.substring(0, 4), 10);
  const month = parseInt(value.substring(4, 6), 10);
  const day = parseInt(value.substring(6, 8), 10);

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1) {
    return false;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthday = new Date(year, month - 1, day);

  if (birthday > today) {
    return false;
  }

  const hundredYearsAgo = new Date();
  hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
  if (birthday < hundredYearsAgo) {
    return false;
  }

  return true;
}

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  petType: null,
  petName: '',
  petBreed: '',
  petBirthday: '',
  petWeight: '',
  petGender: null,
  isNeutered: false,
  nickname: '',
  isNicknameVerified: false,
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

  resetStep1: () => set({petType: null, petName: ''}),

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

  resetStep2: () =>
    set({petBreed: '', petBirthday: '', petWeight: '', petGender: null, isNeutered: false}),

  setNickname: (name: string) => {
    if (name.length <= 12) {
      set({nickname: name, isNicknameVerified: false});
    }
  },

  setNicknameVerified: (verified: boolean) => set({isNicknameVerified: verified}),

  setReferralSource: (source: ReferralSource) => set({referralSource: source}),

  resetStep3: () => set({nickname: '', isNicknameVerified: false, referralSource: null}),

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
      isNicknameVerified: false,
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
    if (!isValidBirthday(petBirthday)) {
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
    const {nickname, isNicknameVerified, referralSource} = get();
    if (!nickname || nickname.trim().length === 0) {
      return false;
    }
    if (!isNicknameVerified) {
      return false;
    }
    if (!referralSource) {
      return false;
    }
    return true;
  },
}));
