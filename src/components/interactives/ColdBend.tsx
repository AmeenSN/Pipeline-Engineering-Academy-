import { useState } from 'react';
import { coldBendMinRadius, degPerDiameter, maxAnglePerJoint } from '@/lib/eng/bends';
import { Controls, Frame, Segmented, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { npsOptions, odOf } from './pipe';

export default function ColdBend() {
  const sys = useUnits();
  const [nps, setNps] = useState('24');
  const [len, setLen] = useState('12');
  const [tangent, setTangent] = useState(2);
  const [dpd, setDpd] = useState(1.5);
  const [need, setNeed] = useState(35);
  const D = odOf(nps), nMin = coldBendMinRadius(Number(nps)), codeMax = degPerDiameter(nMin);
  const n = 180 / (Math.PI * dpd);
  const j = maxAnglePerJoint({ jointLength: Number(len), tangent, D, degPerD: dpd });
  const joints = j.angle > 0 ? Math.ceil(need / j.angle - 1e-9) : Infinity;
  const over = dpd > codeMax + 1e-9;
  const pulls = Math.floor(j.usable / (D / 1000));

  // one joint, drawn to scale
  const W = 560, H = 200, L = Number(len), s = (W - 60) / L, a = (j.angle * Math.PI) / 180, Rpx = n * (D / 1000) * s;
  const x0 = 30, y0 = H - 40, t = tangent * s;
  const ax = x0 + t, ex = ax + Rpx * Math.sin(a), ey = y0 - Rpx * (1 - Math.cos(a));
  const fx = ex + t * Math.cos(a), fy = ey - t * Math.sin(a);
  const ticks = Array.from({ length: Math.min(pulls, 60) + 1 }, (_, i) => {
    const th = (i / Math.max(pulls, 1)) * a;
    const px = ax + Rpx * Math.sin(th), py = y0 - Rpx * (1 - Math.cos(th));
    return <line key={i} x1={px - 7 * Math.sin(th)} y1={py + 7 * Math.cos(th)} x2={px + 7 * Math.sin(th)} y2={py - 7 * Math.cos(th)} stroke="var(--surface)" strokeWidth="1.2" />;
  });

  return (
    <Frame title="Cold field bend planner" foot="Code minimum radius by pipe size from ASME B31.4 and B31.8 (18 D for NPS 12 and smaller, rising to 30 D for NPS 20 and larger). Project specifications are usually stricter: 1.5° per diameter (about 40 D) is common.">
      <Controls>
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Segmented label="Joint length" value={len} onChange={setLen} options={[{ value: '12', label: sys === 'si' ? '12 m' : '40 ft' }, { value: '18', label: sys === 'si' ? '18 m' : '60 ft' }]} />
        <Slider label="Straight tangent at each end" kind="m" value={tangent} onChange={setTangent} min={0.5} max={3} step={0.1} dp={1} />
        <Slider label="Bend per pipe diameter (degrees)" value={dpd} onChange={setDpd} min={0.5} max={3.2} step={0.05} dp={2} />
        <Slider label="Turn required at this location (degrees)" value={need} onChange={setNeed} min={2} max={90} step={1} dp={0} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="One pipe joint with straight tangents and a cold bend in the middle" style={{ width: '100%' }}>
          <path d={`M${x0} ${y0}H${ax}A${Rpx} ${Rpx} 0 0 0 ${ex} ${ey}L${fx} ${fy}`} fill="none" stroke="var(--steel)" strokeWidth="14" />
          <path d={`M${ax} ${y0}A${Rpx} ${Rpx} 0 0 0 ${ex} ${ey}`} fill="none" stroke={over ? 'var(--bad)' : 'var(--brand)'} strokeWidth="14" />
          {ticks}
          <text x={x0 + t / 2} y={y0 + 26} textAnchor="middle" className="svg-label">tangent</text>
          <text x={(ax + ex) / 2} y={Math.min(y0 + 26, H - 6)} textAnchor="middle" className="svg-label" style={{ fill: 'var(--brand)' }}>{pulls} pulls, one per diameter</text>
          <text x={x0} y="18" className="svg-strong">one {fmt('m', sys, L, 0)} {unitOf('m', sys)} joint · {j.angle.toFixed(1)}° maximum</text>
        </svg>
        <Stats>
          <Stat label="Bend radius" text={`${n.toFixed(0)} D`} tone={over ? 'bad' : undefined} />
          <Stat label="Radius" kind="m" value={n * D / 1000} dp={1} />
          <Stat label="Code minimum radius" text={`${nMin} D  (${codeMax.toFixed(2)}°/D)`} />
          <Stat label="Maximum angle per joint" text={`${j.angle.toFixed(1)}°`} tone="brand" />
          <Stat label="Joints needed for the turn" text={Number.isFinite(joints) ? String(joints) : '—'} />
        </Stats>
        {over ? <Verdict tone="bad">Tighter than the code minimum radius of {nMin} D for this size. Reduce the bend per diameter.</Verdict>
          : joints > 3 ? <Verdict tone="warn">{joints} consecutive bent joints are needed. Consider a hot induction bend if space is tight.</Verdict>
          : <Verdict tone="ok">{joints === 1 ? 'One bent joint makes this turn.' : `${joints} bent joints welded in sequence make this turn.`} Position the longitudinal seam near the neutral axis.</Verdict>}
      </View>
    </Frame>
  );
}
