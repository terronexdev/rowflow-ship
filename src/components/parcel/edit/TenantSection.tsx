'use client';

import { Button, Grid, TextField } from '@mui/material';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import { SummaryLine, SChip, dash } from '@/components/parcel/sectionSummary';

export type TenantInfoFields = {
  tenantName: string;
  tenantAddress: string;
  tenantPhone: string;
  tenantEmail: string;
  tenantNotes: string;
};

export default function TenantSection({
  parcelId,
  tenantInfo,
  setTenantInfo,
  saving,
  setSaving,
  setSaveError,
  onSaved,
}: {
  parcelId: string;
  tenantInfo: TenantInfoFields;
  setTenantInfo: (v: TenantInfoFields) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setSaveError: (v: string | null) => void;
  onSaved: () => void;
}) {
  return (
    <CollapsibleSection
      id="tenant"
      title="Tenant"
      defaultOpen={false}
      summary={
        <SummaryLine>
          <SChip label={`Tenant: ${dash(tenantInfo.tenantName)}`} fill />
          <SChip label={`Phone: ${dash(tenantInfo.tenantPhone)}`} />
          <SChip label={`Email: ${dash(tenantInfo.tenantEmail)}`} />
        </SummaryLine>
      }
    >
      <Grid container spacing={2}>
        {(
          [
            ['tenantName', 'Tenant name(s)'],
            ['tenantAddress', 'Address'],
            ['tenantPhone', 'Phone'],
            ['tenantEmail', 'Email'],
          ] as const
        ).map(([name, label]) => (
          <Grid item xs={12} md={6} key={name}>
            <TextField
              fullWidth
              label={label}
              value={tenantInfo[name]}
              onChange={(e) => setTenantInfo({ ...tenantInfo, [name]: e.target.value })}
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Tenant notes"
            value={tenantInfo.tenantNotes}
            onChange={(e) => setTenantInfo({ ...tenantInfo, tenantNotes: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setSaveError(null);
              try {
                const res = await fetch(`/api/parcels/${parcelId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(tenantInfo),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.error || 'Failed to save tenant');
                }
                onSaved();
              } catch (e: any) {
                setSaveError(e.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            Save Tenant
          </Button>
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
}
