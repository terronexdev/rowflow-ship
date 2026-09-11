# ROWFlow data model — live vs reserved

> Cleanup baseline: **2026-07-27** · Enhanced: **2026-07-29** · Tracking refresh: **2026-08-02**  
> **Hierarchy:** single **Project → Parcels** (CapitalProject plan **parked** → `docs/archive/`).  
> Product SOT: `docs/CURRENT.md`  
> Spec (implemented): `docs/PROJECT_PARCEL_ENHANCEMENT_SPEC.md`

---

## Source of truth (live)

### Hierarchy
```text
User → Project → Parcel[]
              → ProjectLayer[]
              → LandPaymentMatrix → rows[]
              → RoleAssignment[] / RoleRate[] / ProjectMember[] / ProjectInvite[]
              → BudgetLine[]
              → ProjectSchedulePhase[]
              → Permit[]
              → Note[] / Document[] (project-scoped)
```
No CapitalProject / ProjectComponent / BPID split until product says otherwise.  
See `docs/archive/CAPITAL_PROJECT_SPEC_STATUS.md` (parked).

### Parcel phase statuses (enums on `parcels`)
**One status model only** for workflow coloring / bulk / map Color-by:

| Field | Owner section (parcel edit) |
|-------|------------------------------|
| `status` (overall) | ROW agent |
| `ptsStatus` | ROW agent |
| `acquisitionStatus` | ROW agent |
| `specialConditionsStatus` | ROW agent |
| `titleStatus` | Titled owner |
| `surveyStatus` | Survey / take |
| `appraisalStatus` | Appraisal (+ AppraisalTracking detail) |
| `condemnationStatus` | Legal (+ CondemnationTracking detail) |
| `permitStatus` | Permitting (+ optional child `Permit` rows via `parcelId`) |
| `damagesStatus` | Construction support |

**Constraint labels:** `ParcelLabel` (fixed codes + note) — map hatch overlay, not phase status.  
**Attention:** `bookmarked` (project-wide pin) + `priority` (LOW/NORMAL/HIGH/CRITICAL).

**Write path for enums:**
```http
PATCH /api/parcels/{id}
Content-Type: application/json
{ "ptsStatus": "REQUESTED", "titleStatus": "IN_PROGRESS", "permitStatus": "IDENTIFIED" }
```
Also written when section Save buttons include status (title, survey, appraisal, legal, permitting, ROW, construction).

**UI:** collapsible sections on parcel edit · `ParcelStatusPanel` summary rail · project map Color-by.  
**Constants (only):** `src/lib/constants/status.ts` — do not reintroduce page-local status arrays.

### Parcel detail records (section payloads)

| Concern | Storage | API |
|---------|---------|-----|
| PE / TCE take acres | `easementAcres`, `easementAcresToAcquire`, `tceAcres` | PATCH parcel (Survey) |
| Matrix land use | `matrixLandUse`, `matrixLandUseLabel` | PATCH parcel (Appraisal owns write) |
| Compensation offers | `CompensationOffer[]` + last-offer cache on parcel | `/api/parcels/[id]/compensation` |
| Appraisal valuation | `AppraisalTracking` (latest upsert) | `/api/parcels/[id]/appraisal` |
| Legal / ED docket | `CondemnationTracking` (latest upsert) | `/api/parcels/[id]/legal` |
| Constraint labels | `ParcelLabel[]` | `PUT /api/parcels/[id]/labels` |
| Tract permits | `Permit` with `parcelId` set | `/api/parcels/[id]/permits` or project permits + parcelId |
| Cost ledger | `ParcelCostEntry` | `/api/parcels/[id]/costs` |
| Notes / docs | `Note` / `Document` by category | `/notes`, `/documents` |

**Compensation inputs:** land use from Appraisal (`matrixLandUse`) · PE acres from Survey · offer band from project matrix section (`offerRangeLowPct` / `HighPct`).

**Access:** all parcel sub-routes use `getAccessibleParcel` + `assertParcelWritable` (members/agents can write).

### Assignment roles (People)
```text
MANAGER | LEAD_AGENT | AGENT | TITLE | SURVEY | APPRAISAL | LEGAL | CONSTRUCTION_SUPPORT | PERMIT
```
- UI: `ProjectPeoplePanel` on project edit  
- Rates: `/api/projects/[id]/role-rates`  
- Invites: `/api/projects/[id]/invites`  
- Counter-offer email: MANAGER + LEAD_AGENT only  

### Project (live)
| Field | Notes |
|-------|-------|
| `name`, `description`, `status` | |
| `projectCode` | Business Project ID |
| `workOrderNumber` | Single WO# |
| `clientName`, `contractNumber`, `projectType` | |
| `startDate` / `endDate` | |
| `offerRangeLowPct` / `offerRangeHighPct` | saved with **Land matrix** UI |
| matrix / people / rates / budget / schedule / permits | related tables |

### Notes & documents
Categories (`StatusCategory`): GENERAL, TITLE, SURVEY, APPRAISAL, ACQUISITION, CONDEMNATION, SPECIAL_CONDITIONS, DAMAGES, PTS, COMPENSATION, LABOR, PERMIT, PROJECT, **LEGAL**.

Section filters: Survey→SURVEY · Appraisal→APPRAISAL · ROW→PTS/ACQUISITION/COMPENSATION/SPECIAL_CONDITIONS · Legal→LEGAL/CONDEMNATION · Construction→DAMAGES.

### Compensation formula
```text
// Single amount model: minAmount = maxAmount = schedule amount
// FLAT: band ignored (range = amount)
// PER_ACRE / PER_SQFT: range = amount × qty × [lowPct, highPct]
```
Helpers: `src/lib/compensation/matrix.ts`. Do **not** dual-write `AcquisitionTracking` tiers.

---

## Reserved (in DB, not primary path)

### Parallel history tables
- `title_tracking`, `survey_tracking` — unused primary path  
- `appraisal_tracking`, `condemnation_tracking` — **now used** as detail stores (not status SOT)  
- `acquisition_tracking`, `damage_claims`, `payments`, `contact_logs` — reserved  

**API:** `PATCH /api/parcels/[id]/lifecycle` → **410 Gone** (do not use for live status).

### Parked architecture
- CapitalProject / ProjectComponent / M:N  
- Spec: `docs/CAPITAL_PROJECT_SPEC.md` (PARKED)

---

## Rules for future agents

1. **Keep single Project** until capital hierarchy is un-parked.  
2. Parcel **enums** = phase status source of truth (map / bulk / chips).  
3. Section **detail** tables (appraisal / condemnation / offers) hold money & docket fields.  
4. Land use write = Appraisal; PE acres write = Survey; Comp only reads both.  
5. People / rates via People panel — no second roles UI on project edit.  
6. Theme: `src/lib/theme.ts` (Terronex dark).  
7. Additive Prisma only.

## Related
- **`docs/TRACKING.md`** — short agent cheat-sheet (statuses, section owners, APIs)  
- `docs/PROJECT_PARCEL_ENHANCEMENT_SPEC.md`  
- `docs/CURRENT.md`  
- Tractsource: `../tractsource/docs/AGENT_HANDOFF.md`
