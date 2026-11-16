import { useState } from 'react';
import { elasticBendCheck, minElasticRadius } from '@/lib/eng/bends';
import { Controls, Defs, Frame, Meter, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { gradeOf, gradeOptions, usePipe } from './pipe';

export default function ElasticBend() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [grade, setGrade] = useState('X65');
  const [P, setP] = useState(9.6);
  const [dT, setDT] = useState(45);
  const [logR, setLogR] = useState(Math.log10(600));
  const R = 10 ** logR;
  const input = { D: pipe.D, t: pipe.t, smys: gradeOf(grade).smys, P, dT };
  const r = elasticBendCheck(input, R);
  const Rmin = minElasticRadius(input);
  const Dm = pipe.D / 1000, perJoint = (12 / R) * (180 / Math.PI), per100 = (100 / R) * (180 / Math.PI);
  const ok = r.ratio <= 1;

  // 200 m of pipe drawn with the vertical offset exaggerated ×10
  const W = 560, H = 190, sx = (W - 40) / 200, ex = 10;
  const pts = Array.from({ length: 41 }, (_, i) => { const s = i * 5 - 100; return `${(W / 2 + s * sx).toFixed(1)},${(40 + ((s * s) / (2 * R)) * sx * ex).toFixed(1)}`; });
  const sag = (100 * 100) / (2 * R);

  return (
    <Frame title="Elastic bend radius check" foot="Restrained buried pipe: bending stress E·D/2R added to the pressure and thermal longitudinal stress, Von Mises limit 0.9 SMYS. The sketch exaggerates the offset ten times.">
      <Controls>
        {pipe.pickers}
        <Select label="Material grade" value={grade} onChange={setGrade} options={gradeOptions} />
        <Slider label="Internal pressure" kind="pressure" value={P} onChange={setP} min={0} max={25} step={0.1} />
        <Slider label="Temperature rise ΔT" kind="dT" value={dT} onChange={setDT} min={0} max={100} step={1} />
        <label className="fld block">
          <span className="fld-label"><span>Bend radius</span><span className="fld-val">{fmt('m', sys, R, 0)} {unitOf('m', sys)} · {(R / Dm).toFixed(0)} D</span></span>
          <input type="range" min={2} max={3.7} step={0.01} value={logR} onChange={(e) => setLogR(Number(e.target.value))} />
        </label>
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pipe following an elastic curve" style={{ width: '100%' }}>
          <Defs />
          <line x1="20" x2={W - 20} y1="40" y2="40" stroke="var(--muted)" strokeDasharray="4 5" />
          <path d={'M' + pts.join('L')} fill="none" stroke={ok ? 'var(--brand)' : 'var(--bad)'} strokeWidth="9" strokeLinecap="round" />
          <line x1="20" x2={W - 20} y1={H - 18} y2={H - 18} stroke="var(--muted)" markerStart="url(#arr-muted)" markerEnd="url(#arr-muted)" />
          <text x={W / 2} y={H - 24} textAnchor="middle" className="svg-label">{fmt('m', sys, 200, 0)} {unitOf('m', sys)} of pipeline</text>
          <text x={W - 22} y="32" textAnchor="end" className="svg-label">straight line</text>
          <text x={W - 22} y={Math.min(40 + sag * sx * ex + 22, H - 40)} textAnchor="end" className="svg-strong">offset at ends {fmt('m', sys, sag, 1)} {unitOf('m', sys)}</text>
        </svg>
        <Stats>
          <Stat label="Bending stress" kind="stress" value={r.sb} />
          <Stat label="Equivalent stress" kind="stress" value={r.seq} tone={ok ? 'ok' : 'bad'} />
          <Stat label="Minimum radius" kind="m" value={Rmin ?? 0} dp={0} tone="brand" text={Rmin ? undefined : 'none'} />
          <Stat label="Minimum radius ÷ D" text={Rmin ? `${(Rmin / Dm).toFixed(0)} D` : '—'} />
          <Stat label="Turn per 12 m joint" text={`${perJoint.toFixed(2)}°`} />
          <Stat label="Turn per 100 m" text={`${per100.toFixed(1)}°`} />
        </Stats>
        <Meter label="Equivalent stress ÷ 0.9 SMYS" ratio={r.ratio} />
        {!Rmin ? <Verdict tone="bad">The straight pipe already exceeds the stress limit. No elastic bending is available.</Verdict>
          : ok ? <Verdict tone="ok">This radius is acceptable. The pipe can be laid to the curve without a made bend.</Verdict>
          : <Verdict tone="bad">Too tight for an elastic bend. Increase the radius to at least {fmt('m', sys, Rmin, 0)} {unitOf('m', sys)} or use cold field bends.</Verdict>}
      </View>
    </Frame>
  );
}
