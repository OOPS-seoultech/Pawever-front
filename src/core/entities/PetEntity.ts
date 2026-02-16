/**
 * Pet 도메인 엔티티
 * 비즈니스 로직에서 사용하는 핵심 데이터 모델
 */

export interface PetEntity {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: number;
  gender: PetGender;
  profileImageUrl?: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetGender = 'male' | 'female';

/**
 * API 응답 데이터를 PetEntity로 변환
 */
export function toPetEntity(raw: Record<string, any>): PetEntity {
  return {
    id: raw.id,
    name: raw.name,
    species: raw.species,
    breed: raw.breed,
    age: raw.age,
    gender: raw.gender,
    profileImageUrl: raw.profile_image_url ?? raw.profileImageUrl,
    description: raw.description,
    ownerId: raw.owner_id ?? raw.ownerId,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}
