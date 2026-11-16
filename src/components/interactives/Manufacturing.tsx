import { useEffect, useState } from 'react';
import { Defs, Segmented, fmt, unitOf, useUnits } from './kit';
import { lin } from './pipe';

type Shape = { kind: 'solid' | 'ring' | 'arc' | 'spiral'; open?: number; wall?: number; weld?: 'none' | 'tack' | 'in' | 'both' | 'hf'; expand?: boolean };
interface Step { t: string; d: string; s: Shape }
interface Proc { id: string; name: string; full: string; od: [number, number]; wall: [number, number]; seam: string; use: string; steps: Step[] }

const PROCS: Proc[] = [
  { id: 'smls', name: 'Seamless', full: 'Seamless (SMLS)', od: [21, 660], wall: [3, 60], seam: 'None', use: 'Small-diameter flowlines, sour and high-pressure service, heavy walls.',
    steps: [
      { t: 'Billet heating', d: 'A solid round steel billet is heated to about 1250 °C in a rotary hearth furnace.', s: { kind: 'solid' } },
      { t: 'Rotary piercing', d: 'Two skewed rolls spin the billet over a piercing point, opening a hole through the centre to form a thick hollow shell.', s: { kind: 'ring', wall: 0.42 } },
      { t: 'Elongation', d: 'A mandrel or plug mill rolls the shell longer and thinner over an internal bar.', s: { kind: 'ring', wall: 0.22 } },
      { t: 'Sizing and stretch reducing', d: 'Stands of rolls bring the pipe to final diameter and wall. Wall thickness varies more than on welded pipe.', s: { kind: 'ring', wall: 0.12 } },
      { t: 'Heat treatment and inspection', d: 'Normalising or quench-and-temper sets the grade, then the full body is ultrasonically tested.', s: { kind: 'ring', wall: 0.12 } },
    ] },
  { id: 'hfw', name: 'HFW / ERW', full: 'High-frequency welded (HFW / ERW)', od: [60, 660], wall: [3, 25], seam: 'One straight seam, no filler metal', use: 'Onshore lines up to about NPS 24: economical, good dimensional accuracy.',
    steps: [
      { t: 'Uncoil and edge trim', d: 'Hot-rolled coil (skelp) is flattened and its edges milled square.', s: { kind: 'arc', open: 0 } },
      { t: 'Roll forming', d: 'A series of roll stands progressively curls the strip into an open tube.', s: { kind: 'arc', open: 0.55 } },
      { t: 'Fin pass', d: 'Final forming stands bring the two edges almost together in a V.', s: { kind: 'arc', open: 0.93 } },
      { t: 'High-frequency welding', d: 'Current concentrates at the strip edges and heats them to forging temperature. Squeeze rolls press them together. No filler metal is added.', s: { kind: 'arc', open: 1, weld: 'hf' } },
      { t: 'Seam heat treatment', d: 'The weld line is normalised by induction heating to restore toughness, and the internal and external flash is trimmed.', s: { kind: 'arc', open: 1, weld: 'both' } },
      { t: 'Sizing, cut-off and testing', d: 'Sizing rolls set the final diameter. Each pipe is hydrotested and the seam ultrasonically inspected.', s: { kind: 'arc', open: 1, weld: 'both' } },
    ] },
  { id: 'lsaw', name: 'LSAW', full: 'Longitudinal submerged-arc welded (LSAW: UOE / JCOE)', od: [406, 1626], wall: [6, 50], seam: 'One straight seam, welded inside and outside', use: 'Large-diameter, high-pressure trunklines, sour service and offshore.',
    steps: [
      { t: 'Plate edge preparation', d: 'A single steel plate is ultrasonically tested and its long edges milled to a weld bevel, then crimped.', s: { kind: 'arc', open: 0 } },
      { t: 'U-ing (or J-C forming)', d: 'A press bends the plate into a U. In the JCOE route the plate is pressed in small steps: J, then C.', s: { kind: 'arc', open: 0.55 } },
      { t: 'O-ing', d: 'Two half-round dies close the U into an O.', s: { kind: 'arc', open: 0.96 } },
      { t: 'Tack welding', d: 'The seam is closed with a continuous tack weld.', s: { kind: 'arc', open: 1, weld: 'tack' } },
      { t: 'Inside then outside SAW', d: 'Multi-wire submerged-arc welding lays one pass from inside and one from outside. The passes overlap through the wall.', s: { kind: 'arc', open: 1, weld: 'both' } },
      { t: 'Mechanical expansion', d: 'An internal expander stretches the pipe about 1 % to round it, straighten it and set the final diameter.', s: { kind: 'arc', open: 1, weld: 'both', expand: true } },
    ] },
  { id: 'ssaw', name: 'SSAW', full: 'Spiral (helical) submerged-arc welded (SSAW / HSAW)', od: [406, 2540], wall: [6, 25], seam: 'One helical seam, welded inside and outside', use: 'Large-diameter water and lower-pressure oil and gas lines; any diameter from one coil width.',
    steps: [
      { t: 'Uncoil and level', d: 'Hot-rolled coil is uncoiled, levelled and its edges milled.', s: { kind: 'spiral', open: 0 } },
      { t: 'Helical forming', d: 'The strip is fed at an angle into a three-roll forming cage. The feed angle sets the pipe diameter.', s: { kind: 'spiral', open: 0.5 } },
      { t: 'Inside and outside SAW', d: 'As the helix closes, the seam is submerged-arc welded first inside, then outside half a turn later.', s: { kind: 'spiral', open: 1 } },
      { t: 'Cut-off and testing', d: 'Pipe is cut to length on the fly, then the seam is inspected and each pipe hydrotested.', s: { kind: 'spiral', open: 1 } },
    ] },
];

