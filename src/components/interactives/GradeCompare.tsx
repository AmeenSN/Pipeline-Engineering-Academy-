import { useState } from 'react';
import { GAS_CLASSES, GRADES } from '@/lib/eng/data';
import { steelMass, wallThickness } from '@/lib/eng/design';
import { Controls, Frame, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { lin, npsOptions, odOf } from './pipe';

export default function GradeCompare() {
  const sys = useUnits();
  const [nps, setNps] = useState('30');
  const [P, setP] = useState(9.6);
  const [cls, setCls] = useState('1');
  const [sel, setSel] = useState('X65');
  const D = odOf(nps), F = GAS_CLASSES.find((c) => c.id === cls)!.F;
  const rows = GRADES.map((g) => {
    const r = wallThickness({ P, D, smys: g.smys, F, E: 1, T: 1, ca: 0 });
    const t = r.tSelected;
    return { g, t, mass: t ? steelMass(D, t) : null, dt: t ? D / t : null };
  });
  const cur = rows.find((r) => r.g.id === sel)!;
  const base = rows[0];
  const maxMass = Math.max(...rows.map((r) => r.mass ?? 0), 1);

  const W = 560, H = 230, x0 = 20, bw = (W - 40) / rows.length, y = lin(0, maxMass, H - 44, 40);
  // schematic stress-strain curve
  const SW = 560, SH = 190, sx = lin(0, 12, 46, SW - 16), sy = lin(0, 700, SH - 26, 10);
  const g = cur.g, ey = (g.smys / 207000) * 100;
  const curve = [`M${sx(0)},${sy(0)}`, `L${sx(ey)},${sy(g.smys * 0.97)}`, `Q${sx(0.6)},${sy(g.smys)} ${sx(1.2)},${sy(g.smys + (g.smts - g.smys) * 0.25)}`, `Q${sx(4)},${sy(g.smts)} ${sx(8)},${sy(g.smts)}`, `Q${sx(10.5)},${sy(g.smts)} ${sx(11.5)},${sy(g.smts * 0.9)}`].join('');

  return (
    <Frame title="Grade comparison" foot="Pressure design wall rounded up to a standard wall (no corrosion allowance), gas service design factor. Stress-strain curve is schematic. Tonnage is bare steel.">
      <Controls>
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Slider label="Design pressure" kind="pressure" value={P} onChange={setP} min={2} max={20} step={0.1} />
        <Select label="Location class" value={cls} onChange={setCls} options={GAS_CLASSES.map((c) => ({ value: c.id, label: `${c.label}  ·  F = ${c.F.toFixed(2)}` }))} />
        <Select label="Highlight grade" value={sel} onChange={setSel} options={GRADES.map((x) => ({ value: x.id, label: `API 5L ${x.id}` }))} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Steel tonnage per kilometre for each grade" style={{ width: '100%' }}>
          <text x={x0} y={14} className="svg-label">steel weight per unit length, by grade (click a bar)</text>
          {rows.map((r, i) => {
            const on = r.g.id === sel, cx = x0 + i * bw;
            return (
              <g key={r.g.id} onClick={() => setSel(r.g.id)} style={{ cursor: 'pointer' }}>
                <rect x={cx} y={20} width={bw} height={H - 20} fill="transparent" />
                {r.mass ? <rect x={cx + 6} y={y(r.mass)} width={bw - 12} height={H - 44 - y(r.mass)} rx="3" fill={on ? 'var(--accent)' : 'var(--steel)'} opacity={on ? 1 : 0.55} />
                  : <text x={cx + bw / 2} y={H - 60} textAnchor="middle" className="svg-label" style={{ fill: 'var(--bad)' }}>too thick</text>}
                {r.t && <text x={cx + bw / 2} y={y(r.mass!) - 5} textAnchor="middle" className="svg-label">{fmt('mm', sys, r.t, sys === 'si' ? 1 : 3)}</text>}
                <text x={cx + bw / 2} y={H - 26} textAnchor="middle" className={on ? 'svg-strong' : 'svg-label'}>{r.g.id}</text>
                <text x={cx + bw / 2} y={H - 10} textAnchor="middle" className="svg-label">{r.g.smys}</text>
              </g>
            );
          })}
        </svg>
        <Stats>
          <Stat label="SMYS" kind="stress" value={g.smys} />
          <Stat label="SMTS" kind="stress" value={g.smts} />
          <Stat label="Yield / tensile ratio" value={g.smys / g.smts} dp={2} tone={g.smys / g.smts > 0.88 ? 'warn' : undefined} />
          <Stat label="Wall needed" kind="mm" value={cur.t ?? 0} dp={sys === 'si' ? 1 : 3} tone="brand" text={cur.t ? undefined : 'none'} />
          <Stat label="Steel per km" text={cur.mass ? `${cur.mass.toFixed(0)} t` : '—'} />
          <Stat label={`Saving vs Grade ${base.g.id}`} text={cur.mass && base.mass ? `${((1 - cur.mass / base.mass) * 100).toFixed(0)} %` : '—'} tone="ok" />
        </Stats>
        {cur.dt && cur.dt > 96 ? <Verdict tone="warn">At this grade the wall is so thin that D/t exceeds about 96. Handling, not pressure, would set the wall, so the extra strength is wasted.</Verdict>
          : <Verdict tone="ok">Higher grades save steel and welding volume, at the cost of tighter welding procedures and a higher yield-to-tensile ratio.</Verdict>}
        <svg viewBox={`0 0 ${SW} ${SH}`} role="img" aria-label={`Schematic stress-strain curve for grade ${g.id}`} style={{ width: '100%' }}>
          <line x1={sx(0)} x2={sx(12)} y1={sy(0)} y2={sy(0)} stroke="var(--line)" />
          <line x1={sx(0)} x2={sx(0)} y1={sy(0)} y2={sy(700)} stroke="var(--line)" />
          <line x1={sx(0)} x2={sx(12)} y1={sy(g.smys)} y2={sy(g.smys)} stroke="var(--brand)" strokeDasharray="4 4" />
          <line x1={sx(0)} x2={sx(12)} y1={sy(g.smts)} y2={sy(g.smts)} stroke="var(--accent)" strokeDasharray="4 4" />
          <path d={curve} fill="none" stroke="var(--text)" strokeWidth="2.5" />
          <text x={sx(12)} y={sy(g.smys) + 14} textAnchor="end" className="svg-label" style={{ fill: 'var(--brand)' }}>SMYS {fmt('stress', sys, g.smys)} {unitOf('stress', sys)} (at 0.5 % strain)</text>
          <text x={sx(12)} y={sy(g.smts) - 6} textAnchor="end" className="svg-label" style={{ fill: 'var(--accent)' }}>SMTS {fmt('stress', sys, g.smts)} {unitOf('stress', sys)}</text>
          <text x={sx(12)} y={SH - 8} textAnchor="end" className="svg-label">strain →</text>
          <text x={sx(0) + 6} y={16} className="svg-label">stress ↑</text>
        </svg>
      </View>
    </Frame>
  );
}
