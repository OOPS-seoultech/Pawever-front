export type FuneralCompanyRegistrationType = 'BLOCKED' | 'SAVED' | null;

export type FuneralCompanyReview = {
  canDelete: boolean;
  content: string;
  createdAt: string;
  petName: string;
  rating: number;
  reviewId: number;
  userId: number;
  userNickname: string;
};

export type FuneralCompanyMock = {
  email: string;
  freeBasicUrn: boolean;
  fullObservation: boolean;
  guideText: string;
  id: number;
  imageCards: Array<{
    backgroundColor: string;
    emoji: string;
    label: string;
  }>;
  introduction: string;
  latitude: number;
  location: string;
  longitude: number;
  memorialStone: boolean;
  name: string;
  open24Hours: boolean;
  ossuary: boolean;
  phone: string;
  pickupService: boolean;
  priceEstimateMax: number;
  priceEstimateMin: number;
  privateMemorialRoom: boolean;
  ratingAverage: number;
  ratingCount: number;
  reviews: FuneralCompanyReview[];
  roadAddress: string;
  serviceDescription: string;
  sido: string;
  sigungu: string;
};

export type FuneralCompanyListItem = {
  distanceKm: number | null;
  id: number;
  location: string;
  name: string;
  userRegistrationType: FuneralCompanyRegistrationType;
};

export type FuneralCompanyDetail = FuneralCompanyMock & {
  distanceKm: number | null;
  userRegistrationType: FuneralCompanyRegistrationType;
};

export type FuneralCompanyOptionId =
  | 'freeBasicUrn'
  | 'fullObservation'
  | 'memorialStone'
  | 'open24Hours'
  | 'ossuary'
  | 'pickupService'
  | 'privateMemorialRoom';

export type FuneralCompaniesSortType = 'cost' | 'distance' | 'reviews';

export const funeralCompanyOptionDefinitions: Array<{
  id: FuneralCompanyOptionId;
  label: string;
}> = [
  { id: 'fullObservation', label: '👀 전 과정 참관 가능' },
  { id: 'open24Hours', label: '🕒 24시간 장례/상담' },
  { id: 'pickupService', label: '🚑 픽업/운구 서비스' },
  { id: 'memorialStone', label: '💎 메모리얼 스톤(루세떼) 제작' },
  { id: 'privateMemorialRoom', label: '🏠 단독 추모실 제공' },
  { id: 'ossuary', label: '🌳 납골당/수목장 보유' },
  { id: 'freeBasicUrn', label: '⚱️ 기본 유골함 무료 제공' },
] as const;

