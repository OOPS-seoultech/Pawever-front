/**
 * Pet 관련 유스케이스 (비즈니스 로직)
 * UI나 인프라에 의존하지 않는 순수 로직만 포함
 */

import {PetEntity, PetSpecies} from '../entities/PetEntity';

/**
 * 반려동물 나이를 사람 나이로 환산
 */
export function calculateHumanAge(
  pet: Pick<PetEntity, 'age' | 'species'>,
): number {
  if (pet.species === 'dog') {
    if (pet.age <= 2) {
      return pet.age * 10.5;
    }
    return 21 + (pet.age - 2) * 4;
  }

  if (pet.species === 'cat') {
    if (pet.age <= 2) {
      return pet.age * 12.5;
    }
    return 25 + (pet.age - 2) * 4;
  }

  return pet.age;
}

/**
 * 종별 반려동물 필터링
 */
export function filterPetsBySpecies(
  pets: PetEntity[],
  species: PetSpecies,
): PetEntity[] {
  return pets.filter(pet => pet.species === species);
}

/**
 * 반려동물 나이순 정렬
 */
export function sortPetsByAge(
  pets: PetEntity[],
  order: 'asc' | 'desc' = 'asc',
): PetEntity[] {
  return [...pets].sort((a, b) =>
    order === 'asc' ? a.age - b.age : b.age - a.age,
  );
}
