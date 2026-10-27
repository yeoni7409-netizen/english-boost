import { STREAK_MILESTONES } from './data.js';

// 학생 기록은 이 기기 브라우저(localStorage)에만 저장됩니다. 서버로 보내지 않습니다.
const KEY = 'english-boost-v1';

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const weekKey = (dateStr = today()) => {
  const d = new Date(dateStr);
  const day = (d.getDay() + 6) % 7; // 월요일 시작
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const initialState = {
  nickname: '', avatar: 'av_cat', owned: ['av_cat'], points: 0,
  diagnosed: false, startStage: 0, stars: {},
  streak: { current: 0, best: 0, last: null }, streakClaimed: [],
  daily: {}, bestDailyClears: 0, bestFocusSec: 0,
  weekDays: {}, weekXp: {}, weekBonusClaimed: [],
  badges: [], coupons: [],
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch { return initialState; }
}

export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 저장 불가 환경 무시 */ }
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

// 단계 완료 시 호출 → 새 상태와 알림 메시지 반환
export function applyLessonResult(state, lessonId, stars, focusSec) {
  const s = structuredClone(state);
  const msgs = [];
  const t = today();
  const wk = weekKey(t);
  const prev = s.stars[lessonId] || 0;

  if (stars > prev) {
    const gained = (stars - prev) * 10;
    s.stars[lessonId] = stars;
    s.points += gained;
    s.weekXp[wk] = (s.weekXp[wk] || 0) + gained;
    msgs.push(`⭐ 새 별 ${stars - prev}개! +${gained}P`);
  } else {
    s.weekXp[wk] = (s.weekXp[wk] || 0) + 2; // 복습도 리그 점수 조금
  }

  // 연속 학습일
  if (s.streak.last !== t) {
    const gap = s.streak.last ? daysBetween(s.streak.last, t) : null;
    s.streak.current = gap === 1 ? s.streak.current + 1 : 1;
    s.streak.last = t;
    s.streak.best = Math.max(s.streak.best, s.streak.current);
    for (const m of STREAK_MILESTONES) {
      const tag = `${m.days}@${t}`;
      if (s.streak.current === m.days && !s.streakClaimed.includes(tag)) {
        s.streakClaimed.push(tag);
        s.points += m.points;
        msgs.push(`🔥 ${m.days}일 연속 학습! +${m.points}P`);
      }
    }
  }

  // 주간 참여일
  s.weekDays[wk] = Array.from(new Set([...(s.weekDays[wk] || []), t]));
  if (s.weekDays[wk].length >= 5 && !s.weekBonusClaimed.includes(wk)) {
    s.weekBonusClaimed.push(wk);
    s.points += 50;
    msgs.push('📅 이번 주 5일 학습 달성! 참여 보너스 +50P');
  }

  // 개인 기록
  s.daily[t] = (s.daily[t] || 0) + (stars > 0 ? 1 : 0);
  if (s.daily[t] > s.bestDailyClears) {
    s.bestDailyClears = s.daily[t];
    if (s.daily[t] > 1) msgs.push(`🏅 하루 최다 클리어 신기록: ${s.daily[t]}단계`);
  }
  if (focusSec > s.bestFocusSec) {
    if (s.bestFocusSec > 0) msgs.push(`⏱️ 최장 집중 시간 신기록: ${fmtTime(focusSec)}`);
    s.bestFocusSec = focusSec;
  }

  // 뱃지
  const addBadge = (id, label) => {
    if (!s.badges.includes(id)) { s.badges.push(id); s.points += 15; msgs.push(`🎖️ 뱃지 획득: ${label} +15P`); }
  };
  if (stars === 3) addBadge('perfect', '첫 PERFECT');
  if (Object.keys(s.stars).length >= 5) addBadge('five', '5단계 도전자');
  if (s.streak.current >= 7) addBadge('week', '일주일 개근');

  return { state: s, msgs };
}

export const fmtTime = (sec) => `${Math.floor(sec / 60)}분 ${sec % 60}초`;

export const BADGE_INFO = {
  perfect: { icon: '🌟', label: '첫 PERFECT' },
  five: { icon: '🧭', label: '5단계 도전자' },
  week: { icon: '🔥', label: '일주일 개근' },
};
