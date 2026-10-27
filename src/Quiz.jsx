import { useEffect, useMemo, useRef, useState } from 'react';

export function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* 음성 미지원 브라우저 */ }
}

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

// 정답 비율 → 별 (점수 대신 별만 보여줌)
export const toStars = (ratio) => (ratio >= 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0);

/**
 * 문제 세트를 풀게 하고 onFinish({ correct, total, focusSec })를 호출
 */
export default function Quiz({ title, color = '#4c9aff', questions, onFinish, onExit }) {
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null); // {ok, answer}
  const focus = useRef({ total: 0, last: Date.now() });

  // 실제 반응이 있는 시간만 집중 시간으로 계산 (반응 간격 최대 30초까지만 인정)
  const touch = () => {
    const now = Date.now();
    focus.current.total += Math.min(now - focus.current.last, 30000);
    focus.current.last = now;
  };

  const q = questions[i];

  const submit = (ok, answer) => {
    touch();
    if (ok) setCorrect((c) => c + 1);
    setFeedback({ ok, answer });
  };

  const next = () => {
    setFeedback(null);
    if (i + 1 < questions.length) setI(i + 1);
    else onFinish({ correct, total: questions.length, focusSec: Math.round(focus.current.total / 1000) });
  };

  return (
    <div className="quiz" style={{ '--accent': color }}>
      <div className="quiz-top">
        <button className="ghost" onClick={onExit}>✕</button>
        <div className="progress"><div style={{ width: `${(i / questions.length) * 100}%` }} /></div>
        <span className="muted">{i + 1}/{questions.length}</span>
      </div>
      <h2 className="quiz-title">{title}</h2>

      <Question key={i} q={q} locked={!!feedback} onSubmit={submit} onTouch={touch} />

      {feedback && (
        <div className={`feedback ${feedback.ok ? 'ok' : 'no'}`}>
          <div>
            <strong>{feedback.ok ? '잘했어요! 👏' : '괜찮아요, 다시 보면 돼요 💪'}</strong>
            {!feedback.ok && feedback.answer && <div className="muted">정답: {feedback.answer}</div>}
          </div>
          <button className="primary" onClick={next} autoFocus>
            {i + 1 < questions.length ? '다음' : '결과 보기'}
          </button>
        </div>
      )}
    </div>
  );
}

function Question({ q, locked, onSubmit, onTouch }) {
  switch (q.type) {
    case 'listen': return <Listen q={q} locked={locked} onSubmit={onSubmit} onTouch={onTouch} />;
    case 'flash': return <Flash q={q} locked={locked} onSubmit={onSubmit} onTouch={onTouch} />;
    case 'choice': return <Choice q={q} locked={locked} onSubmit={onSubmit} onTouch={onTouch} />;
    case 'order': return <Order q={q} locked={locked} onSubmit={onSubmit} onTouch={onTouch} />;
    case 'fill': return <Fill q={q} locked={locked} onSubmit={onSubmit} onTouch={onTouch} />;
    case 'write': return <Write q={q} locked={locked} onSubmit={onSubmit} onTouch={onTouch} />;
    default: return null;
  }
}

function Options({ options, answer, locked, onPick, picked }) {
  return (
    <div className="options">
      {options.map((o) => {
        let cls = 'option';
        if (locked && o === answer) cls += ' right';
        else if (locked && o === picked) cls += ' wrong';
        return (
          <button key={o} className={cls} disabled={locked} onClick={() => onPick(o)}>{o}</button>
        );
      })}
    </div>
  );
}

function Listen({ q, locked, onSubmit, onTouch }) {
  const [picked, setPicked] = useState(null);
  const opts = useMemo(() => shuffle(q.options), [q]);
  useEffect(() => { const t = setTimeout(() => speak(q.say), 300); return () => clearTimeout(t); }, [q]);
  return (
    <>
      <p className="prompt">소리를 듣고 맞는 단어를 고르세요</p>
      <button className="speaker" onClick={() => { onTouch(); speak(q.say); }}>🔊 다시 듣기</button>
      <Options options={opts} answer={q.answer} locked={locked} picked={picked}
        onPick={(o) => { setPicked(o); onSubmit(o === q.answer, q.answer); }} />
    </>
  );
}

