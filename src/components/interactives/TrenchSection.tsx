import { useState } from 'react';
import { trench } from '@/lib/eng/flow';
import { Controls, Defs, Frame, Select, Slider, Stat, Stats, View, fmt, unitOf, useUnits } from './kit';
import { npsOptions, odOf } from './pipe';

const TERRAIN = {
  normal: { label: 'Normal soil', slope: 0.5, bedding: 0, clear: 0.3, notes: ['Trench sides stand at a moderate slope', 'Excavated soil is usually suitable as padding once screened of stones', 'Standard 3LPE or FBE coating'] },
  rock: { label: 'Rock', slope: 0.1, bedding: 0.15, clear: 0.3, notes: ['Rock breaker, trencher or controlled blasting', 'At least 150 mm of imported sand bedding under the pipe', 'Sand padding around and 300 mm over the pipe, or rock shield wrap', 'Excavated rock cannot go back against the pipe: import or crush padding'] },
  sand: { label: 'Loose sand / dunes', slope: 1.5, bedding: 0, clear: 0.3, notes: ['Very flat trench sides: the trench top becomes wide', 'Trench only just ahead of lowering-in, as wind and collapse refill it', 'Natural sand is good padding', 'Stabilise the surface over the line (gatch, marl or oil spray) against wind stripping the cover'] },
  sabkha: { label: 'Sabkha', slope: 1.0, bedding: 0.15, clear: 0.4, notes: ['Saline water table near the surface: continuous dewatering', 'Concrete weight coating or weights against buoyancy', 'Enhanced coating and cathodic protection for extreme corrosivity', 'Often built on a raised berm with imported fill instead of a deep trench', 'Geotextile under imported backfill; sulphate-resisting concrete'] },
  wadi: { label: 'Wadi bed', slope: 1.0, bedding: 0.15, clear: 0.4, notes: ['Depth set by the design scour level, not by normal cover', 'Concrete coating for stability if the cover is lost', 'Selected backfill, with rock armour or gabions at the banks', 'Build in the dry season and restore the bed profile'] },
} as const;
export type TerrainId = keyof typeof TERRAIN;

