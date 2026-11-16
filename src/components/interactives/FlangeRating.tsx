import { useState } from 'react';
import { FLANGE_CLASSES, FLANGE_RATINGS, FLANGE_TEMPS, flangeRating, requiredClass } from '@/lib/eng/materials';
import { Controls, Frame, Meter, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { lin } from './pipe';

export default function FlangeRating() {
  const sys = useUnits();
  const [P, setP] = useState(9.6);
  const [T, setT] = useState(60);
  const bar = P * 10;
  const cls = requiredClass(bar, T);
  const rating = cls ? flangeRating(cls, T) : 0;

  const W = 560, H = 280, x = lin(38, 300, 50, W - 60), y = (b: number) => lin(Math.log10(8), Math.log10(500), H - 28, 12)(Math.log10(b));
  return (
    <Frame title="Flange pressure class selector" foot="ASME B16.5 ratings for material group 1.1 (carbon steel such as A105 and A350 LF2), interpolated between tabulated temperatures. Other materials have different ratings.">
      <Controls>
        <Slider label="Design pressure" kind="pressure" value={P} onChange={setP} min={0.5} max={42} step={0.1} />
        <Slider label="Design temperature" kind="temp" value={T} onChange={setT} min={38} max={300} step={2} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pressure-temperature rating curves for each flange class" style={{ width: '100%' }}>
          {[10, 20, 50, 100, 200, 400].map((b) => <g key={b}><line x1={x(38)} x2={x(300)} y1={y(b)} y2={y(b)} stroke="var(--line)" /><text x={x(38) - 6} y={y(b) + 4} textAnchor="end" className="svg-label">{fmt('pressure', sys, b / 10)}</text></g>)}
          {[38, 100, 200, 300].map((t) => <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="svg-label">{fmt('temp', sys, t)} {unitOf('temp', sys)}</text>)}
          {FLANGE_CLASSES.map((c) => {
            const on = c === cls;
            return (
              <g key={c}>
                <path d={'M' + FLANGE_TEMPS.map((t, i) => `${x(t)},${y(FLANGE_RATINGS[c][i])}`).join('L')} fill="none" stroke={on ? 'var(--accent)' : 'var(--steel)'} strokeWidth={on ? 3 : 1.5} opacity={on ? 1 : 0.6} />
                <text x={x(300) + 6} y={y(FLANGE_RATINGS[c][6]) + 4} className={on ? 'svg-strong' : 'svg-label'} style={on ? { fill: 'var(--accent)' } : undefined}>{c}</text>
              </g>
            );
          })}
          <line x1={x(T)} x2={x(T)} y1={y(8)} y2={y(500)} stroke="var(--text)" strokeDasharray="2 4" />
          <circle cx={x(T)} cy={y(Math.max(bar, 8))} r="6" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
          <text x={x(38) + 6} y={22} className="svg-label">rated pressure ({unitOf('pressure', sys)}, log scale) · class →</text>
        </svg>
        <Stats>
          <Stat label="Required class" text={cls ? `Class ${cls}` : 'Above 2500'} tone="brand" />
          <Stat label="Rating at temperature" kind="pressure" value={rating / 10} />
          <Stat label="Rating at ambient (38 °C)" kind="pressure" value={cls ? FLANGE_RATINGS[cls][0] / 10 : 0} />
          <Stat label="Flange hydrotest (1.5 × ambient)" kind="pressure" value={cls ? (FLANGE_RATINGS[cls][0] * 1.5) / 10 : 0} />
        </Stats>
        {cls && <Meter label="Design pressure ÷ flange rating" ratio={bar / rating} max={1.2} />}
        {!cls ? <Verdict tone="bad">Above Class 2500. Use API 6A flanges, hub connectors or welded construction.</Verdict>
          : bar / rating > 0.95 ? <Verdict tone="warn">Class {cls} works, but with almost no margin. Check surge pressure and whether the pipeline hydrotest will exceed the flange test limit.</Verdict>
          : <Verdict tone="ok">Class {cls} flanges, valves and fittings are suitable. The pipe itself is often stronger than the flange, so the flange class sets the system MAOP.</Verdict>}
      </View>
    </Frame>
  );
}
