import { useState } from 'react';
import { Controls, Defs, Frame, Select, Stat, Stats, Verdict, View } from './kit';
import { lin } from './pipe';

// Approximate potentials in neutral soil or water, volts versus a copper / copper-sulphate reference electrode.
const METALS = [
  { id: 'mg', name: 'Magnesium alloy', v: -1.55 },
  { id: 'zn', name: 'Zinc', v: -1.1 },
  { id: 'al', name: 'Aluminium alloy', v: -1.05 },
  { id: 'steel', name: 'Clean carbon steel', v: -0.65 },
  { id: 'rust', name: 'Rusted carbon steel', v: -0.4 },
  { id: 'conc', name: 'Steel in concrete', v: -0.2 },
  { id: 'cu', name: 'Copper, brass', v: -0.2 },
  { id: 'ss', name: 'Stainless steel (passive)', v: -0.1 },
  { id: 'c', name: 'Graphite, carbon', v: 0.3 },
];

export default function GalvanicSeries() {
  const [a, setA] = useState('steel');
  const [b, setB] = useState('cu');
  const A = METALS.find((m) => m.id === a)!, B = METALS.find((m) => m.id === b)!;
  const anode = A.v <= B.v ? A : B, cathode = A.v <= B.v ? B : A, dv = Math.abs(A.v - B.v);
  const opts = METALS.map((m) => ({ value: m.id, label: `${m.name}  (${m.v.toFixed(2)} V)` }));
  const W = 560, x = lin(-1.7, 0.4, 20, W - 20);
  const steelAnode = anode.id === 'steel' || anode.id === 'rust';

  return (
    <Frame title="Which metal corrodes?" foot="Typical potentials versus a copper / copper-sulphate electrode in neutral soil. Real values vary with environment. The more negative metal of a connected pair becomes the anode and corrodes.">
      <Controls>
        <Select label="Metal 1" value={a} onChange={setA} options={opts} />
        <Select label="Metal 2 (electrically connected, same soil)" value={b} onChange={setB} options={opts} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 110`} role="img" aria-label="Galvanic series with the two selected metals" style={{ width: '100%' }}>
          <line x1={x(-1.7)} x2={x(0.4)} y1="60" y2="60" stroke="var(--line)" strokeWidth="2" />
          {METALS.map((m) => <circle key={m.id} cx={x(m.v)} cy="60" r={m.id === a || m.id === b ? 9 : 4} fill={m.id === anode.id && a !== b ? 'var(--bad)' : m.id === cathode.id && a !== b ? 'var(--ok)' : 'var(--steel)'} />)}
          {[-1.5, -1, -0.5, 0].map((v) => <text key={v} x={x(v)} y="92" textAnchor="middle" className="svg-label">{v.toFixed(1)} V</text>)}
          <text x={x(-1.7)} y="22" className="svg-label" style={{ fill: 'var(--bad)' }}>← more active: corrodes (anode)</text>
          <text x={x(0.4)} y="22" textAnchor="end" className="svg-label" style={{ fill: 'var(--ok)' }}>more noble: protected (cathode) →</text>
        </svg>
        <svg viewBox="0 0 560 150" role="img" aria-label="Corrosion cell between the two metals" style={{ width: '100%' }}>
          <Defs />
          <rect x="0" y="50" width="560" height="100" fill="url(#soil)" /><rect x="0" y="50" width="560" height="100" fill="var(--yellow)" opacity=".07" />
          <rect x="90" y="40" width="46" height="90" rx="4" fill="var(--bad)" opacity=".8" /><rect x="424" y="40" width="46" height="90" rx="4" fill="var(--ok)" opacity=".8" />
          <path d="M113 40V16H447V40" fill="none" stroke="var(--text)" strokeWidth="2" />
          {a !== b && <>
            <path d="M400 12H170" stroke="var(--brand)" strokeWidth="2" markerEnd="url(#arr-brand)" /><text x="280" y="9" textAnchor="middle" className="svg-label" style={{ fill: 'var(--brand)' }}>electrons flow through the metal connection</text>
            <path d="M140 100Q280 140 420 100" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arr-accent)" /><text x="280" y="140" textAnchor="middle" className="svg-label" style={{ fill: 'var(--accent)' }}>current flows through the soil (electrolyte)</text>
          </>}
          <text x="113" y="146" textAnchor="middle" className="svg-strong">ANODE</text><text x="447" y="146" textAnchor="middle" className="svg-strong">CATHODE</text>
          <text x="80" y="66" textAnchor="end" className="svg-label">{anode.name}</text><text x="480" y="66" className="svg-label">{cathode.name}</text>
          <text x="80" y="82" textAnchor="end" className="svg-label" style={{ fill: 'var(--bad)' }}>metal dissolves</text>
        </svg>
        <Stats>
          <Stat label="Anode (corrodes)" text={a === b ? '—' : anode.name} tone="bad" />
          <Stat label="Cathode (protected)" text={a === b ? '—' : cathode.name} tone="ok" />
          <Stat label="Driving voltage" text={`${dv.toFixed(2)} V`} />
        </Stats>
        {a === b ? <Verdict tone="ok">Same metal: no galvanic cell from the pairing itself. Corrosion can still occur from differences in the soil along the pipe.</Verdict>
          : steelAnode ? <Verdict tone="bad">The steel is the anode and will corrode faster than it would alone. This is why steel pipe must be isolated from copper grounding, stainless steel and reinforced concrete.</Verdict>
          : cathode.id === 'steel' || cathode.id === 'rust' ? <Verdict tone="ok">The steel is the cathode and is protected. This is exactly how sacrificial anode cathodic protection works.</Verdict>
          : <Verdict tone="warn">{anode.name} is the anode and corrodes in preference to {cathode.name}.</Verdict>}
      </View>
    </Frame>
  );
}
