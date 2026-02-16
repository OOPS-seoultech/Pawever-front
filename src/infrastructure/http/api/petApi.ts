/**
 * Pet API 엔드포인트 정의
 * 서버 통신 경로만 정의하고 비즈니스 로직은 포함하지 않음
 */

import {get, post, put, del} from '../httpClient';
import type {ApiResponse, PaginatedResponse} from '@shared/types/common';

export interface PetApiResponse {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  profile_image_url?: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePetRequest {
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  description?: string;
}

export interface UpdatePetRequest extends Partial<CreatePetRequest> {}

export const petApi = {
  getAll: (page = 1, limit = 20) =>
    get<ApiResponse<PaginatedResponse<PetApiResponse>>>(
      `/pets?page=${page}&limit=${limit}`,
    ),

  getById: (id: string) =>
    get<ApiResponse<PetApiResponse>>(`/pets/${id}`),

  create: (data: CreatePetRequest) =>
    post<ApiResponse<PetApiResponse>>('/pets', data),

  update: (id: string, data: UpdatePetRequest) =>
    put<ApiResponse<PetApiResponse>>(`/pets/${id}`, data),

  delete: (id: string) =>
    del<ApiResponse<void>>(`/pets/${id}`),

  getByOwner: (ownerId: string) =>
    get<ApiResponse<PetApiResponse[]>>(`/pets/owner/${ownerId}`),
};
