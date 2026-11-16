import { useState } from 'react';
import { rowWidth, trench } from '@/lib/eng/flow';
import { Controls, Frame, Segmented, Select, Slider, Stat, Stats, View, fmt, unitOf, useUnits } from './kit';
import { npsOptions, odOf } from './pipe';

const SOILS = { rock: { label: 'Rock', slope: 0.1 }, firm: { label: 'Firm soil', slope: 0.5 }, sand: { label: 'Loose sand', slope: 1.5 } } as const;
const COLORS: Record<string, string> = { 'Trench spoil': 'var(--yellow)', Trench: 'var(--accent)', 'Pipe string': 'var(--steel)', 'Sideboom and welding lane': 'var(--brand)', 'Travel / passing lane': 'var(--ok)', 'Topsoil stockpile': 'var(--yellow)' };

export default function RowSection() {
  const sys = useUnits();
  const [nps, setNps] = useState('36');
  const [cover, setCover] = useState(1);
  const [soil, setSoil] = useState<keyof typeof SOILS>('firm');
  const [topsoil, setTopsoil] = useState<'no' | 'yes'>('no');
  const [passing, setPassing] = useState<'no' | 'yes'>('yes');
  const D = odOf(nps);
  const t = trench({ D, cover, clearance: 0.3, bedding: soil === 'rock' ? 0.15 : 0, slope: SOILS[soil].slope });
  const r = rowWidth(t, D, { topsoil: topsoil === 'yes', passing: passing === 'yes' });
  const W = 560, s = (W - 20) / r.total, gy = 110;
  let x = 10;
  const u = (v: number) => `${fmt('m', sys, v, 1)} ${unitOf('m', sys)}`;

  return (
    <Frame title="Construction right-of-way builder" foot="A typical single-pipeline layout built up from its working parts. Spoil pile sized from the trench volume with 25 % bulking and a 35° angle of repose. Actual ROW widths are fixed by the project and the land authority.">
      <Controls>
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Slider label="Depth of cover" kind="m" value={cover} onChange={setCover} min={0.6} max={2.5} step={0.1} dp={1} />
        <Segmented label="Ground" value={soil} onChange={setSoil} options={Object.entries(SOILS).map(([k, v]) => ({ value: k as keyof typeof SOILS, label: v.label }))} />
        <Segmented label="Topsoil stripped and stored" value={topsoil} onChange={setTopsoil} options={[{ value: 'no', label: 'No (desert)' }, { value: 'yes', label: 'Yes (farmland)' }]} />
        <Segmented label="Separate travel lane" value={passing} onChange={setPassing} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 216`} role="img" aria-label="Cross-section of the construction right of way" style={{ width: '100%' }}>
          <line x1="0" x2={W} y1={gy} y2={gy} stroke="var(--text)" strokeWidth="1.5" />
          {r.parts.map((p, i) => {
            const x0 = x, w = p.w * s; x += w;
            const c = COLORS[p.name] ?? 'var(--line)', mid = x0 + w / 2;
            return (
              <g key={i}>
                <rect x={x0} y={gy + 54} width={w} height="12" fill={c} opacity=".8" stroke="var(--bg)" />
                {p.name.includes('spoil') || p.name.includes('Topsoil') ? <path d={`M${x0} ${gy}L${mid} ${gy - Math.min(w * 0.35, 70)}L${x0 + w} ${gy}Z`} fill={c} opacity=".45" stroke="var(--text)" /> : null}
                {p.name === 'Trench' && <g>
                  <path d={`M${x0} ${gy}L${mid - (t.bottom * s) / 2} ${gy + t.depth * s}H${mid + (t.bottom * s) / 2}L${x0 + w} ${gy}`} fill="var(--bg)" stroke="var(--text)" />
                </g>}
                {p.name === 'Pipe string' && <circle cx={mid} cy={gy - (D / 2000) * s - 3} r={Math.max((D / 2000) * s, 3)} fill="var(--steel)" stroke="var(--text)" />}
                {p.name.startsWith('Sideboom') && <g><rect x={mid - 16} y={gy - 24} width="32" height="20" rx="3" fill="var(--yellow)" stroke="var(--text)" /><line x1={mid - 10} y1={gy - 24} x2={mid - 40} y2={gy - 66} stroke="var(--text)" strokeWidth="2" /><rect x={mid - 18} y={gy - 5} width="36" height="5" fill="var(--text)" /></g>}
                {p.name.startsWith('Travel') && <g><rect x={mid - 15} y={gy - 18} width="30" height="13" rx="3" fill="var(--steel)" /><circle cx={mid - 8} cy={gy - 4} r="4" fill="var(--text)" /><circle cx={mid + 8} cy={gy - 4} r="4" fill="var(--text)" /></g>}
                {w > 34 && <text x={mid} y={gy + 82} textAnchor="middle" className="svg-label">{fmt('m', sys, p.w, 1)}</text>}
              </g>
            );
          })}
          <line x1="10" x2={W - 10} y1="18" y2="18" stroke="var(--muted)" /><text x={W / 2} y="13" textAnchor="middle" className="svg-strong">ROW {u(r.total)}</text>
          <text x="12" y={gy + 98} className="svg-label">spoil side</text><text x={W - 12} y={gy + 98} textAnchor="end" className="svg-label">working side</text>
        </svg>
        <Stats>
          <Stat label="ROW width" kind="m" value={r.total} dp={1} tone="brand" />
          <Stat label="Trench depth" kind="m" value={t.depth} />
          <Stat label="Trench top width" kind="m" value={t.top} />
          <Stat label="Excavation per metre" text={`${t.area.toFixed(1)} m³`} />
        </Stats>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem .9rem', fontSize: '.8rem', color: 'var(--muted)' }}>
          {r.parts.filter((p) => COLORS[p.name]).map((p, i) => <span key={i}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS[p.name], marginRight: 5 }} />{p.name} {u(p.w)}</span>)}
        </div>
      </View>
    </Frame>
  );
}
