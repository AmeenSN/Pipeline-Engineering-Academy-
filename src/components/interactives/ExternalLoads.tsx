import { useState } from 'react';
import { impactFactor, ovalisation, soilPressure, wheelPressure } from '@/lib/eng/loads';
import { Controls, Defs, Frame, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { lin, usePipe } from './pipe';

const SOILS = { loose: { label: 'Loose', E: 1.4 }, medium: { label: 'Compacted', E: 7 }, dense: { label: 'Dense', E: 14 } } as const;

export default function ExternalLoads() {
  const sys = useUnits();
  const pipe = usePipe(24, 9.5);
  const [H, setH] = useState(1.0);
  const [wheel, setWheel] = useState(70);
  const [soil, setSoil] = useState<keyof typeof SOILS>('medium');
  const gamma = 18.8;

  const ps = soilPressure(gamma, H), pl = wheelPressure(wheel, H), total = ps + pl;
  const ov = ovalisation({ D: pipe.D, t: pipe.t, pressure: total, Eprime: SOILS[soil].E });

  const W = 560, Hh = 290, gy = 46, maxDepth = 3.2;
  const yd = lin(0, maxDepth, gy, Hh - 30);
  const Dm = pipe.D / 1000, rpx = ((yd(1) - yd(0)) * Dm) / 2;
  const cx = 150, cy = yd(H) + rpx;
  // chart
  const cx0 = 320, cx1 = W - 16, pMax = 160;
  const xp = lin(0, pMax, cx0, cx1);
  const depths = Array.from({ length: 60 }, (_, i) => 0.3 + (i * (maxDepth - 0.3)) / 59);
  const path = (f: (d: number) => number) => 'M' + depths.map((d) => `${Math.min(xp(f(d)), cx1).toFixed(1)},${yd(d).toFixed(1)}`).join('L');
  const spread = Math.min((yd(H) - gy) * 0.6, 120);

  return (
    <Frame title="Soil and traffic load on a buried pipe" foot="Soil prism load (γ = 18.8 kN/m³), Boussinesq point load with depth-dependent impact factor, modified Iowa ovalisation (ALA 2001). A screening estimate: a formal road crossing needs the API RP 1102 method.">
      <Controls>
        {pipe.pickers}
        <Slider label="Depth of cover" kind="m" value={H} onChange={setH} min={0.4} max={3} step={0.05} />
        <Slider label="Wheel load" kind="force" value={wheel * 1000} onChange={(v) => setWheel(v / 1000)} min={0} max={150000} step={5000} />
        <Segmented label="Backfill support (E′)" value={soil} onChange={setSoil} options={Object.entries(SOILS).map(([k, v]) => ({ value: k as keyof typeof SOILS, label: v.label }))} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${Hh}`} role="img" aria-label="Cross-section of buried pipe under a wheel load, with pressure versus depth chart" style={{ width: '100%' }}>
          <Defs />
          <rect x="0" y={gy} width="300" height={Hh - gy} fill="url(#soil)" />
          <rect x="0" y={gy} width="300" height={Hh - gy} fill="var(--yellow)" opacity=".06" />
          <line x1="0" x2="300" y1={gy} y2={gy} stroke="var(--text)" strokeWidth="2" />
          {wheel > 0 && <>
            <path d={`M${cx - 10} ${gy}L${cx - 10 - spread} ${yd(H)}L${cx + 10 + spread} ${yd(H)}L${cx + 10} ${gy}Z`} fill="var(--bad)" opacity=".12" />
            <rect x={cx - 14} y={gy - 30} width="28" height="30" rx="6" fill="var(--text)" />
            <line x1={cx} x2={cx} y1={4} y2={gy - 34} stroke="var(--bad)" strokeWidth="2.5" markerEnd="url(#arr-bad)" />
            <text x={cx + 22} y={18} className="svg-strong">{fmt('force', sys, wheel * 1000)} {unitOf('force', sys)}</text>
          </>}
          <ellipse cx={cx} cy={cy} rx={rpx * (1 + ov.ratio * 6)} ry={rpx * (1 - ov.ratio * 6)} fill="var(--surface)" stroke="var(--text)" strokeWidth={Math.max(2, (pipe.t / pipe.D) * rpx * 5)} />
          <line x1="262" x2="262" y1={gy} y2={yd(H)} stroke="var(--muted)" markerStart="url(#arr-muted)" markerEnd="url(#arr-muted)" />
          <text x="258" y={(gy + yd(H)) / 2 + 4} textAnchor="end" className="svg-label">H = {fmt('m', sys, H)} {unitOf('m', sys)}</text>
          {/* chart */}
          <line x1={cx0} x2={cx0} y1={gy} y2={Hh - 30} stroke="var(--line)" />
          <line x1={cx0} x2={cx1} y1={gy} y2={gy} stroke="var(--line)" />
          <path d={path((d) => soilPressure(gamma, d))} fill="none" stroke="var(--yellow)" strokeWidth="2" />
          <path d={path((d) => wheelPressure(wheel, d, impactFactor(d)))} fill="none" stroke="var(--bad)" strokeWidth="2" />
          <path d={path((d) => soilPressure(gamma, d) + wheelPressure(wheel, d, impactFactor(d)))} fill="none" stroke="var(--text)" strokeWidth="2.5" />
          <line x1={cx0} x2={cx1} y1={yd(H)} y2={yd(H)} stroke="var(--accent)" strokeDasharray="4 3" />
          <circle cx={Math.min(xp(total), cx1)} cy={yd(H)} r="5" fill="var(--accent)" />
          <text x={cx0 + 4} y={gy - 8} className="svg-label">pressure on pipe crown →</text>
          <text x={cx1} y={Hh - 36} textAnchor="end" className="svg-label" style={{ fill: 'var(--yellow)' }}>soil</text>
          <text x={cx1} y={Hh - 22} textAnchor="end" className="svg-label" style={{ fill: 'var(--bad)' }}>traffic</text>
          <text x={cx1} y={Hh - 8} textAnchor="end" className="svg-strong">total</text>
          <text x={cx0 - 6} y={Hh - 30} textAnchor="end" className="svg-label">depth ↓</text>
        </svg>
        <Stats>
          <Stat label="Soil pressure" kind="kpa" value={ps} />
          <Stat label="Traffic pressure" kind="kpa" value={pl} />
          <Stat label="Total on crown" kind="kpa" value={total} tone="brand" />
          <Stat label="Ovalisation Δy/D" kind="pct" value={ov.ratio} dp={2} tone={ov.ratio > 0.03 ? 'bad' : 'ok'} />
          <Stat label="Wall bending stress" kind="stress" value={ov.bending} />
        </Stats>
        {ov.ratio > 0.03
          ? <Verdict tone="bad">Ovalisation above 3 %. Increase wall thickness, improve backfill compaction or add cover or a protective slab.</Verdict>
          : H < 0.9 && wheel > 0 ? <Verdict tone="warn">Ovalisation is acceptable, but shallow cover lets traffic load dominate. Most codes require more cover at road crossings.</Verdict>
          : <Verdict tone="ok">Ovalisation is within the usual 3 % screening limit.</Verdict>}
      </View>
    </Frame>
  );
}
