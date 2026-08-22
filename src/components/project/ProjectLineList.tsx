'use client';

import { useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridRowParams,
} from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  PARCEL_STATUS_FIELDS,
  type ParcelStatusKey,
} from '@/components/parcel/ParcelStatusPanel';
import { STATUS_COLORS } from '@/lib/constants/status';

export type LineListParcel = {
  id: string;
  parcelNumber?: string | null;
  pin?: string | null;
  easementNumber?: string | null;
  newStructureNumbers?: string | null;
  existingStructureNumbers?: string | null;
  owner?: string | null;
  status?: string | null;
  ptsStatus?: string | null;
  titleStatus?: string | null;
  surveyStatus?: string | null;
  appraisalStatus?: string | null;
  acquisitionStatus?: string | null;
  condemnationStatus?: string | null;
  damagesStatus?: string | null;
  specialConditionsStatus?: string | null;
  permitStatus?: string | null;
  existingRightsStatus?: string | null;
  parcelClass?: string | null;
  encroachmentStatus?: string | null;
  bookmarked?: boolean | null;
  priority?: string | null;
  lastCompensationTotal?: number | string | null;
  lastCompensationOutsideRange?: boolean | null;
  labels?: { code: string; note?: string | null }[];
  sequence?: number | null;
};

const MATRIX_FIELDS: ParcelStatusKey[] = [
  'status',
  'parcelClass',
  'existingRightsStatus',
  'encroachmentStatus',
  'ptsStatus',
  'titleStatus',
  'surveyStatus',
  'appraisalStatus',
  'acquisitionStatus',
  'permitStatus',
  'condemnationStatus',
  'damagesStatus',
];

function fmtMoney(n: number | string | null | undefined) {
  if (n == null || n === '') return '';
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
}

function StatusChip({ value }: { value: string }) {
  const v = value || 'NOT_STARTED';
  const color = STATUS_COLORS[v] || '#757575';
  return (
    <Chip
      size="small"
      label={v.replaceAll('_', ' ')}
      sx={{
        maxWidth: '100%',
        bgcolor: `${color}33`,
        borderColor: color,
        height: 22,
        '& .MuiChip-label': { px: 0.75, fontSize: 11 },
      }}
      variant="outlined"
    />
  );
}

