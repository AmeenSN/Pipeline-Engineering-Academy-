import { useState } from 'react';

type Pipe = 'none' | 'joints' | 'string' | 'in' | 'buried';
interface Stage { id: string; name: string; trench: boolean; pipe: Pipe; machine: string; what: string; acts: string[]; kit: string[]; qc: string[]; issues: string[] }

export const STAGES: Stage[] = [
  { id: 'survey', name: 'Survey and staking', trench: false, pipe: 'none', machine: 'Survey crew', what: 'The centreline, right-of-way boundaries and every existing buried service are set out on the ground.',
    acts: ['Stake centreline, ROW limits and bend points', 'Locate and mark existing pipelines and cables', 'Record pre-construction condition (photos, levels)'], kit: ['GNSS and total station', 'Pipe and cable locators'], qc: ['Stake-out checked against alignment sheets', 'Existing services exposed by hand and surveyed'], issues: ['Unrecorded buried services', 'Stakes lost to grading or wind'] },
  { id: 'clear', name: 'ROW clearing and grading', trench: false, pipe: 'none', machine: 'Dozer / grader', what: 'The working strip is cleared and levelled so the spread can travel and work safely.',
    acts: ['Clear vegetation and obstacles, fence where needed', 'Strip and store topsoil in farmland', 'Grade the working surface; cut benches on side slopes', 'Build access roads and temporary crossings'], kit: ['Dozers, graders, excavators', 'Water tankers for dust'], qc: ['ROW width within permit', 'Protection ramps over existing pipelines'], issues: ['Working outside the ROW', 'Blocking drainage or access', 'Damage to existing lines by heavy traffic'] },
  { id: 'string', name: 'Stringing', trench: false, pipe: 'joints', machine: 'Pipe trailer + sideboom', what: 'Pipe joints are hauled from the stockpile and laid out end to end along the ROW.',
    acts: ['Haul pipe by the planned sequence of wall thickness and coating', 'Set joints on padded skids, offset from the trench line', 'Leave gaps for crossings and access'], kit: ['Stringing trailers', 'Sidebooms or vacuum lifters', 'Padded slings and skids'], qc: ['Pipe number, heat number, wall and grade recorded by location', 'Coating and bevel inspected on receipt', 'End caps kept on'], issues: ['Wrong wall thickness strung in a heavy-wall section', 'Coating and bevel damage from handling', 'Debris or animals inside pipe'] },
  { id: 'bend', name: 'Field bending', trench: false, pipe: 'joints', machine: 'Bending machine', what: 'Joints are cold bent to fit the surveyed horizontal and vertical changes of direction.',
    acts: ['Bending engineer measures angles from the graded ROW or trench', 'Bend each joint in small pulls, with a mandrel for thin wall', 'Mark angle, direction and top of pipe'], kit: ['Hydraulic bending machine with correct die', 'Internal mandrel'], qc: ['Bend per diameter within the limit', 'Ovality and wrinkles checked; gauging plate passed', 'Seam near the neutral axis', 'Coating holiday-tested after bending'], issues: ['Wrinkles on thin-wall pipe', 'Short tangents', 'Bends installed reversed'] },
  { id: 'weld', name: 'Line-up and welding', trench: false, pipe: 'string', machine: 'Welding shacks', what: 'Joints are aligned, clamped and welded into a continuous string beside the trench.',
    acts: ['Clean and inspect bevels; swab the pipe', 'Align with an internal line-up clamp', 'Front end makes root and hot pass; back end adds fill and cap passes', 'Number every weld'], kit: ['Internal and external clamps', 'Welding machines or automatic welding bugs', 'Shelters, preheat torches or induction coils'], qc: ['Qualified welding procedure and welders', 'Hi-lo, gap, preheat and interpass temperature', 'Consumable control and storage', 'Weld numbers tied to pipe numbers'], issues: ['Root defects from poor fit-up', 'Hydrogen cracking: wrong preheat or wet electrodes', 'Arc strikes on the pipe body'] },
  { id: 'ndt', name: 'NDT and repair', trench: false, pipe: 'string', machine: 'RT / AUT truck', what: 'Every girth weld is inspected, and rejected welds are repaired or cut out.',
    acts: ['Visual inspection of each weld', 'Radiography or automated ultrasonic testing', 'Mark, excavate and re-weld defects, then re-inspect'], kit: ['X-ray crawler or gamma source, film or digital detectors', 'AUT scanner and calibration blocks'], qc: ['Acceptance to API 1104 or the project criteria', 'Repair rate tracked per welder', 'Radiation safety barriers'], issues: ['Lack of fusion, porosity, slag, cracks', 'Repeated repairs at one location', 'Film or scan traceability errors'] },
  { id: 'fjc', name: 'Field joint coating', trench: false, pipe: 'string', machine: 'Blast + coating crew', what: 'The bare steel at each girth weld is cleaned and coated to match the factory coating.',
    acts: ['Abrasive blast the cutback to the specified cleanliness and profile', 'Preheat and apply shrink sleeve, liquid epoxy or FBE', 'Inspect and holiday-test'], kit: ['Blast pots and compressors', 'Induction heaters or torches', 'Holiday detector'], qc: ['Surface profile, salt and dust checks', 'Preheat temperature', 'Thickness, adhesion (peel test) and holiday test'], issues: ['Poor adhesion from damp or dirty steel', 'Sleeves not fully shrunk at edges', 'Blast damage to factory coating'] },
  { id: 'trench', name: 'Trenching', trench: true, pipe: 'string', machine: 'Excavator / trencher', what: 'The trench is excavated to line, depth and width, with spoil placed on the non-working side.',
    acts: ['Excavate to the designed profile', 'Hand-dig near existing services', 'Grade the bottom and place bedding in rock'], kit: ['Excavators, trenchers, rock breakers', 'Dewatering pumps in wet ground'], qc: ['Depth, width and profile surveyed', 'Bottom free of rocks and debris', 'Slopes or shoring where workers enter'], issues: ['Hard points in the trench bottom', 'Trench opened too far ahead and collapsing', 'Strikes on unmarked services'] },
  { id: 'lower', name: 'Lowering-in', trench: true, pipe: 'in', machine: 'Sidebooms', what: 'A row of sidebooms lifts the welded string off its skids and lays it into the trench.',
    acts: ['Holiday-test the full circumference as the pipe passes', 'Lift with several sidebooms on rolling cradles', 'Lower smoothly onto the trench bottom', 'Repair any coating damage at once'], kit: ['Sidebooms with roller cradles', 'Holiday detector ahead of the first cradle', 'Trench padding where needed'], qc: ['Lifting plan: number and spacing of sidebooms for the pipe stress', 'No holidays left unrepaired', 'Pipe bearing on the bottom with slack for temperature'], issues: ['Overstress or buckling from too few lifting points', 'Coating scraped on trench walls', 'Pipe floating if the trench floods'] },
  { id: 'backfill', name: 'Padding and backfill', trench: true, pipe: 'buried', machine: 'Padding machine', what: 'Fine padding is placed round the pipe, then the trench is filled and crowned.',
    acts: ['Place padding to 300 mm over the pipe', 'Lay warning tape and fibre-optic duct', 'Backfill, compacting where specified', 'Install trench breakers on slopes'], kit: ['Padding machine or screening bucket', 'Dozers and excavators', 'Compactors at roads'], qc: ['Padding grading and thickness', 'Cover surveyed before and after backfill', 'As-laid pipe position surveyed before it is covered'], issues: ['Rocks in the padding', 'Voids under the pipe haunches', 'Insufficient cover after settlement'] },
  { id: 'tiein', name: 'Tie-ins and crossings', trench: true, pipe: 'in', machine: 'Tie-in crew', what: 'Separate strings, crossing sections and valve assemblies are joined by welds made in the trench.',
    acts: ['Install road, pipeline and wadi crossings as separate sections', 'Cut to length and weld tie-ins in bell holes', 'Inspect, coat and backfill each tie-in'], kit: ['External clamps, sidebooms', 'Trench shoring or sloping for welders'], qc: ['Tie-in temperature recorded', '100 % NDT, often by two methods', 'No forcing of pipe into alignment'], issues: ['Residual stress from pulling pipe together', 'Welds made at night at low temperature on a hot line', 'Unsafe bell holes'] },
  { id: 'test', name: 'Cleaning, gauging and hydrotest', trench: false, pipe: 'buried', machine: 'Test pumps + pigs', what: 'The line is cleaned and gauged with pigs, filled with water and pressure tested.',
    acts: ['Run cleaning and gauging pigs', 'Fill with treated water behind a pig', 'Pressurise in stages and hold', 'Depressurise and dewater'], kit: ['Temporary pig traps and test heads', 'Fill and pressure pumps', 'Calibrated recorders and deadweight tester'], qc: ['Gauge plate undamaged', 'Test pressure at high and low points', 'Pressure and temperature records accepted'], issues: ['Air left in the line', 'Unexplained pressure drop', 'Dented gauge plate from a buckle or debris'] },
  { id: 'reinstate', name: 'Reinstatement and markers', trench: false, pipe: 'buried', machine: 'Grader', what: 'The ROW is restored and the permanent markers, test posts and fences are installed.',
    acts: ['Regrade to original contours; replace topsoil', 'Restore drainage, roads, fences and wadi banks', 'Stabilise sand and slopes', 'Install markers and CP test posts'], kit: ['Graders, dozers', 'Erosion control materials'], qc: ['Landowner or authority sign-off', 'Final cover survey', 'Marker locations as per drawings'], issues: ['Trench settlement after rain', 'Erosion on slopes', 'Construction debris left behind'] },
  { id: 'commission', name: 'Drying, commissioning and handover', trench: false, pipe: 'buried', machine: 'Commissioning team', what: 'The line is dried, filled with product, started up and handed to operations with its records.',
    acts: ['Dry to the specified dew point; purge with nitrogen for gas', 'Commission CP, valves, instruments and SCADA', 'Introduce product and pressurise', 'Run baseline in-line inspection', 'Compile and hand over as-built records'], kit: ['Dry air or vacuum drying spread', 'Nitrogen units'], qc: ['Dew point achieved and held', 'Pre-startup safety review', 'As-built data book complete'], issues: ['Residual water causing hydrates or corrosion', 'Punch-list items left open', 'Incomplete traceability records'] },
];

