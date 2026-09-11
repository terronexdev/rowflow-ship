# ROWFlow Field System Plan - 2026-06-03

## Coding Model Preference

Jason wants ROWFlow coding work handled with GPT 5.5 whenever that model is available in the active coding environment. If unavailable, use the strongest available Codex coding model and preserve this preference for future sessions.

## Product Direction

ROWFlow should become a parcel-first field system for right-of-way work. The parcel record should be the operational source of truth for status, comments, owner/contact history, photos, documents, damage records, title/survey/appraisal/acquisition progress, and follow-up tasks.

## Phase 1 - Parcel Field Record

- Add working parcel comments/notes with lifecycle categories.
- Add parcel document and image uploads.
- Support PWA/mobile camera capture for parcel photos.
- Support mobile document capture for scanned documents.
- Show comments and documents directly on the parcel detail page.
- Keep all mutations ownership-checked through project ownership.

## Phase 2 - Activity Timeline

- Combine status changes, notes, document uploads, contact logs, damage claims, payments, and lifecycle updates into one parcel activity feed.
- Add important/pinned entries for critical parcel facts.
- Add audit records for material changes.

## Phase 3 - Field Workflow

- Add a mobile-first field action panel: add note, take photo, scan document, log contact, update status, add follow-up.
- Add geotagging metadata for field photos when browser permissions allow it.
- Add assigned parcel lists and field-day filters.
- Add follow-up dates and reminders.

## Phase 4 - Offline PWA

- Cache project, parcel, and layer data in IndexedDB.
- Queue offline notes, status changes, contact logs, and uploads.
- Sync queued changes when connectivity returns.
- Add conflict handling for edits made by another user.

## Phase 5 - Full ROW Operations

- Add structured contact history and owner communication workflows.
- Add acquisition offer tracking, approval thresholds, and payment status.
- Add damages workflow with inspection photos, assessed/negotiated/paid amounts, and releases.
- Add document templates for letters, offers, easements, damage releases, and checklists.
- Add project bottleneck dashboards and exportable status reports.

## Immediate Sprint

1. Implement note/comment API routes.
2. Implement document/photo upload API routes.
3. Wire parcel detail UI buttons.
4. Add mobile capture inputs.
5. Build and test.
