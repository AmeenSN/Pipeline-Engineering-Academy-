import { useState } from 'react';
import { Controls, Defs, Frame, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';

export default function CrossingClearance() {
  const sys = useUnits();
  const [gap, setGap] = useState(0.6);
  const [angle, setAngle] = useState(90);
  const [pos, setPos] = useState<'under' | 'over'>('under');
  const [what, setWhat] = useState<'pipe' | 'cable'>('pipe');
  const min = what === 'cable' ? 0.6 : 0.3, pref = what === 'cable' ? 1.0 : 0.6;
  const tone = gap < min ? 'bad' : gap < pref || angle < 60 ? 'warn' : 'ok';
  const W = 560, H = 220, gy = 40, s = 60, ey = pos === 'under' ? 96 : 150, ny = pos === 'under' ? ey + 16 + gap * s + 9 : ey - 16 - gap * s - 9;
  const u = (v: number) => `${fmt('m', sys, v, 2)} ${unitOf('m', sys)}`;
  // length over which the two lines are within 3 m of each other in plan
  const close = 3 / Math.max(Math.sin((angle * Math.PI) / 180), 0.05);

  return (
    <Frame title="Crossing an existing pipeline or cable" foot="Code minimum vertical clearance is about 0.3 m (12 in) for pipelines in ASME B31.4 and 0.15 m (6 in) in B31.8. Most operators require more: 0.6 m for pipelines and 1 m for power cables are typical. Always follow the existing owner's requirements.">
      <Controls>
        <Segmented label="Existing service" value={what} onChange={setWhat} options={[{ value: 'pipe', label: 'Pipeline' }, { value: 'cable', label: 'Power cable' }]} />
        <Segmented label="New pipeline passes" value={pos} onChange={setPos} options={[{ value: 'under', label: 'Under' }, { value: 'over', label: 'Over' }]} />
        <Slider label="Vertical clearance" kind="m" value={gap} onChange={setGap} min={0.1} max={2} step={0.05} />
        <Slider label="Crossing angle (degrees)" value={angle} onChange={setAngle} min={15} max={90} step={5} dp={0} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Section through a crossing of a new pipeline and an existing service" style={{ width: '100%' }}>
          <Defs />
          <rect x="0" y={gy} width={W} height={H - gy} fill="url(#soil)" />
          <line x1="0" x2={W} y1={gy} y2={gy} stroke="var(--text)" strokeWidth="1.5" />
          <path d={`M0 ${gy + 40}H150Q215 ${gy + 40} 240 ${ny}H320Q345 ${gy + 40} 410 ${gy + 40}H${W}`} fill="none" stroke={tone === 'bad' ? 'var(--bad)' : 'var(--accent)'} strokeWidth="18" />
          {what === 'pipe' ? <circle cx="280" cy={ey} r="16" fill="var(--surface)" stroke="var(--text)" strokeWidth="4" /> : <g><circle cx="270" cy={ey} r="6" fill="var(--bad)" /><circle cx="290" cy={ey} r="6" fill="var(--bad)" /><rect x="250" y={ey - 16} width="60" height="5" fill="var(--yellow)" /></g>}
          <rect x="246" y={pos === 'under' ? ey + 18 : ey - 24} width="68" height="6" rx="2" fill="var(--steel)" />
          <line x1="360" x2="360" y1={pos === 'under' ? ey + 16 : ny + 9} y2={pos === 'under' ? ny - 9 : ey - 16} stroke="var(--text)" markerStart="url(#arr-text)" markerEnd="url(#arr-text)" />
          <text x="368" y={(ey + ny) / 2 + 4} className="svg-strong">{u(gap)}</text>
          <line x1="430" x2="430" y1={gy} y2="10" stroke="var(--text)" strokeWidth="3" /><rect x="422" y="6" width="16" height="10" fill="var(--yellow)" stroke="var(--text)" />
          <text x="444" y="16" className="svg-label">CP test post with leads to both lines</text>
          <text x="8" y={gy + 30} className="svg-label" style={{ fill: 'var(--accent)' }}>new pipeline</text>
          <text x="300" y={ey + (what === 'pipe' ? 5 : -22)} className="svg-label">{what === 'pipe' ? '  existing' : 'existing cable + tiles'}</text>
          <text x="250" y={pos === 'under' ? ey + 38 : ey - 30} className="svg-label">separation slab / sandbags</text>
        </svg>
        <Stats>
          <Stat label="Minimum clearance" kind="m" value={min} />
          <Stat label="Preferred clearance" kind="m" value={pref} />
          <Stat label="Length within 3 m in plan" text={`${close.toFixed(1)} m`} tone={angle < 60 ? 'warn' : undefined} />
        </Stats>
        {tone === 'bad' ? <Verdict tone="bad">Clearance is below the minimum. Deepen or raise the new line.</Verdict>
          : angle < 60 ? <Verdict tone="warn">A skew crossing keeps the two services close together over a long distance. That complicates future excavation and increases cathodic protection interference. Cross as near to 90° as possible.</Verdict>
          : tone === 'warn' ? <Verdict tone="warn">Meets the code minimum but not the usual operator requirement. Add a separation slab and get the existing owner's approval.</Verdict>
          : <Verdict tone="ok">Good practice: near-perpendicular, with ample clearance, physical separation and a test post for interference monitoring.{pos === 'over' ? ' Check the cover that remains over the new line.' : ''}</Verdict>}
      </View>
    </Frame>
  );
}
