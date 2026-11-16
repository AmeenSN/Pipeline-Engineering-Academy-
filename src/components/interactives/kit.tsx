import type { ReactNode } from 'react';
import { fmt, unitOf, useUnits, type Kind, type UnitSystem } from '@/lib/units';

export { useUnits, fmt, unitOf };
export type { Kind, UnitSystem };

export function Frame({ title, children, foot }: { title: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <section className="ix not-prose" aria-label={title}>
      <div className="ix-head">
        <div className="ix-title">{title}</div>
        <span className="ix-tag">Interactive</span>
      </div>
      <div className="ix-body">{children}</div>
      {foot && <div className="ix-foot">{foot}</div>}
    </section>
  );
}
export const Controls = ({ children }: { children: ReactNode }) => <div className="ix-controls">{children}</div>;
export const View = ({ children }: { children: ReactNode }) => <div className="ix-view flex flex-col gap-4">{children}</div>;

interface SliderProps { label: string; kind?: Kind; value: number; onChange: (v: number) => void; min: number; max: number; step: number; dp?: number }
/** Range input that stores the value in base (SI) units and displays it in the active system. */
export function Slider({ label, kind = 'none', value, onChange, min, max, step, dp }: SliderProps) {
  const sys = useUnits();
  return (
    <label className="fld block">
      <span className="fld-label">
        <span>{label}</span>
        <span className="fld-val">{fmt(kind, sys, value, dp)} {unitOf(kind, sys)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <label className="fld block">
      <span className="fld-label"><span>{label}</span></span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Segmented<T extends string>({ label, value, onChange, options }: { label?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="fld">
      {label && <span className="fld-label"><span>{label}</span></span>}
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export type Tone = 'ok' | 'bad' | 'warn' | 'brand' | undefined;
export function Stat({ label, value, kind = 'none', dp, tone, text }: { label: string; value?: number; kind?: Kind; dp?: number; tone?: Tone; text?: string }) {
  const sys = useUnits();
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${tone ? `tone-${tone}` : ''}`}>
        {text ?? fmt(kind, sys, value ?? 0, dp)}
        {!text && <span className="stat-unit">{unitOf(kind, sys)}</span>}
      </div>
    </div>
  );
}
export const Stats = ({ children }: { children: ReactNode }) => <div className="stats">{children}</div>;

export function Verdict({ tone, children }: { tone: 'ok' | 'bad' | 'warn'; children: ReactNode }) {
  return (
    <div className={`verdict ${tone}`} role="status">
      <span aria-hidden="true">{tone === 'ok' ? '✓' : tone === 'bad' ? '✕' : '!'}</span>
      <span>{children}</span>
    </div>
  );
}

/** Horizontal utilisation bar: value/limit with a marker at 100 %. */
export function Meter({ label, ratio, max = 1.5 }: { label: string; ratio: number; max?: number }) {
  const r = Number.isFinite(ratio) ? ratio : max;
  const pct = Math.min(r / max, 1) * 100;
  const tone = r > 1 ? 'var(--bad)' : r > 0.9 ? 'var(--yellow)' : 'var(--ok)';
  return (
    <div>
      <div className="fld-label"><span>{label}</span><span className="fld-val" style={{ color: tone }}>{(r * 100).toFixed(0)} %</span></div>
      <div style={{ position: 'relative', height: 10, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--line)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: tone, transition: 'width .2s' }} />
        <div style={{ position: 'absolute', left: `${(1 / max) * 100}%`, top: -3, bottom: -3, width: 2, background: 'var(--text)' }} title="Limit" />
      </div>
    </div>
  );
}

/** Arrow marker definitions shared by the SVG diagrams. */
export function Defs() {
  return (
    <defs>
      {(['brand', 'accent', 'bad', 'ok', 'muted', 'text'] as const).map((c) => (
        <marker key={c} id={`arr-${c}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={`var(--${c})`} />
        </marker>
      ))}
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="var(--steel)" strokeWidth="1.2" opacity=".55" />
      </pattern>
      <pattern id="soil" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="1" fill="var(--yellow)" opacity=".45" />
        <circle cx="10" cy="10" r="1.2" fill="var(--yellow)" opacity=".3" />
        <circle cx="11" cy="3" r=".7" fill="var(--yellow)" opacity=".4" />
      </pattern>
    </defs>
  );
}
