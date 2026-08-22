import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// Project Schemas
// ============================================

export const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  status: z.string().default('Active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clientName: z.string().optional(),
  contractNumber: z.string().optional(),
  workOrderNumber: z.string().optional(),
  projectType: z.string().optional(),
  projectCode: z.string().optional(),
  landBudget: z.number().optional(),
  laborBudget: z.number().optional(),
  offerRangeLowPct: z.number().min(0).max(5).optional(),
  offerRangeHighPct: z.number().min(0).max(5).optional(),
  mileageRate: z.number().min(0).max(20).optional(),
  /** Engineering alignment / route GeoJSON (FeatureCollection or Geometry) */
  centerlineData: z.any().optional().nullable(),
  /** Corridor / ROW extents GeoJSON */
  rowExtents: z.any().optional().nullable(),
});

export const updateProjectSchema = projectSchema.partial();

export const statusCategoryEnum = z.enum([
  'GENERAL', 'TITLE', 'SURVEY', 'APPRAISAL', 'ACQUISITION', 'CONDEMNATION',
  'SPECIAL_CONDITIONS', 'DAMAGES', 'PTS', 'COMPENSATION', 'LABOR', 'PERMIT', 'PROJECT', 'LEGAL',
  'EXISTING_RIGHTS',
  'ENCROACHMENT',
]);

export const ptsStatusEnum = z.enum([
  'NOT_STARTED', 'REQUESTED', 'GRANTED', 'DENIED', 'ON_HOLD', 'EXPIRED', 'NOT_REQUIRED',
]);

export const assignmentRoleEnum = z.enum([
  'MANAGER',
  'LEAD_AGENT',
  'AGENT',
  'TITLE',
  'SURVEY',
  'APPRAISAL',
  'LEGAL',
  'CONSTRUCTION_SUPPORT',
  'PERMIT',
  'RECORDS_AGENT',
  'COORDINATOR',
]);
export const landUseEnum = z.enum([
  'AGRICULTURE', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'FOREST', 'VACANT', 'PUBLIC', 'OTHER',
]);
export const matrixUnitEnum = z.enum(['PER_ACRE', 'PER_SQFT', 'FLAT']);
export const budgetCategoryEnum = z.enum([
  'LAND',
  'PERMITS',
  'ROW_LABOR',
  'TITLE_LABOR',
  'SURVEY_LABOR',
  'APPRAISAL',
  'LEGAL',
  'CONSTRUCTION_LABOR',
  'EXPENSES',
  'MILEAGE',
  'DAMAGES',
  'OTHER',
]);
export const permitTypeEnum = z.enum([
  'ENVIRONMENTAL', 'HIGHWAY', 'RAILROAD', 'UTILITY', 'LOCAL', 'FEDERAL', 'OTHER',
]);
export const permitStatusEnum = z.enum([
  'NOT_STARTED', 'PREPARING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'EXPIRED', 'CLOSED',
]);

