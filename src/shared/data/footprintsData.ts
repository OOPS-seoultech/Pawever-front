export type FootprintsSectionId = 'stamp' | 'record' | 'message';

export type FootprintsMissionDefinition = {
  emoji: string;
  id: string;
  subtitle: string;
  title: string;
};

const stampMissionTitles = [
  ['stamp-home-party', '🍖', '홈파티 벌여주기', '맛있는 선물로 채우는 최고의 만찬'],
  ['stamp-photo-booth', '📸', '인생네컷 찍기', '하루를 오래 붙잡아둘 네 컷의 기록'],
  ['stamp-paw-print', '🐾', '발도장 만들기', '오늘의 온기를 남기는 작고 귀여운 흔적'],
  ['stamp-sniff-freely', '🌿', '원없이 냄새 맡게 하기', '좋아하는 공기와 계절을 마음껏 맡게 해주세요'],
  ['stamp-fur-keepsake', '🪮', '털 뭉치 보관하기', '작은 조각으로 오래 곁에 두는 기억'],
  ['stamp-drive-thru', '🚗', '드라이브 스루', '차창 밖 풍경을 함께 보는 짧은 모험'],
  ['stamp-day-together', '🧑‍🦯', '하루 동안 시간 보내기', '하고 싶은 일을 한 번 더 같이 해보세요'],
  ['stamp-sunset', '🌅', '노을 같이 보기', '천천히 변하는 하늘을 함께 바라보는 시간'],
  ['stamp-spa', '🛁', '최고급 스파 시켜주기', '보송한 감촉을 남기는 편안한 휴식'],
  ['stamp-toy-shopping', '🧸', '장난감 쇼핑', '좋아하는 장난감을 고르는 들뜬 순간'],
  ['stamp-sniff-deeply', '👃', '꼬순내 깊이 맡기', '가장 익숙한 체취를 오래 기억해 주세요'],
  ['stamp-album-marathon', '📚', '추억 앨범 정주행', '함께했던 순간을 천천히 다시 훑어봐요'],
  ['stamp-shoe-bite', '👟', '신발 물어뜯기', '말썽 같은 장난도 추억으로 남겨요'],
  ['stamp-eye-contact', '👀', '10분동안 마주보기', '말 없이 눈을 맞추는 조용한 위로'],
  ['stamp-smell-storage', '🧺', '냄새 보관하기', '담요나 옷에 남은 온기를 기억해 주세요'],
  ['stamp-chocolate-factory', '🍫', '초콜릿 공장', '먹지 못하는 간식 대신 모양만 즐겨보는 놀이'],
  ['stamp-goods-source', '🏷️', '굿즈 소스 확보', '나중을 위해 사진과 자료를 모아 둬요'],
  ['stamp-sunlight-nap', '🌤️', '햇살 아래 낮잠', '가장 포근한 자리에서 쉬어가는 시간'],
] as const;

const recordMissionTitles = [
  ['record-sleep-breath', '😴', '새근새근 잠자는 숨소리', '조용한 밤을 채우던 가장 익숙한 호흡'],
  ['record-snore', '🫧', '드르렁 코고는 소리', '웃음이 나던 잠버릇도 남겨보세요'],
  ['record-greeting', '🐶', '세상에서 가장 반가운 인사', '문 앞에서 반겨주던 목소리'],
  ['record-heartbeat', '💓', '생명의 심장 박동', '곁에 있음을 알려주던 힘찬 리듬'],
  ['record-food-asmr', '🥣', '오독오독 사료 ASMR', '사료를 씹던 부지런한 소리'],
  ['record-paw-click', '👣', '찰깍찰깍 발자국 소리', '바닥 위를 뛰어오던 발걸음'],
  ['record-purring', '🐱', '행복의 가르릉(골골송)', '편안할 때만 들려주던 소리'],
  ['record-yawn', '😮', '하품할 때 귀여운 소리', '하루가 느긋해지는 작은 순간'],
  ['record-begging', '🦴', '간식 보채는 애교 소리', '더 달라고 조르던 목소리'],
  ['record-squeaky-toy', '🪀', '장난감 삑삑이 소리', '한참 놀다가 더 신났던 소리'],
  ['record-waiting', '🚪', '애틋한 기다림의 소리', '발소리만 들려도 먼저 달려오던 소리'],
  ['record-sleep-talk', '💤', '꿈꾸는 잠꼬대 소리', '작은 움직임마저 귀엽던 밤의 기록'],
  ['record-answer', '😺', '다정한 대답 소리', '불러주면 꼭 답해주던 반응'],
  ['record-grooming', '🛁', '찹찹 정성스러운 그루밍', '온몸을 다듬던 사랑스러운 루틴'],
  ['record-shake', '🌪️', '따다닥다닥 몸 터는 소리', '신나거나 젖은 뒤에 꼭 하던 소리'],
  ['record-panting', '😮‍💨', '설레 가득한 헥헥거림', '뛰어놀고 난 뒤 숨찬 순간'],
  ['record-tail', '🐕', '딱닥딱 기분 좋은 꼬리 소리', '행복할 때 유난히 바빠지던 꼬리'],
  ['record-walk', '🦮', '산책 소리 녹음!', '밖으로 나가던 순간의 공기까지 남겨보세요'],
] as const;