function Section({ s }: { s: Shape }) {
  const R = 78;
  if (s.kind === 'solid') return <circle r={R * 0.7} fill="var(--accent)" opacity=".85" stroke="var(--text)" />;
  if (s.kind === 'ring') {
    const ro = R * (0.75 + (0.42 - (s.wall ?? 0.2)) * 0.8), ri = ro * (1 - (s.wall ?? 0.2) * 2);
    return <g><circle r={ro} fill="var(--steel)" stroke="var(--text)" /><circle r={ri} fill="var(--surface)" stroke="var(--text)" /></g>;
  }
  if (s.kind === 'spiral') {
    const o = s.open ?? 0;
    return (
      <g>
        <rect x={-150} y={-46} width={300} height={92} rx="6" fill="var(--steel)" opacity={0.25 + 0.5 * o} stroke="var(--text)" />
        {Array.from({ length: 7 }, (_, i) => {
          const x = -150 + i * 50 * (0.4 + 0.6 * o);
          return o > 0 && x < 150 && <path key={i} d={`M${x} 46 Q${x + 22} 0 ${Math.min(x + 44, 150)} -46`} fill="none" stroke={o >= 1 ? 'var(--accent)' : 'var(--text)'} strokeWidth={o >= 1 ? 3 : 1.5} strokeDasharray={o >= 1 ? undefined : '5 4'} />;
        })}
        <path d="M-190 80 L-150 46 L-150 -10 L-190 24Z" fill="var(--steel)" stroke="var(--text)" opacity=".8" />
        <text x="-186" y="100" className="svg-label">strip in</text>
        <text x="150" y="70" textAnchor="end" className="svg-label">side view</text>
      </g>
    );
  }
  // arc: a strip of fixed length curled from flat (open 0) to a closed circle (open 1)
  // Opening faces up; the bottom of the shape rises as the strip closes so the finished pipe is centred.
  const o = Math.max(s.open ?? 0, 0.001), rf = R * 0.75, len = 2 * Math.PI * rf, th = o * 2 * Math.PI, r = len / th;
  const half = th / 2, B = 20 + (rf - 20) * o, yc = B - r, closed = o > 0.995;
  const p = (a: number) => `${(r * Math.sin(a)).toFixed(1)},${(yc + r * Math.cos(a)).toFixed(1)}`;
  const d = o < 0.02 ? `M${-len / 2},${B}L${len / 2},${B}` : `M${p(-half)}A${r.toFixed(1)} ${r.toFixed(1)} 0 ${th > Math.PI ? 1 : 0} 0 ${p(half)}`;
  const top = yc + r * Math.cos(half), cy = yc;
  const k = s.expand ? 1.08 : 1;
  return (
    <g transform={`scale(${k})`} style={{ transition: 'transform .5s' }}>
      {closed ? <circle cx="0" cy={yc} r={r} fill="none" stroke="var(--steel)" strokeWidth="11" />
        : <path d={d} fill="none" stroke="var(--steel)" strokeWidth="11" strokeLinecap="butt" />}
      {s.weld === 'tack' && <circle cx="0" cy={top} r="4" fill="var(--yellow)" />}
      {s.weld === 'hf' && <g><circle cx="0" cy={top} r="9" fill="var(--bad)" opacity=".5" /><circle cx="0" cy={top} r="4" fill="var(--yellow)" /></g>}
      {s.weld === 'both' && <ellipse cx="0" cy={top} rx="6" ry="9" fill="var(--accent)" stroke="var(--text)" />}
      {s.expand && [0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1="0" y1="0" x2="34" y2="0" transform={`translate(0 ${cy}) rotate(${a})`} stroke="var(--brand)" strokeWidth="2" markerEnd="url(#arr-brand)" />)}
    </g>
  );
}

