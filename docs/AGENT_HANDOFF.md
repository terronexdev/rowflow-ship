# ROWFlow — agent handoff

> **Live desk** (2026-08-29). Not parked.  
> **Cold start:** read this → `docs/CURRENT.md` → `docs/TRACKING.md`.  
> Hermes skill: `terronex-product-ops`.

Do **not** invent the next feature. Resume ≠ go.

---

## Live pointers

| Item | Value |
|------|--------|
| Live | https://rowflow-alpha.vercel.app |
| Repo | Terronex-dev/rowflow · local `~/clawd/rowflow` |
| Branch | `main` |
| Last ship | `d65f42e` — crossing map notes → job Permits (no parcel) |
| Neon | Dedicated ROWFlow project · DB `neondb` only · `ep-super-math-awn8slhp…` — **never** drop whole vesper/neondb |
| Vercel | project **rowflow** · **no GitHub webhook** — `npx vercel --prod --yes` after push |
| Stripe Pro | $99 · comps: terronex.dev / @terronex.dev + tester gmails (`isTerronexCompedEmail`) |
| Legal | `/terms` `/privacy` · GIS disclaimer Terms §7 + map footer |

---

## Product model (locked)

Flat **User → Project → Parcel**. No CapitalProject hierarchy (parked in `docs/archive/`).

**Primary persona:** ROW agent. Daily jobs: **contact → negotiate → status**. Map is the desk.

Workspace: **Map | Overview | Line list | Features**.

Permits: optional `parcelId` (null = corridor / crossing — no PIN).

---

## Last shipped (through 2026-08-29)

- Map inspector card + folds; Esri dark tiles; map notes + Features tab
- Free-form feature groups; RR/DOT/Crossing → job Permit (no parcel)
- Tabs + ACL + skinny tract card **restored off** — live edit = Summary | Full accordion

Full ship table: `docs/CURRENT.md`.

---

## Explicitly NOT built (do not start unprompted)

| Item | Status | Start only when |
|------|--------|-----------------|
| **Agent-home** / tabbed edit | Tried 2026-08-29, restored off | Typed **go** that **names** it |
| Overview **next-actions** | Not built | Named go |
| Section **ACL** | Tried then restored | Named **go edit ACL** (no tabs) |
| ROWFlow Lite | Paper only, gitignored | Named **go ROWFlow Lite shell** |
| Capital hierarchy | Parked | Explicit un-park |

**Go rules:** typed go/execute/proceed that **names the feature**.

---

## Next cuts

Wait for named go. Do not revive agent-home, tabs, or Lite.

---

## Ownership rules (do not regress)

| Data | Owner |
|------|--------|
| PE / TCE acres | Survey |
| matrixLandUse | Appraisal |
| Offers | ROW / compensation API (reads PE + land use) |
| Overall status | Rollup + agent; keep CONDEMNED/RELOCATED |
| Easement # | This job’s tract ID — **not** ER instrument # |
| Structure #s | Utility plant (poles/towers), never buildings |
| ER under | Existing rights (instruments); existing structure #s live there |
| Encroach under | Own section under ROW path; status rollup from items |
| Billing | `ParcelCostEntry` only — **no** LaborEntry |
| Activity feed | Project sidebar only |
| Map notes | Project layer, not a parcel |
| Crossing permits from map | Job Permit, `parcelId` null until attached |

Constants: `src/lib/constants/status.ts` only — no local status arrays.

---

## Verify when shipping UI

```bash
cd ~/clawd/rowflow
npx tsc --noEmit -p tsconfig.json
npm run test:ci
npm run build
npx vercel --prod --yes
```

`next lint` is an interactive setup prompt — skip it.

---

## Infra / secrets hygiene

- Neon: ROWFlow `neondb` only; never drop vesper DB
- Stripe live keys in `.env.local` — **never** paste `sk_live` / `whsec` into chat
- Comp emails: see `src/lib/billing/comped.ts`
- Demo/flagship Free product: **retired** — do not revive
- npm only (no pnpm lockfile)
