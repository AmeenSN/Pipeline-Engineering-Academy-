import { useState } from 'react';
import { Controls, Frame, Slider, Verdict, View } from './kit';

const CRITERIA = [
  { id: 'length', label: 'Length and cost' },
  { id: 'people', label: 'Population and safety' },
  { id: 'terrain', label: 'Difficult terrain (rock, sabkha, dunes)' },
  { id: 'crossings', label: 'Crossings' },
  { id: 'env', label: 'Environment and heritage' },
] as const;
type C = (typeof CRITERIA)[number]['id'];
// Raw penalties: lower is better.
const ROUTES: { id: string; name: string; c: string; d: string; note: string; raw: Record<C, number>; facts: string }[] = [
  { id: 'A', name: 'Route A: direct', c: 'var(--accent)', d: 'M30 150 L530 70', note: 'Shortest, but passes the town edge and crosses the sabkha.', raw: { length: 62, people: 9, terrain: 14, crossings: 11, env: 3 }, facts: '62 km · 9 km populated · 14 km sabkha · 11 crossings' },
  { id: 'B', name: 'Route B: northern corridor', c: 'var(--brand)', d: 'M30 150 Q140 40 300 46 T530 70', note: 'Follows an existing pipeline corridor. Longer, few new constraints.', raw: { length: 71, people: 1, terrain: 4, crossings: 6, env: 2 }, facts: '71 km · 1 km populated · 4 km rock · 6 crossings' },
  { id: 'C', name: 'Route C: southern', c: 'var(--ok)', d: 'M30 150 Q200 215 360 180 T530 70', note: 'Avoids the town and sabkha but crosses the wadi and a protected area.', raw: { length: 68, people: 2, terrain: 7, crossings: 9, env: 12 }, facts: '68 km · 2 km populated · 7 km dunes · 9 crossings · 12 km protected area' },
];

export default function RouteScore() {
  const [w, setW] = useState<Record<C, number>>({ length: 5, people: 8, terrain: 5, crossings: 4, env: 5 });
  const sumW = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const scores = ROUTES.map((r) => ({
    r, score: CRITERIA.reduce((s, c) => s + (w[c.id] / sumW) * (r.raw[c.id] / Math.max(...ROUTES.map((x) => x.raw[c.id]))), 0) * 100,
  }));
  const best = scores.reduce((a, b) => (b.score < a.score ? b : a));
  return (
    <Frame title="Route option scoring" foot="An illustrative weighted-penalty comparison. Each criterion is scaled against the worst route, multiplied by your weight and summed: the lowest total wins. Real studies use many more criteria, GIS constraint maps and stakeholder input.">
      <Controls>
        {CRITERIA.map((c) => <Slider key={c.id} label={`Weight: ${c.label}`} value={w[c.id]} onChange={(v) => setW({ ...w, [c.id]: v })} min={0} max={10} step={1} dp={0} />)}
      </Controls>
      <View>
        <svg viewBox="0 0 560 240" role="img" aria-label="Map of three route options between a plant and a terminal" style={{ width: '100%', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <ellipse cx="250" cy="118" rx="62" ry="26" fill="var(--steel)" opacity=".3" /><text x="250" y="122" textAnchor="middle" className="svg-label">sabkha</text>
          <rect x="330" y="78" width="60" height="34" rx="4" fill="var(--yellow)" opacity=".3" /><text x="360" y="99" textAnchor="middle" className="svg-label">town</text>
          <path d="M150 240 Q210 190 260 205 T400 150 T470 240" fill="none" stroke="var(--brand)" strokeWidth="8" opacity=".18" /><text x="205" y="232" className="svg-label">wadi</text>
          <rect x="330" y="170" width="110" height="46" rx="6" fill="var(--ok)" opacity=".15" stroke="var(--ok)" strokeDasharray="4 3" /><text x="385" y="197" textAnchor="middle" className="svg-label">protected area</text>
          <path d="M60 30 H520" stroke="var(--muted)" strokeDasharray="8 4" /><text x="64" y="24" className="svg-label">existing pipeline corridor</text>
          {scores.map(({ r }) => <path key={r.id} d={r.d} fill="none" stroke={r.c} strokeWidth={r.id === best.r.id ? 5 : 2.5} opacity={r.id === best.r.id ? 1 : 0.55} />)}
          <circle cx="30" cy="150" r="7" fill="var(--text)" /><text x="20" y="172" className="svg-strong">Plant</text>
          <circle cx="530" cy="70" r="7" fill="var(--text)" /><text x="540" y="92" textAnchor="end" className="svg-strong">Terminal</text>
        </svg>
        <div style={{ display: 'grid', gap: '.6rem' }}>
          {scores.map(({ r, score }) => (
            <div key={r.id}>
              <div className="fld-label"><span style={{ color: 'var(--text)', fontWeight: 600 }}>{r.name}</span><span className="fld-val">{score.toFixed(0)} penalty points</span></div>
              <div style={{ height: 10, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--line)' }}><div style={{ width: `${score}%`, height: '100%', borderRadius: 6, background: r.c, transition: 'width .2s' }} /></div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '.2rem' }}>{r.facts}</div>
            </div>
          ))}
        </div>
        <Verdict tone="ok">{best.r.name} scores best with these weights. {best.r.note}</Verdict>
      </View>
    </Frame>
  );
}
