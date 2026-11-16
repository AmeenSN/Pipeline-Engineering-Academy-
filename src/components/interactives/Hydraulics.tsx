import { useState } from 'react';
import { joukowsky, pressureDrop, waveSpeed } from '@/lib/eng/flow';
import { Controls, Frame, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { lin, usePipe } from './pipe';

const FLUIDS = { crude: { label: 'Crude oil', rho: 850, mu: 8, K: 1.5e9 }, water: { label: 'Water', rho: 1000, mu: 1, K: 2.2e9 }, diesel: { label: 'Diesel', rho: 830, mu: 3, K: 1.4e9 } } as const;

export default function Hydraulics() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [fluid, setFluid] = useState<keyof typeof FLUIDS>('crude');
  const [Q, setQ] = useState(2000);
  const [L, setL] = useState(100);
  const [pin, setPin] = useState(8);
  const [maop, setMaop] = useState(9.6);
  const [rise, setRise] = useState(50);
  const f = FLUIDS[fluid], Di = pipe.D - 2 * pipe.t;
  const r = pressureDrop({ Q, Di, L, rho: f.rho, mu: f.mu });
  const stat = (f.rho * 9.81 * rise) / 1e6;
  const pout = pin - r.dP - stat;
  const a = waveSpeed(f.K, f.rho, pipe.D, pipe.t), surge = joukowsky(f.rho, a, r.v);
  const peak = Math.max(pout, 0) + surge;
  const W = 560, H = 240, x = lin(0, L, 46, W - 14), yMax = Math.max(maop * 1.35, peak * 1.05, pin * 1.1), y = lin(0, yMax, H - 26, 12);
  const bar = (v: number) => `${fmt('pressure', sys, v)} ${unitOf('pressure', sys)}`;

  return (
    <Frame title="Pressure profile and surge" foot="Darcy-Weisbach with the Swamee-Jain friction factor, roughness 0.045 mm, constant elevation slope. Surge is the Joukowsky rise for instant closure at the delivery end: a worst case that real valve closure times reduce.">
      <Controls>
        <Segmented label="Fluid" value={fluid} onChange={setFluid} options={Object.entries(FLUIDS).map(([k, v]) => ({ value: k as keyof typeof FLUIDS, label: v.label.split(' ')[0] }))} />
        {pipe.pickers}
        <Slider label="Flow rate (m³/h)" value={Q} onChange={setQ} min={100} max={8000} step={50} dp={0} />
        <Slider label="Pipeline length (km)" value={L} onChange={setL} min={5} max={300} step={5} dp={0} />
        <Slider label="Pump discharge pressure" kind="pressure" value={pin} onChange={setPin} min={1} max={15} step={0.1} />
        <Slider label="MAOP" kind="pressure" value={maop} onChange={setMaop} min={2} max={15} step={0.1} />
        <Slider label="Elevation gain to delivery" kind="m" value={rise} onChange={setRise} min={-300} max={600} step={10} dp={0} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pressure along the pipeline with MAOP and surge" style={{ width: '100%' }}>
          <line x1={x(0)} x2={x(L)} y1={y(0)} y2={y(0)} stroke="var(--line)" />
          <rect x={x(0)} y={y(yMax)} width={x(L) - x(0)} height={y(maop * 1.1) - y(yMax)} fill="var(--bad)" opacity=".08" />
          <line x1={x(0)} x2={x(L)} y1={y(maop)} y2={y(maop)} stroke="var(--ok)" strokeDasharray="6 4" />
          <line x1={x(0)} x2={x(L)} y1={y(maop * 1.1)} y2={y(maop * 1.1)} stroke="var(--bad)" strokeDasharray="2 4" />
          <path d={`M${x(0)},${y(pin)}L${x(L)},${y(Math.max(pout, 0))}`} stroke="var(--brand)" strokeWidth="3" fill="none" />
          <path d={`M${x(L)},${y(Math.max(pout, 0))}L${x(L)},${y(peak)}L${x(Math.max(L - L * 0.35, 0))},${y(Math.max(pout, 0) + r.dP * 0.35 + stat * 0.35 + surge * 0.55)}`} stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 3" fill="none" />
          <circle cx={x(L)} cy={y(peak)} r="5" fill="var(--accent)" />
          <text x={x(0) + 6} y={y(maop) - 5} className="svg-label" style={{ fill: 'var(--ok)' }}>MAOP</text>
          <text x={x(0) + 6} y={y(maop * 1.1) - 5} className="svg-label" style={{ fill: 'var(--bad)' }}>110 % MAOP surge limit</text>
          <text x={x(L) - 8} y={y(peak) - 8} textAnchor="end" className="svg-label" style={{ fill: 'var(--accent)' }}>surge peak if the delivery valve slams shut</text>
          <text x={x(0)} y={H - 8} className="svg-label">pump station</text>
          <text x={x(L)} y={H - 8} textAnchor="end" className="svg-label">delivery · {L} km</text>
        </svg>
        <Stats>
          <Stat label="Velocity" kind="velocity" value={r.v} tone={r.v > 3 ? 'warn' : undefined} />
          <Stat label="Reynolds number" text={r.Re > 1e4 ? `${(r.Re / 1000).toFixed(0)} k` : r.Re.toFixed(0)} />
          <Stat label="Friction loss" kind="pressure" value={r.dP} />
          <Stat label="Static head" kind="pressure" value={stat} />
          <Stat label="Arrival pressure" kind="pressure" value={pout} tone={pout < 0.3 ? 'bad' : 'brand'} />
          <Stat label="Surge rise" kind="pressure" value={surge} />
        </Stats>
        {pin > maop ? <Verdict tone="bad">Pump discharge pressure is above MAOP.</Verdict>
          : pout < 0.3 ? <Verdict tone="bad">The fluid does not arrive: friction and elevation use all the pressure. Add a booster station, enlarge the pipe or reduce flow.</Verdict>
          : peak > maop * 1.1 ? <Verdict tone="warn">Normal operation is fine ({bar(pout)} at delivery), but an instant valve closure would exceed 110 % of MAOP. Surge protection or slower valves are needed.</Verdict>
          : <Verdict tone="ok">The line delivers {bar(pout)} and the worst-case surge stays within 110 % of MAOP.</Verdict>}
      </View>
    </Frame>
  );
}
