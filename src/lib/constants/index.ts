/**
 * Centralized constants for ROWFlow (Terronex suite)
 */

export * from './status';
export * from './subscription';

// ============================================
// Map Configuration
// ============================================

export const MAP_CONFIG = {
  DEFAULT_CENTER: [39.8283, -98.5795] as [number, number], // Geographic center of USA
  DEFAULT_ZOOM: 5,
  MAX_ZOOM: 20,
  MIN_ZOOM: 3,
} as const;

// ============================================
// Project Configuration
// ============================================

export const PROJECT_STATUSES = [
  { value: 'Planning', label: 'Planning' },
  { value: 'Active', label: 'Active' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Archived', label: 'Archived' },
] as const;

export const LAND_USE_OPTIONS = [
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'FOREST', label: 'Forest' },
  { value: 'VACANT', label: 'Vacant' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const MATRIX_UNIT_OPTIONS = [
  { value: 'PER_ACRE', label: 'Per acre' },
  { value: 'PER_SQFT', label: 'Per sq ft' },
  { value: 'FLAT', label: 'Flat' },
] as const;

export const ASSIGNMENT_ROLE_OPTIONS = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'LEAD_AGENT', label: 'Lead Agent' },
  { value: 'AGENT', label: 'ROW Agent' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'RECORDS_AGENT', label: 'Records agent' },
  { value: 'TITLE', label: 'Title' },
  { value: 'SURVEY', label: 'Survey' },
  { value: 'APPRAISAL', label: 'Appraisal' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'CONSTRUCTION_SUPPORT', label: 'Construction support' },
  { value: 'PERMIT', label: 'Permitting' },
] as const;

/** Roles that receive counter-offer / OOR review emails */
export const COUNTER_OFFER_ROLES = ['MANAGER', 'LEAD_AGENT'] as const;

/** All assignment role values (for rates, invites, zod) */
export const ASSIGNMENT_ROLE_VALUES = ASSIGNMENT_ROLE_OPTIONS.map((r) => r.value);