const messageMissionTitles = [
  ['message-thanks', '💛', '오늘 가장 전하고 싶은 말', '지금 가장 먼저 떠오르는 마음을 남겨주세요'],
  ['message-first-day', '🌼', '처음 만난 날의 고마움', '처음 우리 집으로 온 날의 마음'],
  ['message-tomorrow', '🌙', '내일도 함께하자는 약속', '당연했던 내일을 향한 소망'],
  ['message-comfort', '🫂', '네가 준 위로', '힘든 날 곁을 지켜준 순간들'],
  ['message-favorite', '🍀', '네가 좋아하던 순간', '가장 환하게 빛나던 취향들'],
  ['message-family', '🏠', '우리 집이 된 날', '가족이 되는 건 어떤 일이었는지'],
  ['message-funny', '😂', '가장 웃겼던 장면', '생각만 해도 웃음 나는 장면을 남겨요'],
  ['message-strength', '💪', '힘들었던 날의 버팀목', '다시 일어설 수 있게 해준 기억'],
  ['message-proud', '✨', '가장 자랑스러웠던 순간', '유난히 뿌듯했던 하루를 떠올려요'],
  ['message-sorry', '🤍', '미안했던 마음', '마음 한켠에 남아 있던 말을 꺼내봐요'],
  ['message-love', '🧡', '처음 배운 사랑', '함께하며 처음 알게 된 감정'],
  ['message-eyes', '👀', '가장 따뜻했던 눈빛', '말보다 더 많은 걸 전해주던 눈빛'],
  ['message-seasons', '🍂', '함께한 계절의 냄새', '계절마다 달랐던 하루의 감각'],
  ['message-goodbye', '🕊️', '꼭 남기고 싶은 인사', '언젠가를 대비해 남겨두는 문장'],
  ['message-promise', '📝', '오늘의 다짐', '앞으로의 나에게 남기는 메모'],
  ['message-growing-old', '🪴', '같이 늙어가는 상상', '평범해서 더 소중했던 미래'],
  ['message-next-walk', '🌤️', '다음 산책의 약속', '함께 걷고 싶은 길을 떠올려요'],
  ['message-name', '🔖', '영원히 기억할 이름', '늘 불러왔던 이름을 또박또박 남겨요'],
] as const;

export const footprintsMissionDefinitions: Record<FootprintsSectionId, FootprintsMissionDefinition[]> = {
  message: messageMissionTitles.map(([id, emoji, title, subtitle]) => ({
    emoji,
    id,
    subtitle,
    title,
  })),
  record: recordMissionTitles.map(([id, emoji, title, subtitle]) => ({
    emoji,
    id,
    subtitle,
    title,
  })),
  stamp: stampMissionTitles.map(([id, emoji, title, subtitle]) => ({
    emoji,
    id,
    subtitle,
    title,
  })),
};

export const totalFootprintsMissionCount = Object.values(footprintsMissionDefinitions)
  .reduce((count, missionDefinitions) => count + missionDefinitions.length, 0);
