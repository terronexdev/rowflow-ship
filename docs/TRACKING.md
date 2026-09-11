# Parcel tracking — agent cheat-sheet

> Short SOT for Hermes / humans. Full model: `docs/DATA_MODEL.md`.  
> Last aligned: **2026-08-16** (product SOT unchanged; see `AGENT_HANDOFF.md` for park + next cuts).

---

## Source of truth (live path)

| Domain | Live path | Reserved / not productized |
|--------|-----------|----------------------------|
| Phase status | Parcel status enums | — |
| Offers | `CompensationOffer` + matrix | — |
| Costs | `ParcelCostEntry` + budget lines | — |
| Existing rights | `ExistingRight` + links | — |
| Encroachments | `ParcelEncroachment` + parcel status | — |
| Contacts | **ContactLog** + Overview stale (14d) + past-due follow-up (unsatisfied due date) | Preferred method / succession later |
| Acquisition tracking table | reserved | Prefer acquisition enum + offers |
| Payment / DamageClaim tables | reserved | Prefer cost ledger + damages enum |

Do not revive reserved tables in UI without an explicit product decision.

## Project workspace

| View | URL | Status |
|------|-----|--------|
| Map | default | Live |
| Overview | `?view=overview` | Live |
| Line list | `?view=list` | Live |
| Bulk status | `POST .../parcels/bulk-status` | Live |
| Section ACL | — | Not enforced (roles mapped in `sectionRegistry`) |

## Existing rights (instrument-centric)

| Concept | Detail |
|---------|--------|
| **Parcel class** | `GREENFIELD` \| `BROWNFIELD` \| `THIRD_PARTY` \| `UNKNOWN` — why tract is on the job |
| **existingRightsStatus** | `NOT_REVIEWED` \| `NONE` \| `RESTRICTED` \| `SUPPLEMENT_NEEDED` \| `SUPPLEMENT_ACQUIRED` |
| **Model** | `ExistingRight` @ project + `ExistingRightParcel` M:N |
| **Same #** | `instrumentNumberNorm` match → link, don’t duplicate |
| **Notes/docs** | category `EXISTING_RIGHTS` |
| **Map** | Layer **Existing rights** (linked parcels); Color-by **Parcel class** + **Existing rights** |

### Encroachments

| Concept | Detail |
|---------|--------|
| **Parcel status** | `NOT_REVIEWED` \| `NONE` \| `IDENTIFIED` \| `NEEDS_REMOVAL` \| `CAN_REMAIN` \| `REMOVED` |
| **Items** | `ParcelEncroachment` rows (type, disposition, PE/TCE, cost est/actual, notes) |
| **Rollup** | Worst open item → section status (button + auto on write) |
| **Section** | Under ROW, above Legal; notes/docs `ENCROACHMENT` |
| **Color-by** | Encroachments |

APIs: `GET/POST /api/projects/[id]/existing-rights`, …; `GET/POST /api/parcels/[id]/encroachments`, `PATCH/DELETE /api/encroachments/[id]`.

---

## Two layers (don’t mix them)

| Layer | What | Where |
|-------|------|--------|
| **Phase status** | Workflow / map Color-by / bulk | Enum columns on `parcels` |
| **Section detail** | Money, docket, take, offers | Related tables + parcel fields |

Status enums are **never** only on tracking tables.  
Detail tables **never** replace status enums.

---

## Phase statuses → section owner

| Parcel field | Edit section | Notes |
|--------------|--------------|--------|
| `status` | **ROW agent** (auto-rollup) | Overall — see rollup rules below |
| `ptsStatus` | **ROW agent** | Permission to survey |
| `acquisitionStatus` | **ROW agent** | Negotiation path |
| `specialConditionsStatus` | **ROW agent** | Gates / access flags |
| `titleStatus` | **Title** | |
| `surveyStatus` | **Survey / take** | PE/TCE geometry lives here too |
| `appraisalStatus` | **Appraisal** | + land use for matrix |
| `condemnationStatus` | **Legal** | ED path |
| `permitStatus` | **Permitting** | Parcel phase; child `Permit` rows = filings |
| `damagesStatus` | **Construction support** | |

**Labels (map hatch):** fixed codes on `ParcelLabel` — not statuses.  
**Bookmark / priority:** attention queue (list sort); not land facts.

**Write statuses:** `PATCH /api/parcels/{id}`  
Section Save buttons often include the matching status in the same PATCH/POST.

**Constants only:** `src/lib/constants/status.ts`  
**Do not** invent local status option arrays in pages.

### Overall status rollup (`src/lib/parcels/statusRollup.ts`)

On parcel PATCH (and when an offer is **ACCEPTED**):

