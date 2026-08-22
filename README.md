# ROWFlow

Map-first **right-of-way** tracking by **Terronex LLC** (terronex.dev).

**Live alpha:** https://rowflow-alpha.vercel.app  
**Agent cold start / park handoff:** [`docs/AGENT_HANDOFF.md`](docs/AGENT_HANDOFF.md)  
**Source of truth (product):** [`docs/CURRENT.md`](docs/CURRENT.md)  
**Data model:** [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)

---

## What it is

ROWFlow manages **flat Projects → Parcels** for ROW acquisition work:

- Leaflet map with multi-status coloring (including **PTS**)
- Parcel import (GeoJSON / Tractsource handoff)
- Land payment **matrix**, team **roles/rates**, schedules, budget
- Parcel **compensation offers** (matrix-driven ranges) + **labor** time
- **Permits**, project/parcel notes & documents (Vercel Blob)
- Team **invites** (email + register link)
- Reporting stats + CSV export (labor / compensation / budget)
- Counter-offer / invite email via **Resend** (`noreply@terronex.dev`)

**Not in scope right now:** CapitalProject hierarchy, Stripe monetization UX, dual-write to old `AcquisitionTracking` tiers.

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 15 (App Router), TypeScript |
| UI | MUI 6, React Query |
| Map | Leaflet |
| DB | PostgreSQL + Prisma 6 |
| Auth | NextAuth (credentials; OAuth optional) |
| Files | Vercel Blob |
| Email | Resend |
| Host | Vercel |

---

## Quick start

```bash
git clone https://github.com/Terronex-dev/rowflow.git
cd rowflow
npm install          # or pnpm install — pick one lockfile long-term

cp .env.example .env.local
# fill DATABASE_URL, NEXTAUTH_*, etc.

npx prisma generate
npx prisma db push   # schema sync (migrate history is partial; see docs/CURRENT.md)

npm run dev
# http://localhost:3000
```

### Essential env

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Email (production)
RESEND_API_KEY="re_..."
ROWFLOW_EMAIL_FROM="ROWFlow <noreply@terronex.dev>"

# Optional: Google OAuth, Stripe (billing deferred)
```

Full template: [`.env.example`](.env.example).

### Scripts

```bash
npm run dev          # local
npm run build        # prisma generate + next build
npm run test:ci      # jest (matrix + validations)
npx prisma studio    # DB UI
npx vercel --prod    # deploy (linked project)
```

---

## Project layout

```text
rowflow/
├── docs/
│   ├── CURRENT.md                         ← start here
│   ├── DATA_MODEL.md
│   ├── PROJECT_PARCEL_ENHANCEMENT_SPEC.md ← implemented design
│   └── archive/                           ← parked + historical
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/          login, register (+ invite token)
│   │   ├── (dashboard)/     dashboard, projects, settings, analytics
│   │   └── api/             REST routes
│   ├── components/          map, parcel panel, layout
│   └── lib/                 auth, prisma, matrix, email, access, queries
├── .env.example
└── README.md                ← this file
```

---

## Core API (selected)

| Method | Path | Notes |
|--------|------|--------|
| GET/POST | `/api/projects` | List (owner \| member \| role) / create (+ seed) |
| GET/PATCH/DELETE | `/api/projects/[id]` | Detail / update / delete (owner) |
| GET/POST | `/api/projects/[id]/matrix` | Land payment matrix |
| GET/POST | `/api/projects/[id]/roles` | Role assignments |
| GET/POST | `/api/projects/[id]/invites` | Team invite |
| GET | `/api/projects/[id]/stats` | Reporting |
| GET | `/api/projects/[id]/export/report` | CSV reports |
| GET/PATCH | `/api/parcels/[id]` | Parcel + status enums (SOT) |
| POST | `/api/parcels/[id]/compensation` | Offers |
| POST | `.../compensation/[offerId]/send` | Email offer (Resend) |
| GET | `/api/system/email-status` | Ops: is Resend configured? |

Parcel status write path: **`PATCH /api/parcels/[id]` only**.  
`/api/parcels/[id]/lifecycle` → **410 Gone**.

---

## Deploy (Vercel)

1. Link: `npx vercel link` (project **rowflow**)
2. Set env (Production + Preview): DB, NextAuth, Blob, Resend, From address
3. `npx vercel --prod`
4. Ensure Neon/Postgres schema matches: `npx prisma db push` against prod URL when schema changes

Domain email: verify **terronex.dev** in Resend (DNS already authorized via Cloudflare when set up).

---

## Docs policy

| Read | Skip for day-to-day |
|------|---------------------|
| `docs/CURRENT.md` | `docs/archive/*` |
| `docs/DATA_MODEL.md` | May 2025 root handoffs (archived) |
| Enhancement spec (implemented) | CapitalProject spec (parked) |

---

## Legal

- Terms: https://rowflow-alpha.vercel.app/terms
- Privacy: https://rowflow-alpha.vercel.app/privacy
- Shared Terronex suite terms with Tractsource

## License / contact

Private product of **Terronex LLC**.  
Support routing: `support@terronex.dev` (inbound) · app From: `noreply@terronex.dev`.
