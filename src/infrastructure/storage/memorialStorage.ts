import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MemorialComment } from '../../shared/data/memorialData';

export type MemorialStorageState = {
  commentsByPetId: Record<string, MemorialComment[]>;
  hasCompletedGuide: boolean;
  notificationCountByPetId: Record<string, number>;
};

const MEMORIAL_STORAGE_KEY = '@pawever/memorial';

const defaultMemorialStorageState: MemorialStorageState = {
  commentsByPetId: {},
  hasCompletedGuide: false,
  notificationCountByPetId: {},
};

const sanitizeStoredComment = (comment: Partial<MemorialComment> | null | undefined): MemorialComment | null => {
  if (!comment) {
    return null;
  }

  const id = comment.id?.trim();
  const authorId = comment.authorId?.trim();
  const authorDisplayName = comment.authorDisplayName?.trim();
  const authorPetName = comment.authorPetName?.trim();
  const text = comment.text?.trim();
  const createdAt = comment.createdAt?.trim();
  const authorRole = comment.authorRole === 'OWNER' ? 'OWNER' : 'GUEST';

  if (!id || !authorId || !authorDisplayName || !authorPetName || !text || !createdAt) {
    return null;
  }

  return {
    authorDisplayName,
    authorId,
    authorPetId: Number.isFinite(comment.authorPetId) ? Number(comment.authorPetId) : -1,
    authorPetName,
    authorRole,
    createdAt,
    id,
    text,
  };
};

const sanitizeCommentsByPetId = (value: Record<string, MemorialComment[] | Partial<MemorialComment>[]>) =>
  Object.entries(value).reduce<Record<string, MemorialComment[]>>((accumulator, [petId, comments]) => {
    accumulator[petId] = (comments ?? [])
      .map(sanitizeStoredComment)
      .filter((comment): comment is MemorialComment => Boolean(comment));
    return accumulator;
  }, {});

const sanitizeNotificationCountByPetId = (value: Record<string, number>) =>
  Object.entries(value).reduce<Record<string, number>>((accumulator, [petId, count]) => {
    const safeCount = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
    accumulator[petId] = safeCount;
    return accumulator;
  }, {});

export async function readStoredMemorialState() {
  const raw = await AsyncStorage.getItem(MEMORIAL_STORAGE_KEY);

  if (!raw) {
    return defaultMemorialStorageState;
  }

  const parsed = JSON.parse(raw) as Partial<MemorialStorageState>;

  return {
    commentsByPetId: sanitizeCommentsByPetId(parsed.commentsByPetId ?? {}),
    hasCompletedGuide: parsed.hasCompletedGuide ?? false,
    notificationCountByPetId: sanitizeNotificationCountByPetId(parsed.notificationCountByPetId ?? {}),
  };
}

export async function writeStoredMemorialState(nextState: Partial<MemorialStorageState>) {
  const currentState = await readStoredMemorialState();
  const mergedState: MemorialStorageState = {
    commentsByPetId: nextState.commentsByPetId
      ? sanitizeCommentsByPetId(nextState.commentsByPetId)
      : currentState.commentsByPetId,
    hasCompletedGuide: nextState.hasCompletedGuide ?? currentState.hasCompletedGuide,
    notificationCountByPetId: nextState.notificationCountByPetId
      ? sanitizeNotificationCountByPetId(nextState.notificationCountByPetId)
      : currentState.notificationCountByPetId,
  };

  await AsyncStorage.setItem(MEMORIAL_STORAGE_KEY, JSON.stringify(mergedState));
}

export async function clearStoredMemorialState() {
  await AsyncStorage.removeItem(MEMORIAL_STORAGE_KEY);
}
