/**
 * Status-related constants and utilities
 * Centralized definitions for parcel status types, colors, and labels
 */

// ============================================
// Status Type Definitions
// ============================================

export type StatusTab =
  | 'title'
  | 'survey'
  | 'appraisal'
  | 'acquisition'
  | 'condemnation'
  | 'special_conditions'
  | 'damages'
  | 'pts'
  | 'permit'
  | 'existing_rights'
  | 'parcel_class'
  | 'encroachments';

export interface StatusOption {
  value: string;
  label: string;
}

// ============================================
// Status Lists by Category
// ============================================

export const TITLE_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETE', label: 'Complete' },
  { value: 'CURATIVE', label: 'Curative' },
  { value: 'HOLD', label: 'Hold' },
];

/** Top-level parcel workflow (map color default) */
export const OVERALL_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ACQUIRED', label: 'Acquired' },
  { value: 'CONDEMNED', label: 'Condemned' },
  { value: 'RELOCATED', label: 'Relocated' },
];

export const ACQUISITION_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'OWNER_CONTACTED', label: 'Owner Contacted' },
  { value: 'OFFER_PREPARED', label: 'Offer Prepared' },
  { value: 'OFFER_PRESENTED', label: 'Offer Presented' },
  { value: 'NEGOTIATING', label: 'Negotiating' },
  { value: 'AGREEMENT_REACHED', label: 'Agreement Reached' },
  { value: 'CLOSING', label: 'Closing' },
  { value: 'ACQUIRED', label: 'Acquired' },
  { value: 'CONDEMNATION_RECOMMENDED', label: 'Condemnation Recommended' },
  { value: 'HOLD', label: 'Hold' },
];

export const SURVEY_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'FIELD_WORK', label: 'Field Work' },
  { value: 'DRAFTING', label: 'Drafting' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'COMPLETE', label: 'Complete' },
  { value: 'HOLD', label: 'Hold' },
];

export const APPRAISAL_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'INSPECTION_SCHEDULED', label: 'Inspection Scheduled' },
  { value: 'DRAFT_RECEIVED', label: 'Draft Received' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'FINAL', label: 'Final' },
  { value: 'HOLD', label: 'Hold' },
];

export const CONDEMNATION_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'NOTICE_SENT', label: 'Notice Sent' },
  { value: 'PETITION_FILED', label: 'Petition Filed' },
  { value: 'SERVED', label: 'Served' },
  { value: 'HEARING_SCHEDULED', label: 'Hearing Scheduled' },
  { value: 'AWARD_ISSUED', label: 'Award Issued' },
  { value: 'APPEALED', label: 'Appealed' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'JUDGMENT', label: 'Judgment' },
  { value: 'POSSESSION_GRANTED', label: 'Possession Granted' },
  { value: 'COMPLETE', label: 'Complete' },
];

export const SPECIAL_CONDITIONS_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'NOTIFICATION_REQUIRED', label: 'Notification Required' },
  { value: 'LOCKED_GATE', label: 'Locked Gate' },
  { value: 'HERBICIDES', label: 'Herbicides' },
  { value: 'FORESTRY', label: 'Forestry' },
  { value: 'OTHER', label: 'Other' },
];

export const DAMAGES_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'INVESTIGATE', label: 'Investigate' },
  { value: 'REPORT', label: 'Report' },
  { value: 'RESOLVED', label: 'Resolved' },
];

/** Permission to Survey */
export const PTS_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'GRANTED', label: 'Granted' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'NOT_REQUIRED', label: 'Not Required' },
];

/** Parcel permitting phase (child filings use project Permit status list) */
export const PERMIT_PHASE_STATUSES: StatusOption[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IDENTIFIED', label: 'Identified' },
  { value: 'IN_PREP', label: 'In Prep' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'NOT_REQUIRED', label: 'Not Required' },
  { value: 'HOLD', label: 'Hold' },
];

/** Parcel research / rights strategy for Existing rights section */
export const EXISTING_RIGHTS_STATUSES: StatusOption[] = [
  { value: 'NOT_REVIEWED', label: 'Not reviewed' },
  { value: 'NONE', label: 'None (greenfield / clear)' },
  { value: 'RESTRICTED', label: 'Restricted' },
  { value: 'SUPPLEMENT_NEEDED', label: 'Supplement needed' },
  { value: 'SUPPLEMENT_ACQUIRED', label: 'Supplement acquired' },
];

/** Corridor role — why the tract is on the job */
export const PARCEL_CLASS_OPTIONS: StatusOption[] = [
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'GREENFIELD', label: 'Greenfield' },
  { value: 'BROWNFIELD', label: 'Brownfield' },
  { value: 'THIRD_PARTY', label: '3rd party' },
];

export const PARCEL_CLASS_SHORT: Record<string, string> = {
  UNKNOWN: '?',
  GREENFIELD: 'GF',
  BROWNFIELD: 'BF',
  THIRD_PARTY: '3P',
};

/** Parcel rollup for Encroachments section / Color-by */
export const ENCROACHMENT_STATUSES: StatusOption[] = [
  { value: 'NOT_REVIEWED', label: 'Not reviewed' },
  { value: 'NONE', label: 'None / clear' },
  { value: 'IDENTIFIED', label: 'Identified' },
  { value: 'NEEDS_REMOVAL', label: 'Needs removal' },
  { value: 'CAN_REMAIN', label: 'Can remain' },
  { value: 'REMOVED', label: 'Removed' },
];

// ============================================
// Status Color Mappings
// ============================================

