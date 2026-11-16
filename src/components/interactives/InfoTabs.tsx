import { useState } from 'react';

export interface InfoTab { label: string; title?: string; text?: string; rows?: [string, string][] }

/** Data-driven comparison: pick an option, read its fact sheet. Content is supplied by the lesson. */
export default function InfoTabs({ title, tabs, foot }: { title: string; tabs: InfoTab[]; foot?: string }) {
  const [i, setI] = useState(0);
  const t = tabs[i];
  return (
    <section className="ix not-prose" aria-label={title}>
      <div className="ix-head"><div className="ix-title">{title}</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1rem' }}>
        <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
          {tabs.map((x, k) => (
            <button key={x.label} role="tab" type="button" aria-selected={k === i} onClick={() => setI(k)}
              style={{ padding: '.4rem .8rem', borderRadius: 99, fontSize: '.84rem', fontWeight: 600, border: `1px solid ${k === i ? 'var(--accent)' : 'var(--line)'}`, background: k === i ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg)', color: k === i ? 'var(--text)' : 'var(--muted)' }}>
              {x.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: '1rem 1.1rem' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 650 }}>{t.title ?? t.label}</h4>
          {t.text && <p style={{ color: 'var(--muted)', fontSize: '.94rem', marginTop: '.4rem' }}>{t.text}</p>}
          {t.rows && (
            <dl style={{ display: 'grid', gap: '.55rem', marginTop: '.8rem', fontSize: '.9rem' }}>
              {t.rows.map(([k, v]) => (
                <div key={k} className="grid sm:grid-cols-[8.5rem_1fr]" style={{ gap: '.15rem .8rem' }}>
                  <dt className="num" style={{ color: 'var(--accent)', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.06em', paddingTop: '.15rem' }}>{k}</dt><dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      {foot && <div className="ix-foot">{foot}</div>}
    </section>
  );
}
