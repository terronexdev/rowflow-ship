'use client';

import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import ContactLogPanel from '@/components/parcel/ContactLogPanel';
import { SummaryLine, SChip } from '@/components/parcel/sectionSummary';

export default function ContactsSection({ parcelId }: { parcelId: string }) {
  return (
    <CollapsibleSection
      id="contacts"
      title="Contacts"
      defaultOpen={false}
      summary={
        <SummaryLine>
          <SChip label="Landowner / tenant contact history" fill />
        </SummaryLine>
      }
    >
      <ContactLogPanel parcelId={parcelId} />
    </CollapsibleSection>
  );
}
