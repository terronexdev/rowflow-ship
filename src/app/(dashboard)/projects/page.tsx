"use client";

import { Suspense, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProjectList, type ProjectListItem } from '@/lib/queries/projects';
import { useAuthReady } from '@/components/providers/AppProviders';

const deleteProject = async (id: string): Promise<void> => {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to delete project');
};

const Link = ({ href, children, ...props }: any) => (
  <a href={href} {...props}>
    {children}
  </a>
);

function ProjectsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTractsource = searchParams.get('from') === 'tractsource';
  const tractsourceJob = searchParams.get('job') || '';
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuthReady();

  const {
    data: projects = [],
    isLoading,
    error,
    isFetching,
  } = useQuery<ProjectListItem[]>({
    queryKey: ['projects'],
    queryFn: fetchProjectList,
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: Error) => {
      setDeleteError(err.message || 'Failed to delete project');
    },
  });

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (window.confirm('Delete this project and all its parcels? This cannot be undone.')) {
      setDeleteError(null);
      deleteMutation.mutate(id);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Project Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params.row as ProjectListItem;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
            <Link href={`/projects/${params.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {params.value}
            </Link>
            null
          </Box>
        );
      },
    },
    {
      field: 'projectCode',
      headerName: 'Project ID',
      width: 140,
      valueGetter: (_v, row) => (row as ProjectListItem).projectCode || '—',
    },
    { field: 'status', headerName: 'Status', width: 110 },
    {
      field: 'parcels',
      headerName: 'Parcels',
      width: 90,
      valueGetter: (_value, row) => (row as ProjectListItem)._count?.parcels || 0,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueFormatter: (value) =>
        value ? new Date(value as string).toLocaleDateString() : '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: fromTractsource ? 340 : 220,
      minWidth: 200,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row as ProjectListItem & { readOnly?: boolean };
        const isReadOnly = Boolean(row.readOnly);
        return (
          <Box
            sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {fromTractsource && !isReadOnly && (
              <Button
                size="small"
                variant="contained"
                onClick={() =>
                  router.push(
                    `/projects/${params.id}/import?from=tractsource${
                      tractsourceJob ? `&job=${encodeURIComponent(tractsourceJob)}` : ''
                    }`
                  )
                }
              >
                Import here
              </Button>
            )}
            <Button
              size="small"
              variant={isReadOnly ? 'contained' : 'text'}
              onClick={() => router.push(`/projects/${params.id}`)}
            >
              Open
            </Button>
            {!isReadOnly && (
              <>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => router.push(`/projects/${params.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  disabled={deleteMutation.isPending}
                  onClick={(e) => handleDelete(params.id as string, e)}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;

  const ownCount = projects.filter((p) => !(p as any).readOnly).length;

  return (
    <Box>
      {fromTractsource && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Tractsource handoff</strong>
          {tractsourceJob ? ` (job ${tractsourceJob})` : ''}: a ROWFlow-ready GeoJSON should have
          downloaded. Open a project with <strong>Import here</strong>, then upload the file named{' '}
          <code>*-rowflow.geojson</code> as <strong>Parcel records</strong>.
        </Alert>
      )}
      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Projects
          {isFetching && !isLoading ? (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Updating…
            </Typography>
          ) : null}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/projects/new')}>
          New Project
        </Button>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={projects}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          loading={isFetching && projects.length === 0}
          onRowClick={(params) => router.push(`/projects/${params.id}`)}
          localeText={{
            noRowsLabel: 'No projects yet',
          }}
        />
      </Box>
    </Box>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ProjectsPageInner />
    </Suspense>
  );
}
