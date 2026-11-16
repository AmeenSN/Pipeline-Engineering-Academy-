import { useState } from 'react';
import { SN_CURVES, cyclesToFailure } from '@/lib/eng/fatigue';
import { hoopStress } from '@/lib/eng/design';
import { Controls, Frame, Segmented, Select, Slider, Stat, Stats, Verdict, View } from './kit';
import { usePipe } from './pipe';

export default function Fatigue() {
  const pipe = usePipe(20, 9.5);
  const [dP, setDP] = useState(3);
  const [perDay, setPerDay] = useState(4);
  const [curveId, setCurveId] = useState('E');
  const [dff, setDff] = useState('5');
  const curve = SN_CURVES.find((c) => c.id === curveId)!;
  const range = hoopStress(dP, pipe.D, pipe.t);
  const N = cyclesToFailure(curve, range);
  const life = N / (perDay * 365);
  const design = life / Number(dff);
  const tone = design >= 40 ? 'ok' : design >= 25 ? 'warn' : 'bad';

  const W = 560, H = 270, x0 = 48, x1 = W - 14, y0 = H - 30, y1 = 12;
  const lx = (n: number) => x0 + ((Math.log10(n) - 4) / 5) * (x1 - x0);
  const ly = (s: number) => y0 - ((Math.log10(s) - 1) / 2) * (y0 - y1);
  const path = (c: typeof curve) => {
    const pts: string[] = [];
    for (let e = 1; e <= 3; e += 0.02) { const s = 10 ** e, n = cyclesToFailure(c, s); if (n >= 1e4 && n <= 1e9) pts.push(`${lx(n).toFixed(1)},${ly(s).toFixed(1)}`); }
    return 'M' + pts.join('L');
  };
  const demand = perDay * 365 * 40;
  const big = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} bn` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : `${Math.round(n / 1e3)} k`);

  return (
    <Frame title="Pressure-cycle fatigue life" foot="Constant-amplitude hoop stress range against DNV-RP-C203 S-N curves in air. Real spectra are counted with rainflow and summed by Miner's rule; seam-weld and dent details need their own stress concentration factors.">
      <Controls>
        {pipe.pickers}
        <Slider label="Pressure swing per cycle ΔP" kind="pressure" value={dP} onChange={setDP} min={0.2} max={12} step={0.1} />
        <Slider label="Cycles per day" value={perDay} onChange={setPerDay} min={0.1} max={30} step={0.1} dp={1} />
        <Select label="Weld detail (S-N curve)" value={curveId} onChange={setCurveId} options={SN_CURVES.map((c) => ({ value: c.id, label: `${c.id} · ${c.desc}` }))} />
        <Segmented label="Design fatigue factor" value={dff} onChange={setDff} options={['3', '5', '10'].map((v) => ({ value: v, label: v }))} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="S-N curve with the operating point" style={{ width: '100%' }}>
          {[4, 5, 6, 7, 8, 9].map((e) => <g key={e}><line x1={lx(10 ** e)} x2={lx(10 ** e)} y1={y0} y2={y1} stroke="var(--line)" /><text x={lx(10 ** e)} y={H - 12} textAnchor="middle" className="svg-label">10{'⁴⁵⁶⁷⁸⁹'[e - 4]}</text></g>)}
          {[10, 100, 1000].map((s) => <g key={s}><line x1={x0} x2={x1} y1={ly(s)} y2={ly(s)} stroke="var(--line)" /><text x={x0 - 6} y={ly(s) + 4} textAnchor="end" className="svg-label">{s}</text></g>)}
          {SN_CURVES.map((c) => <path key={c.id} d={path(c)} fill="none" stroke={c.id === curveId ? 'var(--brand)' : 'var(--steel)'} strokeWidth={c.id === curveId ? 2.5 : 1} opacity={c.id === curveId ? 1 : 0.5} />)}
          {demand >= 1e4 && demand <= 1e9 && <>
            <line x1={lx(demand)} x2={lx(demand)} y1={y0} y2={y1} stroke="var(--accent)" strokeDasharray="5 4" />
            <text x={lx(demand) + 5} y={y1 + 12} className="svg-label" style={{ fill: 'var(--accent)' }}>cycles in 40 years</text>
          </>}
          {N >= 1e4 && N <= 1e9 && range >= 10 && range <= 1000 && <>
            <line x1={x0} x2={lx(N)} y1={ly(range)} y2={ly(range)} stroke="var(--text)" strokeDasharray="2 3" />
            <line x1={lx(N)} x2={lx(N)} y1={ly(range)} y2={y0} stroke="var(--text)" strokeDasharray="2 3" />
            <circle cx={lx(N)} cy={ly(range)} r="6" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
          </>}
          <text x={x0 + 6} y={y1 + 12} className="svg-label">stress range Δσ (MPa)</text>
          <text x={x1} y={y0 - 6} textAnchor="end" className="svg-label">cycles to failure N →</text>
        </svg>
        <Stats>
          <Stat label="Hoop stress range Δσ" kind="stress" value={range} />
          <Stat label="Cycles to failure" text={big(N)} />
          <Stat label="Calculated life" text={life > 9999 ? '> 9,999 yr' : `${life.toFixed(0)} yr`} />
          <Stat label={`Design life (÷ ${dff})`} text={design > 9999 ? '> 9,999 yr' : `${design.toFixed(0)} yr`} tone={tone} />
        </Stats>
        {tone === 'ok' ? <Verdict tone="ok">Design fatigue life exceeds a typical 40-year service life.</Verdict>
          : tone === 'warn' ? <Verdict tone="warn">Design life is 25 to 40 years. Acceptable only if it matches the specified service life.</Verdict>
          : <Verdict tone="bad">Design fatigue life is short. Reduce pressure cycling, thicken the wall or improve the weld detail.</Verdict>}
      </View>
    </Frame>
  );
}
