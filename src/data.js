// 학습 데이터 — 문제를 추가/수정하려면 이 파일만 고치면 됩니다.
// 문제 유형
//  listen : 🔊 소리를 듣고 맞는 단어 고르기 (say = 읽어줄 단어)
//  flash  : 단어를 1.5초 보여주고 숨긴 뒤, 맞는 소리(🔊 버튼) 고르기
//  choice : 보기 고르기 (timer 초를 주면 제한 시간)
//  order  : 단어 카드를 순서대로 눌러 문장 만들기
//  fill   : 틀 채우기 자기소개 (writing)
//  write  : 그림(이모지) 보고 한 문장 쓰기 (keywords 중 하나 포함 시 가산)

export const STAGES = [
  {
    id: 'phonics', title: '파닉스', emoji: '🔤', color: '#ff8a5b',
    lessons: [
      { id: 'ph1', title: '소리 구별하기', desc: '짧은 a vs 긴 a', questions: [
        { type: 'listen', say: 'cape', options: ['cap', 'cape'], answer: 'cape' },
        { type: 'listen', say: 'mad', options: ['mad', 'made'], answer: 'mad' },
        { type: 'listen', say: 'tape', options: ['tap', 'tape'], answer: 'tape' },
        { type: 'listen', say: 'hat', options: ['hat', 'hate'], answer: 'hat' },
        { type: 'listen', say: 'plane', options: ['plan', 'plane'], answer: 'plane' },
      ]},
      { id: 'ph2', title: '모음 이중자 ai / ay', desc: '가운데는 ai, 끝은 ay', questions: [
        { type: 'choice', prompt: 'r _ _ n  (비)', say: 'rain', options: ['ai', 'ay'], answer: 'ai' },
        { type: 'choice', prompt: 'tr _ _ n  (기차)', say: 'train', options: ['ai', 'ay'], answer: 'ai' },
        { type: 'choice', prompt: 'pl _ _  (놀다)', say: 'play', options: ['ai', 'ay'], answer: 'ay' },
        { type: 'choice', prompt: 'd _ _  (날, 하루)', say: 'day', options: ['ai', 'ay'], answer: 'ay' },
        { type: 'choice', prompt: 's _ _  (말하다)', say: 'say', options: ['ai', 'ay'], answer: 'ay' },
      ]},
      { id: 'ph3', title: '묵음 e (a_e)', desc: '끝의 e는 소리 X, a는 /eɪ/', questions: [
        { type: 'listen', say: 'cake', options: ['cake', 'cack', 'kick'], answer: 'cake' },
        { type: 'listen', say: 'make', options: ['mack', 'make', 'mike'], answer: 'make' },
        { type: 'listen', say: 'name', options: ['nam', 'name', 'numb'], answer: 'name' },
        { type: 'listen', say: 'game', options: ['gam', 'gum', 'game'], answer: 'game' },
        { type: 'listen', say: 'late', options: ['late', 'lat', 'let'], answer: 'late' },
      ]},
    ],
  },
  {
    id: 'sight', title: '사이트워드', emoji: '👀', color: '#ffc145',
    lessons: [
      { id: 'sw1', title: '헷갈리는 쌍', desc: '잠깐 보고 소리 고르기', questions: [
        { type: 'flash', word: 'was', options: ['was', 'saw'], answer: 'was' },
        { type: 'flash', word: 'saw', options: ['was', 'saw'], answer: 'saw' },
        { type: 'flash', word: 'they', options: ['then', 'they'], answer: 'they' },
        { type: 'flash', word: 'then', options: ['then', 'they'], answer: 'then' },
      ]},
      { id: 'sw2', title: '불규칙 철자', desc: '맞는 철자 고르기 (10초)', questions: [
        { type: 'choice', prompt: '맞는 철자는?  (친구)', options: ['freind', 'friend'], answer: 'friend', timer: 10 },
        { type: 'choice', prompt: '맞는 철자는?  (왜냐하면)', options: ['because', 'becouse'], answer: 'because', timer: 10 },
        { type: 'choice', prompt: '맞는 철자는?  (~일 것이다)', options: ['wuld', 'would'], answer: 'would', timer: 10 },
        { type: 'choice', prompt: '맞는 철자는?  (말했다)', options: ['said', 'sed'], answer: 'said', timer: 10 },
        { type: 'choice', prompt: '맞는 철자는?  (사람들)', options: ['peeple', 'people'], answer: 'people', timer: 10 },
      ]},
      { id: 'sw3', title: '불규칙 동사', desc: '과거형 고르기', questions: [
        { type: 'choice', prompt: 'go → ?', options: ['goed', 'went', 'gone'], answer: 'went' },
        { type: 'choice', prompt: 'eat → ?', options: ['ate', 'eated', 'eat'], answer: 'ate' },
        { type: 'choice', prompt: 'see → ?', options: ['seed', 'saw', 'sew'], answer: 'saw' },
        { type: 'choice', prompt: 'have → ?', options: ['haved', 'has', 'had'], answer: 'had' },
        { type: 'choice', prompt: 'make → ?', options: ['made', 'maked', 'make'], answer: 'made' },
      ]},
    ],
  },
  {
    id: 'colloc', title: '콜로케이션', emoji: '🔗', color: '#4cc38a',
    lessons: [
      { id: 'co1', title: '동사 짝꿍', desc: 'make / do / take / have', questions: [
        { type: 'choice', prompt: '(   ) a mistake', options: ['do', 'make', 'take'], answer: 'make' },
        { type: 'choice', prompt: '(   ) my homework', options: ['do', 'make', 'have'], answer: 'do' },
        { type: 'choice', prompt: '(   ) a shower', options: ['make', 'do', 'take'], answer: 'take' },
        { type: 'choice', prompt: '(   ) breakfast', options: ['have', 'do', 'make'], answer: 'have' },
        { type: 'choice', prompt: '(   ) a photo', options: ['do', 'take', 'have'], answer: 'take' },
      ]},
      { id: 'co2', title: '날씨 · 외모 표현', desc: '어울리는 단어 고르기', questions: [
        { type: 'choice', prompt: '(   ) rain  (폭우)', options: ['heavy', 'strong', 'big'], answer: 'heavy' },
        { type: 'choice', prompt: 'a (   ) sky  (맑은 하늘)', options: ['clear', 'heavy', 'loud'], answer: 'clear' },
        { type: 'choice', prompt: '(   ) hair  (긴 머리)', options: ['tall', 'long', 'high'], answer: 'long' },
        { type: 'choice', prompt: 'I (   ) glasses.  (안경을 쓰다)', options: ['put', 'wear', 'dress'], answer: 'wear' },
      ]},
      { id: 'co3', title: '전치사 짝꿍', desc: 'depend on, good at …', questions: [
        { type: 'choice', prompt: 'It depends (   ) the weather.', options: ['on', 'at', 'in'], answer: 'on' },
        { type: 'choice', prompt: 'She is good (   ) math.', options: ['in', 'at', 'on'], answer: 'at' },
        { type: 'choice', prompt: 'I am interested (   ) music.', options: ['in', 'of', 'to'], answer: 'in' },
        { type: 'choice', prompt: 'He is afraid (   ) dogs.', options: ['at', 'from', 'of'], answer: 'of' },
        { type: 'choice', prompt: 'Listen (   ) me.', options: ['to', 'at', 'for'], answer: 'to' },
      ]},
    ],
  },
  {
    id: 'pattern', title: '기본 문장 패턴', emoji: '🧱', color: '#4c9aff',
    lessons: [
      { id: 'pa1', title: 'be동사 + 형용사', desc: 'She is tall.', questions: [
        { type: 'choice', prompt: 'She (   ) tall.', options: ['am', 'is', 'are'], answer: 'is' },
        { type: 'choice', prompt: 'I (   ) hungry.', options: ['am', 'is', 'are'], answer: 'am' },
        { type: 'choice', prompt: 'They (   ) happy.', options: ['is', 'am', 'are'], answer: 'are' },
        { type: 'order', words: ['is', 'It', 'cold', '.'], answer: 'It is cold .' },
      ]},
      { id: 'pa2', title: 'have / like + 명사', desc: 'I have a dog.', questions: [
        { type: 'choice', prompt: 'I (   ) a dog.', options: ['have', 'has', 'am'], answer: 'have' },
        { type: 'choice', prompt: 'He (   ) pizza.', options: ['like', 'likes', 'is'], answer: 'likes' },
        { type: 'order', words: ['like', 'apples', 'I', '.'], answer: 'I like apples .' },
        { type: 'order', words: ['a', 'has', 'She', 'cat', '.'], answer: 'She has a cat .' },
      ]},
      { id: 'pa3', title: '어순 맞추기', desc: '누가-했다-어디-누구와-언제', questions: [
        { type: 'order', words: ['went', 'I', 'to', 'school', '.'], answer: 'I went to school .' },
        { type: 'order', words: ['my', 'went', 'to', 'yesterday', 'friend', 'the park', 'with', 'I', '.'], answer: 'I went to the park with my friend yesterday .' },
        { type: 'order', words: ['play', 'We', 'soccer', 'after school', '.'], answer: 'We play soccer after school .' },
      ]},
    ],
  },
  {
    id: 'writing', title: '짧은 글쓰기', emoji: '✍️', color: '#a46bff',
    lessons: [
      { id: 'wr1', title: '자기소개 틀 채우기', desc: '빈칸을 채워 소개하기', questions: [
        { type: 'fill', template: ['My name is', '.', 'I am', 'years old.', 'I have', 'hair.', 'I like', '.'],
          blanks: [
            { after: 0, hint: 'Minsu' },
            { after: 2, hint: '14', number: true },
            { after: 4, hint: 'short black' },
            { after: 6, hint: 'soccer' },
          ] },
      ]},
      { id: 'wr2', title: '그림 보고 한 문장', desc: '상황을 영어 한 문장으로', questions: [
        { type: 'write', picture: '🌧️☂️🧒', guide: '비 오는 날, 아이가 우산을 들고 있어요.', keywords: ['rain', 'raining', 'umbrella', 'rainy'] },
        { type: 'write', picture: '🐶⚽🌳', guide: '강아지가 공원에서 공을 가지고 놀아요.', keywords: ['dog', 'ball', 'park', 'play', 'plays', 'playing'] },
        { type: 'write', picture: '👧🍕😋', guide: '여자아이가 피자를 맛있게 먹어요.', keywords: ['pizza', 'eat', 'eats', 'eating', 'likes', 'like'] },
      ]},
    ],
  },
];