export default function Manufacturing() {
  const sys = useUnits();
  const [pid, setPid] = useState('lsaw');
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const proc = PROCS.find((p) => p.id === pid)!;
  const step = proc.steps[Math.min(i, proc.steps.length - 1)];
  useEffect(() => { setI(0); }, [pid]);
  useEffect(() => {
    if (!play) return;
    const h = setInterval(() => setI((v) => (v + 1) % proc.steps.length), 2200);
    return () => clearInterval(h);
  }, [play, proc]);
  const W = 560, bx = lin(Math.log10(20), Math.log10(2600), 130, W - 12);
  const rng = (a: number, b: number, k: 'mm') => `${fmt(k, sys, a, sys === 'si' ? 0 : 1)} to ${fmt(k, sys, b, sys === 'si' ? 0 : 1)} ${unitOf(k, sys)}`;

  return (
    <section className="ix not-prose" aria-label="Pipe manufacturing processes">
      <div className="ix-head"><div className="ix-title">How line pipe is made</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1rem' }}>
        <Segmented value={pid} onChange={setPid} options={PROCS.map((p) => ({ value: p.id, label: p.name }))} />
        <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4 items-center">
          <svg viewBox="-200 -110 400 230" role="img" aria-label={`${proc.full}: ${step.t}`} style={{ width: '100%', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <Defs />
            <Section s={step.s} />
          </svg>
          <div>
            <div className="eyebrow">{proc.full}</div>
            <div className="num" style={{ color: 'var(--muted)', fontSize: '.8rem', marginTop: '.6rem' }}>Step {Math.min(i, proc.steps.length - 1) + 1} of {proc.steps.length}</div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 650, marginTop: '.2rem' }}>{step.t}</h4>
            <p style={{ color: 'var(--muted)', marginTop: '.5rem', fontSize: '.95rem', minHeight: '5.5em' }}>{step.d}</p>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.8rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setPlay(false); setI((v) => Math.max(v - 1, 0)); }}>← Back</button>
              <button type="button" className="btn btn-primary" onClick={() => { setPlay(false); setI((v) => Math.min(v + 1, proc.steps.length - 1)); }}>Next step →</button>
              <button type="button" className="btn btn-ghost" onClick={() => setPlay((v) => !v)} aria-pressed={play}>{play ? 'Pause' : 'Play'}</button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
          {proc.steps.map((_, k) => <button key={k} type="button" onClick={() => { setPlay(false); setI(k); }} style={{ flex: 1, height: 6, borderRadius: 4, background: k <= i ? 'var(--accent)' : 'var(--line)' }} />)}
        </div>
        <div className="stats">
          <div className="stat"><div className="stat-label">Outside diameter range</div><div className="stat-value" style={{ fontSize: '.92rem' }}>{rng(proc.od[0], proc.od[1], 'mm')}</div></div>
          <div className="stat"><div className="stat-label">Typical wall range</div><div className="stat-value" style={{ fontSize: '.92rem' }}>{rng(proc.wall[0], proc.wall[1], 'mm')}</div></div>
          <div className="stat"><div className="stat-label">Weld seam</div><div style={{ fontSize: '.86rem', fontWeight: 600 }}>{proc.seam}</div></div>
          <div className="stat"><div className="stat-label">Typical use</div><div style={{ fontSize: '.86rem' }}>{proc.use}</div></div>
        </div>
        <svg viewBox={`0 0 ${W} 122`} role="img" aria-label="Diameter range covered by each process" style={{ width: '100%' }}>
          {PROCS.map((p, k) => (
            <g key={p.id} onClick={() => setPid(p.id)} style={{ cursor: 'pointer' }}>
              <text x="4" y={20 + k * 24} className={p.id === pid ? 'svg-strong' : 'svg-label'}>{p.name}</text>
              <rect x={bx(Math.log10(p.od[0]))} y={10 + k * 24} width={bx(Math.log10(p.od[1])) - bx(Math.log10(p.od[0]))} height="13" rx="4" fill={p.id === pid ? 'var(--accent)' : 'var(--steel)'} opacity={p.id === pid ? 1 : 0.5} />
            </g>
          ))}
          {[[60.3, 'NPS 2'], [168.3, '6'], [323.9, '12'], [610, '24'], [1219, '48'], [2032, '80']].map(([od, l]) => (
            <g key={l as string}><line x1={bx(Math.log10(od as number))} x2={bx(Math.log10(od as number))} y1="6" y2="104" stroke="var(--line)" /><text x={bx(Math.log10(od as number))} y="118" textAnchor="middle" className="svg-label">{l}</text></g>
          ))}
        </svg>
      </div>
      <div className="ix-foot">Size ranges are typical of large mills and vary by manufacturer. Cross-sections are schematic.</div>
    </section>
  );
}
