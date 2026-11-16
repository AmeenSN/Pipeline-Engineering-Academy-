import { useState } from 'react';
import { buoyancy, requiredConcrete } from '@/lib/eng/loads';
import { Controls, Defs, Frame, Meter, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { clamp, usePipe } from './pipe';

const FLUIDS = { fresh: { label: 'Fresh water', rho: 1000 }, sea: { label: 'Seawater', rho: 1025 }, brine: { label: 'Sabkha brine', rho: 1150 } } as const;

export default function Buoyancy() {
  const sys = useUnits();
  const pipe = usePipe(30, 9.5);
  const [conc, setConc] = useState(0);
  const [concRho, setConcRho] = useState('3040');
  const [fluid, setFluid] = useState<keyof typeof FLUIDS>('brine');
  const [full, setFull] = useState<'empty' | 'full'>('empty');
  const base = { D: pipe.D, t: pipe.t, coatT: 3, coatRho: 950, concRho: Number(concRho), fluidRho: FLUIDS[fluid].rho, contentRho: full === 'full' ? 850 : 0 };
  const r = buoyancy({ ...base, concT: conc });
  const need = requiredConcrete(base, 1.1);

  const R = 70, k = R / (pipe.D / 2), rc = R + conc * k, bore = R - Math.max(pipe.t * k, 2.5);
  const big = Math.max(r.weight, r.uplift);
  const aw = clamp((r.weight / big) * 90, 14, 90), au = clamp((r.uplift / big) * 90, 14, 90);
  const tone = r.sf >= 1.1 ? 'ok' : r.sf >= 1 ? 'warn' : 'bad';
  const float = r.sf < 1 ? -52 : 18;

  return (
    <Frame title="Buoyancy check" foot="Per metre of pipe, 3 mm polyethylene coating, target safety factor 1.1 against flotation. Backfill weight above the pipe is ignored (conservative).">
      <Controls>
        {pipe.pickers}
        <Segmented label="Surrounding fluid" value={fluid} onChange={setFluid} options={Object.entries(FLUIDS).map(([k2, v]) => ({ value: k2 as keyof typeof FLUIDS, label: v.label.split(' ')[0] }))} />
        <Segmented label="Pipe contents" value={full} onChange={setFull} options={[{ value: 'empty', label: 'Empty (worst case)' }, { value: 'full', label: 'Oil-filled' }]} />
        <Slider label="Concrete weight coating" kind="mm" value={conc} onChange={setConc} min={0} max={150} step={5} dp={sys === 'si' ? 0 : 2} />
        <Segmented label="Concrete density" value={concRho} onChange={setConcRho} options={[{ value: '2400', label: '2400 kg/m³' }, { value: '3040', label: '3040 kg/m³' }]} />
      </Controls>
      <View>
        <svg viewBox="-200 -150 400 300" role="img" aria-label="Pipe cross-section in groundwater with weight and buoyancy arrows" style={{ width: '100%', maxHeight: 300 }}>
          <Defs />
          <rect x="-200" y="-105" width="400" height="255" fill="var(--brand)" opacity=".1" />
          <path d="M-200 -105q25 -8 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" fill="none" stroke="var(--brand)" strokeWidth="1.5" />
          <text x="-192" y="-114" className="svg-label">{FLUIDS[fluid].label} · {FLUIDS[fluid].rho} kg/m³</text>
          <g transform={`translate(0 ${float})`} style={{ transition: 'transform .4s' }}>
            {conc > 0 && <circle r={rc} fill="var(--steel)" opacity=".55" stroke="var(--text)" />}
            <circle r={R} fill="var(--text)" />
            <circle r={bore} fill={full === 'full' ? 'var(--accent)' : 'var(--surface)'} opacity={full === 'full' ? 0.75 : 1} />
            <line x1="-34" x2="-34" y1="0" y2={aw} stroke="var(--accent)" strokeWidth="4" markerEnd="url(#arr-accent)" transform={`translate(${-rc - 6} 0)`} />
            <line x1="34" x2="34" y1="0" y2={-au} stroke="var(--brand)" strokeWidth="4" markerEnd="url(#arr-brand)" transform={`translate(${rc + 6} 0)`} />
            <text x={-rc - 48} y={aw + 20} textAnchor="middle" className="svg-strong">weight</text>
            <text x={rc + 48} y={-au - 12} textAnchor="middle" className="svg-strong">buoyancy</text>
          </g>
        </svg>
        <Stats>
          <Stat label="Weight (down)" kind="lineload" value={r.weight} />
          <Stat label="Buoyancy (up)" kind="lineload" value={r.uplift} />
          <Stat label="Net downward" kind="lineload" value={r.net} tone={r.net < 0 ? 'bad' : undefined} />
          <Stat label="Safety factor" value={r.sf} dp={2} tone={tone} />
          <Stat label="Concrete needed for SF 1.1" kind="mm" value={need ?? 0} dp={sys === 'si' ? 0 : 2} text={need === null ? '> 300 mm' : undefined} />
        </Stats>
        <Meter label="Buoyancy ÷ weight (limit 1 / 1.1)" ratio={(r.uplift / r.weight) * 1.1} />
        {tone === 'ok' ? <Verdict tone="ok">Stable. The pipe will stay down even if the trench floods before backfilling.</Verdict>
          : tone === 'warn' ? <Verdict tone="warn">Just heavier than the fluid, but below the 1.1 margin. Add weight or rely on verified backfill.</Verdict>
          : <Verdict tone="bad">The pipe floats. Add concrete coating, saddle weights or screw anchors.</Verdict>}
      </View>
    </Frame>
  );
}
