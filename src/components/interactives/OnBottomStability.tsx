import { useState } from 'react';
import { buoyancy } from '@/lib/eng/loads';
import { hydroForces, requiredSubmergedWeight } from '@/lib/eng/ops';
import { Controls, Defs, Frame, Meter, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { clamp, usePipe } from './pipe';

const SOIL = { sand: { label: 'Sand', mu: 0.6 }, clay: { label: 'Clay', mu: 0.2 } } as const;

export default function OnBottomStability() {
  const sys = useUnits();
  const pipe = usePipe(24, 15.9);
  const [conc, setConc] = useState(50);
  const [U, setU] = useState(1.0);
  const [soil, setSoil] = useState<keyof typeof SOIL>('sand');
  const b = buoyancy({ D: pipe.D, t: pipe.t, coatT: 3, coatRho: 950, concT: conc, concRho: 3040, fluidRho: 1025, contentRho: 0 });
  const Do = b.outerD / 1000, f = hydroForces(Do, U), mu = SOIL[soil].mu;
  const need = requiredSubmergedWeight(f.drag, f.lift, mu), ws = b.net, ok = ws >= need, floats = ws <= 0;
  const R = 46, k = (v: number) => clamp((v / Math.max(need, ws, 1)) * 70, 8, 80);

  return (
    <Frame title="On-bottom stability" foot="Simplified static check for an empty pipe resting on the seabed in steady flow: drag and lift from Morison-type coefficients (0.7 and 0.9), required submerged weight = 1.1 × (drag ÷ friction + lift). Concrete 3040 kg/m³. DNV-RP-F109 gives the full method, including wave loading and pipe embedment.">
      <Controls>
        {pipe.pickers}
        <Slider label="Concrete weight coating" kind="mm" value={conc} onChange={setConc} min={0} max={150} step={5} dp={sys === 'si' ? 0 : 2} />
        <Slider label="Near-bed water velocity (current + wave)" kind="velocity" value={U} onChange={setU} min={0.1} max={3} step={0.05} />
        <Segmented label="Seabed" value={soil} onChange={setSoil} options={Object.entries(SOIL).map(([key, v]) => ({ value: key as keyof typeof SOIL, label: `${v.label} (μ ${v.mu})` }))} />
      </Controls>
      <View>
        <svg viewBox="-200 -120 400 210" role="img" aria-label="Forces on a pipe resting on the seabed" style={{ width: '100%', maxHeight: 280 }}>
          <Defs />
          <rect x="-200" y="-120" width="400" height="166" fill="var(--brand)" opacity=".08" />
          <rect x="-200" y={R} width="400" height="50" fill="url(#soil)" /><line x1="-200" x2="200" y1={R} y2={R} stroke="var(--text)" strokeWidth="1.5" />
          {[-90, -60, -30].map((yy) => <line key={yy} x1="-190" x2="-130" y1={yy} y2={yy} stroke="var(--brand)" strokeWidth="1.5" strokeDasharray="6 5" markerEnd="url(#arr-brand)" />)}
          <g transform={`translate(${ok ? 0 : 26} ${floats ? -18 : 0})`} style={{ transition: 'transform .4s' }}>
            <circle r={R} fill="var(--steel)" stroke="var(--text)" /><circle r={R - Math.max(conc * 0.14, 0) - 4} fill="var(--surface)" stroke="var(--text)" />
            <line x1={-R - 6} x2={-R - 6 + k(f.drag)} y1="-6" y2="-6" stroke="var(--bad)" strokeWidth="4" markerEnd="url(#arr-bad)" transform={`translate(${R * 2 + 12} 0)`} />
            <line x1="0" x2="0" y1={-R - 4} y2={-R - 4 - k(f.lift)} stroke="var(--accent)" strokeWidth="4" markerEnd="url(#arr-accent)" />
            <line x1="0" x2="0" y1="0" y2={k(Math.max(ws, 0))} stroke="var(--ok)" strokeWidth="4" markerEnd="url(#arr-ok)" />
          </g>
          <text x="-190" y="-104" className="svg-label">flow</text>
          <text x="118" y="-12" className="svg-label" style={{ fill: 'var(--bad)' }}>drag</text><text x="8" y={-R - 40} className="svg-label" style={{ fill: 'var(--accent)' }}>lift</text><text x="8" y="30" className="svg-label" style={{ fill: 'var(--ok)' }}>weight</text>
          <text x="-190" y={R + 20} className="svg-label">friction resists sliding</text>
        </svg>
        <Stats>
          <Stat label="Submerged weight" kind="lineload" value={ws} tone={ok ? 'ok' : 'bad'} />
          <Stat label="Drag force" kind="lineload" value={f.drag} />
          <Stat label="Lift force" kind="lineload" value={f.lift} />
          <Stat label="Weight required" kind="lineload" value={need} tone="brand" />
          <Stat label="Outside diameter" kind="mm" value={b.outerD} dp={sys === 'si' ? 0 : 1} />
        </Stats>
        <Meter label="Required ÷ actual submerged weight" ratio={ws > 0 ? need / ws : 2} />
        {floats ? <Verdict tone="bad">The empty pipe is buoyant. It needs concrete coating before stability can even be considered.</Verdict>
          : ok ? <Verdict tone="ok">Stable. The pipe is heavy enough that friction resists the drag, even with lift reducing its grip on the seabed.</Verdict>
          : <Verdict tone="bad">The pipe would slide. Add concrete, trench or bury the pipe, or use rock cover or mattresses.{soil === 'clay' ? ' Low friction on clay makes weight alone inefficient.' : ''}</Verdict>}
      </View>
    </Frame>
  );
}
