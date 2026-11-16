# Pipeline Engineering Academy: project plan

## Goal
A free, one-stop learning site for new and experienced pipeline engineers. Main focus is onshore buried pipelines, with above-ground and offshore modules. Every topic combines a written explanation, an interactive graphic, a calculator where numbers are involved, a standards comparison box, a worked example and a quiz.

## Decisions (agreed with the owner)
| Topic | Decision |
|---|---|
| Language | English only |
| Saudi Aramco standards | Written from general knowledge of the SAES series (L-410, L-440, L-450, L-460, B-064). Flagged for verification against current revisions. No standard text is reproduced. |
| Accounts | None. Progress is saved in the browser. |
| Hosting | Netlify, custom domain later |
| Branding | Original identity designed for the site |
| Build order | Module M2 (Mechanical design) built fully first, reviewed, then the rest |

## Tech stack
- Astro 5 + MDX for content, React for interactive components
- Tailwind CSS 4 plus a small custom design system (`src/styles/global.css`), dark and light themes
- Hand-built SVG diagrams, KaTeX equations, Pagefind search
- Engineering maths in `src/lib/eng/`, unit-tested with Vitest (`npm test`)
- SI / US unit switch shared by every calculator (`src/lib/units.ts`)

## Structure
```
src/
  content/lessons/<module>/<lesson>.mdx   lesson text
  components/interactives/                one component per interactive tool
  components/ui/                          callouts, standards box, worked example, quiz
  lib/eng/                                tested engineering functions
  data/curriculum.ts                      all modules and lessons (drives navigation)
  layouts/, pages/                        page shells and routes
tests/                                    unit tests for the engineering library
```

## Curriculum and status
| Code | Module | Status |
|---|---|---|
| M0 | Foundations | Planned |
| M1 | Line pipe materials and manufacturing | **Built: 4 lessons, 7 interactive tools** |
| M2 | Mechanical design | **Built: 7 lessons, 9 interactive tools** |
| M3 | Route selection and surveys | Planned |
| M4 | Safety and risk (PDI, location class) | Planned |
| M5 | Bends and pipe geometry | **Built: 4 lessons, 5 interactive tools** |
| M6 | Crossings and special terrain | Planned |
| M7 | Trench design and burial | Planned |
| M8 | Construction | Planned |
| M9 | Coatings and corrosion control | Planned |
| M10 | Testing and commissioning | Planned |
| M11 | Operations and integrity | Planned |
| M12 | Above-ground and offshore | Planned |

The full lesson list for each module is in `src/data/curriculum.ts`.

## Delivery phases
1. Foundation: design system, layouts, navigation, search, unit switch, lesson template. **Done**
2. Pilot module M2. **Done, awaiting review**
3. Core onshore modules: M1, M3 to M10
4. Operations: M11
5. Extras: M0, M12, formula sheet, glossary, module assessments
6. Polish: accessibility and performance checks, deployment to Netlify

## Adding a lesson
1. Add the lesson to `src/data/curriculum.ts` with a `slug`, and set `live: true` on its module.
2. Create `src/content/lessons/<module-id>/<slug>.mdx` with the frontmatter used by existing lessons.
3. Put any new formulas in `src/lib/eng/` with a unit test, then build the interactive in `src/components/interactives/`.
