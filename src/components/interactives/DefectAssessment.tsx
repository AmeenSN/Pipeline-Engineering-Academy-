import { useState } from 'react';
import { modifiedB31G } from '@/lib/eng/ops';
import { Controls, Frame, Meter, Select, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { gradeOf, gradeOptions, lin, usePipe } from './pipe';

export default function DefectAssessment() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [grade, setGrade] = useState('X65');
  const [maop, setMaop] = useState(9.6);
  const [dep, setDep] = useState(0.45);
  const [len, setLen] = useState(250);
  const smys = gradeOf(grade).smys, SF = 1 / 0.72;
  const base = { D: pipe.D, t: pipe.t, smys };
  const r = modifiedB31G({ ...base, depth: dep * pipe.t, length: len });
  const safe = r.failure / SF, erf = maop / safe;
  const tone = dep > 0.8 ? 'bad' : erf > 1 ? 'bad' : erf > 0.9 ? 'warn' : 'ok';
  // acceptance curve: deepest acceptable defect for each length
  const W = 560, H = 210, x = lin(0, 1000, 46, W - 14), y = lin(0, 1, H - 28, 12);
  const limit = (L: number) => { let lo = 0, hi = 0.8; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (modifiedB31G({ ...base, depth: m * pipe.t, length: L }).failure / SF >= maop) lo = m; else hi = m; } return lo; };
  const curve = Array.from({ length: 51 }, (_, i) => [i * 20 + 1, limit(i * 20 + 1)] as const);
  const wy = 30, wh = 46;

  return (
    <Frame title="Corrosion defect assessment (Modified B31G)" foot="Modified B31G (0.85 dL): flow stress = SMYS + 69 MPa, Folias factor from L²/(D·t). Safe pressure = failure pressure ÷ 1.39 (equivalent to a 0.72 design factor). For isolated, blunt external or internal metal loss. Cracks, dents, weld defects and interacting defects need other methods.">
      <Controls>
        {pipe.pickers}
        <Select label="Material grade" value={grade} onChange={setGrade} options={gradeOptions} />
        <Slider label="MAOP" kind="pressure" value={maop} onChange={setMaop} min={2} max={15} step={0.1} />
        <Slider label="Defect depth (% of wall)" kind="pct" value={dep} onChange={setDep} min={0.05} max={0.9} step={0.01} dp={0} />
        <Slider label="Defect length along the pipe" kind="mm" value={len} onChange={setLen} min={10} max={1000} step={10} dp={sys === 'si' ? 0 : 1} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 100`} role="img" aria-label="Section through the pipe wall showing the corrosion defect" style={{ width: '100%' }}>
          <defs><pattern id="da" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--steel)" strokeWidth="1.2" opacity=".6" /></pattern></defs>
          <path d={`M20 ${wy}H${W / 2 - len * 0.22}Q${W / 2} ${wy + dep * wh * 2.1} ${W / 2 + len * 0.22} ${wy}H${W - 20}V${wy + wh}H20Z`} fill="url(#da)" stroke="var(--text)" strokeWidth="1.5" />
          <path d={`M${W / 2 - len * 0.22} ${wy}Q${W / 2} ${wy + dep * wh * 2.1} ${W / 2 + len * 0.22} ${wy}Z`} fill={tone === 'bad' ? 'var(--bad)' : 'var(--accent)'} opacity=".55" />
          <text x="24" y={wy - 8} className="svg-label">outside surface · corrosion pit {(dep * 100).toFixed(0)} % deep, {fmt('mm', sys, len, sys === 'si' ? 0 : 1)} {unitOf('mm', sys)} long</text>
          <text x="24" y={wy + wh + 16} className="svg-label">inside surface · remaining wall {fmt('mm', sys, pipe.t * (1 - dep), sys === 'si' ? 1 : 3)} {unitOf('mm', sys)}</text>
        </svg>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Acceptable defect depth against length" style={{ width: '100%' }}>
          <path d={`M${x(1)},${y(0)}` + curve.map(([l, d]) => `L${x(l).toFixed(1)},${y(d).toFixed(1)}`).join('') + `L${x(1000)},${y(0)}Z`} fill="var(--ok)" opacity=".12" />
          <path d={'M' + curve.map(([l, d]) => `${x(l).toFixed(1)},${y(d).toFixed(1)}`).join('L')} fill="none" stroke="var(--ok)" strokeWidth="2.5" />
          <line x1={x(0)} x2={x(1000)} y1={y(0.8)} y2={y(0.8)} stroke="var(--bad)" strokeDasharray="5 4" />
          <line x1={x(0)} x2={x(1000)} y1={y(0)} y2={y(0)} stroke="var(--line)" /><line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--line)" />
          <circle cx={x(len)} cy={y(dep)} r="6" fill={tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--yellow)' : 'var(--bad)'} stroke="var(--surface)" strokeWidth="2" />
          <text x={x(1000)} y={y(0.8) - 5} textAnchor="end" className="svg-label" style={{ fill: 'var(--bad)' }}>80 % depth: repair regardless</text>
          <text x={x(600)} y={y(0.08)} className="svg-label" style={{ fill: 'var(--ok)' }}>acceptable at MAOP</text>
          <text x={x(0) + 6} y={y(1) + 10} className="svg-label">depth ÷ wall ↑</text><text x={x(1000)} y={H - 8} textAnchor="end" className="svg-label">defect length →</text>
        </svg>
        <Stats>
          <Stat label="Predicted failure pressure" kind="pressure" value={r.failure} />
          <Stat label="Safe operating pressure" kind="pressure" value={safe} tone="brand" />
          <Stat label="Folias factor M" value={r.M} dp={2} />
          <Stat label="ERF (MAOP ÷ safe pressure)" value={erf} dp={2} tone={tone} />
        </Stats>
        <Meter label="MAOP ÷ safe pressure" ratio={erf} />
        {dep > 0.8 ? <Verdict tone="bad">Deeper than 80 % of the wall. Repair or replace regardless of the calculated pressure: the remaining ligament is too thin to rely on.</Verdict>
          : erf > 1 ? <Verdict tone="bad">Not acceptable at MAOP. Repair, or reduce the operating pressure to {fmt('pressure', sys, safe)} {unitOf('pressure', sys)} until repaired.</Verdict>
          : erf > 0.9 ? <Verdict tone="warn">Acceptable today with little margin. Estimate the corrosion growth rate and schedule repair or re-inspection before the defect reaches the limit.</Verdict>
          : <Verdict tone="ok">Acceptable at MAOP. Stop the corrosion (recoat, restore CP or inhibition) and re-inspect at an interval based on growth rate.</Verdict>}
      </View>
    </Frame>
  );
}
