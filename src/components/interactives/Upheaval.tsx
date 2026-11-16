import { useState } from 'react';
import { upheaval } from '@/lib/eng/upheaval';
import { Controls, Defs, Frame, Meter, Segmented, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { clamp, lin, usePipe } from './pipe';

const SOILS = {
  loose: { label: 'Loose sand', f: 0.1, gamma: 15.5 },
  dense: { label: 'Dense sand', f: 0.5, gamma: 18 },
  rock: { label: 'Gravel / rock', f: 0.6, gamma: 19 },
} as const;

export default function Upheaval() {
  const sys = useUnits();
  const pipe = usePipe(12, 9.5);
  const [P, setP] = useState(12);
  const [dT, setDT] = useState(85);
  const [delta, setDelta] = useState(0.4);
  const [cover, setCover] = useState(0.6);
  const [soil, setSoil] = useState<keyof typeof SOILS>('loose');
  const s = SOILS[soil];
  const base = { D: pipe.D, t: pipe.t, P, dT, gammaSoil: s.gamma, f: s.f, contentRho: 800 };
  const r = upheaval({ ...base, delta, cover });
  const stable = r.sf >= 1;
  const tone = r.sf >= 1.5 ? 'ok' : stable ? 'warn' : 'bad';

  // Profile sketch
  const W = 560, H = 240, m = lin(0, 3.2, 0, 150); // metres → px (vertical)
  const ground = 62, Dpx = clamp(m(pipe.D / 1000), 8, 46);
  const yBot = ground + m(cover) + Dpx; // trench bottom away from the hump
  const hump = m(delta);
  const lift = stable ? 0 : Math.max(yBot - Dpx / 2 - hump - (ground - 22), 0);
  const yPipe = (x: number, extra = 0) => {
    const u = (x - W / 2) / 120;
    return yBot - Dpx / 2 - (hump + extra) * Math.exp(-u * u * 2.2);
  };
  const xs = Array.from({ length: 57 }, (_, i) => i * 10);
  const line = (f: (x: number) => number) => 'M' + xs.map((x) => `${x},${f(x).toFixed(1)}`).join('L');
  const groundLine = (_x: number) => ground;

  // Required cover vs imperfection chart
  const CW = 560, CH = 170, cx = lin(0, 1, 44, CW - 12), cyMax = Math.max(2, cover * 1.3);
  const cy = lin(0, cyMax, CH - 26, 10);
  const curve = Array.from({ length: 41 }, (_, i) => { const d = 0.025 * i; return [d, upheaval({ ...base, delta: Math.max(d, 0.001), cover }).requiredCover] as const; });

  return (
    <Frame title="Upheaval buckling explorer" foot="Effective force for a fully restrained line; required download from Palmer et al. (1990); uplift resistance q = γHD(1 + fH/D). Contents 800 kg/m³. Screening level: detailed design uses surveyed imperfections and finite-element checks.">
      <Controls>
        {pipe.pickers}
        <Slider label="Operating pressure" kind="pressure" value={P} onChange={setP} min={0} max={25} step={0.5} />
        <Slider label="Temperature rise ΔT" kind="dT" value={dT} onChange={setDT} min={0} max={120} step={1} />
        <Slider label="Imperfection height δ" kind="m" value={delta} onChange={setDelta} min={0.05} max={1} step={0.05} />
        <Slider label="Depth of cover H" kind="m" value={cover} onChange={setCover} min={0.3} max={2.5} step={0.05} />
        <Segmented label="Backfill" value={soil} onChange={setSoil} options={Object.entries(SOILS).map(([k, v]) => ({ value: k as keyof typeof SOILS, label: v.label }))} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={stable ? 'Pipe held down over a trench-bottom imperfection' : 'Pipe buckling upward out of the ground'} style={{ width: '100%' }}>
          <Defs />
          <path d={`${line(groundLine)}L${W},${H}L0,${H}Z`} fill="url(#soil)" />
          <path d={`${line(groundLine)}L${W},${H}L0,${H}Z`} fill="var(--yellow)" opacity=".07" />
          <path d={line(groundLine)} fill="none" stroke="var(--text)" strokeWidth="2" />
          <path d={`${line((x) => yPipe(x) + Dpx / 2)}L${W},${H}L0,${H}Z`} fill="var(--steel)" opacity=".35" />
          <path d={line((x) => yPipe(x, lift))} fill="none" stroke={stable ? 'var(--brand)' : 'var(--bad)'} strokeWidth={Dpx} strokeLinecap="butt" opacity=".9" style={{ transition: 'd .5s, stroke .3s' }} />
          <line x1="70" x2="150" y1={yBot - Dpx / 2} y2={yBot - Dpx / 2} stroke="var(--surface)" strokeWidth="2.5" markerEnd="url(#arr-text)" />
          <line x1={W - 70} x2={W - 150} y1={yBot - Dpx / 2} y2={yBot - Dpx / 2} stroke="var(--surface)" strokeWidth="2.5" markerEnd="url(#arr-text)" />
          <text x="20" y={yBot + 26} className="svg-strong">N = {fmt('force', sys, r.axial)} {unitOf('force', sys)} compression</text>
          <line x1={W / 2 + 96} x2={W / 2 + 96} y1={yBot} y2={yBot - hump} stroke="var(--accent)" markerStart="url(#arr-accent)" markerEnd="url(#arr-accent)" />
          <text x={W / 2 + 104} y={yBot - hump / 2 + 4} className="svg-label" style={{ fill: 'var(--accent)' }}>δ</text>
          {stable
            ? <>
              <line x1={W / 2} x2={W / 2} y1={ground - 30} y2={yPipe(W / 2) - Dpx / 2 - 6} stroke="var(--ok)" strokeWidth="2.5" markerEnd="url(#arr-ok)" />
              <text x={W / 2 + 8} y={ground - 20} className="svg-label" style={{ fill: 'var(--ok)' }}>soil + pipe weight hold it down</text>
            </>
            : <text x={W / 2} y={16} textAnchor="middle" className="svg-strong" style={{ fill: 'var(--bad)' }}>pipe breaks out of the cover</text>}
        </svg>
        <Stats>
          <Stat label="Compressive force N" kind="force" value={r.axial} />
          <Stat label="Download required" kind="lineload" value={r.required} />
          <Stat label="Download available" kind="lineload" value={r.available} />
          <Stat label="Safety factor" value={r.sf} dp={2} tone={tone} text={Number.isFinite(r.sf) ? undefined : 'no uplift'} />
          <Stat label="Cover needed (SF 1.0)" kind="m" value={r.requiredCover} tone="brand" />
        </Stats>
        <Meter label="Required ÷ available download" ratio={r.required / r.available} />
        {tone === 'ok' ? <Verdict tone="ok">Stable with margin. The cover and pipe weight comfortably resist the uplift at this imperfection.</Verdict>
          : tone === 'warn' ? <Verdict tone="warn">Stable, but with less than 1.5 margin. Imperfection surveys and backfill quality are uncertain: add cover or reduce δ.</Verdict>
          : <Verdict tone="bad">Unstable. Deepen the trench, smooth the trench bottom, use better backfill, add rock cover or lower the temperature differential.</Verdict>}
        <svg viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Chart of required cover against imperfection height" style={{ width: '100%' }}>
          <line x1={cx(0)} x2={cx(1)} y1={cy(0)} y2={cy(0)} stroke="var(--line)" />
          <line x1={cx(0)} x2={cx(0)} y1={cy(0)} y2={cy(cyMax)} stroke="var(--line)" />
          <path d={`M${cx(0)},${cy(cover)}L${cx(1)},${cy(cover)}L${cx(1)},${cy(0)}L${cx(0)},${cy(0)}Z`} fill="var(--ok)" opacity=".07" />
          <line x1={cx(0)} x2={cx(1)} y1={cy(cover)} y2={cy(cover)} stroke="var(--ok)" strokeDasharray="5 4" />
          <path d={'M' + curve.map(([d, h]) => `${cx(d).toFixed(1)},${cy(Math.min(h, cyMax)).toFixed(1)}`).join('L')} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          <circle cx={cx(delta)} cy={cy(Math.min(r.requiredCover, cyMax))} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
          <text x={cx(1)} y={cy(cover) - 6} textAnchor="end" className="svg-label" style={{ fill: 'var(--ok)' }}>actual cover</text>
          <text x={cx(0) + 6} y={16} className="svg-label">required cover ↑</text>
          <text x={cx(1)} y={CH - 6} textAnchor="end" className="svg-label">imperfection height δ → {fmt('m', sys, 1, 1)} {unitOf('m', sys)}</text>
        </svg>
      </View>
    </Frame>
  );
}