const SHORT = ['Survey', 'Grading', 'Stringing', 'Bending', 'Welding', 'NDT', 'Joint coat', 'Trenching', 'Lowering', 'Backfill', 'Tie-ins', 'Hydrotest', 'Reinstate', 'Handover'];

function Zone({ s, x, w, on, onClick, n }: { s: Stage; x: number; w: number; on: boolean; onClick: () => void; n: number }) {
  const gy = 70, cx = x + w / 2;
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} role="button" aria-label={s.name}>
      <rect x={x} y="0" width={w} height="140" fill={on ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent'} stroke={on ? 'var(--accent)' : 'var(--line)'} />
      <rect x={x} y={gy} width={w} height={140 - gy} fill="var(--yellow)" opacity=".1" />
      <line x1={x} x2={x + w} y1={gy} y2={gy} stroke="var(--text)" strokeWidth="1.2" />
      {s.trench && <path d={`M${cx - 16} ${gy}l5 34h22l5 -34z`} fill="var(--bg)" stroke="var(--text)" />}
      {s.trench && <path d={`M${cx - 44} ${gy}l11 -16l11 16z`} fill="var(--yellow)" opacity=".55" stroke="var(--text)" />}
      {s.pipe === 'joints' && [0, 1].map((i) => <rect key={i} x={x + 6 + i * (w / 2 - 2)} y={gy - 10} width={w / 2 - 12} height="6" rx="3" fill="var(--steel)" stroke="var(--text)" strokeWidth=".6" />)}
      {s.pipe === 'string' && <rect x={x} y={gy - 12} width={w} height="6" fill="var(--steel)" stroke="var(--text)" strokeWidth=".6" transform={s.trench ? `translate(${Math.min(22, w / 3)} 0)` : undefined} />}
      {s.pipe === 'in' && <circle cx={cx} cy={gy + 26} r="6" fill="var(--steel)" stroke="var(--text)" />}
      {s.pipe === 'buried' && <g><rect x={x} y={gy + 22} width={w} height="7" fill="var(--accent)" opacity=".85" /><path d={`M${x} ${gy}q${w / 2} -7 ${w} 0`} fill="var(--yellow)" opacity=".5" /></g>}
      <rect x={cx - 15} y={gy - 36} width="30" height="16" rx="3" fill={on ? 'var(--accent)' : 'var(--brand)'} opacity=".9" />
      <text x={cx} y={gy - 24} textAnchor="middle" style={{ fontSize: 10, fill: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{n}</text>
      <text x={cx} y="130" textAnchor="middle" className="svg-label" style={{ fontSize: 9 }}>{SHORT[n - 1]}</text>
    </g>
  );
}

/** The pipeline spread as a clickable assembly line. `only` limits the stages shown (by id). */
export default function ConstructionSpread({ only }: { only?: string[] }) {
  const list = only ? STAGES.filter((s) => only.includes(s.id)) : STAGES;
  const [id, setId] = useState(list[0].id);
  const s = list.find((x) => x.id === id) ?? list[0];
  const W = 980, w = W / list.length;
  const Col = ({ t, items, c }: { t: string; items: string[]; c: string }) => (
    <div>
      <div className="num" style={{ color: c, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>{t}</div>
      <ul style={{ marginTop: '.4rem', display: 'grid', gap: '.3rem', fontSize: '.88rem', paddingLeft: '1rem', listStyle: 'disc' }}>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
  return (
    <section className="ix not-prose" aria-label="Pipeline construction spread">
      <div className="ix-head"><div className="ix-title">{only ? 'Construction stages in detail' : 'The pipeline spread, start to finish'}</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${W} 140`} style={{ width: '100%', minWidth: list.length > 6 ? 760 : 0, background: 'var(--bg)', borderRadius: 10 }}>
            {list.map((st, i) => <Zone key={st.id} s={st} x={i * w} w={w} n={STAGES.indexOf(st) + 1} on={st.id === s.id} onClick={() => setId(st.id)} />)}
          </svg>
        </div>
        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Work advances from left to right along the right of way. Click a stage.</div>
        <div>
          <div className="eyebrow">Stage {STAGES.indexOf(s) + 1} of {STAGES.length} · {s.machine}</div>
          <h4 style={{ fontSize: '1.3rem', fontWeight: 650, marginTop: '.3rem' }}>{s.name}</h4>
          <p style={{ color: 'var(--muted)', marginTop: '.3rem' }}>{s.what}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Col t="Activities" items={s.acts} c="var(--brand)" />
          <Col t="Equipment" items={s.kit} c="var(--steel)" />
          <Col t="Quality checks and hold points" items={s.qc} c="var(--ok)" />
          <Col t="Typical problems" items={s.issues} c="var(--bad)" />
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setId(list[Math.max(list.indexOf(s) - 1, 0)].id)}>← Previous stage</button>
          <button type="button" className="btn btn-primary" onClick={() => setId(list[Math.min(list.indexOf(s) + 1, list.length - 1)].id)}>Next stage →</button>
        </div>
      </div>
      <div className="ix-foot">Stage order varies between projects: trenching may come before or after welding, and several stages overlap along the line. Sketches are schematic.</div>
    </section>
  );
}
