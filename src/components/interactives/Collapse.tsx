import { useState } from 'react';
import { collapse } from '@/lib/eng/fatigue';
import { Controls, Frame, Meter, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { gradeOf, gradeOptions, lin } from './pipe';

export default function Collapse() {
  const sys = useUnits();
  const [dt, setDt] = useState(45);
  const [grade, setGrade] = useState('X65');
  const [oval, setOval] = useState(0.01);
  const [depth, setDepth] = useState(150);
  const Y = gradeOf(grade).smys, D = 610;
  const r = collapse(D, D / dt, Y, oval);
  const pe = (1025 * 9.81 * depth) / 1e6; // MPa
  const util = pe / (r.pc / 1.3); // illustrative resistance factor
  const tone = util <= 1 ? 'ok' : 'bad';

  const W = 560, H = 260, x = lin(15, 100, 48, W - 14), pMax = 40, y = lin(0, pMax, H - 30, 12);
  const pts = Array.from({ length: 86 }, (_, i) => 15 + i);
  const path = (f: (c: ReturnType<typeof collapse>) => number) => 'M' + pts.map((k) => `${x(k).toFixed(1)},${y(Math.min(f(collapse(D, D / k, Y, oval)), pMax)).toFixed(1)}`).join('L');

  return (
    <Frame title="External pressure collapse and D/t" foot="DNV-ST-F101 collapse equation shape with a combined resistance factor of 1.3 for illustration. Empty pipe (zero internal pressure) in seawater.">
      <Controls>
        <Slider label="Diameter-to-thickness ratio D/t" value={dt} onChange={setDt} min={15} max={100} step={1} dp={0} />
        <Select label="Material grade" value={grade} onChange={setGrade} options={gradeOptions} />
        <Slider label="Initial ovality" kind="pct" value={oval} onChange={setOval} min={0.005} max={0.03} step={0.0025} dp={2} />
        <Slider label="Water depth" kind="m" value={depth} onChange={setDepth} min={0} max={2500} step={10} dp={0} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Collapse pressure against D over t ratio" style={{ width: '100%' }}>
          {[20, 40, 60, 80, 100].map((k) => <g key={k}><line x1={x(k)} x2={x(k)} y1={y(0)} y2={y(pMax)} stroke="var(--line)" /><text x={x(k)} y={H - 12} textAnchor="middle" className="svg-label">{k}</text></g>)}
          <line x1={x(15)} x2={x(100)} y1={y(0)} y2={y(0)} stroke="var(--line)" />
          <rect x={x(96)} y={y(pMax)} width={x(100) - x(96)} height={y(0) - y(pMax)} fill="var(--yellow)" opacity=".15" />
          <path d={path((c) => c.pel)} fill="none" stroke="var(--steel)" strokeWidth="1.5" strokeDasharray="5 4" />
          <path d={path((c) => c.pp)} fill="none" stroke="var(--steel)" strokeWidth="1.5" strokeDasharray="2 3" />
          <path d={path((c) => c.pc)} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
          <line x1={x(15)} x2={x(100)} y1={y(Math.min(pe, pMax))} y2={y(Math.min(pe, pMax))} stroke="var(--accent)" strokeDasharray="5 4" />
          <text x={x(100) - 4} y={y(Math.min(pe, pMax)) - 6} textAnchor="end" className="svg-label" style={{ fill: 'var(--accent)' }}>external pressure at depth</text>
          <line x1={x(dt)} x2={x(dt)} y1={y(0)} y2={y(pMax)} stroke="var(--text)" strokeDasharray="2 3" />
          <circle cx={x(dt)} cy={y(Math.min(r.pc, pMax))} r="6" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
          <text x={x(22)} y={24} className="svg-label">plastic limit (short dashes) · elastic limit (long dashes)</text>
          <text x={x(22)} y={40} className="svg-label" style={{ fill: 'var(--brand)' }}>collapse pressure</text>
          <text x={x(100)} y={H - 34} textAnchor="end" className="svg-label">D/t →</text>
        </svg>
        <Stats>
          <Stat label="Elastic collapse" kind="pressure" value={r.pel} />
          <Stat label="Plastic collapse" kind="pressure" value={r.pp} />
          <Stat label="Collapse pressure" kind="pressure" value={r.pc} tone="brand" />
          <Stat label="External pressure" kind="pressure" value={pe} dp={1} />
        </Stats>
        <Meter label="External pressure ÷ factored collapse resistance" ratio={util} />
        {dt > 96 ? <Verdict tone="warn">D/t above about 96: thin for handling. Expect denting and ovality control problems on land as well as low collapse resistance.</Verdict>
          : tone === 'ok' ? <Verdict tone="ok">Collapse resistance is adequate at {fmt('m', sys, depth, 0)} {unitOf('m', sys)} water depth.</Verdict>
          : <Verdict tone="bad">The empty pipe would collapse during installation at this depth. Lower D/t (heavier wall) is needed.</Verdict>}
      </View>
    </Frame>
  );
}
