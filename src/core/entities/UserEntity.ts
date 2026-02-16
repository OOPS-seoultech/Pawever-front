/**
 * User 도메인 엔티티
 */

export interface UserEntity {
  id: string;
  email: string;
  nickname: string;
  profileImageUrl?: string;
  createdAt: string;
}

export function toUserEntity(raw: Record<string, any>): UserEntity {
  return {
    id: raw.id,
    email: raw.email,
    nickname: raw.nickname,
    profileImageUrl: raw.profile_image_url ?? raw.profileImageUrl,
    createdAt: raw.created_at ?? raw.createdAt,
  };
}