| Trigger | Overall `status` |
|---------|------------------|
| Any domain past `NOT_STARTED` | at least `IN_PROGRESS` |
| `acquisitionStatus` ACQUIRED **or** accepted offer | `ACQUIRED` |
| User set `CONDEMNED` / `RELOCATED` | kept (never auto-downgraded) |

**Dashboard / analytics “acquired”** = effective acquired:  
`status ∈ {ACQUIRED, RELOCATED}` **OR** `acquisitionStatus` complete (ACQUIRED/…).  
Not overall field alone. Project cards also show domain chips (title/survey/appraisal/acq/PTS).

---

## Detail ownership (critical)

| Data | Owner write | Consumers |
|------|-------------|-----------|
| **PE / TCE acres** | Survey | Comp (qty) |
| **`matrixLandUse` (+ label)** | Appraisal | Comp (schedule row) |
| **Offer ledger** | ROW / Comp API | Legal (chips), analytics |
| **Appraisal $ / dates / firm** | Appraisal API | Chips, guidance |
| **Court, judge, counsel, opposing counsel, ED dates** | Legal API | Chips |
| **Notes / files** | Category per section | Filtered lists |

Compensation **must not** let agents edit land use or PE acres.  
It **reads** Appraisal land use + Survey PE acres.

---

## APIs (parcel)

| Path | Purpose |
|------|---------|
| `PATCH /api/parcels/[id]` | Status enums + titled/tenant/survey/land-use fields (+ overall rollup) |
| `POST /api/parcels/[id]/compensation` | Create offer; ACCEPTED → acq + overall ACQUIRED |
| `PATCH /api/parcels/[id]/compensation` | Change offer decision (accept → supersede prior) |
| `POST …/compensation/[offerId]/send` | OOR counter-offer email (Manager/Lead) |
| `POST /api/parcels/[id]/appraisal` | Upsert AppraisalTracking + sync `appraisalStatus` |
| `POST /api/parcels/[id]/legal` | Upsert CondemnationTracking + sync `condemnationStatus` |
| `PUT /api/parcels/[id]/labels` | Replace constraint labels (`code` + optional `note`) |
| `GET/POST /api/parcels/[id]/permits` | Tract-specific Permit filings (`parcelId` set) |
| `GET/PATCH/DELETE /api/permits/[id]` | Filing detail; DELETE cascades notes/docs on filing |
| `GET/POST /api/permits/[id]/documents` | Filing files |
| `GET/POST /api/permits/[id]/notes` | Filing notes |
| `POST /api/parcels/[id]/notes` | Note + `category` |
| `POST /api/parcels/[id]/documents` | File + `category` |
| `GET/POST/DELETE /api/parcels/[id]/costs?discipline=` | ParcelCostEntry ledger (`PERMITTING` supported) |
| `…/lifecycle` | **410 Gone** — do not use |

**Access today:** `getAccessibleParcel` + project member/owner (members OK).  
**Section ACL by role:** not built — see “ACL (later)” below.

---

## Constraint labels (map hatch)

Fixed enum (multi): `CONSERVATION_EASEMENT` · `ENCROACHMENT_RISK` · `WORK_PERMIT_REQUIRED` · `RAILROAD` · `HIGHWAY_ROW` · `UTILITY_CROSSING` · `ENVIRONMENTAL_SENSITIVE` · `HISTORIC_CULTURAL` · `OTHER`  
Optional per-label note. Hatch + amber dashed outline on map in **all** Color-by modes when any label present.  
Filters: Constraints · Permit open · Bookmarked · High priority.  
List chips: ★ + CRIT only (no CE/ENC chip spam).  
Sort: bookmarked → CRITICAL/HIGH → sequence.

---

## Note / doc categories by section

| Section | Categories |
|---------|------------|
| Survey | `SURVEY` |
| Appraisal | `APPRAISAL` |
| ROW | `PTS`, `ACQUISITION`, `COMPENSATION`, `SPECIAL_CONDITIONS` |
| Legal | `LEGAL`, `CONDEMNATION` |
| Permitting | `PERMIT` |
| Construction | `DAMAGES` |
| General | `GENERAL` (+ any) |

Full enum: Prisma `StatusCategory` / `statusCategoryEnum` in validations.

---

## People / roles (project)

```
MANAGER | LEAD_AGENT | AGENT | COORDINATOR | RECORDS_AGENT
TITLE | SURVEY | APPRAISAL | LEGAL | CONSTRUCTION_SUPPORT | PERMIT
```

- UI: **People** panel on project edit only (`ProjectPeoplePanel`).
- **Multi-role:** one person can hold many roles; many people can share a role.
- SOT = `RoleAssignment` rows (`isCurrent`); member.role is primary/default only.
- Rates $/hr per discipline (labor snapshot on TIME entries).
- Invites: email via Resend when configured; Google OK on invite register if email matches.
- Counter-offer email → Manager + Lead only.
- **COORDINATOR / RECORDS_AGENT:** roster + rates only — **no** parcel edit sections.
- **No** second roles form on project edit.

