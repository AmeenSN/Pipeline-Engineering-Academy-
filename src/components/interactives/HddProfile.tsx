import { useState } from 'react';
import { hddProfile } from '@/lib/eng/flow';
import { Controls, Frame, Segmented, Slider, Stat, Stats, Verdict, View } from './kit';
import { usePipe } from './pipe';

const STAGES = {
  pilot: { label: '1 Pilot hole', text: 'A small steerable bit drills the designed path from the rig side to the exit, tracked by a guidance system.' },
  ream: { label: '2 Reaming', text: 'Reamers are pulled or pushed through in passes, enlarging the hole to about 1.5 times the pipe diameter. Drilling mud carries the cuttings out and supports the hole.' },
  pull: { label: '3 Pullback', text: 'The welded, tested and coated pipe string is pulled into the hole in one continuous operation, supported on rollers and often filled with water to reduce buoyancy.' },
} as const;

export default function HddProfile() {
  const pipe = usePipe(24, 15.9);
  const [L, setL] = useState(700);
  const [depth, setDepth] = useState(18);
  const [en, setEn] = useState(10);
  const [ex, setEx] = useState(8);
  const [stage, setStage] = useState<keyof typeof STAGES>('pilot');
  const h = hddProfile({ L, depth, entryDeg: en, exitDeg: ex, D: pipe.D });

  const W = 560, H = 230, sx = (W - 60) / L, sy = 120 / Math.max(depth, 5), gy = 60, x0 = 30;
  // sample the path
  const pts: [number, number][] = [];
  const a = (en * Math.PI) / 180, b = (ex * Math.PI) / 180;
  const tR1 = Math.max(h.en.tanRun, 0), tR2 = Math.max(h.ex.tanRun, 0), bot = Math.max(h.bottom, 0);
  pts.push([0, 0], [tR1, Math.max(h.en.tanDrop, 0)]);
  for (let i = 1; i <= 12; i++) { const th = a * (1 - i / 12); pts.push([tR1 + h.R * (Math.sin(a) - Math.sin(th)), depth - h.R * (1 - Math.cos(th))]); }
  pts.push([tR1 + h.en.arcRun + bot, depth]);
  for (let i = 1; i <= 12; i++) { const th = b * (i / 12); pts.push([tR1 + h.en.arcRun + bot + h.R * Math.sin(th), depth - h.R * (1 - Math.cos(th))]); }
  pts.push([tR1 + h.en.arcRun + bot + h.ex.arcRun + tR2, 0]);
  const path = 'M' + pts.map(([px, py]) => `${(x0 + px * sx).toFixed(1)},${(gy + Math.max(py, 0) * sy).toFixed(1)}`).join('L');
  const prog = stage === 'pilot' ? 0.6 : 1;

  return (
    <Frame title="HDD crossing profile" foot="Design radius taken as 1200 × pipe diameter, the common rule for steel pipe. Vertical scale is exaggerated. Pull force, mud pressure and hole stability need a specialist design.">
      <Controls>
        {pipe.pickers}
        <Slider label="Entry to exit distance (m)" value={L} onChange={setL} min={150} max={1800} step={10} dp={0} />
        <Slider label="Depth below entry level (m)" value={depth} onChange={setDepth} min={5} max={45} step={1} dp={0} />
        <Slider label="Entry angle (degrees)" value={en} onChange={setEn} min={6} max={20} step={1} dp={0} />
        <Slider label="Exit angle (degrees)" value={ex} onChange={setEx} min={4} max={15} step={1} dp={0} />
      </Controls>
      <View>
        <Segmented value={stage} onChange={setStage} options={Object.entries(STAGES).map(([k, v]) => ({ value: k as keyof typeof STAGES, label: v.label }))} />
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Profile of a horizontal directional drill under a river" style={{ width: '100%' }}>
          <path d={`M0 ${gy}H${W * 0.36}Q${W * 0.5} ${gy + 44} ${W * 0.64} ${gy}H${W}V${H}H0Z`} fill="var(--yellow)" opacity=".1" />
          <path d={`M${W * 0.36} ${gy}Q${W * 0.5} ${gy + 44} ${W * 0.64} ${gy}Z`} fill="var(--brand)" opacity=".35" />
          <path d={`M0 ${gy}H${W * 0.36}Q${W * 0.5} ${gy + 44} ${W * 0.64} ${gy}H${W}`} fill="none" stroke="var(--text)" strokeWidth="1.5" />
          <path d={path} fill="none" stroke="var(--muted)" strokeWidth={stage === 'pilot' ? 2 : 7} strokeDasharray={stage === 'pilot' ? '5 4' : undefined} opacity=".5" />
          <path d={path} fill="none" stroke={h.feasible ? (stage === 'pull' ? 'var(--accent)' : 'var(--brand)') : 'var(--bad)'} strokeWidth={stage === 'pull' ? 4 : 2.5} pathLength={1} strokeDasharray={`${prog} 1`} strokeDashoffset={stage === 'pull' ? -(1 - 0.55) : 0} />
          <rect x={x0 - 26} y={gy - 22} width="30" height="16" rx="2" fill="var(--yellow)" stroke="var(--text)" /><line x1={x0 - 4} y1={gy - 16} x2={x0 + 10} y2={gy - 2} stroke="var(--text)" strokeWidth="3" />
          <text x={x0 - 26} y={gy - 28} className="svg-label">rig (entry)</text>
          {stage === 'pull' && <rect x={x0 + L * sx} y={gy - 9} width="30" height="6" fill="var(--accent)" />}
          <text x={W - 6} y={gy - 14} textAnchor="end" className="svg-label">{stage === 'pull' ? 'pipe string on rollers' : 'exit'}</text>
          <text x={W / 2} y={gy - 8} textAnchor="middle" className="svg-label">river / obstacle</text>
        </svg>
        <p style={{ fontSize: '.9rem', color: 'var(--muted)' }}>{STAGES[stage].text}</p>
        <Stats>
          <Stat label="Design bend radius" text={`${h.R.toFixed(0)} m`} />
          <Stat label="Drilled length" text={h.feasible ? `${h.drillLength.toFixed(0)} m` : '—'} tone="brand" />
          <Stat label="Straight length at depth" text={`${Math.max(h.bottom, 0).toFixed(0)} m`} />
          <Stat label="Shortest crossing for this depth" text={`${h.minLength.toFixed(0)} m`} />
          <Stat label="Elastic bending stress" kind="stress" value={h.bendStress} />
        </Stats>
        {h.feasible ? <Verdict tone="ok">The profile fits: both curves reach the full depth within the available length.</Verdict>
          : h.en.tanDrop < 0 || h.ex.tanDrop < 0 ? <Verdict tone="bad">Too shallow for the angle: the curve alone goes deeper than the target depth. Reduce the entry or exit angle, or go deeper.</Verdict>
          : <Verdict tone="bad">Not enough length. At this depth and these angles the crossing must be at least {h.minLength.toFixed(0)} m long. Steepen the angles, reduce the depth or move the entry and exit points apart.</Verdict>}
      </View>
    </Frame>
  );
}
