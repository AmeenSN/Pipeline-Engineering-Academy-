import { useState } from 'react';
import { Segmented } from './kit';

interface Layer { name: string; h: number; fill: string; pattern?: boolean }
interface Type { id: string; label: string; title: string; layers: Layer[]; p: string; t: string; pro: string; con: string; use: string }

const TYPES: Type[] = [
  { id: 'cs', label: 'Carbon steel', title: 'Carbon steel with corrosion allowance',
    layers: [{ name: 'External coating (3LPE / FBE)', h: 8, fill: 'var(--ok)' }, { name: 'Carbon steel: pressure wall', h: 60, fill: 'var(--steel)', pattern: true }, { name: 'Corrosion allowance (sacrificial)', h: 16, fill: 'var(--accent)' }],
    p: 'Any', t: 'Up to about 230 °C', pro: 'Lowest capital cost, simple welding, every size available.', con: 'Depends on inhibition, monitoring and pigging for its whole life.', use: 'The default for most oil, gas and water pipelines.' },
  { id: 'clad', label: 'Clad', title: 'Metallurgically clad pipe',
    layers: [{ name: 'External coating', h: 8, fill: 'var(--ok)' }, { name: 'Carbon steel backing: carries pressure', h: 62, fill: 'var(--steel)', pattern: true }, { name: 'CRA layer, about 3 mm (316L, Alloy 825 or 625), bonded', h: 12, fill: 'var(--yellow)' }],
    p: 'Any', t: 'As carbon steel', pro: 'CRA corrosion resistance at a fraction of solid-alloy cost. The bond is permanent.', con: 'Expensive, long lead time, girth welds need CRA consumables and careful fit-up.', use: 'Highly corrosive sour gas and wet CO₂ service.' },
  { id: 'lined', label: 'Lined', title: 'Mechanically lined pipe',
    layers: [{ name: 'External coating', h: 8, fill: 'var(--ok)' }, { name: 'Carbon steel outer pipe', h: 62, fill: 'var(--steel)', pattern: true }, { name: 'CRA liner, expanded tight but not bonded', h: 10, fill: 'var(--yellow)' }, { name: '', h: 2, fill: 'var(--bg)' }],
    p: 'Any', t: 'As carbon steel', pro: 'Cheaper than clad pipe for the same alloy.', con: 'Liner can wrinkle under bending or collapse if gas gets behind it. Not suited to reeling without controls.', use: 'Corrosive service with limited bending strain.' },
  { id: 'solid', label: 'Solid CRA', title: 'Solid corrosion-resistant alloy',
    layers: [{ name: '13Cr, 22Cr duplex or 25Cr super duplex: full wall', h: 76, fill: 'var(--yellow)', pattern: true }],
    p: 'Any', t: 'Duplex: about 150 °C limit in chloride service', pro: 'No inhibition needed. High strength allows thin walls.', con: 'Highest material cost. Duplex needs strict welding control and external protection against chloride cracking.', use: 'Flowlines, manifolds and short, critical sections.' },
  { id: 'rtp', label: 'RTP', title: 'Reinforced thermoplastic pipe (RTP / TCP)',
    layers: [{ name: 'Outer thermoplastic jacket', h: 14, fill: 'var(--text)' }, { name: 'Reinforcement: aramid, glass or steel tapes', h: 26, fill: 'var(--brand)', pattern: true }, { name: 'Inner thermoplastic liner (HDPE, PE-RT, PA)', h: 22, fill: 'var(--muted)' }],
    p: 'Typically up to 100 to 150 bar', t: 'About 65 to 110 °C by liner material', pro: 'No corrosion. Spooled in long lengths, so installation is fast with few joints.', con: 'Limited diameter (about NPS 8), temperature and gas permeation limits. Connectors are metallic.', use: 'Flowlines, water injection lines, rehabilitation.' },
  { id: 'gre', label: 'GRE / RTR', title: 'Glass-reinforced epoxy (GRE / RTR)',
    layers: [{ name: 'Resin-rich outer layer (UV protection)', h: 6, fill: 'var(--text)' }, { name: 'Filament-wound glass fibre in epoxy', h: 60, fill: 'var(--ok)', pattern: true }, { name: 'Resin-rich inner liner', h: 8, fill: 'var(--muted)' }],
    p: 'Up to about 100 bar in small sizes, lower as diameter grows', t: 'Up to about 95 °C', pro: 'Immune to CO₂, brine and soil corrosion. Light. No cathodic protection.', con: 'Brittle under impact and point loads. Needs careful bedding, jointing and thrust restraint.', use: 'Water injection, produced water, firewater, low-pressure oil.' },
];

export default function PipeWallTypes() {
  const [id, setId] = useState('cs');
  const t = TYPES.find((x) => x.id === id)!;
  let yy = 20;
  return (
    <section className="ix not-prose" aria-label="Pipe wall constructions">
      <div className="ix-head"><div className="ix-title">Inside the pipe wall</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1rem' }}>
        <Segmented value={id} onChange={setId} options={TYPES.map((x) => ({ value: x.id, label: x.label }))} />
        <div className="grid md:grid-cols-2 gap-4">
          <svg viewBox="0 0 400 190" role="img" aria-label={`Layers of ${t.title}`} style={{ width: '100%', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <defs><pattern id="hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--surface)" strokeWidth="1.2" opacity=".45" /></pattern></defs>
            <text x="14" y="14" className="svg-label">outside (soil)</text>
            {t.layers.map((l, i) => {
              const y = yy; yy += l.h * 1.5;
              return (
                <g key={i}>
                  <rect x="14" y={y} width="130" height={l.h * 1.5} fill={l.fill} />
                  {l.pattern && <rect x="14" y={y} width="130" height={l.h * 1.5} fill="url(#hatch2)" />}
                  {l.name && <><line x1="144" x2="160" y1={y + l.h * 0.75} y2={y + l.h * 0.75} stroke="var(--muted)" />
                    <foreignObject x="164" y={y + l.h * 0.75 - 16} width="228" height="40"><div style={{ fontSize: 11, lineHeight: 1.25, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{l.name}</div></foreignObject></>}
                </g>
              );
            })}
            <text x="14" y={Math.min(yy + 14, 184)} className="svg-label">inside (fluid)</text>
          </svg>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 650 }}>{t.title}</h4>
            <dl style={{ display: 'grid', gap: '.55rem', marginTop: '.7rem', fontSize: '.9rem' }}>
              {[['Pressure', t.p], ['Temperature', t.t], ['Strengths', t.pro], ['Watch out for', t.con], ['Typical use', t.use]].map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '6.5rem 1fr', gap: '.6rem' }}>
                  <dt className="num" style={{ color: 'var(--muted)', fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.06em', paddingTop: '.15rem' }}>{k}</dt><dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div className="ix-foot">Layer thicknesses are not to scale. Pressure and temperature limits are typical; each product is qualified individually by its manufacturer.</div>
    </section>
  );
}
