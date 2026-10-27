import { useEffect, useMemo, useState } from 'react';
import { STAGES, DIAGNOSTIC, STREAK_MILESTONES, STORE, LEAGUES } from './data.js';
import { load, save, resetAll, initialState, applyLessonResult, today, weekKey, fmtTime, BADGE_INFO } from './store.js';
import Quiz, { toStars } from './Quiz.jsx';

// ───────── 주간 리그 (데모: 같은 리그의 '가상 친구'와 경쟁) ─────────
// 실제 반 친구들과 경쟁하려면 Supabase 같은 DB 연결이 필요합니다 (README 참고).
const BOT_NAMES = ['별빛곰', '파란고래', '번개토끼', '초코칩', '구름빵', '민트펭귄', '달팽이킹', '레몬소다',
  '햇살여우', '모찌모찌', '용감한콩', '바닐라', '도토리', '하늘다람쥐', '감자왕'];
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function leagueTable(state, wk, tier) {
  const dayIdx = Math.min(6, Math.max(0, Math.round((new Date(today()) - new Date(wk)) / 86400000)));
  const progress = wk === weekKey() ? (dayIdx + 1) / 7 : 1;
  const bots = BOT_NAMES.map((n) => ({
    name: n, bot: true,
    xp: Math.round((hash(n + wk + tier) % (120 + tier * 40)) * progress),
  }));
  const me = { name: state.nickname || '나', me: true, xp: state.weekXp[wk] || 0 };
  return [...bots, me].sort((a, b) => b.xp - a.xp || (a.me ? -1 : 1));
}

// 주가 바뀌면 지난주 결과로 승급/강등 + 상위 3명 포인트
function settleLeague(state) {
  const wk = weekKey();
  if (state.leagueWeek === wk) return { state, msgs: [] };
  const s = { ...state, leagueTier: state.leagueTier ?? 0, leagueWeek: wk };
  const msgs = [];
  if (state.leagueWeek && (state.weekXp[state.leagueWeek] || 0) > 0) {
    const table = leagueTable(state, state.leagueWeek, s.leagueTier);
    const rank = table.findIndex((r) => r.me) + 1;
    if (rank <= 3) {
      const bonus = [100, 70, 50][rank - 1];
      s.points += bonus;
      msgs.push(`🏆 지난주 리그 ${rank}위! +${bonus}P`);
      if (s.leagueTier < LEAGUES.length - 1) { s.leagueTier += 1; msgs.push(`⬆️ ${LEAGUES[s.leagueTier]} 리그로 승급!`); }
    } else if (rank > table.length - 3 && s.leagueTier > 0) {
      s.leagueTier -= 1;
      msgs.push(`⬇️ ${LEAGUES[s.leagueTier]} 리그에서 다시 도전해요`);
    }
  }
  return { state: s, msgs };
}

// ───────── 잠금 해제 규칙 ─────────
const stageDone = (state, si) => STAGES[si].lessons.every((l) => (state.stars[l.id] || 0) >= 1);
const stageOpen = (state, si) => si <= state.startStage || stageDone(state, si - 1);
const lessonOpen = (state, si, li) =>
  stageOpen(state, si) && (si < state.startStage || li === 0 || (state.stars[STAGES[si].lessons[li - 1].id] || 0) >= 1);
const stageStars = (state, si) => {
  const ls = STAGES[si].lessons;
  return Math.floor(ls.reduce((a, l) => a + (state.stars[l.id] || 0), 0) / ls.length);
};

const Stars = ({ n, size = 18 }) => (
  <span className="stars" style={{ fontSize: size }}>
    {[0, 1, 2].map((k) => <span key={k} className={k < n ? 'on' : ''}>★</span>)}
  </span>
);

