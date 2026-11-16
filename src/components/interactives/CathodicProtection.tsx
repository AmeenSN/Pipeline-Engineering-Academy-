import { useState } from 'react';
import { ANODES, anodeMass, cpCurrent, dwight } from '@/lib/eng/ops';
import { Controls, Defs, Frame, Segmented, Select, Slider, Stat, Stats, Verdict, View } from './kit';
import { npsOptions, odOf } from './pipe';

const COATINGS = { lpe: { label: '3LPE / 3LPP (new)', b: 0.01 }, fbe: { label: 'FBE', b: 0.03 }, old: { label: 'Aged tape or coal tar', b: 0.2 }, bare: { label: 'Bare pipe', b: 1 } } as const;

export default function CathodicProtection() {
  const [nps, setNps] = useState('24');
  const [L, setL] = useState(50);
  const [coat, setCoat] = useState<keyof typeof COATINGS>('lpe');
  const [rho, setRho] = useState(50);
  const [life, setLife] = useState(25);
  const [sys, setSys] = useState<'iccp' | 'mg'>('iccp');
  const [pot, setPot] = useState(-950);
  const D = odOf(nps), dens = rho < 10 ? 30 : rho < 100 ? 20 : 10;
  const c = cpCurrent(D, L, dens, COATINGS[coat].b), I = c.current;
  const R1 = dwight(rho, 1.5, 0.15), out1 = 0.7 / R1; // one packaged Mg anode, 0.7 V drive
  const nCurrent = Math.ceil(I / out1), mass = anodeMass(I, life, ANODES.mg), nMass = Math.ceil(mass / 14.5);
  const n = Math.max(nCurrent, nMass);
  const ptone = pot > -850 ? 'bad' : pot < -1200 ? 'warn' : 'ok';

  return (
    <Frame title="Cathodic protection sizing" foot="Current demand = pipe surface area × coating breakdown fraction × bare-steel current density (10 to 30 mA/m² by soil resistivity). Magnesium anodes of 14.5 kg, 0.7 V driving voltage, Dwight resistance. A first estimate: real designs add attenuation, ground bed and interference calculations.">
      <Controls>
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Slider label="Pipeline length (km)" value={L} onChange={setL} min={1} max={300} step={1} dp={0} />
        <Select label="Coating and condition" value={coat} onChange={setCoat} options={Object.entries(COATINGS).map(([k, v]) => ({ value: k as keyof typeof COATINGS, label: `${v.label}  ·  ${(v.b * 100).toFixed(0)} % bare` }))} />
        <Slider label="Soil resistivity (ohm·m)" value={rho} onChange={setRho} min={1} max={500} step={1} dp={0} />
        <Slider label="Design life" kind="years" value={life} onChange={setLife} min={5} max={40} step={1} />
        <Segmented label="System" value={sys} onChange={setSys} options={[{ value: 'iccp', label: 'Impressed current' }, { value: 'mg', label: 'Magnesium anodes' }]} />
      </Controls>
      <View>
        <svg viewBox="0 0 560 190" role="img" aria-label={sys === 'iccp' ? 'Impressed current cathodic protection circuit' : 'Sacrificial anode cathodic protection circuit'} style={{ width: '100%' }}>
          <Defs />
          <rect x="0" y="60" width="560" height="130" fill="url(#soil)" /><rect x="0" y="60" width="560" height="130" fill="var(--yellow)" opacity=".07" />
          <line x1="0" x2="560" y1="60" y2="60" stroke="var(--text)" strokeWidth="1.5" />
          <rect x="20" y="120" width="330" height="20" rx="3" fill="var(--steel)" stroke="var(--text)" /><text x="30" y="156" className="svg-label">pipeline (cathode)</text>
          {sys === 'iccp' ? <>
            <rect x="380" y="22" width="56" height="34" rx="4" fill="var(--surface)" stroke="var(--text)" strokeWidth="1.5" /><text x="408" y="43" textAnchor="middle" className="svg-strong">T/R</text>
            <path d="M380 46H200V120" fill="none" stroke="var(--text)" strokeWidth="1.5" /><text x="290" y="40" textAnchor="middle" className="svg-label">− to pipe</text>
            <path d="M436 46H500V90" fill="none" stroke="var(--text)" strokeWidth="1.5" /><text x="468" y="40" textAnchor="middle" className="svg-label">+ to anodes</text>
            {[470, 500, 530].map((ax) => <rect key={ax} x={ax - 5} y="90" width="10" height="70" rx="3" fill="var(--text)" />)}
            <text x="552" y="180" textAnchor="end" className="svg-label">ground bed (inert anodes in coke)</text>
          </> : <>
            {[110, 250].map((ax) => <g key={ax}><rect x={ax - 8} y="158" width="46" height="18" rx="5" fill="var(--bad)" opacity=".8" /><path d={`M${ax + 15} 158V140`} stroke="var(--text)" strokeWidth="1.5" /></g>)}
            <text x="330" y="176" className="svg-label">magnesium anodes wired directly to the pipe</text>
            <line x1="180" y1="120" x2="180" y2="40" stroke="var(--text)" strokeWidth="1.5" /><rect x="170" y="28" width="20" height="14" fill="var(--yellow)" stroke="var(--text)" /><text x="196" y="40" className="svg-label">test post</text>
          </>}
          {(sys === 'iccp' ? [[470, 130, 352, 130], [470, 150, 300, 144]] : [[110, 158, 90, 142], [250, 158, 300, 142]]).map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arr-accent)" />)}
          <text x="20" y="80" className="svg-label" style={{ fill: 'var(--accent)' }}>protective current flows through the soil onto the pipe at coating defects</text>
        </svg>
        <Stats>
          <Stat label="Pipe surface area" text={`${c.area.toLocaleString('en-US', { maximumFractionDigits: 0 })} m²`} />
          <Stat label="Current density (bare)" text={`${dens} mA/m²`} />
          <Stat label="Current demand" text={`${I < 10 ? I.toFixed(2) : I.toFixed(0)} A`} tone="brand" />
          {sys === 'mg' ? <>
            <Stat label="Output of one anode" text={`${(out1 * 1000).toFixed(0)} mA`} />
            <Stat label="Anodes needed" text={n.toLocaleString('en-US')} tone={n > 300 ? 'bad' : undefined} />
            <Stat label="Anode mass for life" text={`${mass.toFixed(0)} kg`} />
          </> : <Stat label="Rectifier output (with 50 % spare)" text={`${(I * 1.5).toFixed(I < 10 ? 1 : 0)} A`} />}
        </Stats>
        {sys === 'mg' ? (n > 300 ? <Verdict tone="bad">{n.toLocaleString('en-US')} anodes is impractical. Use impressed current, or improve the coating.</Verdict> : rho > 100 ? <Verdict tone="warn">High-resistivity soil limits each anode to a few milliamps. Sacrificial anodes suit low-resistivity soil and well-coated pipe.</Verdict> : <Verdict tone="ok">A sacrificial system is practical: about one anode every {(L * 1000 / n).toFixed(0)} m, with no power supply needed.</Verdict>)
          : I > 60 ? <Verdict tone="warn">A large current demand. Several rectifier stations spaced along the line are needed, since one cannot protect the whole length.</Verdict>
          : <Verdict tone="ok">A modest demand, typical of a well-coated pipeline. One or two rectifier stations with ground beds would normally serve this length.</Verdict>}
        <label className="fld block">
          <span className="fld-label"><span>Check a measured pipe-to-soil potential (instant-off, vs Cu/CuSO₄)</span><span className="fld-val">{pot} mV</span></span>
          <input type="range" min={-1500} max={-400} step={10} value={pot} onChange={(e) => setPot(Number(e.target.value))} />
        </label>
        <Verdict tone={ptone}>{ptone === 'bad' ? 'Less negative than −850 mV: the steel is under-protected and can corrode.' : ptone === 'warn' ? 'More negative than about −1200 mV: over-protection. Hydrogen evolution can disbond coating and embrittle high-strength steel.' : 'Between −850 and −1200 mV: protected.'}</Verdict>
      </View>
    </Frame>
  );
}
