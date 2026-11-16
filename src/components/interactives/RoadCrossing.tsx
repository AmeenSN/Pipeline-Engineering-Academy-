import { useState } from 'react';
import { ovalisation, soilPressure, wheelPressure } from '@/lib/eng/loads';
import { Controls, Defs, Frame, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { lin, usePipe } from './pipe';

const ROADS = {
  track: { label: 'Track', min: 0.9, wheel: 50, name: 'unpaved track' },
  road: { label: 'Road', min: 1.2, wheel: 70, name: 'paved road' },
  highway: { label: 'Highway', min: 1.2, wheel: 90, name: 'highway' },
  rail: { label: 'Railway', min: 1.8, wheel: 150, name: 'railway' },
} as const;
const METHODS = { open: 'Open cut', bore: 'Bored, uncased', cased: 'Bored, cased' } as const;

export default function RoadCrossing() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [road, setRoad] = useState<keyof typeof ROADS>('road');
  const [method, setMethod] = useState<keyof typeof METHODS>('bore');
  const [cover, setCover] = useState(1.5);
  const r = ROADS[road];
  const p = soilPressure(18.8, cover) + wheelPressure(r.wheel, cover);
  const ov = ovalisation({ D: pipe.D, t: pipe.t, pressure: p, Eprime: method === 'open' ? 7 : 14 });
  const okCover = cover >= r.min, okOv = ov.ratio <= 0.03;
  const W = 560, H = 230, gy = 70, s = lin(0, 3.5, 0, 140), Dp = Math.max(s(pipe.D / 1000), 6), py = gy + s(cover) + Dp / 2;
  const u = (v: number) => `${fmt('m', sys, v, 1)} ${unitOf('m', sys)}`;

  return (
    <Frame title="Road and railway crossing" foot="Minimum cover values follow API RP 1102 guidance (1.2 m under a road surface, 1.8 m under rail for uncased pipe; 0.9 m under ditches). Load and ovalisation are the screening estimate from module M2, not the full API RP 1102 stress and fatigue check.">
      <Controls>
        <Segmented label="Crossing" value={road} onChange={setRoad} options={Object.entries(ROADS).map(([k, v]) => ({ value: k as keyof typeof ROADS, label: v.label }))} />
        <Segmented label="Method" value={method} onChange={setMethod} options={Object.entries(METHODS).map(([k, v]) => ({ value: k as keyof typeof METHODS, label: v.split(',')[0] + (k === 'cased' ? ' cased' : '') }))} />
        {pipe.pickers}
        <Slider label="Cover below road surface" kind="m" value={cover} onChange={setCover} min={0.6} max={3.2} step={0.1} dp={1} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Section through a ${r.name} crossing, ${METHODS[method]}`} style={{ width: '100%' }}>
          <Defs />
          <path d={`M0 ${gy + 8}H120L150 ${gy + 26}L180 ${gy}H380L410 ${gy + 26}L440 ${gy + 8}H${W}V${H}H0Z`} fill="url(#soil)" />
          <path d={`M0 ${gy + 8}H120L150 ${gy + 26}L180 ${gy}H380L410 ${gy + 26}L440 ${gy + 8}H${W}`} fill="none" stroke="var(--text)" strokeWidth="1.5" />
          <rect x="180" y={gy - 7} width="200" height="7" fill="var(--text)" />
          {road === 'rail' ? <g><rect x="250" y={gy - 13} width="6" height="6" fill="var(--steel)" /><rect x="304" y={gy - 13} width="6" height="6" fill="var(--steel)" /></g>
            : <g><rect x="236" y={gy - 34} width="60" height="20" rx="4" fill="var(--steel)" /><circle cx="250" cy={gy - 12} r="6" fill="var(--text)" /><circle cx="282" cy={gy - 12} r="6" fill="var(--text)" /></g>}
          {method === 'cased' && <g>
            <rect x="140" y={py - Dp / 2 - 7} width="280" height={Dp + 14} fill="none" stroke="var(--yellow)" strokeWidth="3" />
            <line x1="150" y1={py - Dp / 2 - 7} x2="150" y2={gy - 20} stroke="var(--yellow)" strokeWidth="2" /><path d={`M150 ${gy - 20}q0 -8 8 -8`} fill="none" stroke="var(--yellow)" strokeWidth="2" />
            <text x="164" y={gy - 26} className="svg-label" style={{ fill: 'var(--yellow)' }}>casing vent</text>
            <text x="424" y={py + Dp / 2 + 20} className="svg-label" style={{ fill: 'var(--yellow)' }}>end seal</text>
          </g>}
          {method === 'open' && <path d={`M196 ${gy}L214 ${py + Dp / 2 + 6}H346L364 ${gy}`} fill="var(--bg)" opacity=".5" stroke="var(--muted)" strokeDasharray="4 3" />}
          <rect x="0" y={py - Dp / 2} width={W} height={Dp} fill={okCover && okOv ? 'var(--brand)' : 'var(--bad)'} opacity=".9" />
          <line x1="470" x2="470" y1={gy + 8} y2={py - Dp / 2} stroke="var(--muted)" markerStart="url(#arr-muted)" markerEnd="url(#arr-muted)" />
          <line x1="330" x2="330" y1={gy} y2={py - Dp / 2} stroke="var(--text)" markerStart="url(#arr-text)" markerEnd="url(#arr-text)" />
          <text x="336" y={(gy + py) / 2} className="svg-strong">{u(cover)}</text>
          <text x="150" y={gy + 44} textAnchor="middle" className="svg-label">ditch</text>
          <text x="10" y="20" className="svg-label">{METHODS[method]} · heavy-wall carrier pipe extends past the road reserve on both sides</text>
        </svg>
        <Stats>
          <Stat label="Minimum cover" kind="m" value={r.min} dp={1} />
          <Stat label="Design wheel load" kind="force" value={r.wheel * 1000} />
          <Stat label="Pressure on crown" kind="kpa" value={p} />
          <Stat label="Ovalisation" kind="pct" value={ov.ratio} dp={2} tone={okOv ? 'ok' : 'bad'} />
        </Stats>
        {!okCover ? <Verdict tone="bad">Cover is less than the {u(r.min)} minimum for a {r.name}. Deepen the crossing.</Verdict>
          : !okOv ? <Verdict tone="bad">Ovalisation exceeds 3 %. Use a heavier wall or more cover.</Verdict>
          : method === 'cased' ? <Verdict tone="warn">Acceptable, but a casing shields the carrier pipe from cathodic protection and can short to it. Use casings only where the road or rail authority insists.</Verdict>
          : method === 'open' ? <Verdict tone="warn">Acceptable for a track or minor road with a diversion. Backfill must be compacted in layers and the road surface reinstated.</Verdict>
          : <Verdict tone="ok">A bored, uncased crossing with heavy-wall pipe: the preferred modern arrangement. Complete the API RP 1102 stress and fatigue check.</Verdict>}
      </View>
    </Frame>
  );
}
