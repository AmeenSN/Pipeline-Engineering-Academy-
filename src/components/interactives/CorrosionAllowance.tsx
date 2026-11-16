import { useState } from 'react';
import { SOUR_LIMIT_KPA, deWaardRate, wallLoss } from '@/lib/eng/materials';
import { Controls, Frame, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { lin } from './pipe';

export default function CorrosionAllowance() {
  const sys = useUnits();
  const [T, setT] = useState(60);
  const [pco2, setPco2] = useState(2);
  const [h2s, setH2s] = useState(0.1);
  const [avail, setAvail] = useState(0.95);
  const [life, setLife] = useState(25);
  const rate = deWaardRate(T, pco2);
  const r = wallLoss(rate, 0.1, avail, life);
  const sour = h2s >= SOUR_LIMIT_KPA;
  const tier = r.loss <= 3 ? 0 : r.loss <= 6 ? 1 : 2;

  const W = 560, H = 230, x = lin(0, 40, 46, W - 14), yMax = 14, y = lin(0, yMax, H - 28, 12);
  const line = (k: number, c: string, w = 2) => <line x1={x(0)} y1={y(0)} x2={x(Math.min(40, yMax / Math.max(k, 1e-6)))} y2={y(Math.min(k * 40, yMax))} stroke={c} strokeWidth={w} />;

  return (
    <Frame title="Carbon steel or corrosion-resistant alloy?" foot="de Waard-Milliams bare-steel CO2 rate (a conservative upper estimate with no scale or pH correction), inhibited rate 0.1 mm/yr while the inhibitor is available. Sour threshold per NACE MR0175 / ISO 15156. A first screen only: real material selection uses a full corrosion study.">
      <Controls>
        <Slider label="Operating temperature" kind="temp" value={T} onChange={setT} min={20} max={120} step={5} />
        <Slider label="CO₂ partial pressure" kind="pressure" value={pco2 / 10} onChange={(v) => setPco2(v * 10)} min={0.005} max={1} step={0.005} dp={sys === 'si' ? 2 : 1} />
        <Slider label="H₂S partial pressure" kind="kpa" value={h2s} onChange={setH2s} min={0} max={5} step={0.05} dp={2} />
        <Slider label="Inhibitor availability" kind="pct" value={avail} onChange={setAvail} min={0} max={0.99} step={0.01} dp={0} />
        <Slider label="Design life" kind="years" value={life} onChange={setLife} min={5} max={40} step={1} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Wall loss over time with and without inhibition" style={{ width: '100%' }}>
          <rect x={x(0)} y={y(3)} width={x(40) - x(0)} height={y(0) - y(3)} fill="var(--ok)" opacity=".1" />
          <rect x={x(0)} y={y(6)} width={x(40) - x(0)} height={y(3) - y(6)} fill="var(--yellow)" opacity=".1" />
          <rect x={x(0)} y={y(yMax)} width={x(40) - x(0)} height={y(6) - y(yMax)} fill="var(--bad)" opacity=".08" />
          {[10, 20, 30, 40].map((v) => <text key={v} x={x(v)} y={H - 10} textAnchor="middle" className="svg-label">{v} yr</text>)}
          {[3, 6].map((v) => <text key={v} x={x(0) - 6} y={y(v) + 4} textAnchor="end" className="svg-label">{fmt('mm', sys, v, sys === 'si' ? 0 : 2)}</text>)}
          <line x1={x(0)} x2={x(40)} y1={y(0)} y2={y(0)} stroke="var(--line)" />
          {line(rate, 'var(--bad)')}
          {line(r.effective, 'var(--brand)', 3)}
          <line x1={x(life)} x2={x(life)} y1={y(0)} y2={y(yMax)} stroke="var(--text)" strokeDasharray="3 4" />
          <circle cx={x(life)} cy={y(Math.min(r.loss, yMax))} r="6" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
          <text x={x(40)} y={y(1.3)} textAnchor="end" className="svg-label" style={{ fill: 'var(--ok)' }}>normal corrosion allowance</text>
          <text x={x(40)} y={y(4.3)} textAnchor="end" className="svg-label" style={{ fill: 'var(--yellow)' }}>heavy corrosion allowance</text>
          <text x={x(40)} y={y(12.6)} textAnchor="end" className="svg-label" style={{ fill: 'var(--bad)' }}>beyond practical allowance</text>
          <text x={x(0) + 6} y={22} className="svg-label">wall loss ↑ · red: no inhibitor · blue: with inhibitor</text>
        </svg>
        <Stats>
          <Stat label="Bare-steel CO₂ rate" text={`${fmt('mm', sys, rate, sys === 'si' ? 2 : 3)} ${unitOf('mm', sys)}/yr`} tone={rate > 1 ? 'bad' : undefined} />
          <Stat label="Effective rate with inhibitor" text={`${fmt('mm', sys, r.effective, sys === 'si' ? 2 : 3)} ${unitOf('mm', sys)}/yr`} />
          <Stat label={`Wall loss in ${life} years`} kind="mm" value={r.loss} dp={sys === 'si' ? 1 : 2} tone={tier === 0 ? 'ok' : tier === 1 ? 'warn' : 'bad'} />
          <Stat label="Sour service?" text={sour ? 'Yes' : 'No'} tone={sour ? 'warn' : 'ok'} />
        </Stats>
        {tier === 0 ? <Verdict tone="ok">Carbon steel with a normal corrosion allowance and inhibition is feasible.{sour ? ' Specify sour-service pipe to ISO 15156 (hardness and HIC limits).' : ''}</Verdict>
          : tier === 1 ? <Verdict tone="warn">Carbon steel needs a heavy corrosion allowance and reliable inhibition. Compare life-cycle cost against a lined or non-metallic option.{sour ? ' Sour-service pipe is required.' : ''}</Verdict>
          : <Verdict tone="bad">Wall loss is beyond a practical allowance. Improve inhibitor availability, or select corrosion-resistant alloy, clad pipe or a non-metallic system.{sour ? ' Any alloy must also be qualified for the H₂S level.' : ''}</Verdict>}
      </View>
    </Frame>
  );
}