function csvEscape(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportLineListCsv(parcels: LineListParcel[], projectName?: string) {
  const fieldMeta = MATRIX_FIELDS.map((key) => {
    const m = PARCEL_STATUS_FIELDS.find((f) => f.key === key);
    return { key, label: m?.label || key };
  });
  const headers = [
    'Easement #',
    'PIN',
    'Parcel #',
    'New structure #s',
    'Existing structure #s',
    'Owner',
    'Bookmarked',
    'Priority',
    ...fieldMeta.map((f) => f.label),
    'Last offer',
    'OOR',
    'Labels',
  ];
  const lines = [headers.join(',')];
  for (const p of parcels) {
    const row = [
      p.easementNumber || '',
      p.pin || '',
      p.parcelNumber || '',
      p.newStructureNumbers || '',
      p.existingStructureNumbers || '',
      p.owner || '',
      p.bookmarked ? 'Y' : '',
      p.priority || 'NORMAL',
      ...fieldMeta.map((f) => String((p as any)[f.key] || '')),
      p.lastCompensationTotal != null ? String(Number(p.lastCompensationTotal)) : '',
      p.lastCompensationOutsideRange ? 'Y' : '',
      (p.labels || []).map((l) => l.code).join('|'),
    ].map((c) => csvEscape(String(c)));
    lines.push(row.join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(projectName || 'project').replace(/[^\w.-]+/g, '_')}-line-list.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProjectLineList({
  parcels,
  projectId,
  projectName,
  selectedIds,
  selectedParcelId,
  readOnly,
  onSelectionChange,
  onRowFocus,
  onStatusChange,
  onOpenEdit,
}: {
  parcels: LineListParcel[];
  projectId: string;
  projectName?: string;
  selectedIds: string[];
  selectedParcelId?: string | null;
  readOnly?: boolean;
  onSelectionChange: (ids: string[]) => void;
  onRowFocus: (id: string) => void;
  onStatusChange: (parcelId: string, field: string, value: string) => void;
  onOpenEdit: (parcelId: string) => void;
}) {
  const fieldOptions = useMemo(() => {
    const map: Record<string, { value: string; label: string }[]> = {};
    for (const f of PARCEL_STATUS_FIELDS) {
      map[f.key] = f.options.map((o) => ({ value: o.value, label: o.label }));
    }
    return map;
  }, []);

  const columns = useMemo<GridColDef[]>(() => {
    const cols: GridColDef[] = [
      {
        field: 'easementNumber',
        headerName: 'Easement #',
        width: 110,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
            {params.row.bookmarked ? <span title="Bookmarked">★</span> : null}
            <Typography variant="body2" noWrap fontWeight={600}>
              {params.value || '—'}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'pin',
        headerName: 'PIN',
        width: 110,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" noWrap>
            {params.value || params.row.parcelNumber || '—'}
          </Typography>
        ),
      },
      {
        field: 'newStructureNumbers',
        headerName: 'New struct #',
        width: 120,
        renderCell: (p) => (
          <Typography variant="body2" noWrap title={String(p.value || '')}>
            {p.value || '—'}
          </Typography>
        ),
      },
      {
        field: 'existingStructureNumbers',
        headerName: 'Exist struct #',
        width: 120,
        renderCell: (p) => (
          <Typography variant="body2" noWrap title={String(p.value || '')}>
            {p.value || '—'}
          </Typography>
        ),
      },
      {
        field: 'owner',
        headerName: 'Owner',
        width: 160,
        renderCell: (p) => (
          <Typography variant="body2" noWrap title={String(p.value || '')}>
            {p.value || '—'}
          </Typography>
        ),
      },
      {
        field: 'priority',
        headerName: 'Pri',
        width: 88,
        type: 'singleSelect',
        valueOptions: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'],
        editable: !readOnly,
      },
    ];

    for (const key of MATRIX_FIELDS) {
      const meta = PARCEL_STATUS_FIELDS.find((f) => f.key === key);
      const opts = fieldOptions[key] || [];
      cols.push({
        field: key,
        headerName: meta?.label || key,
        width: key === 'status' || key === 'parcelClass' ? 120 : 130,
        editable: !readOnly,
        type: 'singleSelect',
        valueOptions: opts.map((o) => o.value),
        renderCell: (params) => <StatusChip value={String(params.value || 'NOT_STARTED')} />,
        valueFormatter: (value) => String(value || '').replaceAll('_', ' '),
      });
    }

    cols.push(
      {
        field: 'lastCompensationTotal',
        headerName: 'Last offer',
        width: 110,
        align: 'right',
        headerAlign: 'right',
        valueGetter: (_v, row) =>
          row.lastCompensationTotal != null ? Number(row.lastCompensationTotal) : null,
        renderCell: (p) => (
          <Typography
            variant="body2"
            color={p.row.lastCompensationOutsideRange ? 'warning.main' : 'text.primary'}
            fontWeight={p.row.lastCompensationOutsideRange ? 700 : 400}
          >
            {fmtMoney(p.value as number | null)}
            {p.row.lastCompensationOutsideRange ? ' ·OOR' : ''}
          </Typography>
        ),
      },
      {
        field: 'labels',
        headerName: 'Labels',
        width: 120,
        sortable: false,
        valueGetter: (_v, row) => (row.labels || []).map((l: any) => l.code).join(', '),
        renderCell: (p) => (
          <Typography variant="caption" noWrap title={String(p.value || '')}>
            {p.value || ''}
          </Typography>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 88,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (p) => (
          <Button
            size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit(p.row.id);
            }}
          >
            Edit
          </Button>
        ),
      }
    );

    return cols;
  }, [fieldOptions, readOnly, onOpenEdit]);

  const rows = parcels;

  const selectionModel = selectedIds;

  const processRowUpdate = useCallback(
    async (newRow: LineListParcel, oldRow: LineListParcel) => {
      if (readOnly) return oldRow;
      const changed: Partial<Record<ParcelStatusKey | 'priority', string>> = {};
      for (const key of [...MATRIX_FIELDS, 'priority' as const]) {
        const nv = String((newRow as any)[key] ?? '');
        const ov = String((oldRow as any)[key] ?? '');
        if (nv !== ov) {
          (changed as any)[key] = nv;
        }
      }
      const keys = Object.keys(changed);
      if (!keys.length) return newRow;
      // Apply first change via callback (parent patches); optimistic row return
      for (const [field, value] of Object.entries(changed)) {
        onStatusChange(newRow.id, field, value);
      }
      return newRow;
    },
    [onStatusChange, readOnly]
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider', gap: 1, flexWrap: 'wrap' }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Line list
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {parcels.length} parcel{parcels.length === 1 ? '' : 's'} · double-click status to edit ·
            CSV matches visible filter
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={() => exportLineListCsv(parcels, projectName)}
        >
          CSV
        </Button>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          density="compact"
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={(model: GridRowSelectionModel) => {
            const ids = (Array.isArray(model) ? model : []).map(String);
            onSelectionChange(ids);
          }}
          onRowClick={(params: GridRowParams) => onRowFocus(String(params.id))}
          getRowClassName={(params) =>
            params.id === selectedParcelId ? 'rf-line-row-focus' : ''
          }
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(err) => console.error(err)}
          pageSizeOptions={[25, 50, 100, 200]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
          }}
          sx={{
            border: 0,
            height: '100%',
            '& .rf-line-row-focus': {
              bgcolor: 'action.selected',
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
          }}
          localeText={{ noRowsLabel: 'No parcels match filters' }}
        />
      </Box>
    </Box>
  );
}
