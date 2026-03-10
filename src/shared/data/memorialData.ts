import type { PetLifecycleStatus } from '../../core/entities/pet';

export type MemorialAuthorRole = 'OWNER' | 'GUEST';

export type MemorialProfile = {
  animalTypeName: string;
  farewellDate: string | null;
  id: number;
  inviteCode: string;
  lifecycleStatus: PetLifecycleStatus;
  memorialExists: boolean;
  name: string;
  ownerDisplayName: string;
  profileImageUrl: string | null;
};

export type MemorialComment = {
  authorDisplayName: string;
  authorId: string;
  authorPetId: number;
  authorPetName: string;
  authorRole: MemorialAuthorRole;
  createdAt: string;
  id: string;
  text: string;
};

export type MemorialConstellationPattern = {
  featured: {
    leftRatio: number;
    size: number;
    topRatio: number;
  };
  id: string;
  orbitStars: Array<{
    leftRatio: number;
    size: number;
    topRatio: number;
  }>;
};

export const memorialConstellationPatterns: MemorialConstellationPattern[] = [
  {
    featured: { leftRatio: 0.53, size: 108, topRatio: 0.31 },
    id: 'aurora',
    orbitStars: [
      { leftRatio: 0.11, size: 44, topRatio: 0.24 },
      { leftRatio: 0.33, size: 38, topRatio: 0.16 },
      { leftRatio: 0.31, size: 34, topRatio: 0.41 },
      { leftRatio: 0.82, size: 36, topRatio: 0.58 },
    ],
  },
  {
    featured: { leftRatio: 0.46, size: 104, topRatio: 0.28 },
    id: 'comet',
    orbitStars: [
      { leftRatio: 0.15, size: 34, topRatio: 0.45 },
      { leftRatio: 0.27, size: 42, topRatio: 0.2 },
      { leftRatio: 0.69, size: 38, topRatio: 0.19 },
      { leftRatio: 0.8, size: 40, topRatio: 0.47 },
    ],
  },
  {
    featured: { leftRatio: 0.58, size: 112, topRatio: 0.34 },
    id: 'midnight',
    orbitStars: [
      { leftRatio: 0.12, size: 40, topRatio: 0.18 },
      { leftRatio: 0.24, size: 36, topRatio: 0.52 },
      { leftRatio: 0.45, size: 34, topRatio: 0.14 },
      { leftRatio: 0.77, size: 42, topRatio: 0.3 },
    ],
  },
];

export const mockMemorialProfiles: MemorialProfile[] = [
  {
    animalTypeName: '강아지',
    farewellDate: '2026-03-08',
    id: 701,
    inviteCode: 'STAR701',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '별빛',
    ownerDisplayName: '민서',
    profileImageUrl: null,
  },
  {
    animalTypeName: '고양이',
    farewellDate: '2026-03-03',
    id: 702,
    inviteCode: 'STAR702',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '나비',
    ownerDisplayName: '서윤',
    profileImageUrl: null,
  },
  {
    animalTypeName: '강아지',
    farewellDate: '2026-02-17',
    id: 703,
    inviteCode: 'STAR703',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '해솔',
    ownerDisplayName: '지후',
    profileImageUrl: null,
  },
  {
    animalTypeName: '햄스터',
    farewellDate: '2026-01-19',
    id: 704,
    inviteCode: 'STAR704',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '초코',
    ownerDisplayName: '예린',
    profileImageUrl: null,
  },
  {
    animalTypeName: '거북이',
    farewellDate: '2026-03-05',
    id: 705,
    inviteCode: 'STAR705',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '모카',
    ownerDisplayName: '태양',
    profileImageUrl: null,
  },
  {
    animalTypeName: '물고기',
    farewellDate: '2026-02-11',
    id: 706,
    inviteCode: 'STAR706',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '루루',
    ownerDisplayName: '가은',
    profileImageUrl: null,
  },
  {
    animalTypeName: '새',
    farewellDate: null,
    id: 707,
    inviteCode: 'STAR707',
    lifecycleStatus: 'BEFORE_FAREWELL',
    memorialExists: false,
    name: '구름',
    ownerDisplayName: '현우',
    profileImageUrl: null,
  },
  {
    animalTypeName: '고양이',
    farewellDate: '2026-02-28',
    id: 708,
    inviteCode: 'STAR708',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '레오',
    ownerDisplayName: '도연',
    profileImageUrl: null,
  },
  {
    animalTypeName: '강아지',
    farewellDate: '2026-01-06',
    id: 709,
    inviteCode: 'STAR709',
    lifecycleStatus: 'AFTER_FAREWELL',
    memorialExists: true,
    name: '보리',
    ownerDisplayName: '채원',
    profileImageUrl: null,
  },
  {
    animalTypeName: '파충류',
    farewellDate: null,
    id: 710,
    inviteCode: 'STAR710',
    lifecycleStatus: 'BEFORE_FAREWELL',
    memorialExists: false,
    name: '루미',
    ownerDisplayName: '시온',
    profileImageUrl: null,
  },
];

