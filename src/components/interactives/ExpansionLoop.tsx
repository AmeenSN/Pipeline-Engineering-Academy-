import { useState } from 'react';
import { offsetLeg, supportSpan, thermalGrowth } from '@/lib/eng/ops';
import { Controls, Defs, Frame, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { gradeOf, gradeOptions, usePipe } from './pipe';

export default function ExpansionLoop() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [grade, setGrade] = useState('X65');
  const [dT, setDT] = useState(60);
  const [L, setL] = useState(300);
  const smys = gradeOf(grade).smys, SA = 0.72 * smys;
  const growth = thermalGrowth(L, dT);
  const leg = offsetLeg(pipe.D, growth / 2, SA); // each leg of a symmetric loop takes half the growth
  const sp = supportSpan(pipe.D, pipe.t, 850, 0.25 * smys);
  const span = Math.min(sp.span, 30);
  const W = 560, cx = W / 2, y0 = 150, lw = 46, lh = Math.min(Math.max(leg * 3.2, 24), 110);
  const u = (v: number, dp = 1) => `${fmt('m', sys, v, dp)} ${unitOf('m', sys)}`;
  const nSup = Math.max(Math.floor(L / span), 1);

  return (
    <Frame title="Above-ground expansion loop" foot="Free thermal growth α·ΔT·L between anchors, absorbed by a symmetric loop at mid-length. Leg length from the guided-cantilever formula L = √(3·E·D·δ / S), with the allowable expansion stress range taken as 0.72 SMYS. Support span limits bending stress to 25 % SMYS for a crude-filled pipe. Preliminary sizing: final design needs a pipe stress analysis.">
      <Controls>
        {pipe.pickers}
        <Select label="Material grade" value={grade} onChange={setGrade} options={gradeOptions} />
        <Slider label="Temperature range ΔT" kind="dT" value={dT} onChange={setDT} min={10} max={120} step={1} />
        <Slider label="Distance between anchors" kind="m" value={L} onChange={setL} min={50} max={1000} step={10} dp={0} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 200`} role="img" aria-label="Plan view of an above-ground pipeline with an expansion loop between two anchors" style={{ width: '100%' }}>
          <Defs />
          <path d={`M30 ${y0}H${cx - lw}V${y0 - lh}H${cx + lw}V${y0}H${W - 30}`} fill="none" stroke="var(--steel)" strokeWidth="10" strokeLinejoin="round" />
          <path d={`M30 ${y0}H${cx - lw + 7}V${y0 - lh}`} fill="none" stroke="var(--bad)" strokeWidth="1.5" strokeDasharray="4 4" opacity=".8" />
          <path d={`M${W - 30} ${y0}H${cx + lw - 7}V${y0 - lh}`} fill="none" stroke="var(--bad)" strokeWidth="1.5" strokeDasharray="4 4" opacity=".8" />
          {[30, W - 30].map((ax) => <g key={ax}><rect x={ax - 9} y={y0 - 14} width="18" height="28" fill="var(--text)" /><text x={ax} y={y0 + 30} textAnchor="middle" className="svg-label">anchor</text></g>)}
          {Array.from({ length: 8 }, (_, i) => { const sx2 = 60 + i * ((W - 120) / 7); return Math.abs(sx2 - cx) > lw + 12 && <rect key={i} x={sx2 - 3} y={y0 - 9} width="6" height="18" fill="var(--yellow)" stroke="var(--text)" strokeWidth=".6" />; })}
          <line x1="110" x2="170" y1={y0 - 22} y2={y0 - 22} stroke="var(--bad)" strokeWidth="2" markerEnd="url(#arr-bad)" /><line x1={W - 110} x2={W - 170} y1={y0 - 22} y2={y0 - 22} stroke="var(--bad)" strokeWidth="2" markerEnd="url(#arr-bad)" />
          <text x="110" y={y0 - 30} className="svg-label" style={{ fill: 'var(--bad)' }}>pipe grows toward the loop</text>
          <line x1={cx + lw + 16} x2={cx + lw + 16} y1={y0} y2={y0 - lh} stroke="var(--text)" markerStart="url(#arr-text)" markerEnd="url(#arr-text)" />
          <text x={cx + lw + 22} y={y0 - lh / 2 + 4} className="svg-strong">leg {u(leg)}</text>
          <text x={cx} y={y0 - lh - 10} textAnchor="middle" className="svg-label">loop legs bend to absorb the growth</text>
          <text x="60" y={y0 + 46} className="svg-label" style={{ fill: 'var(--yellow)' }}>■ sliding supports with guides</text>
        </svg>
        <Stats>
          <Stat label="Thermal growth between anchors" kind="mm" value={growth} dp={sys === 'si' ? 0 : 2} tone="brand" />
          <Stat label="Loop leg length needed" kind="m" value={leg} dp={1} />
          <Stat label="Maximum support span" kind="m" value={span} dp={1} />
          <Stat label="Supports between anchors" text={String(nSup)} />
          <Stat label="Force if fully restrained instead" kind="force" value={207000 * 11.7e-6 * dT * (Math.PI / 4) * (pipe.D ** 2 - (pipe.D - 2 * pipe.t) ** 2)} />
        </Stats>
        {leg > 25 ? <Verdict tone="warn">The loop legs are very long. Reduce the anchor spacing so each loop absorbs less movement.</Verdict>
          : <Verdict tone="ok">A loop with legs of about {u(leg)} absorbs {fmt('mm', sys, growth, sys === 'si' ? 0 : 2)} {unitOf('mm', sys)} of growth. Compare that with the anchor force a fully restrained pipe would generate.</Verdict>}
      </View>
    </Frame>
  );
}
