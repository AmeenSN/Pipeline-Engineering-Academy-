import { useState } from 'react';
import { leakPosition } from '@/lib/eng/ops';
import { Controls, Defs, Frame, Segmented, Slider, Stat, Stats, Verdict, View } from './kit';
import { lin } from './pipe';

export default function LeakLocate() {
  const [x, setX] = useState(18);
  const [med, setMed] = useState<'liquid' | 'gas'>('liquid');
  const [err, setErr] = useState(0.1);
  const L = 50, a = med === 'liquid' ? 1100 : 380;
  const t1 = (x * 1000) / a, t2 = ((L - x) * 1000) / a;
  const calc = leakPosition(L * 1000, a, t1, t2) / 1000;
  const unc = (a * err) / 2;
  const W = 560, px = lin(0, L, 40, W - 40), tMax = (L * 1000) / a, tx = lin(0, tMax * 1.1, 40, W - 40);
  const trace = (t: number, y: number, c: string, label: string) => (
    <g>
      <path d={`M${tx(0)} ${y}H${tx(t)}l6 16H${W - 40}`} fill="none" stroke={c} strokeWidth="2" />
      <line x1={tx(t)} x2={tx(t)} y1={y - 12} y2={y + 22} stroke={c} strokeDasharray="2 3" />
      <text x={tx(0)} y={y - 8} className="svg-label">{label}</text>
      <text x={tx(t) + 6} y={y - 4} className="svg-strong" style={{ fill: c }}>{t.toFixed(1)} s</text>
    </g>
  );

  return (
    <Frame title="Locating a leak by pressure-wave timing" foot="When a leak starts, a negative pressure wave travels both ways at the speed of sound in the fluid. Position from the upstream end = (L + a·(t₁ − t₂)) / 2. A 50 km section; wave speed 1100 m/s for liquid, 380 m/s for gas.">
      <Controls>
        <Segmented label="Fluid" value={med} onChange={setMed} options={[{ value: 'liquid', label: 'Liquid' }, { value: 'gas', label: 'Gas' }]} />
        <Slider label="True leak position (km from upstream)" value={x} onChange={setX} min={1} max={49} step={0.5} dp={1} />
        <Slider label="Timing accuracy of the sensors (s)" value={err} onChange={setErr} min={0.01} max={2} step={0.01} dp={2} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 110`} role="img" aria-label="Pipeline with a leak and pressure waves travelling to both ends" style={{ width: '100%' }}>
          <Defs />
          <rect x={px(0)} y="50" width={px(L) - px(0)} height="12" fill="var(--steel)" stroke="var(--text)" />
          <path d={`M${px(x)} 50l-7 -22M${px(x)} 50l0 -26M${px(x)} 50l7 -22`} stroke="var(--bad)" strokeWidth="2" />
          <line x1={px(x) - 8} x2={px(0) + 26} y1="76" y2="76" stroke="var(--brand)" strokeWidth="2" markerEnd="url(#arr-brand)" />
          <line x1={px(x) + 8} x2={px(L) - 26} y1="76" y2="76" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arr-accent)" />
          <rect x={px(0) - 12} y="40" width="12" height="32" fill="var(--brand)" /><rect x={px(L)} y="40" width="12" height="32" fill="var(--accent)" />
          <text x={px(0) - 12} y="32" className="svg-label">sensor 1</text><text x={px(L) + 12} y="32" textAnchor="end" className="svg-label">sensor 2</text>
          <text x={px(x)} y="18" textAnchor="middle" className="svg-strong" style={{ fill: 'var(--bad)' }}>leak</text>
          <text x={px(x) / 2 + 20} y="94" textAnchor="middle" className="svg-label">{x.toFixed(1)} km</text><text x={(px(x) + px(L)) / 2} y="94" textAnchor="middle" className="svg-label">{(L - x).toFixed(1)} km</text>
        </svg>
        <svg viewBox={`0 0 ${W} 120`} role="img" aria-label="Pressure against time at each end of the pipeline" style={{ width: '100%' }}>
          {trace(t1, 30, 'var(--brand)', 'pressure at sensor 1')}
          {trace(t2, 86, 'var(--accent)', 'pressure at sensor 2')}
        </svg>
        <Stats>
          <Stat label="Arrival at sensor 1" text={`${t1.toFixed(1)} s`} />
          <Stat label="Arrival at sensor 2" text={`${t2.toFixed(1)} s`} />
          <Stat label="Time difference" text={`${Math.abs(t1 - t2).toFixed(1)} s`} />
          <Stat label="Calculated position" text={`${calc.toFixed(1)} km`} tone="brand" />
          <Stat label="Location uncertainty" text={`± ${unc < 1000 ? unc.toFixed(0) + ' m' : (unc / 1000).toFixed(1) + ' km'}`} tone={unc > 500 ? 'warn' : 'ok'} />
        </Stats>
        <Verdict tone={unc > 500 ? 'warn' : 'ok'}>{unc > 500 ? 'Timing error dominates. Faster sampling and GPS-synchronised clocks at both ends are needed to locate the leak to within a few hundred metres.' : 'With well-synchronised, fast pressure sensors the leak is located to within a few hundred metres, in less than a minute.'}{med === 'gas' ? ' In gas the wave is weaker and fades with distance, so sensors must be closer together.' : ''}</Verdict>
      </View>
    </Frame>
  );
}
