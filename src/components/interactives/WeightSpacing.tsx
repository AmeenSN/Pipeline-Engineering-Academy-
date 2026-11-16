import { useState } from 'react';
import { buoyancy } from '@/lib/eng/loads';
import { Controls, Frame, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { usePipe } from './pipe';

const FLUIDS = { fresh: { label: 'Fresh water', rho: 1000 }, brine: { label: 'Sabkha brine', rho: 1150 }, liq: { label: 'Liquefied soil', rho: 1600 } } as const;

export default function WeightSpacing() {
  const sys = useUnits();
  const pipe = usePipe(30, 9.5);
  const [fluid, setFluid] = useState<keyof typeof FLUIDS>('brine');
  const [mass, setMass] = useState(3000);
  const rho = FLUIDS[fluid].rho;
  const b = buoyancy({ D: pipe.D, t: pipe.t, coatT: 3, coatRho: 950, concT: 0, concRho: 2400, fluidRho: rho, contentRho: 0 });
  const need = Math.max(1.1 * b.uplift - b.weight, 0); // N/m
  const each = mass * 9.81 * (1 - rho / 2400); // submerged weight of one concrete weight
  const spacing = need > 0 ? each / need : Infinity;
  const W = 560, n = Number.isFinite(spacing) ? Math.min(Math.floor(60 / Math.max(spacing, 0.5)), 40) : 0, sx = (W - 40) / 60;

  return (
    <Frame title="Set-on weight spacing" foot="Empty pipe with 3 mm coating, safety factor 1.1 against flotation, concrete weights of density 2400 kg/m³ (their own buoyancy deducted). Backfill weight ignored.">
      <Controls>
        {pipe.pickers}
        <Segmented label="Surrounding fluid" value={fluid} onChange={setFluid} options={Object.entries(FLUIDS).map(([k, v]) => ({ value: k as keyof typeof FLUIDS, label: v.label.split(' ')[0] }))} />
        <Slider label="Mass of each weight (kg)" value={mass} onChange={setMass} min={500} max={8000} step={250} dp={0} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 130`} role="img" aria-label="Side view of pipe with saddle weights at the calculated spacing" style={{ width: '100%' }}>
          <rect width={W} height="130" fill="var(--brand)" opacity=".08" />
          <rect x="20" y="62" width={W - 40} height="18" fill="var(--steel)" stroke="var(--text)" />
          {Array.from({ length: n + 1 }, (_, i) => {
            const x = 20 + (i + 0.5) * spacing * sx;
            return x < W - 30 && <path key={i} d={`M${x - 9} 86V54h18V86h-5V62h-8V86z`} fill="var(--accent)" stroke="var(--text)" />;
          })}
          <text x="20" y="112" className="svg-label">60 m of pipeline · {FLUIDS[fluid].label}</text>
          {Number.isFinite(spacing) && spacing < 60 && <text x={W - 20} y="30" textAnchor="end" className="svg-strong">one weight every {fmt('m', sys, spacing, 1)} {unitOf('m', sys)}</text>}
        </svg>
        <Stats>
          <Stat label="Buoyancy" kind="lineload" value={b.uplift} />
          <Stat label="Pipe weight" kind="lineload" value={b.weight} />
          <Stat label="Extra downforce needed" kind="lineload" value={need} tone="brand" />
          <Stat label="Net weight of one unit" kind="force" value={each} dp={1} />
          <Stat label="Maximum spacing" kind="m" value={spacing} dp={1} text={Number.isFinite(spacing) ? undefined : 'none needed'} />
        </Stats>
        {!Number.isFinite(spacing) ? <Verdict tone="ok">The pipe is heavy enough on its own. No weights are needed.</Verdict>
          : spacing < 3 ? <Verdict tone="warn">Weights would be almost touching. Continuous concrete weight coating is the better solution here.</Verdict>
          : spacing > 12 ? <Verdict tone="warn">Calculated spacing is wide. Limit it so the pipe cannot lift and overstress between weights: about one joint length is a common maximum.</Verdict>
          : <Verdict tone="ok">Practical spacing. Protect the coating under each weight with rock shield or felt padding.</Verdict>}
      </View>
    </Frame>
  );
}