export default function TrenchSection({ initial = 'normal' }: { initial?: TerrainId }) {
  const sys = useUnits();
  const [nps, setNps] = useState('24');
  const [cover, setCover] = useState(1.0);
  const [ter, setTer] = useState<TerrainId>(initial);
  const T = TERRAIN[ter], D = odOf(nps);
  const t = trench({ D, cover, clearance: T.clear, bedding: T.bedding, slope: T.slope });
  const W = 560, H = 260, gy = 46, s = Math.min(170 / t.depth, (W - 80) / t.top), cx = W / 2;
  const Dp = (D / 1000) * s, bot = gy + t.depth * s, pcy = bot - T.bedding * s - Dp / 2;
  const half = (y: number) => (t.bottom / 2 + T.slope * ((bot - y) / s)) * s;
  const padTop = pcy - Dp / 2 - 0.3 * s;
  const poly = (y1: number, y2: number) => `M${cx - half(y1)} ${y1}L${cx + half(y1)} ${y1}L${cx + half(y2)} ${y2}L${cx - half(y2)} ${y2}Z`;
  const wet = ter === 'sabkha', conc = wet || ter === 'wadi';
  const u = (v: number, dp = 2) => `${fmt('m', sys, v, dp)} ${unitOf('m', sys)}`;

  return (
    <Frame title="Trench cross-section by terrain" foot="Typical arrangement drawn to scale. Bottom width = pipe diameter + clearance each side; 300 mm of padding over the pipe. Dimensions and materials are fixed by the project specification.">
      <Controls>
        <Select label="Terrain" value={ter} onChange={setTer} options={Object.entries(TERRAIN).map(([k, v]) => ({ value: k as TerrainId, label: v.label }))} />
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Slider label="Depth of cover" kind="m" value={cover} onChange={setCover} min={0.6} max={3} step={0.1} dp={1} />
        <ul style={{ fontSize: '.82rem', color: 'var(--muted)', display: 'grid', gap: '.35rem', paddingLeft: '1rem', listStyle: 'disc' }}>
          {T.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Trench cross-section in ${T.label}`} style={{ width: '100%' }}>
          <Defs />
          <rect x="0" y={gy} width={W} height={H - gy} fill={ter === 'rock' ? 'url(#hatch)' : 'url(#soil)'} />
          <rect x="0" y={gy} width={W} height={H - gy} fill={ter === 'rock' ? 'var(--steel)' : 'var(--yellow)'} opacity=".08" />
          <path d={poly(gy, bot)} fill="var(--bg)" />
          <path d={poly(gy, padTop)} fill="var(--yellow)" opacity=".35" />
          <path d={poly(padTop, bot)} fill="var(--accent)" opacity=".28" />
          {T.bedding > 0 && <path d={poly(bot - T.bedding * s, bot)} fill="var(--accent)" opacity=".4" />}
          {wet && <rect x="0" y={gy + 0.4 * s} width={W} height={H} fill="var(--brand)" opacity=".13" />}
          {wet && <line x1="0" x2={W} y1={gy + 0.4 * s} y2={gy + 0.4 * s} stroke="var(--brand)" strokeDasharray="6 4" />}
          <path d={`M${cx - half(gy) - 30} ${gy}Q${cx} ${gy - 16} ${cx + half(gy) + 30} ${gy}`} fill="var(--yellow)" opacity=".35" stroke="var(--text)" strokeWidth="1" />
          <path d={`M0 ${gy}H${cx - half(gy)}L${cx - t.bottom * s / 2} ${bot}H${cx + t.bottom * s / 2}L${cx + half(gy)} ${gy}H${W}`} fill="none" stroke="var(--text)" strokeWidth="1.5" />
          {conc && <circle cx={cx} cy={pcy} r={Dp / 2 + 5} fill="var(--steel)" stroke="var(--text)" />}
          <circle cx={cx} cy={pcy} r={Dp / 2} fill="var(--surface)" stroke="var(--text)" strokeWidth="3" />
          <line x1={cx - half(padTop) + 6} x2={cx + half(padTop) - 6} y1={(gy + padTop) / 2} y2={(gy + padTop) / 2} stroke="var(--bad)" strokeWidth="2" strokeDasharray="8 5" />
          <circle cx={cx + Dp / 2 + 14} cy={pcy - Dp / 2} r="3" fill="var(--ok)" />
          <line x1={cx + half(gy) + 44} x2={cx + half(gy) + 44} y1={gy} y2={pcy - Dp / 2} stroke="var(--text)" markerStart="url(#arr-text)" markerEnd="url(#arr-text)" />
          <text x={cx + half(gy) + 50} y={(gy + pcy - Dp / 2) / 2 + 4} className="svg-strong">cover {u(cover, 1)}</text>
          <text x="8" y={gy - 26} className="svg-label">crown left over the trench for settlement</text>
          <text x="8" y={(gy + padTop) / 2 + 4} className="svg-label" style={{ fill: 'var(--bad)' }}>warning tape</text>
          <text x="8" y={padTop + 16} className="svg-label" style={{ fill: 'var(--accent)' }}>padding (fine, stone-free)</text>
          {T.bedding > 0 && <text x="8" y={bot - 3} className="svg-label" style={{ fill: 'var(--accent)' }}>bedding</text>}
          {wet && <text x={W - 8} y={gy + 0.4 * s - 5} textAnchor="end" className="svg-label" style={{ fill: 'var(--brand)' }}>saline water table</text>}
          <text x={W - 8} y={H - 8} textAnchor="end" className="svg-label" style={{ fill: 'var(--ok)' }}>● fibre-optic cable duct</text>
        </svg>
        <Stats>
          <Stat label="Trench depth" kind="m" value={t.depth} />
          <Stat label="Bottom width" kind="m" value={t.bottom} />
          <Stat label="Top width" kind="m" value={t.top} />
          <Stat label="Excavation" text={`${t.area.toFixed(2)} m³/m`} tone="brand" />
          <Stat label="Padding and bedding" text={`${Math.max(((t.bottom + 2 * T.slope * (T.bedding + D / 1000 + 0.3) + t.bottom) / 2) * (T.bedding + D / 1000 + 0.3) - t.pipeArea, 0).toFixed(2)} m³/m`} />
        </Stats>
      </View>
    </Frame>
  );
}
