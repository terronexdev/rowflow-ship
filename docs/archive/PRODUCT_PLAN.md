# ROWFlow Product Plan

ROWFlow is a map-first right-of-way tracking application by Terronex. The build starts from the proven `row-tracking-improved` app shell, keeps Leaflet and parcel imports, and adds the deeper ROW lifecycle model from `row-manager` without carrying over unnecessary enterprise bloat.

## Product Direction

ROWFlow should feel like a ROW command center, not a generic CRM. The main object is the parcel. The project map, line list, and parcel detail should always stay in sync.

## Name

Working name: **ROWFlow**

Brand treatment: **ROWFlow by Terronex**

## Base Decisions

- Base app: `row-tracking-improved`
- Map engine: Leaflet / React Leaflet
- Parcel import: keep and strengthen existing parcel import flow
- Database: PostgreSQL + Prisma
- Auth: NextAuth
- UI: MUI for now, with later Terronex styling pass
- Avoid initial mobile app, deep subscriptions, and overly broad admin modules until the core ROW workflow is sharp

## Core MVP

### 1. Dashboard
- Project count and active project summary
- Parcel counts by acquisition status
- Title/survey/appraisal/acquisition/condemnation bottlenecks
- Upcoming milestones and follow-ups
- Budget/payment summary once payment records are populated

### 2. Map-first Project View
- Leaflet parcel map
- Parcel colors by active status
- Click parcel to open detail side panel
- Filters by status, county, assigned agent, priority, phase
- Imported GeoJSON geometries preserved on parcels
- Project-level centerline/ROW extents stored as GeoJSON

### 3. Parcel Line List
- Table view for spreadsheet-style ROW work
- Search by parcel number, PIN/APN, owner, county
- Bulk status changes
- CSV/PDF export
- Quick link to map selection and full parcel detail

### 4. Parcel Detail
- Basic parcel/owner/property information
- Lifecycle sections:
  - Title
  - Survey
  - Appraisal
  - Acquisition/offers
  - Condemnation
  - Damages
  - Contacts
  - Notes
  - Documents
- Timeline/activity view later

### 5. Parcel Import
- Keep existing import route and UI
- Support GeoJSON first
- Preserve mapping of common fields: parcel number, PIN/APN, owner, mailing address, county, acreage, geometry
- Later: KML/SHP importer from `row-manager` patterns

## Schema Direction

The initial schema now extends the `row-tracking-improved` parcel/project model with ROW lifecycle tables inspired by `row-manager`:

- `TitleTracking`
- `SurveyTracking`
- `AppraisalTracking`
- `AcquisitionTracking`
- `CondemnationTracking`
- `DamageClaim`
- `Payment`
- `ContactLog`
- `Milestone`
- `AuditLog`

The original fields are preserved so the existing app screens and APIs can keep working while we progressively wire up the richer model.

## Build Phases

### Phase 1: Foundation
- Rename app/product to ROWFlow
- Preserve existing project/parcel/map/import behavior
- Extend Prisma schema with lifecycle models
- Verify Prisma generation and Next build

### Phase 2: Parcel Detail Upgrade
- Add lifecycle tabs/sections to parcel detail page
- Add simple CRUD endpoints for each lifecycle section
- Show status summary cards for each phase

### Phase 3: Map + Line List Sync
- Improve map side panel
- Add status filter controls
- Add bulk operations to line list
- Ensure imported geometry displays reliably

### Phase 4: Reporting
- Acquisition line list export
- Project status PDF
- Offer/payment summary

### Phase 5: Production Hardening
- Role permissions
- Audit trail hooks
- Seed/demo data
- Deployment cleanup

## Open Questions

- Should the commercial subscription layer stay, or be hidden until the product is stable?
- Should Mapbox remain out entirely, or should Leaflet be primary with optional Mapbox tiles?
- Should this live in a new GitHub repo named `rowflow`, `terronex-rowflow`, or replace one of the existing repos?
