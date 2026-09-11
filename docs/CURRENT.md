# ROWFlow — current truth

> Last updated: **2026-08-29**  
> Live: **https://rowflow-alpha.vercel.app**  
> Repo: **Terronex-dev/rowflow** · local `~/clawd/rowflow`  
> Owner: **Terronex LLC** · product of terronex.dev  
> **Agent cold start:** [`AGENT_HANDOFF.md`](./AGENT_HANDOFF.md)

This file is the **one-page** product/source-of-truth pointer. Prefer it over root May 2025 docs in `docs/archive/`.

---

## Status

**Live desk.** Last production ship: `d65f42e` (RR/DOT/Crossing map notes → job Permits, no parcel). Git push does **not** auto-deploy — `npx vercel --prod --yes`.

**Do not invent next work.** Named go only. Agent-home / tabbed edit / ACL were tried then **restored off**. Lite is paper only (`docs/ROWFLOW_LITE_SPEC.md`, gitignored).

---

## Product model (locked)

```text
User (owner)
  └── Project  (flat — no CapitalProject hierarchy)
        ├── projectCode + workOrderNumber
        ├── offerRangeLowPct / HighPct (default 0.80 / 1.50)
        ├── LandPaymentMatrix → rows (single schedule $ + offer band)
        ├── RoleAssignment[] (multi-role) + RoleRate[]
        ├── BudgetLine[], ProjectSchedulePhase[] (dates + isComplete)
        ├── Permit[] (optional parcelId)
        ├── Note[] / Document[] (project-scoped)
        ├── ProjectMember[] / ProjectInvite[]
        └── Parcel[]
              ├── status enums (SOT) + overall rollup
              ├── permitStatus + ParcelLabel[] (hatch)
              ├── bookmarked / priority
              ├── easementNumber + new/existing structure #s (plant)
              ├── CompensationOffer[]
              ├── ParcelCostEntry[] (TIME/FEE/EXPENSE/MILEAGE by discipline)
              ├── ContactLog[]
              └── Note[] / Document[]
```

**Parked:** CapitalProject hierarchy → `docs/archive/CAPITAL_PROJECT_SPEC.md`  
**Retired:** `/lifecycle` (410); Free/demo marketing; in-app demo product.  
**Paper only:** ROWFlow Lite shell; Overview next-actions; section ACL.  
**Restored off:** agent-home / tabbed Full edit (2026-08-29). Live edit = Summary | Full accordion.

---

## Infra (2026-08)

| Item | Value |
|------|--------|
| Neon | **Dedicated project ROWFlow** · DB `neondb` · `ep-super-math-awn8slhp-pooler…` |
| Legacy | vesper DB name `rowflow` **dropped** (keep vesper `neondb` for Vesper) |
| Vercel | project **rowflow** · Prod/Preview/Dev `DATABASE_URL` → new Neon |
| Auth | NextAuth credentials + Google/GitHub; invite attach on register/OAuth |

---

## Shipped (highlights through 2026-08-29)

| Area | Status |
|------|--------|
| Map + list + status panel + labels hatch | Live |
| Inspector: Track collapsed; Identity open; Notes/Docs folds; Seq hidden; offer range | Live |
| Esri dark basemap (no Carto key); invalidateSize on inspector toggle | Live |
| Map notes: label, color, pin/well/square/triangle, hatch; persist on job | Live |
| Features tab: free-form groups, group+row hide, jump | Live |
| Crossing notes (RR/DOT/Crossing) → job Permit, no parcel | Live |
| Project edit: matrix, people (multi-role), schedule, budget | Live |
| Parcel sections + billing ledger + comp offers | Live |
| Overall status rollup + effective acquired % | Live |
| Permits: filings, files, notes, delete; optional parcelId | Live |
| Invites: Resend email + Google on invite path | Live |
| Schedule health + complete + report/CSV | Live |
| Analytics budget vs actual; labor over-only alert | Live |
| Marketing Pro-only (no free tier / demo copy) | Live |
| Stripe Pro $99 + comps (Terronex + tester gmails) | Live |
| Existing rights (instruments, multi-parcel, map overlay) | Live |
| Encroachments (items + rollup + Color-by) | Live |
| Project Overview tab (stats inside map workspace) | Live |
| Line-list / status matrix on project page | Live |
| ContactLog UI + stale / past-due follow-up alerts | Live |
| Activity feed | Live |
| Section ACL by role | **Not live** (tried then restored) |
| Agent-home / tabbed edit | **Not live** (tried then restored) |
| Overview next-actions CTA list | **Not built** |
| ROWFlow Lite | Paper only |

---

## Stack

- Next.js 15 App Router · TypeScript · Prisma · PostgreSQL (Neon)
- MUI · Leaflet · NextAuth
- Vercel Blob · Resend · React Query
- Deploy: Vercel **rowflow** → rowflow-alpha.vercel.app (**CLI only**, no GitHub webhook)

---

## Env (production essentials)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled Postgres |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Auth |
| `BLOB_READ_WRITE_TOKEN` | Uploads |
| `RESEND_API_KEY` / `ROWFLOW_EMAIL_FROM` | Invites + transactional |
| Stripe keys + `STRIPE_PRO_PRICE_ID` | Billing |
| Google/GitHub OAuth client IDs | Social login |

---

## Doc index

| File | Role |
|------|------|
| [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) | **Cold-start handoff** — last ship, park, next cuts, edit facts |
| [TRACKING.md](./TRACKING.md) | Parcel sections / people / billing / schedule / ACL notes |
| [DATA_MODEL.md](./DATA_MODEL.md) | Schema semantics |
| [NEON_ROWFLOW_MIGRATION.md](./NEON_ROWFLOW_MIGRATION.md) | Neon cutover (complete) |
| [DASHBOARD_ANALYTICS_SPEC.md](./DASHBOARD_ANALYTICS_SPEC.md) | Dashboard/analytics |