export const mockMemorialCommentsByPetId: Record<number, MemorialComment[]> = {
  701: [
    {
      authorDisplayName: '민서',
      authorId: 'user:701-owner',
      authorPetId: 701,
      authorPetName: '별빛',
      authorRole: 'OWNER',
      createdAt: '2026-03-09T09:40:00.000Z',
      id: '701-1',
      text: '오늘도 네가 뛰어오던 소리를 기억하고 있어',
    },
    {
      authorDisplayName: '지후',
      authorId: 'user:703-owner',
      authorPetId: 703,
      authorPetName: '해솔',
      authorRole: 'GUEST',
      createdAt: '2026-03-09T10:05:00.000Z',
      id: '701-2',
      text: '별빛이가 반짝이는 별로 오래 남아있길 바라요',
    },
  ],
  702: [
    {
      authorDisplayName: '서윤',
      authorId: 'user:702-owner',
      authorPetId: 702,
      authorPetName: '나비',
      authorRole: 'OWNER',
      createdAt: '2026-03-08T08:10:00.000Z',
      id: '702-1',
      text: '따뜻한 햇살을 좋아하던 너를 오늘도 떠올려',
    },
  ],
  703: [
    {
      authorDisplayName: '지후',
      authorId: 'user:703-owner',
      authorPetId: 703,
      authorPetName: '해솔',
      authorRole: 'OWNER',
      createdAt: '2026-02-20T14:20:00.000Z',
      id: '703-1',
      text: '우리 해솔이의 꼬리 흔드는 모습이 아직 선명해',
    },
  ],
  704: [
    {
      authorDisplayName: '예린',
      authorId: 'user:704-owner',
      authorPetId: 704,
      authorPetName: '초코',
      authorRole: 'OWNER',
      createdAt: '2026-01-21T07:35:00.000Z',
      id: '704-1',
      text: '작은 숨소리 하나까지도 다 기억하고 있어',
    },
  ],
  705: [
    {
      authorDisplayName: '태양',
      authorId: 'user:705-owner',
      authorPetId: 705,
      authorPetName: '모카',
      authorRole: 'OWNER',
      createdAt: '2026-03-06T12:30:00.000Z',
      id: '705-1',
      text: '천천히 걷던 그 발걸음이 아직도 내 하루를 지켜줘',
    },
    {
      authorDisplayName: '현우',
      authorId: 'user:707-owner',
      authorPetId: 707,
      authorPetName: '구름',
      authorRole: 'GUEST',
      createdAt: '2026-03-06T13:15:00.000Z',
      id: '705-2',
      text: '구름이와 함께 읽으며 조용히 위로를 보내고 있어요',
    },
  ],
  706: [
    {
      authorDisplayName: '가은',
      authorId: 'user:706-owner',
      authorPetId: 706,
      authorPetName: '루루',
      authorRole: 'OWNER',
      createdAt: '2026-02-15T05:55:00.000Z',
      id: '706-1',
      text: '작은 물결처럼 남아 있는 네 마음을 자주 만나러 와',
    },
  ],
  708: [
    {
      authorDisplayName: '도연',
      authorId: 'user:708-owner',
      authorPetId: 708,
      authorPetName: '레오',
      authorRole: 'OWNER',
      createdAt: '2026-03-01T11:18:00.000Z',
      id: '708-1',
      text: '레오야 오늘도 널 생각하며 창문을 오래 봤어',
    },
  ],
  709: [
    {
      authorDisplayName: '채원',
      authorId: 'user:709-owner',
      authorPetId: 709,
      authorPetName: '보리',
      authorRole: 'OWNER',
      createdAt: '2026-01-10T16:40:00.000Z',
      id: '709-1',
      text: '보리 덕분에 배운 사랑을 오래 간직할게',
    },
  ],
};
