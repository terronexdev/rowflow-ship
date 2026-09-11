> **OBSOLETE (2026-08):** Flagship / Goode–Woodlands demo product removed from ROWFlow. Historical plan only.

# ROWFlow product execution plan

**Vision:** Map = where work happens · Activity = what changed · Dashboard = what to do Monday · Report = what you send out.

**Demo:** Goode–Woodlands 138kV shared in-app project is the proof surface for Free users.

---

## Principles

1. Prefer **workflow** over new chrome.
2. **Activity is append-only** — no invented history.
3. **Email is rare** (OOR/invites); managers live in **in-app Activity**.
4. Dashboard widgets must be **actionable** (deep-link) or hidden.
5. Demo-aware: label or filter “includes demo” so Free KPIs aren’t fake personal progress.
6. Ship vertical slices that work on the flagship demo first.

---

## Track A — Map workbench (agent daily path)

| Step | Deliverable | Status |
|------|-------------|--------|
| A1 | Filter chips: Acquired / PTS open / OOR / No owner / Missing geom | **done** |
| A2 | Search fly-to (PIN, owner, address) + highlight | **done** (search + fly on select) |
| A3 | Legend tied to active status tab | later (colors already by tab) |
| A4 | Hover tooltip (owner, status, acres) | **done** |
| A5 | Compact floating status panel on parcel click | **done** (side panel already) |
| A6 | Map snapshot with title/date for reports | later |
| A7 | Bulk box-select + bulk status + undo | later |
| A8 | Corridor sequence / next-unworked along line | later |

**Out of scope:** CAD/PLS, 3D, map library rewrite.

---

## Track B — Activity / manager alerts (in-app)

| Step | Deliverable | Status |
|------|-------------|--------|
| B1 | Extend `AuditLog` + `logActivity()` helper | **done** |
| B2 | Write on parcel status PATCH, offers, bulk | **partial** (PATCH statuses) |
| B3 | Seed demo activity for Goode–Woodlands | **done** |
| B4 | `GET /api/activity` + `/activity` page (filter/sort) | **done** |
| B5 | Nav badge / last-seen | later |
| B6 | Optional email digest | later |

**Reuse:** existing OOR email path stays; Activity does not replace it.

---

## Track C — Dashboard command center

| Step | Deliverable | Status |
|------|-------------|--------|
| C1 | Demo include toggle on rollups | later |
| C2 | **Next up** + **Blocked** strips above fold | **done** |
| C3 | KPI / OOR / schedule deep-links into map filters | **partial** |
| C4 | Move Budget/Labor emphasis to Analytics | **partial** (command strip first) |
| D1 | `/projects/[id]/report` one-pager | **done** |
| D2 | KPIs + status breakdown + OOR + schedule + activity | **done** (print PDF) |

---

## Track D — Project status report

| Step | Deliverable | Status |
|------|-------------|--------|
| D1 | `/projects/[id]/report` one-pager | next |
| D2 | KPIs + status breakdown + OOR + schedule + activity | next |
| D3 | Map snapshot + print-to-PDF | later |
| D4 | Narrative notes field | later |

---

## Implementation order (chosen)

```
B1–B3  Activity foundation + demo seed
A1–A5  Map filters / search / legend / hover / float panel
C1–C4  Dashboard next-up / blocked / demo filter / deep-links
D1–D2  Project report page
B4     Full Activity page polish
A6–A7  Snapshot + bulk
C5     Widget layout prefs
```

Rationale: logging first so map/dashboard actions create a real manager trail; map second (daily path); command dashboard third; sellable report fourth.

---

## Success criteria

- [ ] Status change appears on Activity with who/when/from→to
- [ ] Map filters + search work on Goode–Woodlands (170 parcels)
- [ ] Dashboard shows Next-up / Blocked; demo toggle clear
- [ ] Project report readable for demo without empty panels
- [ ] Free user cannot mutate shared demo; activity not polluted by tourists

---

## Non-goals (near term)

Custom SQL metrics, Tableau builder, websockets, SMS, rewriting Leaflet, in-map full matrix editor.
