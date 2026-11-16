import { useState } from 'react';
import { impactRadius } from '@/lib/eng/flow';
import { Controls, Frame, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { npsOptions, odOf } from './pipe';

const LEVELS = ['Low', 'Medium', 'High', 'Very high'];
const TONE = ['var(--ok)', 'var(--yellow)', 'var(--accent)', 'var(--bad)'];
const level = (l: number, c: number) => { const s = l * c; return s <= 4 ? 0 : s <= 9 ? 1 : s <= 15 ? 2 : 3; };

export default function ImpactRadius() {
  const sys = useUnits();
  const [nps, setNps] = useState('30');
  const [P, setP] = useState(6.9);
  const [like, setLike] = useState(2);
  const [cons, setCons] = useState(4);
  const D = odOf(nps), r = impactRadius(D, P), lv = level(like, cons);
  const scale = 105 / Math.max(r, 60);
  const houses = [[-150, -60], [-90, 70], [60, -110], [140, 40], [220, -50], [-230, 30], [20, 150], [-40, -170], [300, 120], [-310, -120]];
  const inside = houses.filter(([hx, hy]) => Math.hypot(hx, hy) <= r).length;

  return (
    <Frame title="Impact radius and risk ranking" foot="Potential impact radius from ASME B31.8S for natural gas: r = 0.69·d·√p (feet, inches, psi). The houses are at fixed positions for illustration. The matrix is a generic 5 × 5 example: every operator defines its own.">
      <Controls>
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Slider label="Operating pressure (MAOP)" kind="pressure" value={P} onChange={setP} min={1} max={15} step={0.1} />
        <Slider label="Likelihood of failure (1 rare to 5 frequent)" value={like} onChange={setLike} min={1} max={5} step={1} dp={0} />
        <Slider label="Consequence (1 minor to 5 catastrophic)" value={cons} onChange={setCons} min={1} max={5} step={1} dp={0} />
      </Controls>
      <View>
        <div className="grid sm:grid-cols-[1.25fr_1fr] gap-3 items-center">
          <svg viewBox="-170 -120 340 240" role="img" aria-label="Plan view of the potential impact circle around a pipeline" style={{ width: '100%', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--line)' }}>
            <circle r={r * scale} fill="var(--bad)" opacity=".14" stroke="var(--bad)" strokeDasharray="5 4" />
            <line x1="-170" x2="170" y1="0" y2="0" stroke="var(--accent)" strokeWidth="3" />
            {houses.map(([hx, hy], i) => <rect key={i} x={hx * scale - 4} y={hy * scale - 4} width="8" height="8" fill={Math.hypot(hx, hy) <= r ? 'var(--bad)' : 'var(--steel)'} />)}
            <line x1="0" y1="0" x2={r * scale * 0.707} y2={-r * scale * 0.707} stroke="var(--text)" />
            <text x={r * scale * 0.707 + 4} y={-r * scale * 0.707} className="svg-strong">{fmt('m', sys, r, 0)} {unitOf('m', sys)}</text>
          </svg>
          <svg viewBox="0 0 150 150" role="img" aria-label="Risk matrix" style={{ width: '100%', maxWidth: 230 }}>
            {[1, 2, 3, 4, 5].map((l) => [1, 2, 3, 4, 5].map((c) => (
              <rect key={`${l}${c}`} x={22 + (c - 1) * 25} y={(5 - l) * 25 + 2} width="24" height="24" rx="3" fill={TONE[level(l, c)]} opacity={l === like && c === cons ? 1 : 0.3} stroke={l === like && c === cons ? 'var(--text)' : 'none'} strokeWidth="2"
                onClick={() => { setLike(l); setCons(c); }} style={{ cursor: 'pointer' }} />
            )))}
            <text x="84" y="142" textAnchor="middle" className="svg-label">consequence →</text>
            <text x="12" y="66" textAnchor="middle" className="svg-label" transform="rotate(-90 12 66)">likelihood →</text>
          </svg>
        </div>
        <Stats>
          <Stat label="Potential impact radius" kind="m" value={r} dp={0} tone="brand" />
          <Stat label="Houses inside the circle" text={String(inside)} />
          <Stat label="Risk ranking" text={LEVELS[lv]} tone={lv === 0 ? 'ok' : lv === 1 ? 'warn' : 'bad'} />
        </Stats>
        <Verdict tone={lv <= 1 ? 'ok' : lv === 2 ? 'warn' : 'bad'}>{['Acceptable with routine controls.', 'Tolerable: demonstrate the risk is as low as reasonably practicable.', 'High: additional mitigation is required, such as heavier wall, more cover, protective slabs or closer valves.', 'Not acceptable. Reroute or redesign.'][lv]}</Verdict>
      </View>
    </Frame>
  );
}