function Flash({ q, locked, onSubmit, onTouch }) {
  const [shown, setShown] = useState(true);
  const [picked, setPicked] = useState(null);
  const opts = useMemo(() => shuffle(q.options), [q]);
  useEffect(() => { const t = setTimeout(() => setShown(false), 1500); return () => clearTimeout(t); }, [q]);
  return (
    <>
      <p className="prompt">{shown ? '단어를 잘 보세요!' : '방금 본 단어의 소리는? (🔊로 들어보고 고르기)'}</p>
      <div className={`flashcard ${shown ? '' : 'flipped'}`}>{shown ? q.word : '?'}</div>
      {!shown && (
        <div className="options">
          {opts.map((o, idx) => {
            let cls = 'option sound';
            if (locked && o === q.answer) cls += ' right';
            else if (locked && o === picked) cls += ' wrong';
            return (
              <div key={o} className={cls}>
                <button className="ghost" onClick={() => { onTouch(); speak(o); }}>🔊 소리 {idx + 1}</button>
                <button className="primary small" disabled={locked}
                  onClick={() => { setPicked(o); onSubmit(o === q.answer, q.answer); }}>이거!</button>
                {locked && <span className="muted">{o}</span>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Choice({ q, locked, onSubmit, onTouch }) {
  const [picked, setPicked] = useState(null);
  const [left, setLeft] = useState(q.timer || 0);
  const opts = useMemo(() => shuffle(q.options), [q]);

  useEffect(() => {
    if (!q.timer || locked) return;
    if (left <= 0) { onSubmit(false, q.answer); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, locked, q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {q.timer ? <div className={`timer ${left <= 3 ? 'hurry' : ''}`}>⏳ {left}초</div> : null}
      <p className="prompt big">{q.prompt}</p>
      {q.say && <button className="speaker" onClick={() => { onTouch(); speak(q.say); }}>🔊 들어보기</button>}
      <Options options={opts} answer={q.answer} locked={locked} picked={picked}
        onPick={(o) => { setPicked(o); onSubmit(o === q.answer, q.answer); }} />
    </>
  );
}

function Order({ q, locked, onSubmit, onTouch }) {
  const pool = useMemo(() => shuffle(q.words.map((w, idx) => ({ w, idx }))), [q]);
  const [chosen, setChosen] = useState([]);
  const remaining = pool.filter((p) => !chosen.includes(p));
  const sentence = chosen.map((c) => c.w).join(' ');
  return (
    <>
      <p className="prompt">단어 카드를 순서대로 눌러 문장을 만드세요</p>
      <div className="answer-line">
        {chosen.length ? chosen.map((c) => (
          <button key={c.idx} className="chip on" disabled={locked}
            onClick={() => { onTouch(); setChosen(chosen.filter((x) => x !== c)); }}>{c.w}</button>
        )) : <span className="muted">여기에 문장이 만들어져요</span>}
      </div>
      <div className="chips">
        {remaining.map((p) => (
          <button key={p.idx} className="chip" disabled={locked}
            onClick={() => { onTouch(); setChosen([...chosen, p]); }}>{p.w}</button>
        ))}
      </div>
      {!locked && (
        <button className="primary wide" disabled={remaining.length > 0}
          onClick={() => onSubmit(norm(sentence) === norm(q.answer), q.answer.replace(' .', '.'))}>확인</button>
      )}
    </>
  );
}

function Fill({ q, locked, onSubmit, onTouch }) {
  const [vals, setVals] = useState(q.blanks.map(() => ''));
  const ok = vals.every((v, k) => v.trim() && (!q.blanks[k].number || /^\d+$/.test(v.trim())));
  return (
    <>
      <p className="prompt">빈칸을 채워 나를 소개해 보세요</p>
      <div className="fill">
        {q.template.map((part, idx) => {
          const b = q.blanks.findIndex((x) => x.after === idx);
          return (
            <span key={idx}>
              {part}{' '}
              {b >= 0 && (
                <input value={vals[b]} disabled={locked} placeholder={q.blanks[b].hint}
                  inputMode={q.blanks[b].number ? 'numeric' : 'text'}
                  onChange={(e) => { onTouch(); const v = [...vals]; v[b] = e.target.value; setVals(v); }} />
              )}{' '}
            </span>
          );
        })}
      </div>
      {!locked && (
        <button className="primary wide" disabled={!vals.every((v) => v.trim())}
          onClick={() => onSubmit(ok, ok ? null : '나이 칸에는 숫자를 써요 (예: 14)')}>완성!</button>
      )}
    </>
  );
}

function Write({ q, locked, onSubmit, onTouch }) {
  const [text, setText] = useState('');
  const check = () => {
    const t = text.trim();
    const words = t.split(/\s+/).filter(Boolean);
    const hasKey = q.keywords.some((k) => new RegExp(`\\b${k}\\b`, 'i').test(t));
    const ok = words.length >= 3 && hasKey;
    onSubmit(ok, ok ? null : `예: 그림 속 단어(${q.keywords.slice(0, 2).join(', ')})를 넣어 3단어 이상으로 써 보세요`);
  };
  return (
    <>
      <div className="picture">{q.picture}</div>
      <p className="prompt">{q.guide}</p>
      <textarea rows={3} value={text} disabled={locked} placeholder="영어 한 문장을 써 보세요"
        onChange={(e) => { onTouch(); setText(e.target.value); }} />
      {!locked && <button className="primary wide" disabled={!text.trim()} onClick={check}>제출</button>}
      {locked && <p className="muted">선생님/친구와 문장을 함께 고쳐 보면 더 좋아요.</p>}
    </>
  );
}
