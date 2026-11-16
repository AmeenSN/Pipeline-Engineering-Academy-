import { useState } from 'react';
import { Defs } from './kit';

interface Step { t: string; d: string; A: boolean; K: boolean; B: number; door: boolean; pig: number; pressured: boolean }
// A = trap isolation valve, K = kicker valve, B = mainline bypass valve opening (0..1), pig position 0 none / 1 in barrel / 2 leaving / 3 gone
const STEPS: Step[] = [
  { t: 'Normal operation', d: 'Flow passes through the mainline bypass valve. The trap is isolated by two closed valves, depressurised and drained.', A: false, K: false, B: 1, door: false, pig: 0, pressured: false },
  { t: 'Prove the barrel is safe, then open the closure', d: 'Check the pressure gauge reads zero with the vent and drain open. Only then operate the closure. The interlock on the door prevents opening under pressure.', A: false, K: false, B: 1, door: true, pig: 0, pressured: false },
  { t: 'Load the pig', d: 'Push the pig forward until its front cups seal in the reducer, so that kicker flow acts behind it. Check the door seal, then close and lock the closure.', A: false, K: false, B: 1, door: false, pig: 1, pressured: false },
  { t: 'Purge and pressurise the barrel', d: 'Close the drain. Crack open the kicker valve to fill the barrel slowly, venting air or nitrogen, then close the vent and let pressure equalise with the pipeline.', A: false, K: true, B: 1, door: false, pig: 1, pressured: true },
  { t: 'Open the trap isolation valve', d: 'With pressure equal on both sides, open the trap isolation valve fully, then open the kicker valve fully. The pig is now free to move but there is no flow behind it yet.', A: true, K: true, B: 1, door: false, pig: 1, pressured: true },
  { t: 'Launch: throttle the mainline bypass valve', d: 'Slowly close the bypass valve. Flow diverts through the kicker line, into the barrel behind the pig, and pushes it out into the pipeline. The pig signaller confirms it has passed.', A: true, K: true, B: 0.25, door: false, pig: 2, pressured: true },
  { t: 'Return to normal', d: 'Reopen the bypass valve fully. Close the trap isolation and kicker valves. Depressurise and drain the barrel. Record the launch time.', A: false, K: false, B: 1, door: false, pig: 3, pressured: false },
];

const Valve = ({ x, y, open, label, vert, lx = 0, ly = -14 }: { x: number; y: number; open: number; label: string; vert?: boolean; lx?: number; ly?: number }) => {
  const c = open >= 1 ? 'var(--ok)' : open <= 0 ? 'var(--bad)' : 'var(--yellow)';
  return (
    <g transform={`translate(${x} ${y})${vert ? ' rotate(90)' : ''}`}>
      <path d="M-12 -9L12 9V-9L-12 9Z" fill={c} stroke="var(--text)" strokeWidth="1.2" />
      <text x={vert ? ly : lx} y={vert ? -lx - 16 : ly} textAnchor="middle" className="svg-label" transform={vert ? 'rotate(-90)' : undefined} style={{ fill: c, fontWeight: 600 }}>{label}</text>
    </g>
  );
};

