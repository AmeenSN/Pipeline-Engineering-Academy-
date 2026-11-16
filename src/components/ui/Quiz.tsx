import { useState } from 'react';

export interface Question { q: string; options: string[]; answer: number; why: string }

export default function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const score = picked.filter((p, i) => p === questions[i].answer).length;
  const done = picked.every((p) => p !== null);
  return (
    <section className="ix not-prose" aria-label="Knowledge check">
      <div className="ix-head">
        <div className="ix-title">Knowledge check</div>
        <span className="ix-tag">{done ? `${score} / ${questions.length} correct` : `${questions.length} questions`}</span>
      </div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1.4rem' }}>
        {questions.map((qu, qi) => {
          const p = picked[qi];
          return (
            <fieldset key={qi}>
              <legend style={{ fontWeight: 600, marginBottom: '.6rem' }}>
                <span className="num" style={{ color: 'var(--accent)', marginRight: '.5rem' }}>{qi + 1}.</span>{qu.q}
              </legend>
              <div style={{ display: 'grid', gap: '.4rem' }}>
                {qu.options.map((o, oi) => {
                  const chosen = p === oi, correct = oi === qu.answer, show = p !== null;
                  const color = show && correct ? 'var(--ok)' : show && chosen ? 'var(--bad)' : 'var(--line)';
                  return (
                    <button key={oi} type="button" disabled={show}
                      onClick={() => setPicked((s) => s.map((v, i) => (i === qi ? oi : v)))}
                      style={{ textAlign: 'left', padding: '.55rem .8rem', borderRadius: 9, border: `1px solid ${color}`, background: show && (correct || chosen) ? `color-mix(in srgb, ${color} 9%, transparent)` : 'var(--bg)', fontSize: '.92rem', cursor: show ? 'default' : 'pointer' }}>
                      <span className="num" style={{ color: 'var(--muted)', marginRight: '.6rem' }}>{'ABCD'[oi]}</span>{o}
                      {show && correct && <span style={{ color: 'var(--ok)', float: 'right' }}>✓</span>}
                      {show && chosen && !correct && <span style={{ color: 'var(--bad)', float: 'right' }}>✕</span>}
                    </button>
                  );
                })}
              </div>
              {p !== null && <p style={{ marginTop: '.6rem', fontSize: '.86rem', color: 'var(--muted)' }}><strong style={{ color: 'var(--text)' }}>Why: </strong>{qu.why}</p>}
            </fieldset>
          );
        })}
        {done && (
          <button type="button" className="btn btn-ghost" style={{ justifySelf: 'start' }} onClick={() => setPicked(questions.map(() => null))}>Try again</button>
        )}
      </div>
    </section>
  );
}
