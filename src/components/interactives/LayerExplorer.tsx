import { useState } from 'react';

export interface Layer { name: string; h: number; color: string; hatch?: boolean }
export interface LayerItem { label: string; title?: string; layers: Layer[]; rows: [string, string][] }

/** Data-driven layered cross-section (coatings, backfill, wall build-ups). Colours are theme token names. */
export default function LayerExplorer({ title, items, top = 'outside', bottom = 'inside', foot }: { title: string; items: LayerItem[]; top?: string; bottom?: string; foot?: string }) {
  const [i, setI] = useState(0);
  const t = items[i];
  const total = t.layers.reduce((s, l) => s + l.h, 0), k = 150 / total;
  let yy = 22;
  return (
    <section className="ix not-prose" aria-label={title}>
      <div className="ix-head"><div className="ix-title">{title}</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
          {items.map((x, n) => (
            <button key={x.label} type="button" aria-pressed={n === i} onClick={() => setI(n)}
              style={{ padding: '.4rem .8rem', borderRadius: 99, fontSize: '.84rem', fontWeight: 600, border: `1px solid ${n === i ? 'var(--accent)' : 'var(--line)'}`, background: n === i ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg)', color: n === i ? 'var(--text)' : 'var(--muted)' }}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <svg viewBox="0 0 400 200" role="img" aria-label={`Layers of ${t.title ?? t.label}`} style={{ width: '100%', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <defs><pattern id="lx-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--surface)" strokeWidth="1.2" opacity=".45" /></pattern></defs>
            <text x="14" y="15" className="svg-label">{top}</text>
            {t.layers.map((l, n) => {
              const y = yy, h = l.h * k; yy += h;
              return (
                <g key={n}>
                  <rect x="14" y={y} width="120" height={h} fill={`var(--${l.color})`} stroke="var(--bg)" strokeWidth=".5" />
                  {l.hatch && <rect x="14" y={y} width="120" height={h} fill="url(#lx-hatch)" />}
                  <line x1="134" x2="150" y1={y + h / 2} y2={y + h / 2} stroke="var(--muted)" />
                  <foreignObject x="154" y={y + h / 2 - 15} width="240" height="34"><div style={{ fontSize: 11, lineHeight: 1.25, color: 'var(--text)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', height: 30 }}>{l.name}</div></foreignObject>
                </g>
              );
            })}
            <text x="14" y="192" className="svg-label">{bottom}</text>
          </svg>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 650 }}>{t.title ?? t.label}</h4>
            <dl style={{ display: 'grid', gap: '.5rem', marginTop: '.7rem', fontSize: '.9rem' }}>
              {t.rows.map(([key, v]) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '6.5rem 1fr', gap: '.6rem' }}>
                  <dt className="num" style={{ color: 'var(--accent)', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.06em', paddingTop: '.15rem' }}>{key}</dt><dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div className="ix-foot">{foot ?? 'Layer thicknesses are not to scale.'}</div>
    </section>
  );
}
