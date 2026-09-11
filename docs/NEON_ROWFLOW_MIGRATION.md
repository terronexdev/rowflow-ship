# ROWFlow → dedicated Neon project (migration runbook)

> Status: **COMPLETE** (cutover 2026-08-03 · legacy vesper DB `rowflow` dropped 2026-08)  
> Owner: Jason / Terronex  
> Goal: stop sharing Neon project **vesper** with ROWFlow — **done**.

Live app: https://rowflow-alpha.vercel.app  
Repo: `~/clawd/rowflow` · Vercel project **rowflow**

---

## Live (canonical)

| Item | Value |
|------|--------|
| Neon project | **ROWFlow** |
| Endpoint | `ep-super-math-awn8slhp-pooler.c-12.us-east-1.aws.neon.tech` |
| Database | **`neondb`** |
| Local + Vercel `DATABASE_URL` | Pooled URL → this project |
| Schema | Prisma push applied (labels, permitting, schedule `isComplete`, multi-role enums, …) |

---

## Legacy (removed)

| Item | Value |
|------|--------|
| Neon project | **vesper** |
| Old DB name | **`rowflow`** — **dropped** (confirmed `3D000 database "rowflow" does not exist`) |
| Keep on vesper | **`neondb`** (Vesper app only) — never drop whole vesper project |

Pre-cutover alpha project **test** lived only on old DB (no ID overlap with post-cutover **test2**). No merge required.

---

## Why (historical)

| Before | After |
|--------|--------|
| Neon project **vesper** hosting DB `rowflow` | Neon project **ROWFlow** alone |
| Free-tier storage shared with Vesper | Separate quota |

Product rule: **one Neon project per production product**.

---

## Cutover checklist

| Step | Done | Date |
|------|------|------|
| Neon project ROWFlow created (PG 17, Auth off) | ✅ | 2026-08-03 |
| Vercel DATABASE_URL Prod/Preview/Dev | ✅ | 2026-08-03 |
| Local `.env.local` | ✅ | 2026-08-03 |
| `prisma db push` on new DB | ✅ | 2026-08-03 |
| Production redeploy + smoke | ✅ | 2026-08-03 |
| Old vesper DB `rowflow` dropped | ✅ | 2026-08 |
| Docs refreshed | ✅ | 2026-08-05 |

---

## Ongoing schema

Further changes: normal `npx prisma db push` against ROWFlow `neondb` only.

```bash
cd ~/clawd/rowflow
npx prisma generate
npx prisma db push
```

Do **not** use `--accept-data-loss` unless you understand the drop.

---

## Related docs

| Doc | Role |
|-----|------|
| `docs/CURRENT.md` | Product truth |
| `docs/TRACKING.md` | Parcel / people / billing / schedule |
| `docs/DATA_MODEL.md` | Schema semantics |
| `prisma/schema.prisma` | Source of push |