export const funeralCompaniesMockData: FuneralCompanyMock[] = [
  {
    email: 'gangnam@pawever-funeral.mock',
    freeBasicUrn: true,
    fullObservation: true,
    guideText: '강남권 반려동물 가족을 위해 상담부터 장례, 분골, 추모까지 한 동선에서 안내합니다.',
    id: 1,
    imageCards: [
      { backgroundColor: '#FFF2DB', emoji: '🏛️', label: '메인 홀' },
      { backgroundColor: '#F3ECE4', emoji: '🕯️', label: '추모실' },
      { backgroundColor: '#F7E6D2', emoji: '🚐', label: '운구 차량' },
    ],
    introduction: '도심 접근성이 좋아 마지막 인사를 준비하기 편한 강남권 장례업체입니다.',
    latitude: 37.4982,
    location: '서울특별시 강남구 테헤란로 221',
    longitude: 127.0284,
    memorialStone: true,
    name: '포에버 강남 메모리얼',
    open24Hours: true,
    ossuary: false,
    phone: '02-567-4100',
    pickupService: true,
    priceEstimateMax: 950000,
    priceEstimateMin: 350000,
    privateMemorialRoom: true,
    ratingAverage: 4.8,
    ratingCount: 132,
    reviews: [
      {
        canDelete: false,
        content: '상담이 차분했고 마지막 인사를 충분히 할 수 있게 시간을 넉넉히 주셨어요.',
        createdAt: '2026-02-11T13:20:00',
        petName: '몽몽이',
        rating: 5,
        reviewId: 1,
        userId: 21,
        userNickname: '다정한보호자',
      },
      {
        canDelete: false,
        content: '주차가 편해서 가족들이 모이기 좋았습니다.',
        createdAt: '2026-01-23T18:05:00',
        petName: '보리',
        rating: 4,
        reviewId: 2,
        userId: 22,
        userNickname: '보리엄마',
      },
    ],
    roadAddress: '서울특별시 강남구 테헤란로 221',
    serviceDescription: '개별 추모실, 전 과정 참관, 24시간 상담, 운구 차량, 메모리얼 스톤 제작',
    sido: '서울특별시',
    sigungu: '강남구',
  },
  {
    email: 'songpa@pawever-funeral.mock',
    freeBasicUrn: false,
    fullObservation: true,
    guideText: '송파와 하남 경계권 가족을 위해 예약 동선과 비용 안내를 투명하게 제공합니다.',
    id: 2,
    imageCards: [
      { backgroundColor: '#F8EED9', emoji: '🛋️', label: '라운지' },
      { backgroundColor: '#F2E7DD', emoji: '🌿', label: '추모 정원' },
      { backgroundColor: '#F5E0D0', emoji: '⚱️', label: '안치 공간' },
    ],
    introduction: '조용한 추모실과 정돈된 동선이 장점인 송파권 메모리얼 센터입니다.',
    latitude: 37.5143,
    location: '서울특별시 송파구 위례성대로 88',
    longitude: 127.1067,
    memorialStone: false,
    name: '마루별 펫메모리얼 송파',
    open24Hours: false,
    ossuary: true,
    phone: '02-401-2290',
    pickupService: true,
    priceEstimateMax: 870000,
    priceEstimateMin: 320000,
    privateMemorialRoom: true,
    ratingAverage: 4.6,
    ratingCount: 98,
    reviews: [
      {
        canDelete: false,
        content: '설명 자료가 잘 정리되어 있어서 부모님께 안내드리기 좋았어요.',
        createdAt: '2026-02-19T09:30:00',
        petName: '하늘',
        rating: 5,
        reviewId: 3,
        userId: 23,
        userNickname: '하늘지기',
      },
    ],
    roadAddress: '서울특별시 송파구 위례성대로 88',
    serviceDescription: '전 과정 참관, 단독 추모실, 운구 서비스, 납골당 연계',
    sido: '서울특별시',
    sigungu: '송파구',
  },
  {
    email: 'hanam@pawever-funeral.mock',
    freeBasicUrn: true,
    fullObservation: false,
    guideText: '하남권 중심으로 실속형 장례를 찾는 보호자를 위한 패키지형 서비스를 제공합니다.',
    id: 3,
    imageCards: [
      { backgroundColor: '#FFF0E1', emoji: '🚐', label: '픽업' },
      { backgroundColor: '#F7EADB', emoji: '📋', label: '안내 데스크' },
      { backgroundColor: '#EFE6DE', emoji: '🪨', label: '메모리얼 스톤' },
    ],
    introduction: '합리적인 가격대와 깔끔한 운구 동선이 강점인 하남권 업체입니다.',
    latitude: 37.5398,
    location: '경기도 하남시 미사강변대로 118',
    longitude: 127.1964,
    memorialStone: true,
    name: '해든 반려동물 장례식장 하남',
    open24Hours: true,
    ossuary: false,
    phone: '031-792-6601',
    pickupService: true,
    priceEstimateMax: 680000,
    priceEstimateMin: 250000,
    privateMemorialRoom: false,
    ratingAverage: 4.4,
    ratingCount: 74,
    reviews: [],
    roadAddress: '경기도 하남시 미사강변대로 118',
    serviceDescription: '24시간 상담, 운구 서비스, 메모리얼 스톤, 기본 유골함 제공',
    sido: '경기도',
    sigungu: '하남시',
  },
  {
    email: 'goyang@pawever-funeral.mock',
    freeBasicUrn: false,
    fullObservation: true,
    guideText: '서북권 보호자를 위해 넓은 추모 공간과 세심한 참관 동선을 제공합니다.',
    id: 4,
    imageCards: [
      { backgroundColor: '#F8EED9', emoji: '🌳', label: '수목장' },
      { backgroundColor: '#F4E5D8', emoji: '🕯️', label: '예식실' },
      { backgroundColor: '#ECE7E1', emoji: '📷', label: '포토존' },
    ],
    introduction: '고양시 일산권에서 접근성이 좋고 수목장 연계가 가능한 메모리얼 파크입니다.',
    latitude: 37.6586,
    location: '경기도 고양시 일산동구 중앙로 1320',
    longitude: 126.7705,
    memorialStone: true,
    name: '온유 루세떼 메모리얼 고양',
    open24Hours: false,
    ossuary: true,
    phone: '031-905-0123',
    pickupService: false,
    priceEstimateMax: 990000,
    priceEstimateMin: 420000,
    privateMemorialRoom: true,
    ratingAverage: 4.9,
    ratingCount: 166,
    reviews: [
      {
        canDelete: false,
        content: '수목장 안내가 구체적이어서 마지막 선택을 차분히 할 수 있었어요.',
        createdAt: '2026-02-02T16:10:00',
        petName: '코코',
        rating: 5,
        reviewId: 4,
        userId: 24,
        userNickname: '코코집사',
      },
    ],
    roadAddress: '경기도 고양시 일산동구 중앙로 1320',
    serviceDescription: '전 과정 참관, 메모리얼 스톤, 단독 추모실, 수목장 연계',
    sido: '경기도',
    sigungu: '고양시',
  },
  {
    email: 'yongin@pawever-funeral.mock',
    freeBasicUrn: true,
    fullObservation: true,
    guideText: '용인과 분당 인근 보호자를 위해 예약형 단독 추모실과 맞춤 상담을 제공합니다.',
    id: 5,
    imageCards: [
      { backgroundColor: '#FDEEDC', emoji: '🏡', label: '단독 추모실' },
      { backgroundColor: '#F5E8DB', emoji: '🌙', label: '야간 상담' },
      { backgroundColor: '#EFE7E1', emoji: '📍', label: '지도 안내' },
    ],
    introduction: '프라이빗한 공간과 충분한 참관 시간을 원하는 보호자에게 적합한 곳입니다.',
    latitude: 37.2856,
    location: '경기도 용인시 수지구 광교중앙로 295',
    longitude: 127.0464,
    memorialStone: false,
    name: '별빛 반려 추모원 용인',
    open24Hours: true,
    ossuary: true,
    phone: '031-262-1127',
    pickupService: true,
    priceEstimateMax: 930000,
    priceEstimateMin: 390000,
    privateMemorialRoom: true,
    ratingAverage: 4.7,
    ratingCount: 121,
    reviews: [
      {
        canDelete: false,
        content: '아이와 마지막 인사를 길게 할 수 있게 배려해주셔서 감사했습니다.',
        createdAt: '2026-01-07T11:15:00',
        petName: '초롱',
        rating: 5,
        reviewId: 5,
        userId: 25,
        userNickname: '초롱아빠',
      },
    ],
    roadAddress: '경기도 용인시 수지구 광교중앙로 295',
    serviceDescription: '단독 추모실, 24시간 상담, 운구 서비스, 납골당 연계, 기본 유골함',
    sido: '경기도',
    sigungu: '용인시',
  },
  {
    email: 'gimpo@pawever-funeral.mock',
    freeBasicUrn: true,
    fullObservation: false,
    guideText: '김포와 검단권에서 가성비 좋은 장례 서비스를 찾는 보호자를 위한 실속형 센터입니다.',
    id: 6,
    imageCards: [
      { backgroundColor: '#FFF2DD', emoji: '🚗', label: '주차장' },
      { backgroundColor: '#F8EBDC', emoji: '🧾', label: '비용 안내' },
      { backgroundColor: '#EEE6DF', emoji: '📦', label: '기본 패키지' },
    ],
    introduction: '예산 범위를 먼저 고려하는 보호자에게 적합한 실속형 패키지를 제공합니다.',
    latitude: 37.6158,
    location: '경기도 김포시 김포한강1로 227',
    longitude: 126.7154,
    memorialStone: false,
    name: '다온 펫파크 김포',
    open24Hours: false,
    ossuary: false,
    phone: '031-983-5570',
    pickupService: true,
    priceEstimateMax: 590000,
    priceEstimateMin: 210000,
    privateMemorialRoom: false,
    ratingAverage: 4.3,
    ratingCount: 57,
    reviews: [],
    roadAddress: '경기도 김포시 김포한강1로 227',
    serviceDescription: '운구 서비스, 기본 유골함 무료 제공, 실속형 장례 패키지',
    sido: '경기도',
    sigungu: '김포시',
  },
  {
    email: 'bucheon@pawever-funeral.mock',
    freeBasicUrn: false,
    fullObservation: true,
    guideText: '부천과 서울 서남권을 연결하는 접근성 좋은 위치에서 참관형 장례를 지원합니다.',
    id: 7,
    imageCards: [
      { backgroundColor: '#FFF0DE', emoji: '👀', label: '참관석' },
      { backgroundColor: '#F6E9DD', emoji: '🧺', label: '유골함' },
      { backgroundColor: '#F0E7DF', emoji: '🚪', label: '단독 출입' },
    ],
    introduction: '서울 서남권 가족도 접근하기 좋은 위치와 참관 동선이 장점입니다.',
    latitude: 37.5038,
    location: '경기도 부천시 길주로 180',
    longitude: 126.7660,
    memorialStone: true,
    name: '품안 장례센터 부천',
    open24Hours: true,
    ossuary: false,
    phone: '032-322-6070',
    pickupService: false,
    priceEstimateMax: 740000,
    priceEstimateMin: 290000,
    privateMemorialRoom: true,
    ratingAverage: 4.5,
    ratingCount: 84,
    reviews: [
      {
        canDelete: false,
        content: '참관실이 넓지는 않지만 조용하고 정돈되어 있었어요.',
        createdAt: '2026-02-22T14:00:00',
        petName: '두부',
        rating: 4,
        reviewId: 6,
        userId: 26,
        userNickname: '두부아빠',
      },
    ],
    roadAddress: '경기도 부천시 길주로 180',
    serviceDescription: '전 과정 참관, 단독 추모실, 메모리얼 스톤 제작',
    sido: '경기도',
    sigungu: '부천시',
  },
  {
    email: 'namyangju@pawever-funeral.mock',
    freeBasicUrn: true,
    fullObservation: false,
    guideText: '남양주 외곽형 추모 공간으로, 자연 친화적인 추모를 원하는 보호자에게 어울립니다.',
    id: 8,
    imageCards: [
      { backgroundColor: '#FFF1E0', emoji: '🌲', label: '야외 공간' },
      { backgroundColor: '#F9ECDD', emoji: '🪦', label: '봉안 공간' },
      { backgroundColor: '#EDE6E0', emoji: '☕', label: '대기 라운지' },
    ],
    introduction: '도심을 벗어난 차분한 분위기 속에서 장례를 진행할 수 있는 남양주권 업체입니다.',
    latitude: 37.6544,
    location: '경기도 남양주시 다산중앙로 145',
    longitude: 127.3102,
    memorialStone: false,
    name: '소풍 메모리얼 남양주',
    open24Hours: false,
    ossuary: true,
    phone: '031-553-9041',
    pickupService: true,
    priceEstimateMax: 810000,
    priceEstimateMin: 340000,
    privateMemorialRoom: false,
    ratingAverage: 4.2,
    ratingCount: 49,
    reviews: [],
    roadAddress: '경기도 남양주시 다산중앙로 145',
    serviceDescription: '운구 서비스, 납골당/수목장 연계, 기본 유골함 무료 제공',
    sido: '경기도',
    sigungu: '남양주시',
  },
  {
    email: 'anyang@pawever-funeral.mock',
    freeBasicUrn: false,
    fullObservation: true,
    guideText: '안양과 과천, 군포권을 잇는 중간 거점으로 빠른 상담과 정돈된 절차 안내를 제공합니다.',
    id: 9,
    imageCards: [
      { backgroundColor: '#FDEEDB', emoji: '📞', label: '상담실' },
      { backgroundColor: '#F3E7DA', emoji: '💐', label: '헌화 공간' },
      { backgroundColor: '#EFE6DD', emoji: '📝', label: '절차 안내' },
    ],
    introduction: '빠른 상담 응대와 단계별 안내가 꼼꼼해 처음 장례를 준비하는 보호자에게 적합합니다.',
    latitude: 37.3942,
    location: '경기도 안양시 동안구 시민대로 312',
    longitude: 126.9567,
    memorialStone: true,
    name: '루시드 펫메모리얼 안양',
    open24Hours: true,
    ossuary: false,
    phone: '031-447-8710',
    pickupService: true,
    priceEstimateMax: 760000,
    priceEstimateMin: 310000,
    privateMemorialRoom: true,
    ratingAverage: 4.6,
    ratingCount: 91,
    reviews: [
      {
        canDelete: false,
        content: '처음이라 많이 떨렸는데 순서를 한 번씩 다시 설명해주셔서 도움이 됐어요.',
        createdAt: '2026-02-04T10:40:00',
        petName: '감자',
        rating: 5,
        reviewId: 7,
        userId: 27,
        userNickname: '감자누나',
      },
    ],
    roadAddress: '경기도 안양시 동안구 시민대로 312',
    serviceDescription: '24시간 상담, 전 과정 참관, 단독 추모실, 운구 서비스, 메모리얼 스톤',
    sido: '경기도',
    sigungu: '안양시',
  },
  {
    email: 'seongnam@pawever-funeral.mock',
    freeBasicUrn: true,
    fullObservation: true,
    guideText: '성남과 분당권 가족을 위해 프리미엄 추모실과 장례 이후 메모리얼 서비스까지 제공합니다.',
    id: 10,
    imageCards: [
      { backgroundColor: '#FDEEDD', emoji: '🛏️', label: '프리미엄실' },
      { backgroundColor: '#F6E8DD', emoji: '🖼️', label: '포토 메모리얼' },
      { backgroundColor: '#EEE6DE', emoji: '🌸', label: '헌화실' },
    ],
    introduction: '프리미엄 추모 공간과 이후 메모리얼 굿즈 상담까지 한 번에 가능한 성남권 업체입니다.',
    latitude: 37.3927,
    location: '경기도 성남시 분당구 판교역로 240',
    longitude: 127.1112,
    memorialStone: true,
    name: '다시봄 반려 추모관 성남',
    open24Hours: true,
    ossuary: true,
    phone: '031-701-4104',
    pickupService: true,
    priceEstimateMax: 1000000,
    priceEstimateMin: 430000,
    privateMemorialRoom: true,
    ratingAverage: 4.9,
    ratingCount: 173,
    reviews: [
      {
        canDelete: false,
        content: '시설이 정갈했고 사진으로 남길 수 있는 공간이 예뻤어요.',
        createdAt: '2026-02-08T17:45:00',
        petName: '설탕',
        rating: 5,
        reviewId: 8,
        userId: 28,
        userNickname: '설탕맘',
      },
      {
        canDelete: false,
        content: '가격은 조금 높지만 서비스와 공간을 생각하면 납득할 수 있었습니다.',
        createdAt: '2026-01-28T15:12:00',
        petName: '호두',
        rating: 4,
        reviewId: 9,
        userId: 29,
        userNickname: '호두집사',
      },
    ],
    roadAddress: '경기도 성남시 분당구 판교역로 240',
    serviceDescription: '프리미엄 단독 추모실, 전 과정 참관, 24시간 상담, 운구 서비스, 수목장 연계, 기본 유골함',
    sido: '경기도',
    sigungu: '성남시',
  },
] as const;