export const STATUS_COLORS: Record<string, string> = {
  // Common statuses
  NOT_STARTED: '#9e9e9e', // Gray
  IN_PROGRESS: '#2196f3', // Blue

  // Acquisition statuses
  ACQUIRED: '#4caf50', // Green
  CONDEMNED: '#ff9800', // Orange
  RELOCATED: '#9c27b0', // Purple
  OWNER_CONTACTED: '#03a9f4',
  OFFER_PREPARED: '#3f51b5',
  OFFER_PRESENTED: '#673ab7',
  NEGOTIATING: '#ff9800',
  AGREEMENT_REACHED: '#8bc34a',
  CLOSING: '#009688',
  CONDEMNATION_RECOMMENDED: '#e91e63',

  // Survey/appraisal/condemnation statuses
  ORDERED: '#03a9f4',
  FIELD_WORK: '#2196f3',
  DRAFTING: '#3f51b5',
  REVIEW: '#ff9800',
  INSPECTION_SCHEDULED: '#03a9f4',
  DRAFT_RECEIVED: '#3f51b5',
  UNDER_REVIEW: '#ff9800',
  FINAL: '#4caf50',
  NOTICE_SENT: '#03a9f4',
  PETITION_FILED: '#ff9800',
  SERVED: '#9c27b0',
  HEARING_SCHEDULED: '#673ab7',
  AWARD_ISSUED: '#8bc34a',
  APPEALED: '#f44336',
  TRIAL: '#e91e63',
  JUDGMENT: '#4caf50',
  POSSESSION_GRANTED: '#009688',

  // Title statuses
  COMPLETE: '#4caf50', // Green
  CURATIVE: '#ff5722', // Deep Orange
  HOLD: '#f44336', // Red

  // Damages statuses
  INVESTIGATE: '#ffc107', // Amber
  REPORT: '#ff9800', // Orange
  RESOLVED: '#4caf50', // Green

  // Special Conditions statuses
  NOTIFICATION_REQUIRED: '#2196f3', // Blue
  LOCKED_GATE: '#ff9800', // Orange
  HERBICIDES: '#8bc34a', // Light Green
  FORESTRY: '#795548', // Brown
  OTHER: '#607d8b', // Blue Gray

  // PTS
  REQUESTED: '#3b82f6',
  GRANTED: '#22c55e',
  DENIED: '#ef4444',
  ON_HOLD: '#f59e0b',
  EXPIRED: '#f97316',
  NOT_REQUIRED: '#94a3b8',

  // Parcel permit phase
  IDENTIFIED: '#06b6d4',
  IN_PREP: '#0ea5e9',
  // SUBMITTED / UNDER_REVIEW / APPROVED / HOLD shared with other tracks
  // DENIED / EXPIRED / NOT_REQUIRED above
  // Existing rights strategy
  NOT_REVIEWED: '#9e9e9e',
  NONE: '#4caf50', // clear / greenfield-style
  RESTRICTED: '#ff9800',
  SUPPLEMENT_NEEDED: '#f44336',
  SUPPLEMENT_ACQUIRED: '#2e7d32',

  // Parcel class (corridor role)
  UNKNOWN: '#9e9e9e',
  GREENFIELD: '#66bb6a',
  BROWNFIELD: '#8d6e63',
  THIRD_PARTY: '#7e57c2',

  // Encroachment disposition (IDENTIFIED shared with permit phase color)
  NEEDS_REMOVAL: '#f44336',
  CAN_REMAIN: '#8bc34a',
  REMOVED: '#2e7d32',

  NOT_APPLICABLE: '#64748b',

  // Default
  DEFAULT: '#757575', // Medium Gray
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the color for a given status
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || STATUS_COLORS.DEFAULT;
}

/**
 * Get the list of statuses for a given tab/category
 */
export function getStatusList(tab: StatusTab): StatusOption[] {
  switch (tab) {
    case 'title':
      return TITLE_STATUSES;
    case 'survey':
      return SURVEY_STATUSES;
    case 'appraisal':
      return APPRAISAL_STATUSES;
    case 'acquisition':
      return ACQUISITION_STATUSES;
    case 'condemnation':
      return CONDEMNATION_STATUSES;
    case 'special_conditions':
      return SPECIAL_CONDITIONS_STATUSES;
    case 'damages':
      return DAMAGES_STATUSES;
    case 'pts':
      return PTS_STATUSES;
    case 'permit':
      return PERMIT_PHASE_STATUSES;
    case 'existing_rights':
      return EXISTING_RIGHTS_STATUSES;
    case 'parcel_class':
      return PARCEL_CLASS_OPTIONS;
    case 'encroachments':
      return ENCROACHMENT_STATUSES;
    default:
      return [];
  }
}

/**
 * Get the display label for a status value
 */
export function getStatusLabel(status: string, tab: StatusTab): string {
  const statusList = getStatusList(tab);
  const statusOption = statusList.find(s => s.value === status);
  return statusOption?.label || status;
}

/**
 * Get all unique status values across all categories
 */
export function getAllStatuses(): string[] {
  return [
    ...TITLE_STATUSES,
    ...SURVEY_STATUSES,
    ...APPRAISAL_STATUSES,
    ...ACQUISITION_STATUSES,
    ...CONDEMNATION_STATUSES,
    ...SPECIAL_CONDITIONS_STATUSES,
    ...DAMAGES_STATUSES,
    ...PTS_STATUSES,
    ...PERMIT_PHASE_STATUSES,
    ...EXISTING_RIGHTS_STATUSES,
    ...PARCEL_CLASS_OPTIONS,
    ...ENCROACHMENT_STATUSES,
  ]
    .map(s => s.value)
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
}

/**
 * Check if a status value is valid for a given category
 */
export function isValidStatus(status: string, tab: StatusTab): boolean {
  const statusList = getStatusList(tab);
  return statusList.some(s => s.value === status);
}
