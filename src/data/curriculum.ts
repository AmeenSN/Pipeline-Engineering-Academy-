export interface LessonRef { slug: string; title: string }
export interface Module { id: string; code: string; title: string; blurb: string; icon: string; live?: boolean; tools?: number; lessons: LessonRef[] }

const L = (title: string, slug = ''): LessonRef => ({ slug, title });

export const MODULES: Module[] = [
  { id: 'foundations', code: 'M0', icon: 'M3 12h18M12 3v18', title: 'Foundations', blurb: 'Pipeline systems, the code landscape, hydraulics basics and the vocabulary of the trade.',
    lessons: [L('Pipeline systems overview'), L('Codes and standards map'), L('Hydraulics, MAOP and surge'), L('Glossary')] },
  { id: 'materials', code: 'M1', icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 110 10 5 5 0 010-10z', title: 'Line pipe materials & manufacturing', blurb: 'API 5L grades, seamless, ERW, LSAW and SSAW mills, sour service, CRA and non-metallic pipe.',
    live: true, tools: 7,
    lessons: [L('Carbon steel grades (API 5L)', 'carbon-steel-grades'), L('Pipe manufacturing methods', 'pipe-manufacturing'), L('CRA, clad and non-metallic pipe', 'cra-clad-nonmetallic'), L('Fittings, flanges and valves', 'fittings-flanges-valves')] },
  { id: 'mechanical-design', code: 'M2', icon: 'M4 18L10 8l4 6 6-10', live: true, tools: 9, title: 'Mechanical design', blurb: 'From wall thickness to upheaval buckling: the calculations that size and qualify a pipeline.',
    lessons: [
      L('Wall thickness calculation', 'wall-thickness'), L('Hoop, longitudinal and combined stress', 'pipe-stresses'),
      L('Thermal expansion and anchor forces', 'thermal-expansion-anchors'), L('External loads and buoyancy', 'external-loads-buoyancy'),
      L('Upheaval buckling', 'upheaval-buckling'), L('Lateral buckling and free spans', 'lateral-buckling-free-spans'),
      L('Fatigue, D/t and collapse checks', 'fatigue-dt-collapse'),
    ] },
  { id: 'route-surveys', code: 'M3', icon: 'M4 19c4-10 6 2 9-6s4-6 7-8', title: 'Route selection & surveys', blurb: 'Choosing a corridor, topographic and geotechnical surveys, alignment sheets and right of way.',
    lessons: [L('Route selection criteria'), L('Topographic and geotechnical surveys'), L('Alignment sheets and profiles'), L('Right of way')] },
  { id: 'safety-risk', code: 'M4', icon: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z', title: 'Safety & risk', blurb: 'Population density index, location classes, risk assessment and integrity management.',
    lessons: [L('PDI study and location classes'), L('Risk assessment and QRA'), L('Integrity management')] },
  { id: 'bends', code: 'M5', icon: 'M4 18h6a8 8 0 008-8V4', title: 'Bends & pipe geometry', blurb: 'Elastic bends, cold field bends, hot induction bends and miters, and when to use each.',
    live: true, tools: 5,
    lessons: [L('Elastic bends', 'elastic-bends'), L('Cold field bends', 'cold-field-bends'), L('Hot induction bends', 'hot-induction-bends'), L('Miters and segmental bends', 'miters-segmental-bends')] },
  { id: 'crossings', code: 'M6', icon: 'M3 9h18M3 15h18M9 3v18', title: 'Crossings & special terrain', blurb: 'Road, rail and wadi crossings, trenchless methods, and rocky, sandy and sabkha ground.',
    lessons: [L('Road and railroad crossings'), L('Trenchless crossings (HDD, boring, microtunnel)'), L('Wadi and water crossings'), L('Rocky, sandy and sabkha terrain'), L('Foreign pipeline and utility crossings'), L('Fault and seismic crossings')] },
  { id: 'trench', code: 'M7', icon: 'M3 6h5l2 12h4l2-12h5', title: 'Trench design & burial', blurb: 'Trench geometry, depth of cover, padding, backfill, buoyancy control and markers.',
    lessons: [L('Trench dimensions and cover'), L('Padding, backfill and rock shield'), L('Buoyancy control'), L('Markers and warning systems')] },
  { id: 'construction', code: 'M8', icon: 'M3 17h18M6 17V9l6-4 6 4v8', title: 'Construction', blurb: 'The pipeline spread stage by stage, from ROW clearing to commissioning, with quality hold points.',
    lessons: [L('The construction spread'), L('ROW preparation and stringing'), L('Welding and NDT'), L('Field joint coating and lowering-in'), L('Tie-ins and reinstatement'), L('As-builts and handover')] },
  { id: 'corrosion', code: 'M9', icon: 'M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z', title: 'Coatings & corrosion control', blurb: 'Corrosion mechanisms, 3LPE and FBE coatings, cathodic protection and interference.',
    lessons: [L('Corrosion mechanisms'), L('External pipeline coatings'), L('Cathodic protection'), L('Internal corrosion control'), L('AC/DC interference')] },
  { id: 'testing', code: 'M10', icon: 'M5 19a8 8 0 1114 0M12 13l4-4', title: 'Testing & commissioning', blurb: 'Hydrostatic test design, pressure-volume plots, dewatering, drying and start-up.',
    lessons: [L('Hydrostatic testing'), L('Dewatering, drying and purging')] },
  { id: 'operations', code: 'M11', icon: 'M3 12h4l2-5 4 10 2-5h6', title: 'Operations & integrity', blurb: 'Pigging and scraper traps, sectionalizing valves, leak detection and defect assessment.',
    lessons: [L('Pigging and scraper traps'), L('Sectionalizing valves'), L('Leak detection methods'), L('Defect assessment and repair'), L('SCADA basics')] },
  { id: 'aboveground-offshore', code: 'M12', icon: 'M3 16c3-3 6 3 9 0s6 3 9 0M6 12V6h12v6', title: 'Above-ground & offshore', blurb: 'Supports and expansion loops for above-ground lines, and an introduction to subsea pipelines.',
    lessons: [L('Above-ground pipelines'), L('Offshore pipeline design'), L('Offshore installation methods')] },
];

export const liveModules = MODULES.filter((m) => m.live);
export const lessonCount = MODULES.reduce((n, m) => n + m.lessons.length, 0);
export const liveLessonCount = MODULES.reduce((n, m) => n + m.lessons.filter((l) => l.slug).length, 0);
export const toolCount = MODULES.reduce((n, m) => n + (m.tools ?? 0), 0);
export const moduleById = (id: string) => MODULES.find((m) => m.id === id)!;