export const matrixRowSchema = z.object({
  id: z.string().optional(),
  landUse: landUseEnum,
  customLabel: z.string().optional().nullable(),
  unit: matrixUnitEnum.default('PER_ACRE'),
  minAmount: z.number(),
  maxAmount: z.number(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const matrixPutSchema = z.object({
  rows: z.array(matrixRowSchema),
});

export const rolesPutSchema = z.object({
  managerId: z.string().cuid().nullable().optional(),
  leadAgentId: z.string().cuid().nullable().optional(),
  agentId: z.string().cuid().nullable().optional(),
});

export const roleRatesPutSchema = z.object({
  rates: z.array(z.object({
    role: assignmentRoleEnum,
    hourlyRate: z.number().nonnegative(),
  })),
});

export const budgetLineSchema = z.object({
  id: z.string().optional(),
  category: budgetCategoryEnum,
  label: z.string().optional().nullable(),
  mode: z.enum(['TOTAL', 'HOURS_X_RATE', 'PER_PARCEL']).default('TOTAL'),
  amount: z.number().optional().nullable(),
  hours: z.number().optional().nullable(),
  rate: z.number().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const budgetPutSchema = z.object({
  lines: z.array(budgetLineSchema),
});

export const schedulePhaseSchema = z.object({
  phaseKey: z.string(),
  track: z.enum(['ROW', 'CONSTRUCTION']),
  label: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isComplete: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const schedulePutSchema = z.object({
  phases: z.array(schedulePhaseSchema),
});

export const contactLogSchema = z.object({
  contactType: z
    .enum(['PHONE', 'EMAIL', 'LETTER', 'IN_PERSON', 'TEXT', 'MEETING', 'OTHER'])
    .default('PHONE'),
  contactDate: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  summary: z.string().min(1, 'Summary is required'),
  outcome: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
});

export const contactLogUpdateSchema = contactLogSchema.partial();

export const permitSchema = z.object({
  name: z.string().min(1),
  permitType: permitTypeEnum.default('OTHER'),
  status: permitStatusEnum.default('NOT_STARTED'),
  parcelId: z.string().cuid().optional().nullable(),
  agency: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  submittedDate: z.string().optional().nullable(),
  approvedDate: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  permitteeName: z.string().optional().nullable(),
  permitteeOrg: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal('')).nullable(),
  contactAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const parcelLabelCodeEnum = z.enum([
  'CONSERVATION_EASEMENT',
  'ENCROACHMENT_RISK',
  'WORK_PERMIT_REQUIRED',
  'RAILROAD',
  'HIGHWAY_ROW',
  'UTILITY_CROSSING',
  'ENVIRONMENTAL_SENSITIVE',
  'HISTORIC_CULTURAL',
  'OTHER',
]);

export const parcelLabelsPutSchema = z.object({
  labels: z.array(
    z.object({
      code: parcelLabelCodeEnum,
      note: z.string().optional().nullable(),
    })
  ),
});

export const permitPhaseStatusEnum = z.enum([
  'NOT_STARTED',
  'IDENTIFIED',
  'IN_PREP',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'DENIED',
  'EXPIRED',
  'NOT_REQUIRED',
  'HOLD',
]);

export const parcelPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);

export const compensationOfferSchema = z.object({
  /** Optional — defaults to parcel.matrixLandUse from Survey/take */
  landUse: landUseEnum.optional(),
  landUseLabel: z.string().optional().nullable(),
  matrixRowId: z.string().optional().nullable(),
  /** Optional — defaults to parcel easement take acres */
  easementAcres: z.number().positive().optional(),
  negotiatedAmount: z.number(),
  damages: z.number().optional().default(0),
  otherAmount: z.number().optional().default(0),
  outsideRangeReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  decision: z
    .enum([
      'DRAFT',
      'OFFERED',
      'PENDING_REVIEW',
      'ACCEPTED',
      'REJECTED',
      'SUPERSEDED',
      'WITHDRAWN',
    ])
    .optional(),
});

export const laborEntrySchema = z.object({
  workDate: z.string().min(1),
  hours: z.number().positive(),
  role: assignmentRoleEnum.optional(),
  description: z.string().optional().nullable(),
  billable: z.boolean().optional().default(true),
});

export const costDisciplineEnum = z.enum([
  'ROW',
  'TITLE',
  'SURVEY',
  'APPRAISAL',
  'LEGAL',
  'CONSTRUCTION',
  'PERMITTING',
  'GENERAL',
]);
export const costEntryTypeEnum = z.enum(['TIME', 'FEE', 'EXPENSE', 'MILEAGE']);
export const costFeeCodeEnum = z.enum([
  'APPRAISAL',
  'EDIT',
  'UPDATE',
  'EXHIBIT',
  'FILING',
  'OTHER',
]);
export const costExpenseCategoryEnum = z.enum([
  'MILEAGE',
  'LODGING',
  'MEALS',
  'FILING',
  'COURIER',
  'SUPPLIES',
  'OTHER',
]);

export const parcelCostEntrySchema = z
  .object({
    discipline: costDisciplineEnum,
    entryType: costEntryTypeEnum,
    workDate: z.string().min(1),
    hours: z.number().positive().optional(),
    role: assignmentRoleEnum.optional(),
    feeCode: costFeeCodeEnum.optional().nullable(),
    feeAmount: z.number().nonnegative().optional(),
    expenseCategory: costExpenseCategoryEnum.optional().nullable(),
    expenseAmount: z.number().nonnegative().optional(),
    miles: z.number().positive().optional(),
    mileageRate: z.number().positive().optional(),
    vendor: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    billable: z.boolean().optional().default(true),
  })
  .superRefine((d, ctx) => {
    if (d.entryType === 'TIME' && !(d.hours && d.hours > 0)) {
      ctx.addIssue({ code: 'custom', message: 'Hours required for time entries', path: ['hours'] });
    }
    if (d.entryType === 'FEE' && (d.feeAmount == null || d.feeAmount < 0)) {
      ctx.addIssue({ code: 'custom', message: 'Fee amount required', path: ['feeAmount'] });
    }
    if (d.entryType === 'EXPENSE' && (d.expenseAmount == null || d.expenseAmount < 0)) {
      ctx.addIssue({ code: 'custom', message: 'Expense amount required', path: ['expenseAmount'] });
    }
    if (d.entryType === 'MILEAGE' && !(d.miles && d.miles > 0)) {
      ctx.addIssue({ code: 'custom', message: 'Miles required', path: ['miles'] });
    }
  });

// ============================================
// Parcel Schemas
// ============================================

export const parcelSchema = z.object({
  projectId: z.string().cuid(),
  parcelNumber: z.string().optional(),
  pin: z.string().optional(),
  easementNumber: z.string().optional().nullable(),
  newStructureNumbers: z.string().optional().nullable(),
  existingStructureNumbers: z.string().optional().nullable(),
  owner: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerCity: z.string().optional(),
  ownerState: z.string().optional(),
  ownerZip: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  legalDesc: z.string().optional(),
  county: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED']).default('NOT_STARTED'),
  titleStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'CURATIVE', 'HOLD']).default('NOT_STARTED'),
  surveyStatus: z.enum(['NOT_STARTED', 'ORDERED', 'FIELD_WORK', 'DRAFTING', 'REVIEW', 'COMPLETE', 'HOLD']).default('NOT_STARTED'),
  appraisalStatus: z.enum(['NOT_STARTED', 'ORDERED', 'INSPECTION_SCHEDULED', 'DRAFT_RECEIVED', 'UNDER_REVIEW', 'FINAL', 'HOLD']).default('NOT_STARTED'),
  acquisitionStatus: z.enum(['NOT_STARTED', 'OWNER_CONTACTED', 'OFFER_PREPARED', 'OFFER_PRESENTED', 'NEGOTIATING', 'AGREEMENT_REACHED', 'CLOSING', 'ACQUIRED', 'CONDEMNATION_RECOMMENDED', 'HOLD']).default('NOT_STARTED'),
  condemnationStatus: z.enum(['NOT_STARTED', 'NOTICE_SENT', 'PETITION_FILED', 'SERVED', 'HEARING_SCHEDULED', 'AWARD_ISSUED', 'APPEALED', 'TRIAL', 'JUDGMENT', 'POSSESSION_GRANTED', 'COMPLETE']).default('NOT_STARTED'),
  damagesStatus: z.enum(['NOT_STARTED', 'INVESTIGATE', 'REPORT', 'RESOLVED']).default('NOT_STARTED'),
  specialConditionsStatus: z.enum(['NOT_STARTED', 'NOTIFICATION_REQUIRED', 'LOCKED_GATE', 'HERBICIDES', 'FORESTRY', 'OTHER']).default('NOT_STARTED'),
  existingRightsStatus: z
    .enum(['NOT_REVIEWED', 'NONE', 'RESTRICTED', 'SUPPLEMENT_NEEDED', 'SUPPLEMENT_ACQUIRED'])
    .default('NOT_REVIEWED'),
  parcelClass: z.enum(['UNKNOWN', 'GREENFIELD', 'BROWNFIELD', 'THIRD_PARTY']).default('UNKNOWN'),
  encroachmentStatus: z
    .enum(['NOT_REVIEWED', 'NONE', 'IDENTIFIED', 'NEEDS_REMOVAL', 'CAN_REMAIN', 'REMOVED'])
    .default('NOT_REVIEWED'),
  ptsStatus: ptsStatusEnum.default('NOT_STARTED'),
  permitStatus: permitPhaseStatusEnum.default('NOT_STARTED'),
  bookmarked: z.boolean().optional(),
  priority: parcelPriorityEnum.optional(),
  sequence: z.number().int().positive().optional(),
  milepost: z.number().positive().optional(),
  geometry: z.any().optional(), // GeoJSON
  acreage: z.number().positive().optional(),
  easementAcres: z.number().optional(),
  easementAcresToAcquire: z.number().optional(),
  tceAcres: z.number().optional().nullable(),
  matrixLandUse: landUseEnum.optional().nullable(),
  matrixLandUseLabel: z.string().optional().nullable(),
  titledOwnerName: z.string().optional().nullable(),
  titledOwnerAddress: z.string().optional().nullable(),
  titledOwnerCity: z.string().optional().nullable(),
  titledOwnerState: z.string().optional().nullable(),
  titledOwnerZip: z.string().optional().nullable(),
  titledOwnerPhone: z.string().optional().nullable(),
  titledOwnerEmail: z.string().email().optional().or(z.literal('')).nullable(),
  titledOwnerTaxId: z.string().optional().nullable(),
  titledOwnerDistrict: z.string().optional().nullable(),
  titledLegalDescription: z.string().optional().nullable(),
  tenantName: z.string().optional().nullable(),
  tenantAddress: z.string().optional().nullable(),
  tenantPhone: z.string().optional().nullable(),
  tenantEmail: z.string().email().optional().or(z.literal('')).nullable(),
  tenantNotes: z.string().optional().nullable(),
  propertyAddress: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});

export const updateParcelSchema = parcelSchema.partial().omit({ projectId: true });

export const bulkUpdateParcelStatusSchema = z.object({
  parcelIds: z.array(z.string().cuid()),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED']),
});

// ============================================
// Note Schemas
// ============================================

export const noteSchema = z.object({
  parcelId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  permitId: z.string().cuid().optional(),
  content: z.string().min(1, 'Note content is required'),
  category: statusCategoryEnum.default('GENERAL'),
}).refine((d) => [d.parcelId, d.projectId, d.permitId].filter(Boolean).length === 1, {
  message: 'Exactly one of parcelId, projectId, permitId is required',
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').optional(),
  category: statusCategoryEnum.optional(),
});

// ============================================
// Document Schemas
// ============================================

export const documentSchema = z.object({
  parcelId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  permitId: z.string().cuid().optional(),
  name: z.string().min(1, 'Document name is required'),
  type: z.string(),
  category: statusCategoryEnum.default('GENERAL'),
  url: z.string().url(),
  size: z.number().int().positive(),
  mimeType: z.string(),
  label: z.string().optional(),
}).refine((d) => [d.parcelId, d.projectId, d.permitId].filter(Boolean).length === 1, {
  message: 'Exactly one of parcelId, projectId, permitId is required',
});

// ============================================
// Export Schemas
// ============================================

export const exportSchema = z.object({
  projectId: z.string().cuid(),
  format: z.enum(['csv', 'pdf']),
  sortBy: z.enum(['sequence', 'milepost', 'status', 'county']).optional(),
  filterStatus: z.array(z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACQUIRED', 'CONDEMNED', 'RELOCATED'])).optional(),
  filterCounty: z.array(z.string()).optional(),
});

// ============================================
// Import Schemas
// ============================================

export const importParcelSchema = z.object({
  projectId: z.string().cuid(),
  file: z.any(), // File upload
  format: z.enum(['kmz', 'kml', 'geojson', 'csv']),
});

export const existingRightSchema = z.object({
  instrumentNumber: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  rightType: z
    .enum(['EASEMENT', 'ROW', 'LICENSE', 'COVENANT', 'LEASE', 'OTHER'])
    .default('EASEMENT'),
  purpose: z
    .enum([
      'INGRESS_EGRESS',
      'UTILITY',
      'PIPELINE',
      'RAIL',
      'ACCESS',
      'DRAINAGE',
      'ELECTRIC',
      'TELECOM',
      'OTHER',
    ])
    .default('OTHER'),
  grantor: z.string().optional().nullable(),
  grantee: z.string().optional().nullable(),
  county: z.string().optional().nullable(),
  recordingBook: z.string().optional().nullable(),
  recordingPage: z.string().optional().nullable(),
  recordingInstrument: z.string().optional().nullable(),
  recordingDate: z.string().optional().nullable(),
  widthFeet: z.number().optional().nullable(),
  widthNotes: z.string().optional().nullable(),
  termNotes: z.string().optional().nullable(),
  lifeStatus: z.enum(['ACTIVE', 'RELEASED', 'EXPIRED', 'UNKNOWN']).default('ACTIVE'),
  restrictionFlags: z.array(z.string()).optional().nullable(),
  restrictionsNote: z.string().optional().nullable(),
  affectsProject: z.boolean().optional().nullable(),
  geometry: z.any().optional().nullable(),
  geometrySource: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  /** When creating from a parcel, link that parcel */
  parcelId: z.string().cuid().optional().nullable(),
  impact: z.enum(['FULL', 'PARTIAL', 'UNKNOWN']).optional(),
  linkNote: z.string().optional().nullable(),
  /** If true and instrument # matches, link existing instead of erroring */
  linkIfMatch: z.boolean().optional().default(true),
});

export const updateExistingRightSchema = existingRightSchema.partial().omit({
  parcelId: true,
  linkIfMatch: true,
  impact: true,
  linkNote: true,
});

export const existingRightLinkSchema = z.object({
  parcelId: z.string().cuid(),
  impact: z.enum(['FULL', 'PARTIAL', 'UNKNOWN']).optional().default('UNKNOWN'),
  note: z.string().optional().nullable(),
});

export const parcelEncroachmentSchema = z.object({
  encroachmentType: z
    .enum([
      'BUILDING',
      'SHED',
      'FENCE',
      'DRIVEWAY',
      'PARKING',
      'SEPTIC',
      'WELL',
      'CROP_ORCHARD',
      'LANDSCAPING',
      'UTILITIES',
      'STOCKPILE',
      'OTHER',
    ])
    .default('OTHER'),
  description: z.string().optional().nullable(),
  locationNote: z.string().optional().nullable(),
  disposition: z
    .enum(['IDENTIFIED', 'NEEDS_REMOVAL', 'CAN_REMAIN', 'REMOVED'])
    .default('IDENTIFIED'),
  inPermanentEasement: z.enum(['YES', 'NO', 'UNKNOWN']).optional().default('UNKNOWN'),
  inTce: z.enum(['YES', 'NO', 'UNKNOWN']).optional().default('UNKNOWN'),
  ownerResponsibility: z
    .enum(['OWNER', 'COMPANY', 'SHARED', 'UNKNOWN'])
    .optional()
    .default('UNKNOWN'),
  agreementRef: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  actualCost: z.number().optional().nullable(),
  costNotes: z.string().optional().nullable(),
  identifiedDate: z.string().optional().nullable(),
  resolvedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  /** When true, set parcel encroachmentStatus from worst item after write */
  applyStatusRollup: z.boolean().optional().default(true),
});

export const updateParcelEncroachmentSchema = parcelEncroachmentSchema.partial();

// ============================================
// Type Exports
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type ProjectInput = z.infer<typeof projectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type ParcelInput = z.infer<typeof parcelSchema>;
export type UpdateParcelInput = z.infer<typeof updateParcelSchema>;
export type BulkUpdateParcelStatusInput = z.infer<typeof bulkUpdateParcelStatusSchema>;

export type NoteInput = z.infer<typeof noteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export type DocumentInput = z.infer<typeof documentSchema>;

export type ExportInput = z.infer<typeof exportSchema>;
export type ImportParcelInput = z.infer<typeof importParcelSchema>;
