import { useState } from 'react';
import { laceyScour, laceySiltFactor } from '@/lib/eng/flow';
import { Controls, Defs, Frame, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';

const BENDS = { straight: { label: 'Straight reach', k: 1.27 }, moderate: { label: 'Moderate bend', k: 1.5 }, severe: { label: 'Sharp bend', k: 1.75 } } as const;

export default function ScourDepth() {
  const sys = useUnits();
  const [Q, setQ] = useState(400);
  const [d50, setD50] = useState(0.5);
  const [flow, setFlow] = useState(2);
  const [bend, setBend] = useState<keyof typeof BENDS>('straight');
  const [margin, setMargin] = useState(1.5);
  const [cover, setCover] = useState(3);
  const f = laceySiltFactor(d50), R = laceyScour(Q, f), below = BENDS[bend].k * R;
  const scour = Math.max(below - flow, 0), need = scour + margin, ok = cover >= need;
  const W = 560, H = 240, bed = 86, s = 150 / Math.max(need + 1.5, cover + 1, 5);
  const u = (v: number) => `${fmt('m', sys, v, 1)} ${unitOf('m', sys)}`;

  return (
    <Frame title="Wadi scour and burial depth" foot="Lacey regime scour for sandy beds: R = 0.473·(Q/f)^⅓ below flood level, with f = 1.76·√d50, multiplied by a factor for channel shape. A screening method: design scour depth comes from the hydrological study.">
      <Controls>
        <Slider label="Design flood flow (m³/s)" value={Q} onChange={setQ} min={20} max={3000} step={10} dp={0} />
        <Slider label="Median bed grain size d50 (mm)" value={d50} onChange={setD50} min={0.1} max={10} step={0.1} dp={1} />
        <Slider label="Flood water depth" kind="m" value={flow} onChange={setFlow} min={0.5} max={6} step={0.1} dp={1} />
        <Segmented label="Channel at the crossing" value={bend} onChange={setBend} options={Object.entries(BENDS).map(([k, v]) => ({ value: k as keyof typeof BENDS, label: v.label.split(' ')[0] }))} />
        <Slider label="Safety margin below scour" kind="m" value={margin} onChange={setMargin} min={0.5} max={3} step={0.1} dp={1} />
        <Slider label="Cover provided below wadi bed" kind="m" value={cover} onChange={setCover} min={1} max={8} step={0.1} dp={1} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wadi cross-section showing flood level, scoured bed and buried pipe" style={{ width: '100%' }}>
          <Defs />
          <path d={`M0 40H90L140 ${bed}H420L470 40H${W}V${H}H0Z`} fill="url(#soil)" />
          <path d={`M110 ${bed - flow * 14}H450L420 ${bed}H140Z`} fill="var(--brand)" opacity=".3" />
          <path d={`M0 40H90L140 ${bed}H420L470 40H${W}`} fill="none" stroke="var(--text)" strokeWidth="1.5" />
          <path d={`M140 ${bed}Q280 ${bed + scour * s * 2} 420 ${bed}`} fill="var(--bg)" opacity=".55" stroke="var(--bad)" strokeDasharray="5 4" />
          <text x="286" y={bed + scour * s + 14} textAnchor="middle" className="svg-label" style={{ fill: 'var(--bad)' }}>scoured bed in flood: {u(scour)}</text>
          <line x1="0" x2={W} y1={bed + cover * s} y2={bed + cover * s} stroke={ok ? 'var(--ok)' : 'var(--bad)'} strokeWidth="9" />
          <line x1="500" x2="500" y1={bed} y2={bed + cover * s - 5} stroke="var(--text)" markerStart="url(#arr-text)" markerEnd="url(#arr-text)" />
          <text x="494" y={bed + (cover * s) / 2} textAnchor="end" className="svg-strong">{u(cover)}</text>
          <line x1="60" x2="520" y1={bed + need * s} y2={bed + need * s} stroke="var(--muted)" strokeDasharray="2 4" />
          <text x="64" y={bed + need * s - 5} className="svg-label">required top of pipe</text>
          <text x="280" y={bed - flow * 14 - 6} textAnchor="middle" className="svg-label" style={{ fill: 'var(--brand)' }}>flood level</text>
          <text x="10" y="30" className="svg-label">bank</text>
        </svg>
        <Stats>
          <Stat label="Silt factor f" value={f} dp={2} />
          <Stat label="Scour below flood level" kind="m" value={below} dp={1} />
          <Stat label="Scour below bed" kind="m" value={scour} dp={1} />
          <Stat label="Cover required" kind="m" value={need} dp={1} tone="brand" />
        </Stats>
        {ok ? <Verdict tone="ok">The pipe stays buried through the design flood with margin. Add concrete coating so it remains stable if exposed anyway.</Verdict>
          : <Verdict tone="bad">The design flood would expose the pipe. Bury it at least {u(need)} below the wadi bed, or use a trenchless crossing below the scour level.</Verdict>}
      </View>
    </Frame>
  );
}