// 진단평가: 각 영역에서 2/3 미만이면 그 단계부터 시작
export const DIAGNOSTIC = [
  { stage: 0, title: 'Step 1 · Phonics', questions: [
    { type: 'listen', say: 'cake', options: ['cack', 'cake'], answer: 'cake' },
    { type: 'listen', say: 'rain', options: ['ran', 'rain'], answer: 'rain' },
    { type: 'listen', say: 'hat', options: ['hat', 'hate'], answer: 'hat' },
  ]},
  { stage: 1, title: 'Step 2 · Sight words', questions: [
    { type: 'flash', word: 'saw', options: ['was', 'saw'], answer: 'saw' },
    { type: 'choice', prompt: '맞는 철자는?', options: ['becouse', 'because'], answer: 'because', timer: 8 },
    { type: 'choice', prompt: '맞는 철자는?', options: ['friend', 'freind'], answer: 'friend', timer: 8 },
  ]},
  { stage: 2, title: 'Step 3 · Collocation', questions: [
    { type: 'choice', prompt: '(   ) a mistake', options: ['do', 'make', 'take'], answer: 'make' },
    { type: 'choice', prompt: 'It depends (   ) you.', options: ['on', 'at', 'to'], answer: 'on' },
    { type: 'choice', prompt: 'She is good (   ) English.', options: ['in', 'at', 'for'], answer: 'at' },
  ]},
  { stage: 3, title: 'Step 4 · Writing', questions: [
    { type: 'order', words: ['my', 'went', 'to', 'yesterday', 'friend', 'the park', 'with', 'I', '.'], answer: 'I went to the park with my friend yesterday .' },
    { type: 'order', words: ['is', 'She', 'tall', '.'], answer: 'She is tall .' },
    { type: 'write', picture: '🌧️☂️', guide: '그림을 보고 한 문장을 써 보세요.', keywords: ['rain', 'raining', 'umbrella', 'rainy'] },
  ]},
];

