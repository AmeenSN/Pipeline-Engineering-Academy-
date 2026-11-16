import { useState } from 'react';
import { pressurePerDegree, pressuriseVolume, testWindow } from '@/lib/eng/ops';
import { Controls, Frame, Segmented, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { gradeOf, gradeOptions, lin, usePipe } from './pipe';

export default function HydroTest() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [grade, setGrade] = useState('X65');
  const [design, setDesign] = useState(9.6);
  const [factor, setFactor] = useState('1.25');
  const [limit, setLimit] = useState('0.95');
  const [dz, setDz] = useState(150);
  const [L, setL] = useState(30);
  const [tw, setTw] = useState(25);
  const [dT, setDT] = useState(-3);
  const smys = gradeOf(grade).smys;
  const w = testWindow({ D: pipe.D, t: pipe.t, smys, design, factor: Number(factor), limit: Number(limit) });
  const head = (1000 * 9.81 * dz) / 1e6;
  const pLow = w.pMin + head, ok = pLow <= w.pMax;
  const hoopLow = (pLow * pipe.D) / (2 * pipe.t) / smys;
  const k = pressurePerDegree(pipe.D, pipe.t, tw), vol = pressuriseVolume(pipe.D, pipe.t, L, pLow);
  const W = 560, H = 210, x = lin(0, 1, 40, W - 20), zy = lin(0, Math.max(dz, 40), 170, 70);
  const prof = [0, 0.12, 0.3, 0.45, 0.62, 0.8, 1].map((u, i) => [u, [0.2, 0, 0.35, 0.7, 1, 0.6, 0.45][i] * dz] as const);
  const bar = (v: number) => `${fmt('pressure', sys, v)} ${unitOf('pressure', sys)}`;

  return (
    <Frame title="Hydrotest section designer" foot="Minimum test pressure = factor × design pressure, needed at the highest point. Maximum = pressure giving the chosen hoop stress limit, applied at the lowest point. Water column 1000 kg/m³. Temperature effect for a restrained, water-filled section.">
      <Controls>
        {pipe.pickers}
        <Select label="Material grade" value={grade} onChange={setGrade} options={gradeOptions} />
        <Slider label="Design pressure" kind="pressure" value={design} onChange={setDesign} min={2} max={20} step={0.1} />
        <Segmented label="Test factor" value={factor} onChange={setFactor} options={['1.1', '1.25', '1.4', '1.5'].map((v) => ({ value: v, label: `× ${v}` }))} />
        <Segmented label="Hoop stress limit at low point" value={limit} onChange={setLimit} options={[{ value: '0.9', label: '90 %' }, { value: '0.95', label: '95 %' }, { value: '1', label: '100 % SMYS' }]} />
        <Slider label="Elevation range in the section" kind="m" value={dz} onChange={setDz} min={0} max={900} step={10} dp={0} />
        <Slider label="Section length (km)" value={L} onChange={setL} min={1} max={100} step={1} dp={0} />
        <Slider label="Water temperature" kind="temp" value={tw} onChange={setTw} min={5} max={45} step={1} />
        <Slider label="Temperature change during hold" kind="dT" value={dT} onChange={setDT} min={-10} max={10} step={0.5} dp={1} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Test section elevation profile with pressure at the high and low points" style={{ width: '100%' }}>
          <path d={'M' + prof.map(([u, z]) => `${x(u)},${zy(z)}`).join('L') + `L${x(1)},190L${x(0)},190Z`} fill="var(--yellow)" opacity=".12" />
          <path d={'M' + prof.map(([u, z]) => `${x(u)},${zy(z)}`).join('L')} fill="none" stroke="var(--accent)" strokeWidth="4" />
          <circle cx={x(0.62)} cy={zy(dz)} r="6" fill="var(--brand)" /><text x={x(0.62)} y={zy(dz) - 26} textAnchor="middle" className="svg-strong">high point</text>
          <text x={x(0.62)} y={zy(dz) - 12} textAnchor="middle" className="svg-label">{bar(w.pMin)} (minimum)</text>
          <circle cx={x(0.12)} cy={zy(0)} r="6" fill={ok ? 'var(--ok)' : 'var(--bad)'} /><text x={x(0.12) + 10} y={zy(0) + 18} className="svg-strong">low point</text>
          <text x={x(0.12) + 10} y={zy(0) + 32} className="svg-label" style={{ fill: ok ? 'var(--ok)' : 'var(--bad)' }}>{bar(pLow)} · {(hoopLow * 100).toFixed(0)} % SMYS</text>
          <rect x={x(0) - 22} y={zy(0.2 * dz) - 8} width="18" height="16" fill="var(--text)" /><rect x={x(1) + 2} y={zy(0.45 * dz) - 8} width="14" height="16" fill="var(--text)" />
          <text x={x(0)} y="20" className="svg-label">test heads with pig traps, pumps and recorders at the section ends</text>
        </svg>
        <Stats>
          <Stat label="Minimum test pressure" kind="pressure" value={w.pMin} />
          <Stat label="Maximum at low point" kind="pressure" value={w.pMax} />
          <Stat label="Static head in section" kind="pressure" value={head} dp={1} />
          <Stat label="Elevation range allowed" kind="m" value={w.head} dp={0} tone="brand" />
          <Stat label="Fill volume" text={`${vol.fill.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`} />
          <Stat label="Extra water to pressurise" text={`${vol.added.toFixed(1)} m³`} />
          <Stat label="Pressure change per °C" kind="pressure" value={k} dp={sys === 'si' ? 1 : 0} />
          <Stat label="Change from temperature" kind="pressure" value={k * dT} dp={sys === 'si' ? 1 : 0} tone={Math.abs(k * dT) > 0.2 ? 'warn' : undefined} />
        </Stats>
        {w.pMin > w.pMax ? <Verdict tone="bad">The test factor cannot be reached within the hoop stress limit even on level ground. The wall is too thin for this design pressure and test factor.</Verdict>
          : !ok ? <Verdict tone="bad">The low point would be overstressed. Split the test into sections with no more than {fmt('m', sys, w.head, 0)} {unitOf('m', sys)} of elevation range each.</Verdict>
          : <Verdict tone="ok">One section works. Pressurise to {bar(pLow)} at the low point. {Math.abs(k * dT) > 0.2 ? `A ${Math.abs(dT)} ° temperature ${dT < 0 ? 'drop' : 'rise'} alone would change the pressure by ${bar(Math.abs(k * dT))}: record temperature and correct for it before suspecting a leak.` : ''}</Verdict>}
      </View>
    </Frame>
  );
}
