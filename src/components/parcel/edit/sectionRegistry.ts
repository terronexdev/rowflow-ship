import type { SectionNavItem } from '@/components/parcel/ParcelSectionNav';

/**
 * Canonical parcel edit section order (nav + future section ACL keys).
 * Keep IDs in sync with CollapsibleSection id= on the edit page.
 */
export const PARCEL_EDIT_SECTIONS: SectionNavItem[] = [
  { id: 'status-summary', label: 'Status' },
  { id: 'flags-attention', label: 'Flags' },
  { id: 'county', label: 'Identity' },
  { id: 'title', label: 'Title' },
  { id: 'tenant', label: 'Tenant' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'existing-rights', label: 'Existing rights' },
  { id: 'survey-take', label: 'Survey' },
  { id: 'appraisal', label: 'Appraisal' },
  { id: 'row-agent', label: 'ROW' },
  { id: 'encroachments', label: 'Encroachments' },
  { id: 'legal', label: 'Legal' },
  { id: 'permitting', label: 'Permitting' },
  { id: 'construction-support', label: 'Construction' },
  { id: 'general-notes', label: 'Notes' },
  { id: 'general-docs', label: 'Docs' },
];

/** Map section id → role keys that may write (Phase 4 ACL; not enforced yet). */
export const SECTION_WRITE_ROLES: Record<string, string[]> = {
  title: ['MANAGER', 'LEAD_AGENT', 'TITLE', 'COORDINATOR'],
  'survey-take': ['MANAGER', 'LEAD_AGENT', 'SURVEY', 'COORDINATOR'],
  appraisal: ['MANAGER', 'LEAD_AGENT', 'APPRAISAL', 'COORDINATOR'],
  'row-agent': ['MANAGER', 'LEAD_AGENT', 'AGENT', 'COORDINATOR'],
  contacts: ['MANAGER', 'LEAD_AGENT', 'AGENT', 'TITLE', 'COORDINATOR'],
  legal: ['MANAGER', 'LEAD_AGENT', 'LEGAL', 'COORDINATOR'],
  permitting: ['MANAGER', 'LEAD_AGENT', 'AGENT', 'COORDINATOR'],
  'existing-rights': ['MANAGER', 'LEAD_AGENT', 'AGENT', 'TITLE', 'RECORDS_AGENT', 'COORDINATOR'],
  encroachments: ['MANAGER', 'LEAD_AGENT', 'AGENT', 'SURVEY', 'COORDINATOR'],
  'construction-support': ['MANAGER', 'LEAD_AGENT', 'AGENT', 'COORDINATOR'],
};
