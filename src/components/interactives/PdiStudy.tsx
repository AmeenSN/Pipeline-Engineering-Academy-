import { useMemo, useState } from 'react';
import { GAS_CLASSES } from '@/lib/eng/data';
import { classFromBuildings } from '@/lib/eng/flow';
import { Stat, Stats, Verdict } from './kit';
import { lin } from './pipe';

type B = { x: number; y: number }; // x in km along the line, y in m from the centreline
const rnd = (seed: number) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
function preset(kind: string): B[] {
  const r = rnd(kind.length * 977 + 13), out: B[] = [];
  const add = (n: number, x0: number, x1: number, spread: number) => { for (let i = 0; i < n; i++) out.push({ x: x0 + r() * (x1 - x0), y: (r() - 0.5) * 2 * spread }); };
  if (kind === 'rural') add(7, 0.3, 7.7, 380);
  if (kind === 'village') { add(6, 0.3, 7.7, 380); add(24, 3.2, 4.6, 260); }
  if (kind === 'town') { add(8, 0.3, 7.7, 380); add(70, 4.2, 6.4, 300); add(14, 2.4, 4.2, 300); }
  return out;
}
const MILE = 1.609, HALF = 201; // sliding zone: 1 mile long, 1/4 mile wide (201 m each side)
const COL = ['', 'var(--ok)', 'var(--yellow)', 'var(--accent)', 'var(--bad)'];

export default function PdiStudy() {
  const [b, setB] = useState<B[]>(() => preset('village'));
  const [pos, setPos] = useState(3.2);
  const W = 620, H = 250, x = lin(0, 8, 14, W - 14), y = lin(-420, 420, 30, 190);
  const count = (start: number) => b.filter((p) => p.x >= start && p.x <= start + MILE && Math.abs(p.y) <= HALF).length;
  const here = count(pos), cls = classFromBuildings(here);
  // class of each 100 m of line = worst class of any window containing it
  const band = useMemo(() => Array.from({ length: 80 }, (_, i) => {
    const k = i * 0.1 + 0.05; let worst = 1;
    for (let s = Math.max(0, k - MILE); s <= Math.min(k, 8 - MILE) + 1e-9; s += 0.05) worst = Math.max(worst, classFromBuildings(count(s)));
    return worst;
  }), [b]);
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H;
    const kx = ((px - 14) / (W - 28)) * 8, my = ((py - 30) / 160) * 840 - 420;
    if (kx < 0 || kx > 8 || my < -420 || my > 420) return;
    const hit = b.findIndex((p) => Math.abs(x(p.x) - px) < 5 && Math.abs(y(p.y) - py) < 5);
    setB(hit >= 0 ? b.filter((_, i) => i !== hit) : [...b, { x: kx, y: my }]);
  };
  const F = GAS_CLASSES.find((c) => c.id === String(cls))!.F;
  const worst = Math.max(...band);

  return (
    <section className="ix not-prose" aria-label="Location class study">
      <div className="ix-head"><div className="ix-title">Location class study</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '.9rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '.84rem', color: 'var(--muted)' }}>Start from:</span>
          {[['rural', 'Open desert'], ['village', 'Village'], ['town', 'Town edge']].map(([k, l]) => <button key={k} type="button" className="btn btn-ghost" style={{ padding: '.35rem .8rem' }} onClick={() => setB(preset(k))}>{l}</button>)}
          <button type="button" className="btn btn-ghost" style={{ padding: '.35rem .8rem' }} onClick={() => setB([])}>Clear</button>
          <span style={{ fontSize: '.84rem', color: 'var(--muted)' }}>Click the map to add or remove a building.</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} onClick={click} role="img" aria-label="Map of buildings along an 8 kilometre pipeline with a sliding one mile zone" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, cursor: 'crosshair' }}>
          <rect x={x(0)} y={y(-HALF)} width={x(8) - x(0)} height={y(HALF) - y(-HALF)} fill="var(--brand)" opacity=".06" />
          <rect x={x(pos)} y={y(-HALF)} width={x(pos + MILE) - x(pos)} height={y(HALF) - y(-HALF)} fill={COL[cls]} opacity=".18" stroke={COL[cls]} strokeWidth="2" />
          <line x1={x(0)} x2={x(8)} y1={y(0)} y2={y(0)} stroke="var(--accent)" strokeWidth="3" />
          {b.map((p, i) => <rect key={i} x={x(p.x) - 3.5} y={y(p.y) - 3.5} width="7" height="7" fill={p.x >= pos && p.x <= pos + MILE && Math.abs(p.y) <= HALF ? 'var(--text)' : 'var(--steel)'} />)}
          <text x={x(pos) + 4} y={y(-HALF) - 5} className="svg-strong" style={{ fill: COL[cls] }}>1 mile × ¼ mile zone · {here} buildings</text>
          <text x={x(0)} y="18" className="svg-label">¼ mile wide corridor (201 m each side of the pipeline)</text>
          {band.map((c, i) => <rect key={i} x={x(i * 0.1)} y="204" width={x(0.1) - x(0) + 0.5} height="14" fill={COL[c]} />)}
          <text x={x(0)} y="234" className="svg-label">resulting class along the line</text>
          {[0, 2, 4, 6, 8].map((k) => <text key={k} x={x(k)} y="246" textAnchor={k === 0 ? 'start' : k === 8 ? 'end' : 'middle'} className="svg-label">KP {k}</text>)}
        </svg>
        <label className="fld block">
          <span className="fld-label"><span>Slide the 1-mile zone along the pipeline</span><span className="fld-val">KP {pos.toFixed(1)} to {(pos + MILE).toFixed(1)}</span></span>
          <input type="range" min={0} max={8 - MILE} step={0.05} value={pos} onChange={(e) => setPos(Number(e.target.value))} />
        </label>
        <Stats>
          <Stat label="Buildings in this zone" text={String(here)} />
          <Stat label="Class of this zone" text={`Class ${cls}`} tone={cls === 1 ? 'ok' : cls === 2 ? 'warn' : 'bad'} />
          <Stat label="Design factor F" value={F} dp={2} />
          <Stat label="Wall vs Class 1" text={`+${((0.72 / F - 1) * 100).toFixed(0)} %`} />
          <Stat label="Highest class on this line" text={`Class ${worst}`} />
        </Stats>
        <Verdict tone={worst === 1 ? 'ok' : 'warn'}>{worst === 1 ? 'The whole line is Class 1: standard wall throughout.' : 'Part of this line needs heavier wall. Moving the route a few hundred metres away from the buildings could keep it in Class 1.'}</Verdict>
      </div>
      <div className="ix-foot">ASME B31.8 building-count method: Class 1 up to 10 buildings, Class 2 from 11 to 45, Class 3 from 46. Class 4 (multi-storey areas) and the cluster rules that trim class boundaries are not modelled. Saudi Aramco uses its own population density index method (SAES-B-064).</div>
    </section>
  );
}
