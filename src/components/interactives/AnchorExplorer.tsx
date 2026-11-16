import { useState } from 'react';
import { anchor } from '@/lib/eng/design';
import { Controls, Defs, Frame, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { lin, usePipe } from './pipe';

export default function AnchorExplorer() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [P, setP] = useState(9.6);
  const [dT, setDT] = useState(50);
  const [cover, setCover] = useState(1.0);
  const [mu, setMu] = useState(0.5);
  const r = anchor({ P, D: pipe.D, t: pipe.t, dT, cover, gammaSoil: 18, mu, contentRho: 0 });

  const W = 560, H = 250, x0 = 46, x1 = W - 14, yTop = 26, yBase = 150;
  const xMax = Math.max(r.anchorLength * 1.6, 100);
  const x = lin(0, xMax, x0, x1);
  const fMax = Math.max(r.force, 1);
  const y = lin(0, fMax * 1.15, yBase, yTop);
  const xa = x(r.anchorLength);
  const move = Math.min(r.endMovement / 4, 26);

  return (
    <Frame title="Virtual anchor and end movement" foot="Soil friction f = μ(2γHD + Wp) with γ = 18 kN/m³, empty pipe. Real soils are not perfectly rigid-plastic, so treat the anchor length as an estimate.">
      <Controls>
        {pipe.pickers}
        <Slider label="Internal pressure" kind="pressure" value={P} onChange={setP} min={0} max={25} step={0.1} />
        <Slider label="Temperature rise ΔT" kind="dT" value={dT} onChange={setDT} min={0} max={110} step={1} />
        <Slider label="Depth of cover" kind="m" value={cover} onChange={setCover} min={0.6} max={3} step={0.05} />
        <Slider label="Pipe-soil friction coefficient μ" value={mu} onChange={setMu} min={0.2} max={0.8} step={0.05} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Axial restraint force building up from the free end to the virtual anchor point" style={{ width: '100%' }}>
          <Defs />
          <rect x={x0} y={yTop} width={xa - x0} height={yBase - yTop} fill="color-mix(in srgb, var(--accent) 8%, transparent)" />
          <rect x={xa} y={yTop} width={x1 - xa} height={yBase - yTop} fill="color-mix(in srgb, var(--ok) 8%, transparent)" />
          <line x1={x0} x2={x1} y1={yBase} y2={yBase} stroke="var(--line)" />
          <line x1={x0} x2={x0} y1={yTop} y2={yBase} stroke="var(--line)" />
          <path d={`M${x0} ${yBase}L${xa} ${y(r.force)}L${x1} ${y(r.force)}`} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
          <line x1={xa} x2={xa} y1={yTop} y2={yBase + 62} stroke="var(--text)" strokeDasharray="3 4" />
          <text x={(x0 + xa) / 2} y={yTop + 14} textAnchor="middle" className="svg-label" style={{ fill: 'var(--accent)' }}>pipe slides</text>
          <text x={(xa + x1) / 2} y={yTop + 14} textAnchor="middle" className="svg-label" style={{ fill: 'var(--ok)' }}>fully restrained</text>
          <text x={x1} y={y(r.force) - 7} textAnchor="end" className="svg-strong">{fmt('force', sys, r.force)} {unitOf('force', sys)}</text>
          <text x={8} y={yTop + 4} className="svg-label">force</text>
          {/* pipe sketch */}
          <rect x={x0 - move} y={yBase + 30} width={x1 - x0 + move} height={16} rx="3" fill="url(#hatch)" stroke="var(--text)" />
          <rect x={x0 - move - 3} y={yBase + 26} width={5} height={24} fill="var(--text)" />
          {Array.from({ length: 9 }, (_, i) => {
            const xx = x0 + 12 + ((xa - x0 - 20) * i) / 8;
            return xa - x0 > 40 && <line key={i} x1={xx} x2={xx + 12} y1={yBase + 54} y2={yBase + 54} stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#arr-accent)" />;
          })}
          <line x1={x0 + 2} x2={x0 - move - 12} y1={yBase + 18} y2={yBase + 18} stroke="var(--bad)" strokeWidth="2" markerEnd="url(#arr-bad)" />
          <text x={x0 + 8} y={yBase + 22} className="svg-label" style={{ fill: 'var(--bad)' }}>end moves {fmt('mm', sys, r.endMovement, sys === 'si' ? 0 : 2)} {unitOf('mm', sys)}</text>
          <text x={(x0 + xa) / 2} y={yBase + 72} textAnchor="middle" className="svg-label" style={{ fill: 'var(--accent)' }}>soil friction resists movement</text>
          <text x={xa + 6} y={yBase + 90} className="svg-strong">virtual anchor · {fmt('m', sys, r.anchorLength, 0)} {unitOf('m', sys)} from end</text>
        </svg>
        <Stats>
          <Stat label="Full restraint force" kind="force" value={r.force} tone="brand" />
          <Stat label="Thermal part" kind="force" value={r.thermalPart} />
          <Stat label="Pressure part" kind="force" value={r.pressurePart} />
          <Stat label="Soil friction" kind="lineload" value={r.friction} />
          <Stat label="Virtual anchor length" kind="m" value={r.anchorLength} dp={0} />
          <Stat label="Free-end movement" kind="mm" value={r.endMovement} dp={sys === 'si' ? 0 : 2} tone={r.endMovement > 50 ? 'warn' : undefined} />
        </Stats>
        {r.endMovement > 50
          ? <Verdict tone="warn">Large end movement. Connected station piping or a scraper trap would need an anchor block or a flexible offset to absorb it.</Verdict>
          : <Verdict tone="ok">Modest end movement. It can usually be absorbed by a designed offset or a small anchor block.</Verdict>}
      </View>
    </Frame>
  );
}