### ACL (later — not built)

Until then: any project member/owner has full parcel write. Planned model:

| Layer | Rule |
|-------|------|
| Open project | Owner or member |
| Project edit (matrix/people/budget/schedule) | Owner (+ maybe Manager) |
| Parcel section write | Union of roles on the member (multi-role) |
| Owner | Always full write |

Suggested role → sections (v1 draft):

| Role | Sections |
|------|----------|
| MANAGER / LEAD_AGENT / AGENT | ROW agent domains + comp + most |
| TITLE | Title |
| SURVEY | Survey |
| APPRAISAL | Appraisal |
| LEGAL | Legal / condemnation |
| PERMIT | Permitting + permit filings |
| CONSTRUCTION_SUPPORT | Damages |
| COORDINATOR / RECORDS_AGENT | Read-heavy / no section lock yet — define when ACL ships |

---

## Billing / costs (parcel ledger)

Unified **`ParcelCostEntry`** by discipline (`ROW` · `TITLE` · `SURVEY` · `APPRAISAL` · `LEGAL` · `CONSTRUCTION` · `PERMITTING` · `GENERAL`):

| entryType | Fields |
|-----------|--------|
| TIME | hours × role rate (snapshot) |
| FEE | feeCode + $ |
| EXPENSE | category + $ + vendor |
| MILEAGE | miles × project `mileageRate` |

Receipts: finance storage — **not** work-product Documents.  
UI: `ParcelBillingPanel` inside each discipline section.

### Budget category mapping (actuals)

Helper: `src/lib/analytics/costBudget.ts`

| Cost | Budget category |
|------|-----------------|
| ROW TIME/FEE | ROW_LABOR |
| TITLE TIME/FEE | TITLE_LABOR |
| SURVEY TIME/FEE | SURVEY_LABOR |
| APPRAISAL TIME/FEE | APPRAISAL |
| LEGAL TIME/FEE | LEGAL |
| CONSTRUCTION TIME/FEE | CONSTRUCTION_LABOR |
| PERMITTING TIME/FEE | **PERMITS** (not labor rollup) |
| any EXPENSE | EXPENSES |
| any MILEAGE | MILEAGE |
| accepted offers | LAND (spend views) |

**Labor Attention alert:** only when labor actual **>** labor budget × 1.25 (overspend). Underspend / $0 billed is normal.

**Not built:** planned hours effort health (budget TOTAL does not auto ÷ role rate into hours).

---

## Project schedule

- Edit project: ROW + Construction phases (start/end + **Complete** checkbox).
- Health: dates vs today; Complete → COMPLETE (not LATE). AT_RISK = end within 14 days.
- Report + Analytics schedule panel + portfolio table + `?type=schedule` CSV.
- No auto-complete from parcel milestones yet.

---

## Do / don’t

**Do**
- Patch parcel enums for status; rely on rollup for overall when domains move.
- Put PE on Survey, land use on Appraisal.
- Use shared status constants + `ASSIGNMENT_ROLE_OPTIONS`.
- Use People panel for multi-role roster/rates/invites.
- Labels for land/access facts; `permitStatus` + child Permit for filings.
- Hatch from labels only (not open permit workflow).

**Don’t**
- Wire `/lifecycle` for live status.
- Dual-write status into title_tracking / acquisition_tracking for day-to-day.
- Let Comp re-enter land use or acres.
- Add a second People/roles UI next to the panel.
- Use free-text tags instead of fixed label enum.
- Auto-roll parcel `permitStatus` from child Permit rows (manual).
- Flag labor variance on underspend.

---

## Quick file map

| Area | Path |
|------|------|
| Status constants | `src/lib/constants/status.ts` |
| Labels / roles | `src/lib/constants/index.ts` |
| Status rollup | `src/lib/parcels/statusRollup.ts` |
| Matrix math | `src/lib/compensation/matrix.ts` |
| Budget actuals map | `src/lib/analytics/costBudget.ts` |
| Schedule health | `src/lib/analytics/statsHelpers.ts` |
| Access helpers | `src/lib/projectAccess.ts` |
| Parcel edit UI | `src/app/(dashboard)/projects/[id]/parcels/[parcelId]/edit/page.tsx` |
| People | `src/components/project/ProjectPeoplePanel.tsx` |
| Map hatch | `src/components/map/ParcelMap.tsx` |
| Neon cutover | `docs/NEON_ROWFLOW_MIGRATION.md` |
| Full model | `docs/DATA_MODEL.md` |
