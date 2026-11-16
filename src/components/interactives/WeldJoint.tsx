import { useState } from 'react';
import { Controls, Frame, Segmented, Slider, Stat, Stats, Verdict, View } from './kit';

const PASSES = [
  { name: 'Root pass', text: 'Fuses the two root faces from the inside surface. The most critical pass: it sets the internal profile and is where most defects begin.' },
  { name: 'Hot pass', text: 'Deposited immediately on the root while it is still hot, to burn out slag, refine the root and add strength before the clamp is released.' },
  { name: 'Fill passes', text: 'Build the joint up to just below the pipe surface. The number depends on wall thickness.' },
  { name: 'Cap pass', text: 'Finishes the weld with a slightly raised, smooth profile that blends into the pipe surface without undercut.' },
];

export default function WeldJoint() {
  const [t, setT] = useState(12.7);
  const [done, setDone] = useState(4);
  const [bevel, setBevel] = useState<'std' | 'narrow'>('std');
  const [V, setV] = useState(26);
  const [I, setI] = useState(160);
  const [speed, setSpeed] = useState(300);
  const hi = (V * I * 60) / (1000 * speed);
  const ang = bevel === 'std' ? 30 : 5, s = 9, th = t * s, rf = 1.6 * s, gap = (bevel === 'std' ? 1.6 : 0.5) * s;
  const top = 40, bot = top + th, tan = Math.tan((ang * Math.PI) / 180);
  const xl = (y: number) => 200 - gap / 2 - (y < bot - rf ? (bot - rf - y) * tan : 0) - (bevel === 'narrow' && y < bot - rf ? 2.2 * s : 0);
  const fills = Math.max(Math.round((t - 5) / 3), 1);
  const bands = [bot, bot - rf - 0.6 * s, bot - rf - 2.6 * s, top + 1.5 * s, top - 4];
  const colors = ['var(--bad)', 'var(--accent)', 'var(--yellow)', 'var(--brand)'];
  const tone = hi < 0.5 ? 'warn' : hi > 2.2 ? 'warn' : 'ok';

  return (
    <Frame title="Girth weld build-up and heat input" foot="Heat input = volts × amps × 60 ÷ (1000 × travel speed in mm/min), in kJ/mm. The acceptable range comes from the qualified welding procedure; 0.5 to 2.2 kJ/mm is used here only as an illustration.">
      <Controls>
        <Segmented label="Joint preparation" value={bevel} onChange={setBevel} options={[{ value: 'std', label: '30° bevel (manual)' }, { value: 'narrow', label: 'Narrow gap (auto)' }]} />
        <Slider label="Wall thickness" kind="mm" value={t} onChange={setT} min={6.4} max={25.4} step={0.1} />
        <Slider label="Passes completed" value={done} onChange={setDone} min={0} max={4} step={1} dp={0} />
        <Slider label="Arc voltage (V)" value={V} onChange={setV} min={18} max={34} step={1} dp={0} />
        <Slider label="Current (A)" value={I} onChange={setI} min={80} max={300} step={5} dp={0} />
        <Slider label="Travel speed (mm/min)" value={speed} onChange={setSpeed} min={80} max={900} step={10} dp={0} />
      </Controls>
      <View>
        <svg viewBox="0 0 400 300" role="img" aria-label="Cross-section of a pipeline girth weld bevel with weld passes" style={{ width: '100%', maxHeight: 300 }}>
          <defs><pattern id="wj" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--steel)" strokeWidth="1.2" opacity=".6" /></pattern></defs>
          {[-1, 1].map((d) => (
            <path key={d} transform={d === 1 ? 'translate(400 0) scale(-1 1)' : undefined}
              d={`M10 ${top}H${xl(top)}L${xl(bot - rf)} ${bot - rf}V${bot}H10Z`} fill="url(#wj)" stroke="var(--text)" strokeWidth="1.4" />
          ))}
          {Array.from({ length: done }, (_, i) => {
            const y1 = bands[i], y2 = bands[i + 1];
            return <path key={i} d={`M${xl(y1) - 1} ${y1}L${400 - xl(y1) + 1} ${y1}L${400 - xl(y2) + (i === 3 ? 6 : 1)} ${Math.max(y2, top)}${i === 3 ? `Q200 ${top - 9} ${xl(y2) - 6} ${top}` : `L${xl(y2) - 1} ${y2}`}Z`} fill={colors[i]} opacity=".88" stroke="var(--text)" strokeWidth=".8" />;
          })}
          <text x="14" y={top - 10} className="svg-label">outside of pipe</text>
          <text x="14" y={bot + 18} className="svg-label">inside of pipe (bore)</text>
          <text x="386" y={(top + bot) / 2} textAnchor="end" className="svg-label">wall {t.toFixed(1)} mm</text>
          {PASSES.map((p, i) => <g key={p.name} opacity={i < done ? 1 : 0.35}><rect x={20 + i * 95} y="262" width="10" height="10" fill={colors[i]} /><text x={34 + i * 95} y="271" className="svg-label">{p.name}</text></g>)}
        </svg>
        <p style={{ fontSize: '.9rem', color: 'var(--muted)', minHeight: '3em' }}>{done === 0 ? 'The bevelled pipe ends are aligned in the clamp with a controlled root gap and minimal high-low offset.' : `${PASSES[done - 1].name}. ${PASSES[done - 1].text}`}</p>
        <Stats>
          <Stat label="Heat input" text={`${hi.toFixed(2)} kJ/mm`} tone={tone === 'ok' ? 'ok' : 'warn'} />
          <Stat label="Typical fill passes" text={String(bevel === 'narrow' ? Math.max(fills - 1, 1) : fills)} />
          <Stat label="Root gap" text={bevel === 'std' ? '1.6 mm' : 'closed to 0.5 mm'} />
        </Stats>
        {hi < 0.5 ? <Verdict tone="warn">Low heat input: the weld cools quickly, which raises hardness and the risk of hydrogen cracking and lack of fusion.</Verdict>
          : hi > 2.2 ? <Verdict tone="warn">High heat input: slow cooling coarsens the grain and can lower toughness and strength in the heat-affected zone.</Verdict>
          : <Verdict tone="ok">Heat input is in a typical range. On site it must stay within the limits of the qualified procedure.</Verdict>}
      </View>
    </Frame>
  );
}
