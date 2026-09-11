# ROWFlow

Map-first **right-of-way** tracking by **Terronex LLC** (terronex.dev).

**Live alpha:** https://rowflow-alpha.vercel.app  
**Agent cold start:** [`docs/AGENT_HANDOFF.md`](docs/AGENT_HANDOFF.md)  
**Source of truth (product):** [`docs/CURRENT.md`](docs/CURRENT.md)  
**Data model:** [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)

GIS, basemaps, and map notes are **planning tools** — not a survey, title, or legal description. See [Terms](https://rowflow-alpha.vercel.app/terms).

---

## What it is

ROWFlow manages **flat Projects → Parcels** for ROW acquisition work:

- Leaflet map (Esri basemaps) with multi-status coloring
- Map notes: labeled markers/rects, free-form groups, Features tab, hide/jump
- Crossing notes (RR / DOT / Crossing) can create a **job Permit with no parcel**
- Parcel import (GeoJSON / Tractsource handoff / county)
- Land payment **matrix**, team **roles/rates**, schedules, budget
- Parcel **compensation offers** (matrix-driven ranges) + **labor** time
- **Permits** (project-wide or parcel-linked), notes & documents (Vercel Blob)
- Team **invites** (email + register link)
- Reporting stats + CSV export
- Counter-offer / invite email via **Resend** (`noreply@terronex.dev`)

**Not in scope unless named go:** CapitalProject hierarchy, agent-home edit, section ACL, ROWFlow Lite shell.

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 15 (App Router), TypeScript |
| UI | MUI 6, React Query |
| Map | Leaflet · Esri public tiles |
| DB | PostgreSQL (Neon) + Prisma 6 |
| Auth | NextAuth (credentials + Google/GitHub) |
| Files | Vercel Blob |
| Email | Resend |
| Host | Vercel (CLI deploy — **git push does not auto-deploy**) |

---

## Quick start

```bash
git clone https://github.com/Terronex-dev/rowflow.git
cd rowflow
npm install

cp .env.example .env.local
# fill DATABASE_URL, NEXTAUTH_*, etc.

npx prisma generate
npx prisma db push

npm run dev
# http://localhost:3000
```

Use **npm** (not pnpm). Verify with:

```bash
npx tsc --noEmit -p tsconfig.json
npm run test:ci
npm run build
```

`next lint` is an interactive setup prompt — do not use it as CI.

Full env template: [`.env.example`](.env.example).

### Scripts

```bash
npm run dev          # local
npm run build        # prisma generate + next build
npm run test:ci      # jest
npx prisma studio    # DB UI
npx vercel --prod --yes   # production (required after git push)
```

---

## Deploy (Vercel)

GitHub webhooks are **not** connected. After `git push origin main`:

```bash
npx vercel --prod --yes
```

Live: https://rowflow-alpha.vercel.app

---

## Legal

- Terms: https://rowflow-alpha.vercel.app/terms
- Privacy: https://rowflow-alpha.vercel.app/privacy
- GIS / mapping disclaimer is in Terms §7 and on the map / Features tab
- Shared Terronex suite terms with Tractsource
- Contact: `support@terronex.dev`

Private product of **Terronex LLC**.
