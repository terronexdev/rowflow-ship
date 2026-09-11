# ROWFlow Project Lifecycle Discovery — 2026-05-05

Purpose: capture how utility transmission ROW projects actually come to life before changing ROWFlow architecture.

## Current Direction

ROWFlow should first become excellent at tracking ROW deliverables for a project before adding full project controls.

Sequence:

1. Perfect ROW deliverables tracking.
2. Add project/component structure that reflects BPIDs and master projects.
3. Later integrate scoping, estimating, schedule, budget, vendor spend, and internal labor.

## Working Principles

- ROW is critical path: construction cannot proceed without rights.
- ROWFlow should stay project-first and map-first.
- Spend/schedule integrations should not be added until the ROW deliverables model is solid.
- Projects may contain many components/BPIDs under a master project.
- The app needs to support utility-style project structure rather than a flat single-project model.

## Early Model Thought

Potential hierarchy:

```text
Master Project
  └─ BPID / Component / Work Package
       └─ ROW Scope
            ├─ Parcels
            ├─ GIS layers
            ├─ ROW deliverables
            ├─ Status tracking
            └─ Later: vendors, labor, budget, schedule
```

Internal model name idea: `ProjectComponent`.

UI label idea: `BPID / Component`, so the system can adapt to utility terminology.

## Known Spend Categories Jason Tracks

- Right-of-way labor
- Internal ROW labor
- Land cost / acquisition
- Legal costs, sometimes
- Survey labor
- Appraisal labor
- Construction support labor
- Vendor spend across many transmission line projects

## Open Discovery Questions

### How Projects Come to Life

- Where does a project start?
- Who creates the master project?
- When does ROW first get involved?
- What information exists before ROW receives the project?
- What documents/maps/scopes are handed to ROW?
- When are BPIDs/components created?
- Are BPIDs funding buckets, scope buckets, accounting buckets, work packages, or all of the above?

### ROW Deliverables

- What does ROW need to deliver before construction can proceed?
- Which deliverables are project-level vs parcel-level?
- Which deliverables belong to survey, title, appraisal, acquisition, legal, environmental, construction support, or engineering?
- What counts as “ROW complete”?
- What counts as “ready for construction”?

### BPID / Component Structure

- Can one parcel belong to multiple BPIDs?
- Can one BPID span many counties or line segments?
- Can one master project include transmission line, substation, access road, and distribution components?
- Are budgets/schedules tracked at BPID level, master project level, or both?

### Planning Later

- What reports does Jason need for work meetings?
- What forecast questions are currently painful?
- What does leadership/vendor/project management ask for?
- What fields need to exist from day one vs later?

## Conversation Notes

Add dated notes below as Jason describes the real project lifecycle.

### 2026-05-05 — Transmission project lifecycle described by Jason

Jason's organization has a project lifecycle management process.

High-level lifecycle:

1. Conceptual
2. Functional
3. Detailed scoping and estimating

Sometimes the process skips functional and goes directly from conceptual to detailed scoping/estimating.

During detailed scoping and estimating, every supporting group submits:

- Scope of work
- Cost estimate to support that scope

Main transmission groups involved, not necessarily in order:

- Transmission planning
- Siting
- Transmission construction management
- Transmission right of way, including Jason and ROW vendors
- Outreach
- Transmission substation engineering
- Transmission line engineering
- Transmission environmental
- Forestry
- Estimating
- Scheduling
- Project manager
- Construction representative
- Other groups as needed
- Some roles also have distribution counterparts

Project structure:

- Work starts with a master project.
- The PM group creates BPIDs/components.
- Each BPID/component is scoped and estimated according to what is required to complete the master project.

Route development:

- Projects begin with conceptual routes.
- Conceptual routes are developed into detailed routes and access plans.
- Projects typically require SCC approval, which can take about a year.
- Community outreach and open houses help develop/refine line routes.

ROW workflow:

- ROW receives ROW extents from Transmission Line Engineering (TLE).
- Jason provides ROW extents to survey for boundary ties and exhibit creation.
- ROW vendor prepares paperwork and acquires rights.
- Landowners who will not sign are referred to condemnation.
- Jason works with legal on mediation, settlement, condemnation, and trial if needed.
- After rights are secured, the project moves to clearing and construction.

Important modeling implication:

- ROWFlow needs to support a master project with multiple BPIDs/components.
- Each BPID/component may need its own scope, estimate, route/access, ROW deliverables, schedule, and budget.
- ROW deliverables are directly tied to construction readiness because work cannot proceed without rights.

### 2026-05-05 — Public AEP Virginia website review implications

Reviewed the public AEP Virginia transmission projects site and related public project pages.

Findings relevant to ROWFlow discovery:

- Public project communication is map-heavy from the beginning.
- Virginia projects are grouped publicly by lifecycle state such as pending approval and approved.
- SCC approval is a major gate for qualifying Virginia transmission projects.
- Public project pages rely heavily on document artifacts such as overview maps, detailed maps, fact sheets, FAQs, news releases, and SCC filings.
- Some project structures visibly behave like master-project-plus-subproject/component bundles rather than one flat project.
- Independence-style entries suggest one area project may contain multiple component scopes, such as substation upgrades and transmission upgrades.

Modeling implication:

- ROWFlow should eventually support project-level and component-level documents, maps, approvals, and public/outreach milestones, not only parcel records.
