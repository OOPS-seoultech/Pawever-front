/**
 * Pet 리포지토리
 * API 응답을 도메인 엔티티로 변환하는 데이터 접근 계층
 * Presentation 레이어는 이 리포지토리를 통해서만 데이터에 접근
 */

import {petApi, CreatePetRequest, UpdatePetRequest} from '../http/api/petApi';
import {PetEntity, toPetEntity} from '@core/entities/PetEntity';
import type {PaginatedResponse} from '@shared/types/common';

export const PetRepository = {
  async getAll(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<PetEntity>> {
    const response = await petApi.getAll(page, limit);
    return {
      ...response.data,
      items: response.data.items.map(toPetEntity),
    };
  },

  async getById(id: string): Promise<PetEntity> {
    const response = await petApi.getById(id);
    return toPetEntity(response.data);
  },

  async create(data: CreatePetRequest): Promise<PetEntity> {
    const response = await petApi.create(data);
    return toPetEntity(response.data);
  },

  async update(id: string, data: UpdatePetRequest): Promise<PetEntity> {
    const response = await petApi.update(id, data);
    return toPetEntity(response.data);
  },

  async delete(id: string): Promise<void> {
    await petApi.delete(id);
  },

  async getByOwner(ownerId: string): Promise<PetEntity[]> {
    const response = await petApi.getByOwner(ownerId);
    return response.data.map(toPetEntity);
  },
};
