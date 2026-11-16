import { useState } from 'react';
import { freeSpan, maxSpanForVr, type EndCondition } from '@/lib/eng/span';
import { Controls, Defs, Frame, Segmented, Slider, Stat, Stats, Verdict, View } from './kit';
import { clamp, lin, usePipe } from './pipe';

export default function FreeSpan() {
  const pipe = usePipe(16, 12.7);
  const [L, setL] = useState(30);
  const [U, setU] = useState(0.8);
  const [ends, setEnds] = useState<EndCondition>('pinned');
  const base = { D: pipe.D, t: pipe.t, ends, contentRho: 800, fluidRho: 1025, U };
  const r = freeSpan({ ...base, L });
  const lMax = maxSpanForVr(base, 1.0);
  const zone = r.Vr < 1 ? 0 : r.Vr < 3 ? 1 : 2;

  const W = 560, H = 190, y0 = 70, xa = 90, xb = W - 90;
  const span = lin(5, 80, 120, xb - xa)(L);
  const x1 = W / 2 - span / 2, x2 = W / 2 + span / 2;
  const sag = clamp(span * 0.03, 2, 14), amp = zone === 0 ? 0 : zone === 1 ? 6 : 16;
  const d = (a: number) => `M0 ${y0}L${x1} ${y0}Q${W / 2} ${y0 + sag + a} ${x2} ${y0}L${W} ${y0}`;
  const dur = clamp(1 / Math.max(r.fn, 0.2), 0.25, 2.5);
  const gx = lin(0, 6, 20, W - 20);

  return (
    <Frame title="Free span and vortex-induced vibration" foot="Submerged pipe in seawater or flood flow, contents 800 kg/m³, added-mass coefficient 1.0, Strouhal number 0.2. Onset values are indicative: DNV-RP-F105 gives the full screening method.">
      <Controls>
        {pipe.pickers}
        <Slider label="Span length" kind="m" value={L} onChange={setL} min={5} max={80} step={1} dp={0} />
        <Slider label="Flow velocity across the pipe" kind="velocity" value={U} onChange={setU} min={0.1} max={3} step={0.05} />
        <Segmented label="Span end fixity" value={ends} onChange={setEnds} options={[{ value: 'pinned', label: 'Pinned' }, { value: 'fixed-pinned', label: 'Mixed' }, { value: 'fixed', label: 'Fixed' }]} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pipe spanning a gap in the seabed, vibrating when the flow is fast enough" style={{ width: '100%' }}>
          <Defs />
          <rect width={W} height={H} fill="var(--brand)" opacity=".07" />
          {[24, 44, 110].map((yy, i) => <line key={i} x1={30 + i * 40} x2={90 + i * 40} y1={yy} y2={yy} stroke="var(--brand)" strokeWidth="1.5" strokeDasharray="6 5" markerEnd="url(#arr-brand)" style={{ animation: 'flow 1s linear infinite' }} />)}
          <path d={`M0 ${y0 + 9}L${x1 - 6} ${y0 + 9}Q${x1 + 20} ${y0 + 12} ${x1 + 30} ${y0 + 60}Q${W / 2} ${y0 + 110} ${x2 - 30} ${y0 + 60}Q${x2 - 20} ${y0 + 12} ${x2 + 6} ${y0 + 9}L${W} ${y0 + 9}L${W} ${H}L0 ${H}Z`} fill="url(#soil)" stroke="var(--text)" strokeWidth="1.5" />
          <path d={d(0)} fill="none" stroke="var(--text)" strokeWidth="14" opacity=".9">
            {amp > 0 && <animate attributeName="d" values={`${d(-amp)};${d(amp)};${d(-amp)}`} dur={`${dur}s`} repeatCount="indefinite" />}
          </path>
          <line x1={x1} x2={x2} y1={y0 + 96} y2={y0 + 96} stroke="var(--muted)" markerStart="url(#arr-muted)" markerEnd="url(#arr-muted)" />
          <text x={W / 2} y={y0 + 112} textAnchor="middle" className="svg-strong">span L</text>
        </svg>
        <div>
          <svg viewBox={`0 0 ${W} 54`} role="img" aria-label="Reduced velocity gauge" style={{ width: '100%' }}>
            <rect x={gx(0)} y="18" width={gx(1) - gx(0)} height="12" fill="var(--ok)" opacity=".7" />
            <rect x={gx(1)} y="18" width={gx(3) - gx(1)} height="12" fill="var(--yellow)" opacity=".7" />
            <rect x={gx(3)} y="18" width={gx(6) - gx(3)} height="12" fill="var(--bad)" opacity=".7" />
            <path d={`M${gx(Math.min(r.Vr, 6))} 16l-6 -10h12z`} fill="var(--text)" />
            <text x={gx(0.5)} y="46" textAnchor="middle" className="svg-label">no VIV</text>
            <text x={gx(2)} y="46" textAnchor="middle" className="svg-label">in-line VIV</text>
            <text x={gx(4.5)} y="46" textAnchor="middle" className="svg-label">cross-flow VIV</text>
          </svg>
        </div>
        <Stats>
          <Stat label="Natural frequency" kind="hz" value={r.fn} />
          <Stat label="Vortex shedding frequency" kind="hz" value={r.fs} />
          <Stat label="Reduced velocity Vr" value={r.Vr} dp={2} tone={zone === 0 ? 'ok' : zone === 1 ? 'warn' : 'bad'} />
          <Stat label="Static bending stress" kind="stress" value={r.bending} />
          <Stat label="Longest span with Vr < 1" kind="m" value={lMax} dp={0} tone="brand" />
        </Stats>
        {zone === 0 ? <Verdict tone="ok">Below VIV onset. The span is short and stiff enough for this flow.</Verdict>
          : zone === 1 ? <Verdict tone="warn">In-line vibration is possible. Assess fatigue or shorten the span with supports.</Verdict>
          : <Verdict tone="bad">Cross-flow vibration is likely: large amplitudes and rapid fatigue damage. Correct the span (grout bags, rock dump, trenching, supports).</Verdict>}
      </View>
    </Frame>
  );
}