// 연속 학습일 보너스
export const STREAK_MILESTONES = [
  { days: 3, points: 20 }, { days: 7, points: 50 }, { days: 14, points: 100 },
  { days: 30, points: 200 }, { days: 60, points: 400 },
];

// 보상 상점: 캐릭터(비금전) + 쿠폰(선생님 확인 후 지급)
export const STORE = [
  { id: 'av_cat', kind: 'avatar', name: '고양이', icon: '🐱', price: 0 },
  { id: 'av_fox', kind: 'avatar', name: '여우', icon: '🦊', price: 60 },
  { id: 'av_panda', kind: 'avatar', name: '판다', icon: '🐼', price: 100 },
  { id: 'av_robot', kind: 'avatar', name: '로봇', icon: '🤖', price: 150 },
  { id: 'av_dragon', kind: 'avatar', name: '드래곤', icon: '🐲', price: 300 },
  { id: 'av_unicorn', kind: 'avatar', name: '유니콘', icon: '🦄', price: 500 },
  { id: 'cp_snack', kind: 'coupon', name: '간식 쿠폰', icon: '🍦', price: 300 },
  { id: 'cp_seat', kind: 'coupon', name: '자리 선택권', icon: '💺', price: 400 },
  { id: 'cp_music', kind: 'coupon', name: '쉬는시간 음악 선곡권', icon: '🎵', price: 250 },
];

export const LEAGUES = ['브론즈', '실버', '골드', '플래티넘', '다이아'];
