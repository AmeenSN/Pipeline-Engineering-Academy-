import { useMemo, useState } from 'react';
import { GAS_CLASSES, LIQUID_FACTOR, tempDerating } from '@/lib/eng/data';
import { wallThickness } from '@/lib/eng/design';
import { Controls, Defs, Frame, Meter, Segmented, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { gradeOf, gradeOptions, npsOptions, odOf } from './pipe';

export default function WallThickness() {
  const sys = useUnits();
  const [service, setService] = useState<'gas' | 'liquid'>('gas');
  const [nps, setNps] = useState('24');
  const [P, setP] = useState(9.6);
  const [grade, setGrade] = useState('X65');
  const [cls, setCls] = useState('1');
  const [E, setE] = useState('1');
  const [temp, setTemp] = useState(60);
  const [ca, setCa] = useState(1.6);

  const D = odOf(nps), g = gradeOf(grade);
  const F = service === 'gas' ? GAS_CLASSES.find((c) => c.id === cls)!.F : LIQUID_FACTOR;
  const T = service === 'gas' ? tempDerating(temp) : 1;
  const r = useMemo(() => wallThickness({ P, D, smys: g.smys, F, E: Number(E), T, ca }), [P, D, g, F, E, T, ca]);
  const tSel = r.tSelected ?? r.tRequired;

  // Cross-section drawing: wall exaggerated so thin walls stay visible.
  const R = 112, K = 4;
  const px = (mm: number) => Math.min((mm / D) * 2 * R * K, R * 0.8 * (mm / tSel));
  const wSel = Math.min((tSel / D) * 2 * R * K, R * 0.8);
  const rBore = R - wSel, rCa = rBore + px(ca), rPress = rCa + px(r.tPressure);
  const ring = (ro: number, ri: number, fill: string, op = 1) => (
    <path fillRule="evenodd" fill={fill} opacity={op}
      d={`M${-ro} 0a${ro} ${ro} 0 1 0 ${2 * ro} 0a${ro} ${ro} 0 1 0 ${-2 * ro} 0M${-ri} 0a${ri} ${ri} 0 1 0 ${2 * ri} 0a${ri} ${ri} 0 1 0 ${-2 * ri} 0`} />
  );
  const u = (k: Parameters<typeof fmt>[0], v: number, dp?: number) => `${fmt(k, sys, v, dp)} ${unitOf(k, sys)}`;

  return (
    <Frame title="Wall thickness calculator" foot="Thin-wall Barlow formula on outside diameter. Does not include mill tolerance, bending, surge or external load checks.">
      <Controls>
        <Segmented label="Service / code" value={service} onChange={setService} options={[{ value: 'gas', label: 'Gas · B31.8' }, { value: 'liquid', label: 'Liquid · B31.4' }]} />
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Slider label="Design pressure" kind="pressure" value={P} onChange={setP} min={1} max={25} step={0.1} />
        <Select label="Material grade" value={grade} onChange={setGrade} options={gradeOptions} />
        {service === 'gas' ? (
          <Select label="Location class (design factor F)" value={cls} onChange={setCls}
            options={GAS_CLASSES.map((c) => ({ value: c.id, label: `${c.label}  ·  F = ${c.F.toFixed(2)}` }))} />
        ) : (
          <div className="fld"><span className="fld-label"><span>Design factor F</span><span className="fld-val">0.72</span></span></div>
        )}
        <Segmented label="Weld joint factor E" value={E} onChange={setE} options={[{ value: '1', label: '1.0 (API 5L)' }, { value: '0.8', label: '0.8' }]} />
        {service === 'gas' && <Slider label="Design temperature" kind="temp" value={temp} onChange={setTemp} min={20} max={230} step={5} />}
        <Slider label="Corrosion allowance" kind="wall" value={ca} onChange={setCa} min={0} max={6.4} step={0.1} />
      </Controls>
      <View>
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-center">
          <svg viewBox="-150 -150 300 300" role="img" aria-label="Pipe cross-section showing corrosion allowance, pressure design thickness and spare wall" style={{ width: '100%', maxHeight: 290 }}>
            <Defs />
            {ring(R, rBore, 'var(--steel)', 0.35)}
            {ring(Math.min(rPress, R), rCa, 'var(--brand)', 0.85)}
            {ca > 0 && ring(rCa, rBore, 'var(--accent)', 0.9)}
            {rPress > R + 0.5 && <circle r={R} fill="none" stroke="var(--bad)" strokeWidth="2" strokeDasharray="5 4" />}
            <circle r={R} fill="none" stroke="var(--text)" strokeWidth="1.2" />
            <circle r={rBore} fill="none" stroke="var(--text)" strokeWidth="1.2" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6, r1 = rBore * 0.42, r2 = rBore - 8;
              return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke="var(--brand)" strokeWidth="1.4" opacity=".55" markerEnd="url(#arr-brand)" />;
            })}
            <text textAnchor="middle" y="-4" className="svg-strong">P = {u('pressure', P)}</text>
            <text textAnchor="middle" y="13" className="svg-label">OD {u('mm', D, sys === 'si' ? 1 : 2)}</text>
            <text textAnchor="middle" y="144" className="svg-label">wall drawn ×{K} for clarity</text>
          </svg>
          <div className="grid gap-2 text-sm">
            {[
              ['var(--accent)', 'Corrosion allowance', ca],
              ['var(--brand)', 'Pressure design thickness', r.tPressure],
              ['var(--steel)', 'Spare (rounding up to a standard wall)', Math.max(tSel - r.tRequired, 0)],
            ].map(([c, l, v]) => (
              <div key={l as string} className="flex items-start gap-2.5">
                <span style={{ width: 12, height: 12, background: c as string, flex: 'none', marginTop: 4 }} />
                <span>
                  <span className="block" style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{l}</span>
                  <span className="num font-semibold block">{fmt('wall', sys, v as number, 2)}</span>
                </span>
              </div>
            ))}
            <div className="mt-2"><Meter label="Hoop stress ÷ allowable (corroded wall)" ratio={r.utilisation} max={1.25} /></div>
          </div>
        </div>
        <Stats>
          <Stat label="Required wall (incl. CA)" kind="wall" value={r.tRequired} dp={2} />
          <Stat label="Selected standard wall" kind="wall" value={tSel} tone="brand" text={r.tSelected ? undefined : 'none'} />
          <Stat label="Hoop stress" kind="stress" value={r.hoop} />
          <Stat label="Allowable  S·F·E·T" kind="stress" value={r.allowable} />
          <Stat label="D / t" value={r.dOverT} dp={1} tone={r.dOverT > 96 ? 'warn' : undefined} />
        </Stats>
        {!r.tSelected ? <Verdict tone="bad">Required wall exceeds the heaviest standard wall listed. Consider a higher grade or larger design factor review.</Verdict>
          : r.dOverT > 96 ? <Verdict tone="warn">Pressure design is satisfied, but D/t above about 96 makes the pipe prone to ovalising and denting in handling. Consider a heavier wall.</Verdict>
          : <Verdict tone="ok">Select {fmt('wall', sys, tSel)} wall. Hoop stress is {(r.utilisation * 100).toFixed(0)} % of the allowable.</Verdict>}
        <div className="steps" aria-label="Calculation steps">
          <b>t</b> = P·D / (2·S·F·E·T) = {P.toFixed(2)} × {D} / (2 × {g.smys} × {F} × {E} × {T.toFixed(3)}) = <b>{fmt('wall', 'si', r.tPressure, 2)}</b>{'\n'}
          <b>t_req</b> = t + CA = {r.tPressure.toFixed(2)} + {ca.toFixed(1)} = <b>{fmt('wall', 'si', r.tRequired, 2)}</b>  →  next standard wall <b>{r.tSelected ? fmt('wall', 'si', r.tSelected) : '—'}</b>
        </div>
      </View>
    </Frame>
  );
}