export default function App() {
  const [state, setState] = useState(load);
  const [tab, setTab] = useState('map');
  const [play, setPlay] = useState(null); // {kind:'lesson', si, li} | {kind:'diag', part, results}
  const [result, setResult] = useState(null);
  const [toasts, setToasts] = useState([]);

  const update = (s, msgs = []) => {
    setState(s); save(s);
    if (msgs.length) setToasts(msgs);
  };

  useEffect(() => {
    const { state: s, msgs } = settleLeague(state);
    if (s !== state) update(s, msgs);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts([]), 4500);
    return () => clearTimeout(t);
  }, [toasts]);

  const avatar = STORE.find((x) => x.id === state.avatar)?.icon || '🐱';

  // ── 1. 처음: 닉네임 ──
  if (!state.nickname) return <Welcome onDone={(name) => update({ ...state, nickname: name })} />;

  // ── 2. 진단평가 ──
  if (!state.diagnosed && !play) {
    return (
      <Screen>
        <div className="card center">
          <div className="hero-emoji">{avatar}</div>
          <h1>{state.nickname}, 반가워요!</h1>
          <p>먼저 짧은 <b>진단평가</b>로 나에게 맞는 시작 단계를 찾아볼게요.<br />틀려도 괜찮아요. 점수는 나오지 않아요.</p>
          <ol className="diag-list">{DIAGNOSTIC.map((d) => <li key={d.title}>{d.title}</li>)}</ol>
          <button className="primary wide" onClick={() => setPlay({ kind: 'diag', part: 0, results: [] })}>진단 시작하기</button>
          <button className="ghost" onClick={() => update({ ...state, diagnosed: true, startStage: 0 })}>처음(파닉스)부터 할래요</button>
        </div>
      </Screen>
    );
  }

  if (play?.kind === 'diag') {
    const part = DIAGNOSTIC[play.part];
    return (
      <Screen>
        <Quiz key={play.part} title={`진단평가 · ${part.title}`} color="#ff6b8b" questions={part.questions}
          onExit={() => setPlay(null)}
          onFinish={({ correct, total }) => {
            const results = [...play.results, correct / total];
            if (play.part + 1 < DIAGNOSTIC.length) { setPlay({ kind: 'diag', part: play.part + 1, results }); return; }
            const weak = results.findIndex((r) => r < 2 / 3);
            const start = weak === -1 ? STAGES.length - 1 : DIAGNOSTIC[weak].stage;
            setPlay(null);
            update({ ...state, diagnosed: true, startStage: start },
              [`🧭 진단 완료! "${STAGES[start].title}" 단계부터 시작해요`]);
          }} />
      </Screen>
    );
  }

  // ── 3. 단계 학습 ──
  if (play?.kind === 'lesson') {
    const st = STAGES[play.si];
    const ls = st.lessons[play.li];
    return (
      <Screen>
        <Quiz key={`${ls.id}-${play.n}`} title={`${st.emoji} ${ls.title}`} color={st.color} questions={ls.questions}
          onExit={() => setPlay(null)}
          onFinish={({ correct, total, focusSec }) => {
            const stars = toStars(correct / total);
            const before = state.stars[ls.id] || 0;
            const { state: s, msgs } = applyLessonResult(state, ls.id, stars, focusSec);
            update(s, msgs);
            setResult({ ...play, stars, before, correct, total });
            setPlay(null);
          }} />
      </Screen>
    );
  }

  if (result) {
    const st = STAGES[result.si];
    const nextLi = result.li + 1 < st.lessons.length ? result.li + 1 : null;
    return (
      <Screen toasts={toasts}>
        <div className="card center result">
          <h1>{result.stars === 3 ? 'PERFECT!' : result.stars > 0 ? '클리어!' : '한 번 더 해볼까요?'}</h1>
          <Stars n={result.stars} size={52} />
          <p className="muted">{result.stars < 3 ? '다시 도전해서 별 3개를 모아 보세요. 복습이 실력이 돼요!' : '완벽해요! 다음 단계로 가 볼까요?'}</p>
          <div className="row">
            <button className="secondary" onClick={() => { setResult(null); setPlay({ kind: 'lesson', si: result.si, li: result.li, n: Date.now() }); }}>다시 하기</button>
            {nextLi !== null && result.stars > 0 && (
              <button className="primary" onClick={() => { setResult(null); setPlay({ kind: 'lesson', si: result.si, li: nextLi, n: Date.now() }); }}>다음 단계 →</button>
            )}
            <button className="ghost" onClick={() => setResult(null)}>지도로</button>
          </div>
        </div>
      </Screen>
    );
  }

  // ── 4. 메인 (탭) ──
  return (
    <Screen toasts={toasts}>
      <header className="topbar">
        <div className="me"><span className="avatar">{avatar}</span><b>{state.nickname}</b></div>
        <div className="chips-stat">
          <span title="연속 학습일">🔥 {state.streak.current}일</span>
          <span title="포인트">💎 {state.points}P</span>
        </div>
      </header>

      {tab === 'map' && <MapTab state={state} onPlay={(si, li) => setPlay({ kind: 'lesson', si, li, n: Date.now() })} />}
      {tab === 'record' && <RecordTab state={state} onReset={() => { if (confirm('모든 기록을 지울까요?')) { resetAll(); update(initialState); } }}
        onRediag={() => update({ ...state, diagnosed: false })} />}
      {tab === 'league' && <LeagueTab state={state} />}
      {tab === 'store' && <StoreTab state={state} update={update} />}

      <nav className="tabs">
        {[['map', '🗺️', '학습'], ['record', '📈', '내 기록'], ['league', '🏆', '리그'], ['store', '🎁', '상점']].map(([id, ic, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <span>{ic}</span>{label}
          </button>
        ))}
      </nav>
    </Screen>
  );
}