export const BUDGET_CATEGORY_OPTIONS = [
  { value: 'LAND', label: 'Land' },
  { value: 'ENCROACHMENTS', label: 'Encroachments' },
  { value: 'PERMITS', label: 'Permits' },
  { value: 'ROW_LABOR', label: 'ROW Labor' },
  { value: 'TITLE_LABOR', label: 'Title Labor' },
  { value: 'SURVEY_LABOR', label: 'Survey Labor' },
  { value: 'APPRAISAL', label: 'Appraisal' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'CONSTRUCTION_LABOR', label: 'Construction support' },
  { value: 'EXPENSES', label: 'Expenses' },
  { value: 'MILEAGE', label: 'Mileage' },
  { value: 'DAMAGES', label: 'Damages' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const BUDGET_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BUDGET_CATEGORY_OPTIONS.map((c) => [c.value, c.label])
);

export const PERMIT_TYPE_OPTIONS = [
  { value: 'ENVIRONMENTAL', label: 'Environmental' },
  { value: 'HIGHWAY', label: 'Highway' },
  { value: 'RAILROAD', label: 'Railroad' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'FEDERAL', label: 'Federal' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const PERMIT_STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

/** Parcel-level permitting phase (Color-by). Child Permit rows use PERMIT_STATUS_OPTIONS. */
export const PARCEL_PERMIT_PHASE_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IDENTIFIED', label: 'Identified' },
  { value: 'IN_PREP', label: 'In prep' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'NOT_REQUIRED', label: 'Not required' },
  { value: 'HOLD', label: 'Hold' },
] as const;

/** Fixed constraint labels — map hatch + list chips */
export const PARCEL_LABEL_OPTIONS = [
  { value: 'CONSERVATION_EASEMENT', label: 'Conservation easement', short: 'CE' },
  { value: 'ENCROACHMENT_RISK', label: 'Encroachment risk', short: 'ENC' },
  { value: 'WORK_PERMIT_REQUIRED', label: 'Work permit required', short: 'WPR' },
  { value: 'RAILROAD', label: 'Railroad', short: 'RR' },
  { value: 'HIGHWAY_ROW', label: 'Highway ROW', short: 'HWY' },
  { value: 'UTILITY_CROSSING', label: 'Utility crossing', short: 'UTL' },
  { value: 'ENVIRONMENTAL_SENSITIVE', label: 'Environmental / sensitive', short: 'ENV' },
  { value: 'HISTORIC_CULTURAL', label: 'Historic / cultural', short: 'HIS' },
  { value: 'OTHER', label: 'Other', short: 'OTH' },
] as const;

export const PARCEL_LABEL_LABELS: Record<string, string> = Object.fromEntries(
  PARCEL_LABEL_OPTIONS.map((o) => [o.value, o.label])
);

export const PARCEL_LABEL_SHORT: Record<string, string> = Object.fromEntries(
  PARCEL_LABEL_OPTIONS.map((o) => [o.value, o.short])
);

export const PARCEL_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

/** permitStatus values that count as “open” for filters (not hatch) */
export const OPEN_PERMIT_PHASE_STATUSES = [
  'IDENTIFIED',
  'IN_PREP',
  'SUBMITTED',
  'UNDER_REVIEW',
  'DENIED',
  'EXPIRED',
  'HOLD',
] as const;

export const ROW_SCHEDULE_PHASES = [
  { key: 'SCOPING_ESTIMATING', label: 'Scoping / Estimating', single: false },
  { key: 'DUE_DILIGENCE', label: 'Due Diligence', single: false },
  { key: 'SURVEYING', label: 'Surveying', single: false },
  { key: 'APPRAISAL', label: 'Appraisal', single: false },
  { key: 'ACQUISITION', label: 'Acquisition', single: false },
  { key: 'CONDEMNATION_FILING', label: 'Condemnation Filing', single: false },
  { key: 'CONDEMNATION_RESOLUTION', label: 'Condemnation Resolution', single: true },
] as const;

export const CONSTRUCTION_SCHEDULE_PHASES = [
  { key: 'PRELIMINARY_SURVEYS', label: 'Preliminary Surveys', single: false },
  { key: 'FORESTRY_CLEARING', label: 'Forestry Clearing', single: false },
  { key: 'ACCESS_ROADS', label: 'Access Roads', single: false },
  { key: 'LINE_CONSTRUCTION', label: 'Line Construction', single: false },
  { key: 'ISD', label: 'ISD', single: true },
  { key: 'CLOSEOUT', label: 'Closeout', single: false },
] as const;

export const DEFAULT_MATRIX_LAND_USES = [
  'AGRICULTURE',
  'RESIDENTIAL',
  'COMMERCIAL',
  'INDUSTRIAL',
  'FOREST',
  'VACANT',
  'PUBLIC',
] as const;


// ============================================
// Document Types
// ============================================

export const DOCUMENT_TYPES = [
  'Contract',
  'Survey',
  'Photo',
  'Legal',
  'Correspondence',
  'Report',
  'Other',
] as const;

// ============================================
// Note Categories
// ============================================

export const NOTE_CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'TITLE', label: 'Title' },
  { value: 'SURVEY', label: 'Survey' },
  { value: 'APPRAISAL', label: 'Appraisal' },
  { value: 'ACQUISITION', label: 'Acquisition' },
  { value: 'CONDEMNATION', label: 'Condemnation' },
  { value: 'SPECIAL_CONDITIONS', label: 'Special Conditions' },
  { value: 'DAMAGES', label: 'Damages' },
  { value: 'PTS', label: 'PTS' },
  { value: 'COMPENSATION', label: 'Compensation' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'LABOR', label: 'Labor' },
  { value: 'PERMIT', label: 'Permit' },
  { value: 'EXISTING_RIGHTS', label: 'Existing Rights' },
  { value: 'ENCROACHMENT', label: 'Encroachment' },
  { value: 'PROJECT', label: 'Project' },
] as const;

// ============================================
// Export Formats
// ============================================

export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  GEOJSON: 'geojson',
} as const;

// ============================================
// API Configuration
// ============================================

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ============================================
// Validation Constants
// ============================================

export const VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PARCEL_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_NOTE_LENGTH: 5000,
  MIN_PASSWORD_LENGTH: 8,
} as const;
