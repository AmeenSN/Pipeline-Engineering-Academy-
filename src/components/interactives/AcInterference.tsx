import { useState } from 'react';
import { acDensity } from '@/lib/eng/ops';
import { Controls, Defs, Frame, Slider, Stat, Stats, Verdict, View } from './kit';
import { lin } from './pipe';

export default function AcInterference() {
  const [vac, setVac] = useState(8);
  const [rho, setRho] = useState(20);
  const J = acDensity(vac, rho);
  const tone = J < 30 ? 'ok' : J < 100 ? 'warn' : 'bad';
  const touch = vac > 15;
  const W = 560, gx = (v: number) => lin(0, 2.6, 20, W - 20)(Math.log10(Math.max(v, 1)));

  return (
    <Frame title="AC interference check" foot="AC current density at a 1 cm² coating holiday: J = 8·V / (ρ·π·d) with d = 0.0113 m. Bands follow common guidance (below about 30 A/m² low risk, above 100 A/m² corrosion expected). 15 V is the usual touch-voltage safety limit.">
      <Controls>
        <Slider label="Induced AC voltage on the pipe (V)" value={vac} onChange={setVac} min={0.5} max={60} step={0.5} dp={1} />
        <Slider label="Soil resistivity at the holiday (ohm·m)" value={rho} onChange={setRho} min={1} max={300} step={1} dp={0} />
      </Controls>
      <View>
        <svg viewBox="0 0 560 170" role="img" aria-label="Pipeline running parallel to an overhead power line" style={{ width: '100%' }}>
          <Defs />
          {[80, 280, 480].map((px) => <g key={px}><path d={`M${px} 100V20M${px - 22} 34H${px + 22}M${px - 16} 50H${px + 16}`} stroke="var(--text)" strokeWidth="2" fill="none" /></g>)}
          <path d="M58 34Q180 52 258 34T458 34T560 40" fill="none" stroke="var(--bad)" strokeWidth="1.5" /><path d="M102 34Q200 52 302 34T502 34T560 42" fill="none" stroke="var(--bad)" strokeWidth="1.5" />
          <rect x="0" y="100" width="560" height="70" fill="url(#soil)" /><line x1="0" x2="560" y1="100" y2="100" stroke="var(--text)" strokeWidth="1.5" />
          <rect x="0" y="130" width="560" height="14" fill="var(--steel)" stroke="var(--text)" />
          {[150, 280, 410].map((cx, i) => <ellipse key={i} cx={cx} cy="92" rx="54" ry="34" fill="none" stroke="var(--accent)" strokeDasharray="4 4" opacity=".7" />)}
          <circle cx="330" cy="130" r="4" fill="var(--bad)" /><text x="338" y="124" className="svg-label" style={{ fill: 'var(--bad)' }}>holiday: AC leaves the pipe here</text>
          <text x="10" y="16" className="svg-label">high-voltage line parallel to the pipeline: its magnetic field induces voltage along the pipe</text>
        </svg>
        <svg viewBox={`0 0 ${W} 54`} role="img" aria-label="AC current density scale" style={{ width: '100%' }}>
          <rect x={gx(1)} y="18" width={gx(30) - gx(1)} height="12" fill="var(--ok)" opacity=".7" />
          <rect x={gx(30)} y="18" width={gx(100) - gx(30)} height="12" fill="var(--yellow)" opacity=".7" />
          <rect x={gx(100)} y="18" width={gx(400) - gx(100)} height="12" fill="var(--bad)" opacity=".7" />
          <path d={`M${gx(Math.min(J, 400))} 16l-6 -10h12z`} fill="var(--text)" />
          {[1, 10, 30, 100, 300].map((v) => <text key={v} x={gx(v)} y="46" textAnchor="middle" className="svg-label">{v}</text>)}
          <text x={W - 20} y="46" textAnchor="end" className="svg-label">A/m²</text>
        </svg>
        <Stats>
          <Stat label="AC current density" text={`${J.toFixed(0)} A/m²`} tone={tone} />
          <Stat label="Corrosion risk" text={tone === 'ok' ? 'Low' : tone === 'warn' ? 'Possible' : 'Expected'} tone={tone} />
          <Stat label="Touch voltage" text={touch ? 'Above 15 V' : 'Within 15 V'} tone={touch ? 'bad' : 'ok'} />
        </Stats>
        {touch ? <Verdict tone="bad">The induced voltage is a shock hazard at test posts, valves and during maintenance. Mitigation is required for safety, whatever the corrosion risk.</Verdict>
          : tone === 'bad' ? <Verdict tone="bad">AC corrosion is expected at small coating defects. Ground the pipeline through DC decouplers to zinc ribbon or copper grounding to bring the voltage down.</Verdict>
          : tone === 'warn' ? <Verdict tone="warn">In the uncertain range. Install AC coupons to monitor current density and plan mitigation.</Verdict>
          : <Verdict tone="ok">Low AC corrosion risk. Note that lower soil resistivity raises the current density for the same voltage.</Verdict>}
      </View>
    </Frame>
  );
}