function Screen({ children, toasts = [] }) {
  return (
    <div className="app">
      {children}
      <div className="toasts">{toasts.map((t, k) => <div key={k} className="toast">{t}</div>)}</div>
    </div>
  );
}

function Welcome({ onDone }) {
  const [name, setName] = useState('');
  return (
    <Screen>
      <div className="card center">
        <div className="hero-emoji">🚀</div>
        <h1>English Boost</h1>
        <p>파닉스부터 짧은 글쓰기까지, 한 계단씩 올라가요.</p>
        <input className="name-input" value={name} maxLength={10} placeholder="닉네임 (실명 말고 별명으로!)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onDone(name.trim())} />
        <button className="primary wide" disabled={!name.trim()} onClick={() => onDone(name.trim())}>시작하기</button>
        <p className="tiny muted">기록은 이 기기에만 저장돼요.</p>
      </div>
    </Screen>
  );
}

function MapTab({ state, onPlay }) {
  return (
    <main className="map">
      <h2>학습 지도</h2>
      <p className="muted">파닉스 → 사이트워드 → 콜로케이션 → 기본 문장 패턴 → 짧은 글쓰기</p>
      {STAGES.map((st, si) => {
        const open = stageOpen(state, si);
        return (
          <section key={st.id} className={`stage ${open ? '' : 'locked'}`} style={{ '--accent': st.color }}>
            <div className="stage-head">
              <span className="stage-emoji">{open ? st.emoji : '🔒'}</span>
              <div>
                <div className="stage-num">STAGE {si + 1}{si === state.startStage ? ' · 추천 시작점' : ''}</div>
                <h3>{st.title}</h3>
              </div>
              <Stars n={stageStars(state, si)} />
            </div>
            <div className="lessons">
              {st.lessons.map((l, li) => {
                const ok = lessonOpen(state, si, li);
                return (
                  <button key={l.id} className="lesson" disabled={!ok} onClick={() => onPlay(si, li)}>
                    <span className="lesson-no">{ok ? `${si + 1}-${li + 1}` : '🔒'}</span>
                    <span className="lesson-txt"><b>{l.title}</b><small>{l.desc}</small></span>
                    <Stars n={state.stars[l.id] || 0} size={14} />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}

function RecordTab({ state, onReset, onRediag }) {
  const totalStars = Object.values(state.stars).reduce((a, b) => a + b, 0);
  const max = STAGES.reduce((a, s) => a + s.lessons.length * 3, 0);
  const nextMs = STREAK_MILESTONES.find((m) => m.days > state.streak.current);
  const wkDays = (state.weekDays[weekKey()] || []).length;
  return (
    <main>
      <h2>내 기록</h2>
      <p className="muted">다른 친구가 아니라 <b>어제의 나</b>와 비교해요.</p>
      <div className="grid">
        <Stat icon="🔥" label="최장 연속 학습일" value={`${state.streak.best}일`} sub={`지금 ${state.streak.current}일째`} />
        <Stat icon="🏅" label="하루 최다 클리어" value={`${state.bestDailyClears}단계`} sub={`오늘 ${state.daily[today()] || 0}단계`} />
        <Stat icon="⏱️" label="최장 집중 시간" value={fmtTime(state.bestFocusSec)} sub="실제로 풀이한 시간만" />
        <Stat icon="⭐" label="모은 별" value={`${totalStars} / ${max}`} />
      </div>

      <div className="card">
        <h3>연속 학습 보상</h3>
        <div className="milestones">
          {STREAK_MILESTONES.map((m) => (
            <div key={m.days} className={`ms ${state.streak.best >= m.days ? 'done' : ''}`}>
              <b>{m.days}일</b><small>+{m.points}P</small>
            </div>
          ))}
        </div>
        {nextMs && <p className="muted">다음 보상까지 {nextMs.days - state.streak.current}일 남았어요!</p>}
        <h3>이번 주 참여</h3>
        <div className="week-bar">{[0, 1, 2, 3, 4].map((k) => <span key={k} className={k < wkDays ? 'on' : ''} />)}</div>
        <p className="muted">주 5일 학습하면 참여 보너스 +50P ({Math.min(wkDays, 5)}/5)</p>
      </div>

      <div className="card">
        <h3>뱃지</h3>
        <div className="badges">
          {Object.entries(BADGE_INFO).map(([id, b]) => (
            <div key={id} className={`badge ${state.badges.includes(id) ? 'on' : ''}`}><span>{b.icon}</span><small>{b.label}</small></div>
          ))}
        </div>
      </div>

      <div className="row">
        <button className="secondary" onClick={onRediag}>진단평가 다시 보기</button>
        <button className="ghost danger" onClick={onReset}>기록 초기화</button>
      </div>
    </main>
  );
}

const Stat = ({ icon, label, value, sub }) => (
  <div className="stat"><span className="stat-icon">{icon}</span><small>{label}</small><b>{value}</b>{sub && <small className="muted">{sub}</small>}</div>
);

function LeagueTab({ state }) {
  const tier = state.leagueTier ?? 0;
  const wk = weekKey();
  const table = useMemo(() => leagueTable(state, wk, tier), [state, wk, tier]);
  const myIdx = table.findIndex((r) => r.me);
  const from = Math.max(0, myIdx - 3), to = Math.min(table.length, myIdx + 4);
  return (
    <main>
      <h2>주간 리그 · {LEAGUES[tier]}</h2>
      <p className="muted">상위 3명은 승급 + 포인트, 하위 3명은 강등. 전체 순위는 공개하지 않고 <b>내 위아래 3명</b>만 보여요.</p>
      <div className="card league">
        {from > 0 && <div className="dots">⋯</div>}
        {table.slice(from, to).map((r, k) => {
          const rank = from + k + 1;
          return (
            <div key={r.name} className={`lrow ${r.me ? 'me' : ''} ${rank <= 3 ? 'up' : rank > table.length - 3 ? 'down' : ''}`}>
              <span className="rank">{rank}</span>
              <span className="lname">{r.me ? '👉 ' : ''}{r.name}</span>
              <span>{r.xp} XP</span>
            </div>
          );
        })}
        {to < table.length && <div className="dots">⋯</div>}
      </div>
      <p className="tiny muted">새 별 1개 = 10 XP, 복습 = 2 XP. 매주 월요일에 결과가 정산돼요. (지금은 연습용 가상 친구들과 경쟁하는 데모 모드예요)</p>
    </main>
  );
}

function StoreTab({ state, update }) {
  const buy = (item) => {
    if (state.points < item.price) return;
    const s = { ...state, points: state.points - item.price };
    if (item.kind === 'avatar') { s.owned = [...s.owned, item.id]; s.avatar = item.id; }
    else s.coupons = [...s.coupons, { id: item.id, name: item.name, date: today() }];
    update(s, [`🎉 ${item.name} 획득!`]);
  };
  return (
    <main>
      <h2>보상 상점</h2>
      <p className="muted">별·연속학습·뱃지로 모은 포인트로 캐릭터를 모으고 쿠폰을 받아요.</p>
      <h3>캐릭터 수집</h3>
      <div className="store">
        {STORE.filter((x) => x.kind === 'avatar').map((item) => {
          const owned = state.owned.includes(item.id);
          return (
            <div key={item.id} className={`item ${state.avatar === item.id ? 'equipped' : ''}`}>
              <div className="item-icon">{item.icon}</div>
              <b>{item.name}</b>
              {owned ? (
                <button className="secondary small" disabled={state.avatar === item.id}
                  onClick={() => update({ ...state, avatar: item.id })}>{state.avatar === item.id ? '착용중' : '착용'}</button>
              ) : (
                <button className="primary small" disabled={state.points < item.price} onClick={() => buy(item)}>💎 {item.price}</button>
              )}
            </div>
          );
        })}
      </div>
      <h3>교환 쿠폰</h3>
      <div className="store">
        {STORE.filter((x) => x.kind === 'coupon').map((item) => (
          <div key={item.id} className="item">
            <div className="item-icon">{item.icon}</div>
            <b>{item.name}</b>
            <button className="primary small" disabled={state.points < item.price} onClick={() => buy(item)}>💎 {item.price}</button>
          </div>
        ))}
      </div>
      {state.coupons.length > 0 && (
        <div className="card">
          <h3>내 쿠폰함</h3>
          {state.coupons.map((c, k) => <div key={k} className="coupon">🎟️ {c.name} <small className="muted">{c.date} · 선생님께 보여주세요</small></div>)}
        </div>
      )}
    </main>
  );
}
