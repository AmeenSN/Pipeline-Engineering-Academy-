import { useState } from 'react';

const TERMS: [string, string][] = [
  ['Alignment sheet', 'The master construction drawing of a pipeline section: plan view, ground and pipe profile, and bands of data such as wall thickness, coating and crossings.'],
  ['Anchor block', 'A concrete block cast around an anchor flange to resist the thermal and pressure force of a restrained pipeline.'],
  ['As-built', 'The record of what was actually constructed, including surveyed pipe position, weld numbers and material traceability.'],
  ['AUT', 'Automated ultrasonic testing: mechanised inspection of girth welds, common on large projects.'],
  ['Backfill', 'Material returned to the trench after the pipe is lowered in.'],
  ['Barlow formula', 'The thin-wall relation between pressure, diameter, wall thickness and hoop stress.'],
  ['Barred tee', 'A tee with guide bars across the branch opening so pigs cannot enter or lodge in it.'],
  ['Block valve', 'A mainline valve used to isolate a section. Also called a sectionalizing valve.'],
  ['Cathodic protection (CP)', 'Making the pipeline the cathode of an electrochemical cell so that corrosion occurs on anodes instead.'],
  ['Class location', 'ASME B31.8 classification of an area by building density, which sets the gas pipeline design factor.'],
  ['Cold bend', 'A bend made in the field at ambient temperature with a bending machine.'],
  ['Corrosion allowance', 'Extra wall thickness provided for expected metal loss over the design life.'],
  ['CPM', 'Computational pipeline monitoring: software leak detection using flow, pressure and temperature measurements.'],
  ['Cover', 'The depth of soil from the top of the pipe to the finished ground surface.'],
  ['CRA', 'Corrosion-resistant alloy, such as duplex stainless steel or nickel alloy.'],
  ['Design factor', 'The fraction of SMYS allowed as hoop stress, for example 0.72.'],
  ['DWTT', 'Drop-weight tear test: checks that line pipe steel fractures in a ductile manner.'],
  ['Elastic bend', 'A gentle curve the pipe follows without being permanently bent.'],
  ['ERW / HFW', 'Electric resistance or high-frequency welded pipe, made from coil with a straight seam and no filler.'],
  ['FBE', 'Fusion-bonded epoxy: a thin thermoset powder coating applied to heated pipe.'],
  ['Field joint coating', 'Coating applied on site over each girth weld area.'],
  ['Free span', 'A length of pipe without support beneath it.'],
  ['Geohazard', 'A ground-related threat such as a landslide, fault, scour or dune migration.'],
  ['Girth weld', 'The circumferential weld joining two pipes.'],
  ['HDD', 'Horizontal directional drilling: a steerable trenchless method for long crossings.'],
  ['Holiday', 'A defect or gap in a coating that exposes steel.'],
  ['Hoop stress', 'Circumferential stress in the pipe wall caused by internal pressure.'],
  ['Hot tap', 'Making a branch connection to a pipeline while it remains in service.'],
  ['Hydrotest', 'Pressure test with water to prove strength and leak tightness.'],
  ['ILI', 'In-line inspection: an intelligent pig that measures wall loss, cracks or geometry.'],
  ['Induction bend', 'A factory bend made by heating a narrow band of pipe with an induction coil.'],
  ['Isolation joint', 'A fitting that electrically separates the cathodically protected pipeline from other piping.'],
  ['KP', 'Kilometre point: distance along the pipeline from its origin.'],
  ['Launcher / receiver', 'Scraper traps used to insert and remove pigs.'],
  ['Line pack', 'Gas stored in a pipeline by operating above the minimum pressure.'],
  ['Lowering-in', 'Placing the welded pipe string into the trench with sidebooms.'],
  ['LSAW', 'Longitudinal submerged-arc welded pipe made from plate.'],
  ['MAOP / MOP', 'Maximum (allowable) operating pressure of the pipeline system.'],
  ['MFL', 'Magnetic flux leakage: the most common in-line inspection technology for metal loss.'],
  ['NDT', 'Non-destructive testing, such as radiography and ultrasonics.'],
  ['Overbend / sag bend', 'Vertical bends over a crest or through a dip.'],
  ['Padding', 'Fine, stone-free material placed around the pipe to protect the coating.'],
  ['PDI', 'Population density index: Saudi Aramco measure of population near a pipeline, used to set location class.'],
  ['Pig', 'A device driven through the pipeline by the flow to clean, gauge, separate or inspect.'],
  ['PIR', 'Potential impact radius: the distance within which a gas pipeline rupture could cause serious harm.'],
  ['RER', 'Rupture exposure radius: Saudi Aramco term for the hazard distance from a pipeline rupture.'],
  ['Right of way (ROW)', 'The strip of land in which the pipeline is built and operated.'],
  ['Sabkha', 'Flat, saline, often waterlogged ground found in coastal and inland Arabia. Corrosive and weak.'],
  ['SCADA', 'Supervisory control and data acquisition: the remote monitoring and control system.'],
  ['Scraper', 'Another word for a pig, used in Saudi Aramco and elsewhere.'],
  ['Sideboom', 'A tracked pipelayer with a side-mounted boom used to lift and lower pipe.'],
  ['SMYS', 'Specified minimum yield strength of the pipe grade.'],
  ['Sour service', 'Service with enough wet hydrogen sulphide to require cracking-resistant materials.'],
  ['Spread', 'The complete set of crews and equipment building a pipeline section.'],
  ['SSAW / HSAW', 'Spiral (helical) submerged-arc welded pipe made from coil.'],
  ['Stringing', 'Laying pipe joints along the right of way ready for welding.'],
  ['Surge', 'A pressure wave caused by a rapid change in flow velocity. Also called water hammer.'],
  ['Tie-in', 'A weld joining two completed sections, or the pipeline to a facility.'],
  ['3LPE', 'Three-layer polyethylene coating: epoxy primer, adhesive and polyethylene outer layer.'],
  ['Upheaval buckling', 'Upward buckling of a buried pipeline under thermal and pressure compression.'],
  ['Wadi', 'A normally dry valley or watercourse that carries flash floods after rain.'],
];

export default function Glossary() {
  const [q, setQ] = useState('');
  const list = TERMS.filter(([t, d]) => (t + ' ' + d).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <section className="ix not-prose" aria-label="Glossary">
      <div className="ix-head"><div className="ix-title">Pipeline glossary</div><span className="ix-tag">{list.length} terms</span></div>
      <div style={{ padding: '1.1rem' }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter terms, for example: pig, coating, bend" aria-label="Filter glossary"
          style={{ width: '100%', padding: '.6rem .8rem', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }} />
        <dl style={{ marginTop: '1rem', display: 'grid', gap: '.1rem' }}>
          {list.map(([t, d]) => (
            <div key={t} className="grid sm:grid-cols-[13rem_1fr]" style={{ gap: '.1rem 1rem', padding: '.6rem 0', borderBottom: '1px solid var(--line)' }}>
              <dt style={{ fontWeight: 650 }}>{t}</dt><dd style={{ color: 'var(--muted)', fontSize: '.94rem' }}>{d}</dd>
            </div>
          ))}
          {list.length === 0 && <p style={{ color: 'var(--muted)' }}>No terms match.</p>}
        </dl>
      </div>
    </section>
  );
}