export default function PigTrap() {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const flowMain = s.B > 0.5, flowKick = s.K && s.A && s.B < 0.5;
  const pipe = (d: string, on: boolean, w = 12) => <g><path d={d} fill="none" stroke="var(--steel)" strokeWidth={w} /><path d={d} fill="none" stroke={on ? 'var(--brand)' : 'transparent'} strokeWidth="3" strokeDasharray="8 7" style={on ? { animation: 'flow 1s linear infinite reverse' } : undefined} /></g>;
  const pigX = s.pig === 1 ? 250 : s.pig === 2 ? 470 : 0;

  return (
    <section className="ix not-prose" aria-label="Pig launcher operating sequence">
      <div className="ix-head"><div className="ix-title">Launching a pig, step by step</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1rem' }}>
        <svg viewBox="0 0 620 250" role="img" aria-label={`Pig launcher: ${s.t}`} style={{ width: '100%', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <Defs />
          {/* mainline */}
          {pipe('M0 190H120', true)}
          {pipe('M120 190H400', flowMain)}
          {pipe('M400 190H620', flowMain || flowKick)}
          {/* kicker line */}
          {pipe('M120 190V40H170V88', flowKick || (s.K && s.pressured && !s.A), 8)}
          {/* barrel */}
          <rect x="130" y="88" width="150" height="40" rx="4" fill={s.pressured ? 'color-mix(in srgb, var(--brand) 25%, var(--surface))' : 'var(--surface)'} stroke="var(--text)" strokeWidth="2" />
          <path d="M280 88L320 96V120L280 128Z" fill={s.pressured ? 'color-mix(in srgb, var(--brand) 25%, var(--surface))' : 'var(--surface)'} stroke="var(--text)" strokeWidth="2" />
          {pipe('M320 108H400V190', flowKick)}
          {/* closure door */}
          <g transform={s.door ? 'rotate(-70 130 88)' : undefined} style={{ transition: 'transform .4s' }}><rect x="122" y="84" width="9" height="48" rx="2" fill="var(--text)" /></g>
          <text x="118" y="146" textAnchor="middle" className="svg-label">closure</text>
          <text x="205" y="146" textAnchor="middle" className="svg-label">barrel (oversize)</text>
          {/* vent, drain, gauge */}
          <line x1="230" y1="88" x2="230" y2="68" stroke="var(--text)" strokeWidth="2" /><circle cx="230" cy="60" r="9" fill="var(--surface)" stroke="var(--text)" /><text x="230" y="64" textAnchor="middle" style={{ fontSize: 9, fill: s.pressured ? 'var(--bad)' : 'var(--ok)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.pressured ? 'P' : '0'}</text>
          <text x="246" y="62" className="svg-label">gauge + vent</text>
          {/* pig */}
          {s.pig > 0 && s.pig < 3 && <g transform={`translate(${pigX} ${s.pig === 1 ? 108 : 190})`} style={{ transition: 'transform .8s' }}><rect x="-22" y="-7" width="44" height="14" rx="4" fill="var(--accent)" /><rect x="-24" y="-12" width="5" height="24" fill="var(--accent)" /><rect x="14" y="-12" width="5" height="24" fill="var(--accent)" /></g>}
          <Valve x={170} y={62} open={s.K ? 1 : 0} label="KICKER" vert lx={-34} ly={0} />
          <Valve x={360} y={108} open={s.A ? 1 : 0} label="TRAP VALVE" />
          <Valve x={260} y={190} open={s.B} label="MAINLINE BYPASS" ly={26} />
          <path d="M520 178v-14h14" fill="none" stroke="var(--text)" strokeWidth="2" /><text x="540" y="168" className="svg-label">pig signaller</text>
          <text x="8" y="214" className="svg-label">from station →</text><text x="612" y="214" textAnchor="end" className="svg-label">→ pipeline</text>
        </svg>
        <div style={{ display: 'flex', gap: 4 }}>{STEPS.map((_, k) => <button key={k} type="button" aria-label={`Step ${k + 1}`} onClick={() => setI(k)} style={{ flex: 1, height: 6, borderRadius: 4, background: k <= i ? 'var(--accent)' : 'var(--line)' }} />)}</div>
        <div>
          <div className="num" style={{ color: 'var(--muted)', fontSize: '.8rem' }}>Step {i + 1} of {STEPS.length}</div>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 650 }}>{s.t}</h4>
          <p style={{ color: 'var(--muted)', fontSize: '.95rem', marginTop: '.3rem', minHeight: '4.2em' }}>{s.d}</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setI(Math.max(i - 1, 0))}>← Back</button>
          <button type="button" className="btn btn-primary" onClick={() => setI(Math.min(i + 1, STEPS.length - 1))}>Next step →</button>
          <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}><span style={{ color: 'var(--ok)' }}>■</span> open <span style={{ color: 'var(--yellow)' }}>■</span> throttled <span style={{ color: 'var(--bad)' }}>■</span> closed</span>
        </div>
      </div>
      <div className="ix-foot">A simplified generic launcher. Drain, vent, balance and pressure-relief lines are omitted or merged. Receiving is the mirror image. Always follow the site operating procedure.</div>
    </section>
  );
}
