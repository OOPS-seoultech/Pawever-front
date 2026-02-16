/**
 * Pet 상태 관리 Store
 * Zustand 기반 전역 상태 관리 (Vue의 Pinia Store에 대응)
 */

import {create} from 'zustand';
import {PetEntity} from '@core/entities';
import {PetRepository} from '@infrastructure/repositories';

interface PetState {
  pets: PetEntity[];
  selectedPet: PetEntity | null;
  isLoading: boolean;
  error: string | null;

  fetchPets: (page?: number) => Promise<void>;
  fetchPetById: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  pets: [],
  selectedPet: null,
  isLoading: false,
  error: null,
};

export const usePetStore = create<PetState>((set) => ({
  ...initialState,

  fetchPets: async (page = 1) => {
    set({isLoading: true, error: null});
    try {
      const result = await PetRepository.getAll(page);
      set({pets: result.items, isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '반려동물 목록을 불러올 수 없습니다.',
        isLoading: false,
      });
    }
  },

  fetchPetById: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      const pet = await PetRepository.getById(id);
      set({selectedPet: pet, isLoading: false});
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '반려동물 정보를 불러올 수 없습니다.',
        isLoading: false,
      });
    }
  },

  clearError: () => set({error: null}),
  reset: () => set(initialState),
}));
