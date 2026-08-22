'use client';

import { useMemo, useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { findNextUnworked, sortParcelsAlongCorridor } from '@/lib/map/corridorOrder';
import {
  toggleSelection,
  rangeSelect,
  isRangeModifier,
  isMultiModifier,
} from '@/lib/map/multiSelect';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getStatusColor, OPEN_PERMIT_PHASE_STATUSES } from '@/lib/constants';
import ParcelStatusPanel, {
  type ParcelStatusKey,
  PARCEL_STATUS_FIELDS,
} from '@/components/parcel/ParcelStatusPanel';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Menu,
  ListItemIcon,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Map as MapIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useAuthReady } from '@/components/providers/AppProviders';
import ProjectOverviewPanel, {
  type OverviewFilterAction,
} from '@/components/project/ProjectOverviewPanel';
import ProjectLineList from '@/components/project/ProjectLineList';
import ViewListIcon from '@mui/icons-material/ViewList';

const ParcelMap = dynamic(() => import('@/components/map/ParcelMap'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ),
});

type MapStatusTab =
  | 'status'
  | 'pts'
  | 'title'
  | 'survey'
  | 'appraisal'
  | 'acquisition'
  | 'condemnation'
  | 'special_conditions'
  | 'damages'
  | 'permit'
  | 'existing_rights'
  | 'parcel_class'
  | 'encroachments';

interface Parcel {
  id: string;
  parcelNumber?: string | null;
  pin?: string | null;
  easementNumber?: string | null;
  newStructureNumbers?: string | null;
  existingStructureNumbers?: string | null;
  owner?: string | null;
  ownerAddress?: string | null;
  ownerCity?: string | null;
  ownerState?: string | null;
  ownerZip?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  propertyAddress?: string | null;
  legalDesc?: string | null;
  status: string;
  ptsStatus?: string | null;
  titleStatus: string;
  surveyStatus?: string | null;
  appraisalStatus?: string | null;
  acquisitionStatus?: string | null;
  condemnationStatus?: string | null;
  damagesStatus: string;
  specialConditionsStatus: string;
  permitStatus?: string | null;
  existingRightsStatus?: string | null;
  parcelClass?: string | null;
  encroachmentStatus?: string | null;
  bookmarked?: boolean | null;
  priority?: string | null;
  labels?: { code: string; note?: string | null }[];
  geometry?: any;
  acreage?: number | null;
  county?: string | null;
  sequence?: number | null;
  milepost?: number | null;
  titledOwnerName?: string | null;
  tenantName?: string | null;
  lastCompensationTotal?: number | null;
  lastCompensationOutsideRange?: boolean | null;
}

interface ProjectLayer {
  id: string;
  name: string;
  kind: string;
  geometryType?: string | null;
  featureCount: number;
  data: any;
  visible: boolean;
  opacity: number;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  projectCode?: string | null;
  workOrderNumber?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  parcels: Parcel[];
  layers?: ProjectLayer[];
  roleAssignments?: any[];
}

const fetchProject = async (
  id: string
): Promise<{ project: Project; access: { readOnly?: boolean; isOwner?: boolean } }> => {
  const res = await fetch(`/api/projects/${id}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch project');
  const data = await res.json();
  return {
    project: data.project,
    access: data.access || { readOnly: false },
  };
};


const COLOR_BY_OPTIONS: { value: MapStatusTab; label: string }[] = [
  { value: 'status', label: 'Overall' },
  { value: 'parcel_class', label: 'Parcel class' },
  { value: 'existing_rights', label: 'Existing rights' },
  { value: 'encroachments', label: 'Encroachments' },
  { value: 'pts', label: 'PTS' },
  { value: 'title', label: 'Title' },
  { value: 'survey', label: 'Survey' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'condemnation', label: 'Condemnation' },
  { value: 'permit', label: 'Permitting' },
  { value: 'special_conditions', label: 'Special conditions' },
  { value: 'damages', label: 'Damages' },
];

const QUICK_FILTERS = [
  { key: 'all' as const, label: 'All parcels' },
  { key: 'acquired' as const, label: 'Acquired' },
  { key: 'pts_open' as const, label: 'PTS open' },
  { key: 'oor' as const, label: 'Outside-range offers' },
  { key: 'supplement_needed' as const, label: 'Supplement needed' },
  { key: 'encroach_removal' as const, label: 'Encroach needs removal' },
  { key: 'stale_contact' as const, label: 'Stale contact (14d)' },
  { key: 'past_due_followup' as const, label: 'Past-due follow-up' },
  { key: 'brownfield' as const, label: 'Brownfield' },
  { key: 'no_owner' as const, label: 'No owner' },
  { key: 'no_geom' as const, label: 'No geometry' },
  { key: 'constraints' as const, label: 'Constraints' },
  { key: 'permit_open' as const, label: 'Permit open' },
  { key: 'bookmarked' as const, label: 'Bookmarked' },
  { key: 'high_priority' as const, label: 'High priority' },
];

type QuickFilterKey = (typeof QUICK_FILTERS)[number]['key'];
type WorkspaceView = 'map' | 'overview' | 'list';

const PANEL_WIDTH_KEY = 'rowflow.parcelPanelWidth';
const PANEL_WIDTH_DEFAULT = 340;
const PANEL_WIDTH_MIN = 260;
const PANEL_WIDTH_MAX = 520;

const MAP_TAB_TO_FIELD: Record<MapStatusTab, ParcelStatusKey> = {
  status: 'status',
  pts: 'ptsStatus',
  title: 'titleStatus',
  survey: 'surveyStatus',
  appraisal: 'appraisalStatus',
  acquisition: 'acquisitionStatus',
  condemnation: 'condemnationStatus',
  special_conditions: 'specialConditionsStatus',
  damages: 'damagesStatus',
  permit: 'permitStatus',
  existing_rights: 'existingRightsStatus',
  parcel_class: 'parcelClass',
  encroachments: 'encroachmentStatus',
};

const PRIORITY_RANK: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <ProjectDetailPageInner />
    </Suspense>
  );
}

function ProjectDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(
    searchParams.get('parcel')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [mapFilter, setMapFilter] = useState<QuickFilterKey>(() => {
    const f = searchParams.get('filter');
    if (QUICK_FILTERS.some((q) => q.key === f)) return f as QuickFilterKey;
    return 'all';
  });
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(() => {
    const v = searchParams.get('view');
    if (v === 'overview' || v === 'list') return v;
    return 'map';
  });
  const [activeStatusTab, setActiveStatusTab] = useState<MapStatusTab>('status');
  const [statusValueFilter, setStatusValueFilter] = useState<string | null>(null);
  const [parcelIdFilter, setParcelIdFilter] = useState<string[] | null>(null);
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);
  const [filtersAnchor, setFiltersAnchor] = useState<null | HTMLElement>(null);
  const [selectedParcelIds, setSelectedParcelIds] = useState<string[]>([]);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<string>('');
  const [bulkUndo, setBulkUndo] = useState<
    { parcelId: string; field: string; from: string | null }[] | null
  >(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(PANEL_WIDTH_DEFAULT);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const resizingRef = useRef(false);
  /** Anchor for Shift+click range select in the list */
  const listAnchorIdRef = useRef<string | null>(null);
  const [sortAlongCorridor, setSortAlongCorridor] = useState(true);

  const { isAuthenticated, isLoading: authLoading } = useAuthReady();

  // Restore parcel list width preference
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PANEL_WIDTH_KEY);
      if (!raw) return;
      const n = Number(raw);
      if (Number.isFinite(n)) {
        setPanelWidth(Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, n)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Reflow map when list collapses/expands
  useEffect(() => {
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
  }, [panelCollapsed]);

  const onPanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    const startX = e.clientX;
    const startW = panelWidth;

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const next = Math.min(
        PANEL_WIDTH_MAX,
        Math.max(PANEL_WIDTH_MIN, startW + (ev.clientX - startX))
      );
      setPanelWidth(next);
    };
    const onUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setPanelWidth((w) => {
        try {
          localStorage.setItem(PANEL_WIDTH_KEY, String(w));
        } catch {
          /* ignore */
        }
        return w;
      });
      // Let Leaflet reflow after panel width change
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: isAuthenticated && Boolean(projectId),
  });
  const project = data?.project;
  const readOnly = Boolean(data?.access?.readOnly);

  const deleteParcelMutation = useMutation({
    mutationFn: async (parcelId: string) => {
      const res = await fetch(`/api/parcels/${parcelId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete parcel');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setSelectedParcelId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ parcelId, ...statusUpdates }: { parcelId: string; [key: string]: string }) => {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusUpdates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      parcelIds,
      statusField,
      status,
      previous,
    }: {
      parcelIds: string[];
      statusField: string;
      status: string;
      previous: { parcelId: string; field: string; from: string | null }[];
    }) => {
      const res = await fetch(`/api/projects/${projectId}/parcels/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelIds,
          field: statusField,
          value: status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to bulk update parcels');
      return {
        previous: data.previous || previous,
        count: data.updated ?? parcelIds.length,
        statusField,
        status,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread'] });
      setBulkUndo(data.previous);
      setBulkMessage(
        `Updated ${data.count} parcels · ${data.statusField} → ${data.status}`
      );
      setSelectedParcelIds([]);
      setBulkUpdateStatus('');
    },
  });

  const undoBulkMutation = useMutation({
    mutationFn: async (rows: { parcelId: string; field: string; from: string | null }[]) => {
      if (!rows.length) return 0;
      const field = rows[0].field;
      // Group by from-value so we can bulk restore
      const byFrom = new Map<string, string[]>();
      for (const r of rows) {
        const key = r.from ?? 'NOT_STARTED';
        if (!byFrom.has(key)) byFrom.set(key, []);
        byFrom.get(key)!.push(r.parcelId);
      }
      for (const [value, parcelIds] of byFrom) {
        const res = await fetch(`/api/projects/${projectId}/parcels/bulk-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcelIds, field, value }),
        });
        if (!res.ok) throw new Error('Undo failed for some parcels');
      }
      return rows.length;
    },
    onSuccess: (n) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
      setBulkUndo(null);
      setBulkMessage(`Undid bulk update on ${n} parcels`);
    },
  });

  const applyBulk = () => {
    if (readOnly || !bulkUpdateStatus || selectedParcelIds.length === 0) return;
    const field = MAP_TAB_TO_FIELD[activeStatusTab];
    const previous = selectedParcelIds.map((parcelId) => {
      const p = project?.parcels?.find((x) => x.id === parcelId) as any;
      const from = p ? String(p[field] ?? 'NOT_STARTED') : 'NOT_STARTED';
      return { parcelId, field, from };
    });
    bulkUpdateMutation.mutate({
      parcelIds: selectedParcelIds,
      statusField: field,
      status: bulkUpdateStatus,
      previous,
    });
  };

  const handleDeleteParcel = (parcelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    if (window.confirm('Are you sure you want to delete this parcel?')) {
      deleteParcelMutation.mutate(parcelId);
    }
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
  });

  const handleDeleteProject = () => {
    if (readOnly) return;
    if (
      window.confirm(
        'Delete this project and all its parcels, documents, and notes? This cannot be undone.'
      )
    ) {
      deleteProjectMutation.mutate();
    }
  };

  const handleStatusFieldChange = (parcelId: string, field: string, value: string) => {
    if (readOnly) return;
    updateStatusMutation.mutate({ parcelId, [field]: value });
  };

  // Hooks MUST run unconditionally (before any early return)
  const statusField = MAP_TAB_TO_FIELD[activeStatusTab];
  const statusFieldMeta =
    PARCEL_STATUS_FIELDS.find((f) => f.key === statusField) || PARCEL_STATUS_FIELDS[0];
  const statusOptions = statusFieldMeta?.options || [];

  const parcelsList = (project?.parcels || []) as Parcel[];
  const layersList = project?.layers || [];

  const filteredParcels = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const openPermit = new Set<string>(OPEN_PERMIT_PHASE_STATUSES as unknown as string[]);
    return parcelsList.filter((parcel) => {
      const matchesSearch =
        !query ||
        parcel.parcelNumber?.toLowerCase().includes(query) ||
        parcel.pin?.toLowerCase().includes(query) ||
        parcel.easementNumber?.toLowerCase().includes(query) ||
        parcel.newStructureNumbers?.toLowerCase().includes(query) ||
        parcel.existingStructureNumbers?.toLowerCase().includes(query) ||
        parcel.owner?.toLowerCase().includes(query) ||
        parcel.county?.toLowerCase().includes(query) ||
        parcel.propertyAddress?.toLowerCase().includes(query) ||
        (parcel.labels || []).some((l) =>
          `${l.code} ${l.note || ''}`.toLowerCase().includes(query)
        );

      if (!matchesSearch) return false;

      if (parcelIdFilter && parcelIdFilter.length > 0) {
        if (!parcelIdFilter.includes(parcel.id)) return false;
      }

      const acq = String(parcel.acquisitionStatus || parcel.status || '');
      const pts = String(parcel.ptsStatus || '');
      switch (mapFilter) {
        case 'acquired':
          return (
            acq.includes('ACQUIRED') ||
            parcel.status === 'ACQUIRED' ||
            parcel.status === 'RELOCATED'
          );
        case 'pts_open':
          return !pts.includes('GRANTED') && !pts.includes('APPROVED') && pts !== 'COMPLETE';
        case 'oor':
          return Boolean(parcel.lastCompensationOutsideRange);
        case 'supplement_needed':
          return String(parcel.existingRightsStatus || '') === 'SUPPLEMENT_NEEDED';
        case 'encroach_removal':
          return String(parcel.encroachmentStatus || '') === 'NEEDS_REMOVAL';
        case 'stale_contact':
          // Id list applied above when set from Overview; without list show all open non-acquired
          if (parcelIdFilter?.length) return true;
          return (
            parcel.status !== 'ACQUIRED' &&
            parcel.status !== 'RELOCATED' &&
            String(parcel.acquisitionStatus || '') !== 'ACQUIRED'
          );
        case 'past_due_followup':
          if (parcelIdFilter?.length) return true;
          return (
            parcel.status !== 'ACQUIRED' &&
            parcel.status !== 'RELOCATED' &&
            String(parcel.acquisitionStatus || '') !== 'ACQUIRED'
          );
        case 'brownfield':
          return String(parcel.parcelClass || '') === 'BROWNFIELD';
        case 'no_owner':
          return !parcel.owner || !String(parcel.owner).trim();
        case 'no_geom':
          return !parcel.geometry;
        case 'constraints':
          return (parcel.labels || []).length > 0;
        case 'permit_open':
          return openPermit.has(String(parcel.permitStatus || 'NOT_STARTED'));
        case 'bookmarked':
          return Boolean(parcel.bookmarked);
        case 'high_priority':
          return parcel.priority === 'HIGH' || parcel.priority === 'CRITICAL';
        default:
          return true;
      }
    });
  }, [parcelsList, searchQuery, mapFilter, parcelIdFilter]);

  const statusVisibleParcels = useMemo(() => {
    let list = filteredParcels;
    if (statusValueFilter) {
      const field = MAP_TAB_TO_FIELD[activeStatusTab];
      list = list.filter(
        (parcel) => String((parcel as any)[field] || 'NOT_STARTED') === statusValueFilter
      );
    }
    if (!hiddenStatuses.length) return list;
    const hidden = new Set(hiddenStatuses);
    const field = MAP_TAB_TO_FIELD[activeStatusTab];
    return list.filter((parcel) => {
      const st = String((parcel as any)[field] || 'NOT_STARTED');
      return !hidden.has(st);
    });
  }, [filteredParcels, hiddenStatuses, activeStatusTab, statusValueFilter]);

  const orderedParcels = useMemo(() => {
    const attentionSort = (list: typeof statusVisibleParcels) =>
      [...list].sort((a, b) => {
        const bm = Number(Boolean(b.bookmarked)) - Number(Boolean(a.bookmarked));
        if (bm !== 0) return bm;
        const pr =
          (PRIORITY_RANK[String(a.priority || 'NORMAL')] ?? 2) -
          (PRIORITY_RANK[String(b.priority || 'NORMAL')] ?? 2);
        if (pr !== 0) return pr;
        const sa = a.sequence ?? Number.POSITIVE_INFINITY;
        const sb = b.sequence ?? Number.POSITIVE_INFINITY;
        if (sa !== sb) return sa - sb;
        return String(a.easementNumber || a.parcelNumber || a.pin || '').localeCompare(
          String(b.easementNumber || b.parcelNumber || b.pin || '')
        );
      });

    if (!sortAlongCorridor) return attentionSort(statusVisibleParcels);
    try {
      const corridor = sortParcelsAlongCorridor(
        statusVisibleParcels as any,
        layersList
      ) as typeof statusVisibleParcels;
      return attentionSort(corridor);
    } catch {
      return attentionSort(statusVisibleParcels);
    }
  }, [statusVisibleParcels, sortAlongCorridor, layersList]);

  const nextUnworked = useMemo(() => {
    const mode =
      activeStatusTab === 'pts'
        ? 'pts'
        : activeStatusTab === 'acquisition'
          ? 'acquisition'
          : 'status';
    try {
      return findNextUnworked(parcelsList as any, layersList, mode);
    } catch {
      return null;
    }
  }, [parcelsList, layersList, activeStatusTab]);

  const orderedIds = useMemo(() => orderedParcels.map((p) => p.id), [orderedParcels]);

  const setWorkspaceViewAndUrl = useCallback((view: WorkspaceView) => {
    setWorkspaceView(view);
    try {
      const url = new URL(window.location.href);
      if (view === 'map') url.searchParams.delete('view');
      else url.searchParams.set('view', view);
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {
      /* ignore */
    }
  }, []);

  const handleOverviewAction = useCallback((action: OverviewFilterAction) => {
    if (action.type === 'quick') {
      setMapFilter(action.key as QuickFilterKey);
      setStatusValueFilter(null);
      setParcelIdFilter(null);
      setHiddenStatuses([]);
      return;
    }
    if (action.type === 'colorBy') {
      const tab = action.tab as MapStatusTab;
      if (COLOR_BY_OPTIONS.some((o) => o.value === tab)) {
        setActiveStatusTab(tab);
      }
      setMapFilter('all');
      setStatusValueFilter(action.statusValue || null);
      setParcelIdFilter(null);
      setHiddenStatuses([]);
      return;
    }
    if (action.type === 'selectParcels') {
      setSelectedParcelIds(action.ids);
      setParcelIdFilter(action.ids.length ? action.ids : null);
      setMapFilter(
        action.filter === 'past_due_followup' ? 'past_due_followup' : 'stale_contact'
      );
      if (action.ids[0]) {
        setSelectedParcelId(action.ids[0]);
        listAnchorIdRef.current = action.ids[0];
      }
      setWorkspaceViewAndUrl('map');
    }
  }, [setWorkspaceViewAndUrl]);

  if (authLoading || isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load project: {(error as Error).message}</Alert>;
  }

  if (!project) {
    return <Alert severity="error">Project not found</Alert>;
  }

  const getParcelStatusValue = (parcel: Parcel) =>
    String((parcel as any)[statusField] || 'NOT_STARTED');

  const selectedParcel = orderedParcels.find((p) => p.id === selectedParcelId);

  const toggleParcelSelection = (
    parcelId: string,
    ev?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } | null
  ) => {
    if (isRangeModifier(ev)) {
      const next = rangeSelect(orderedIds, listAnchorIdRef.current, parcelId);
      setSelectedParcelIds(next);
      setSelectedParcelId(parcelId);
      return;
    }
    if (isMultiModifier(ev)) {
      setSelectedParcelIds((prev) => toggleSelection(prev, parcelId));
      setSelectedParcelId(parcelId);
      listAnchorIdRef.current = parcelId;
      return;
    }
    // plain checkbox toggle
    setSelectedParcelIds((prev) => toggleSelection(prev, parcelId));
    listAnchorIdRef.current = parcelId;
  };

  const focusParcel = (
    parcelId: string,
    ev?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } | null
  ) => {
    if (isRangeModifier(ev)) {
      const next = rangeSelect(orderedIds, listAnchorIdRef.current, parcelId);
      setSelectedParcelIds(next);
      setSelectedParcelId(parcelId);
      return;
    }
    if (isMultiModifier(ev)) {
      setSelectedParcelIds((prev) => toggleSelection(prev, parcelId));
      setSelectedParcelId(parcelId);
      listAnchorIdRef.current = parcelId;
      return;
    }
    // Plain row click = single focus, clear multi
    setSelectedParcelId(parcelId);
    setSelectedParcelIds([]);
    listAnchorIdRef.current = parcelId;
  };

  const selectAllParcels = () => {
    if (selectedParcelIds.length === orderedParcels.length) {
      setSelectedParcelIds([]);
    } else {
      setSelectedParcelIds(orderedParcels.map((p) => p.id));
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        // Fill layout main (works with collapsed nav + denser header on map)
        flex: 1,
        minHeight: 0,
        height: { xs: 'calc(100vh - 72px)', md: '100%' },
        gap: 1.5,
      }}
    >

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            {project.name}
          </Typography>
          {project.description && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {project.description}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={workspaceView}
            onChange={(_e, v) => {
              if (v) setWorkspaceViewAndUrl(v);
            }}
          >
            <ToggleButton value="map" aria-label="Map view">
              <MapIcon fontSize="small" sx={{ mr: 0.5 }} />
              Map
            </ToggleButton>
            <ToggleButton value="overview" aria-label="Overview">
              <DashboardIcon fontSize="small" sx={{ mr: 0.5 }} />
              Overview
            </ToggleButton>
            <ToggleButton value="list" aria-label="Line list">
              <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
              Line list
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" size="small" onClick={() => router.push(`/projects/${projectId}/report`)}>
            Status report
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => router.push(`/activity?projectId=${projectId}&range=30d`)}
          >
            Activity
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => router.push(`/projects/${projectId}/export`)}
          >
            Export
          </Button>
          {readOnly ? (
            <>
              <Button size="small" variant="outlined" onClick={() => router.push(`/projects/${projectId}/edit`)}>
                Matrix · schedule · budget
              </Button>
              <Button size="small" variant="contained" onClick={() => router.push('/projects/new')}>
                Create my project
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => router.push(`/projects/${projectId}/import?mode=parcels`)}
              >
                Import parcels
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => router.push(`/projects/${projectId}/import?mode=layer`)}
              >
                Import design / route
              </Button>
              <IconButton
                size="small"
                aria-label="More project actions"
                onClick={(e) => setActionsAnchor(e.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={actionsAnchor}
                open={Boolean(actionsAnchor)}
                onClose={() => setActionsAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setActionsAnchor(null);
                    router.push(`/projects/${projectId}/import?mode=parcels`);
                  }}
                >
                  <ListItemIcon>
                    <UploadIcon fontSize="small" />
                  </ListItemIcon>
                  Import parcels
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setActionsAnchor(null);
                    router.push(`/projects/${projectId}/import?mode=layer`);
                  }}
                >
                  <ListItemIcon>
                    <UploadIcon fontSize="small" />
                  </ListItemIcon>
                  Import design / engineering route
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setActionsAnchor(null);
                    router.push(`/projects/${projectId}/county-data`);
                  }}
                >
                  Import county data
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setActionsAnchor(null);
                    router.push(`/projects/${projectId}/edit`);
                  }}
                >
                  Edit project
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setActionsAnchor(null);
                    router.push(`/projects/${projectId}/parcels/new`);
                  }}
                >
                  <ListItemIcon>
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  Add parcel
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setActionsAnchor(null);
                    handleDeleteProject();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  Delete project
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {deleteProjectMutation.isError && (
        <Alert severity="error">
          {(deleteProjectMutation.error as Error)?.message || 'Failed to delete project'}
        </Alert>
      )}

      {!readOnly && parcelsList.length === 0 && (
        <Alert
          severity="info"
          sx={{ py: 1.25 }}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={() => router.push(`/projects/${projectId}/import?mode=parcels`)}
              >
                Import parcels
              </Button>
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={() => router.push(`/projects/${projectId}/import?mode=layer`)}
              >
                Import design / route
              </Button>
            </Box>
          }
        >
          <strong>Empty project.</strong> Import parcel polygons (GeoJSON/KML/KMZ) and/or an
          engineering design layer (centerline, structures, access roads) to populate the map.
        </Alert>
      )}

      {bulkMessage && (
        <Alert
          severity="success"
          sx={{ py: 0.5 }}
          onClose={() => setBulkMessage(null)}
          action={
            bulkUndo ? (
              <Button
                color="inherit"
                size="small"
                disabled={undoBulkMutation.isPending}
                onClick={() => undoBulkMutation.mutate(bulkUndo)}
              >
                Undo
              </Button>
            ) : undefined
          }
        >
          {bulkMessage}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 0, flex: 1, minHeight: 0 }}>
        {!panelCollapsed && (
          <Paper
            sx={{
              width: panelWidth,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                px: 1.5,
                pt: 1.25,
                pb: 1,
                borderBottom: 1,
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="color-by-label">Color by</InputLabel>
                  <Select
                    labelId="color-by-label"
                    label="Color by"
                    value={activeStatusTab}
                    onChange={(e) => {
                      setActiveStatusTab(e.target.value as MapStatusTab);
                      setHiddenStatuses([]);
                      setStatusValueFilter(null);
                    }}
                  >
                    {COLOR_BY_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  size="small"
                  aria-label="Collapse parcel list"
                  title="Collapse list"
                  onClick={() => setPanelCollapsed(true)}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                <Checkbox
                  size="small"
                  checked={
                    selectedParcelIds.length === orderedParcels.length && orderedParcels.length > 0
                  }
                  indeterminate={
                    selectedParcelIds.length > 0 &&
                    selectedParcelIds.length < orderedParcels.length
                  }
                  onChange={selectAllParcels}
                />
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                  {selectedParcelIds.length > 0
                    ? `${selectedParcelIds.length} selected`
                    : `${orderedParcels.length} shown`}
                  {mapFilter !== 'all' || searchQuery || hiddenStatuses.length ? ` · filtered` : ''}
                  {filteredParcels.length !== parcelsList.length || hiddenStatuses.length
                    ? ` / ${parcelsList.length}`
                    : ''}
                </Typography>
                <Button
                  size="small"
                  variant={sortAlongCorridor ? 'contained' : 'text'}
                  onClick={() => setSortAlongCorridor((v) => !v)}
                  sx={{ fontSize: 11, minWidth: 0, px: 1 }}
                >
                  {sortAlongCorridor ? 'Along line' : 'Order'}
                </Button>
                <IconButton
                  size="small"
                  aria-label="Filters"
                  color={mapFilter !== 'all' ? 'primary' : 'default'}
                  onClick={(e) => setFiltersAnchor(e.currentTarget)}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={filtersAnchor}
                  open={Boolean(filtersAnchor)}
                  onClose={() => setFiltersAnchor(null)}
                >
                  {QUICK_FILTERS.map((f) => (
                    <MenuItem
                      key={f.key}
                      selected={mapFilter === f.key}
                      onClick={() => {
                        setMapFilter(f.key);
                        setStatusValueFilter(null);
                        setParcelIdFilter(null);
                        setFiltersAnchor(null);
                      }}
                    >
                      {f.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>

              {nextUnworked && (
                <Typography
                  component="button"
                  variant="caption"
                  onClick={() => {
                    setSelectedParcelId(nextUnworked.id);
                    setMapFilter('all');
                    setHiddenStatuses([]);
                    setStatusValueFilter(null);
                  }}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    background: 'transparent',
                    color: 'secondary.main',
                    cursor: 'pointer',
                    fontWeight: 600,
                    p: 0,
                    mb: 0.25,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Next unworked → {nextUnworked.pin || nextUnworked.parcelNumber || 'parcel'}
                </Typography>
              )}
              {searchQuery ? (
                <Typography variant="caption" color="text.secondary" display="block">
                  Search: “{searchQuery}” (map)
                </Typography>
              ) : null}
            </Box>

            {selectedParcelIds.length > 0 && !readOnly && (
              <Box
                sx={{
                  p: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  flexShrink: 0,
                }}
              >
                <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                  <InputLabel>Bulk {statusFieldMeta.label}</InputLabel>
                  <Select
                    label={`Bulk ${statusFieldMeta.label}`}
                    value={bulkUpdateStatus}
                    onChange={(e) => setBulkUpdateStatus(e.target.value)}
                  >
                    {statusOptions.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  disabled={!bulkUpdateStatus || bulkUpdateMutation.isPending}
                  onClick={applyBulk}
                >
                  Apply
                </Button>
                <Button variant="text" onClick={() => setSelectedParcelIds([])}>
                  Clear
                </Button>
              </Box>
            )}

            <List dense sx={{ flex: 1, overflow: 'auto', py: 0.5, minHeight: 0 }}>
              {orderedParcels.length === 0 ? (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No parcels match.
                    {hiddenStatuses.length
                      ? ' Some statuses are hidden in the map legend.'
                      : ''}
                  </Typography>
                </Box>
              ) : (
                orderedParcels.map((parcel) => {
                  const st = getParcelStatusValue(parcel);
                  return (
                    <ListItem
                      key={parcel.id}
                      disablePadding
                      secondaryAction={
                        !readOnly ? (
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleDeleteParcel(parcel.id, e)}
                            aria-label="delete"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        ) : undefined
                      }
                    >
                      <Checkbox
                        size="small"
                        checked={selectedParcelIds.includes(parcel.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleParcelSelection(parcel.id, e.nativeEvent);
                        }}
                        onChange={() => {
                          /* handled in onClick so we get shift/ctrl */
                        }}
                        sx={{ ml: 0.5 }}
                      />
                      <ListItemButton
                        selected={selectedParcelId === parcel.id}
                        onClick={(e) => focusParcel(parcel.id, e.nativeEvent)}
                        sx={{ pr: readOnly ? 2 : 6, py: 0.85 }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}
                            >
                              {parcel.bookmarked ? (
                                <Typography component="span" sx={{ color: 'warning.main', fontSize: 12 }}>
                                  ★
                                </Typography>
                              ) : null}
                              <Typography
                                variant="body2"
                                noWrap
                                sx={{ fontWeight: 600, flex: 1 }}
                              >
                                {parcel.easementNumber ||
                                  parcel.pin ||
                                  parcel.parcelNumber ||
                                  'Parcel'}
                              </Typography>
                              {parcel.priority === 'CRITICAL' && (
                                <Chip
                                  size="small"
                                  label="CRIT"
                                  color="warning"
                                  sx={{ height: 20, fontSize: 10, flexShrink: 0 }}
                                />
                              )}
                              <Chip
                                size="small"
                                label={st.replaceAll('_', ' ')}
                                sx={{
                                  height: 22,
                                  fontSize: 10,
                                  bgcolor: getStatusColor(st),
                                  color: '#fff',
                                  maxWidth: 110,
                                  flexShrink: 0,
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              component="span"
                            >
                              {[
                                parcel.easementNumber
                                  ? `PIN ${parcel.pin || parcel.parcelNumber || '—'}`
                                  : null,
                                !parcel.easementNumber && parcel.pin && parcel.parcelNumber
                                  ? parcel.parcelNumber
                                  : null,
                                parcel.owner || 'No owner',
                                parcel.county || null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })
              )}
            </List>
          </Paper>
        )}

        {/* Resize / expand handle */}
        <Box
          onMouseDown={panelCollapsed ? undefined : onPanelResizeStart}
          onDoubleClick={() => {
            if (panelCollapsed) {
              setPanelCollapsed(false);
              return;
            }
            setPanelWidth(PANEL_WIDTH_DEFAULT);
            try {
              localStorage.setItem(PANEL_WIDTH_KEY, String(PANEL_WIDTH_DEFAULT));
            } catch {
              /* ignore */
            }
          }}
          sx={{
            width: panelCollapsed ? 28 : 6,
            flexShrink: 0,
            cursor: panelCollapsed ? 'pointer' : 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'transparent',
            borderLeft: 1,
            borderRight: 1,
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
            position: 'relative',
            zIndex: 2,
          }}
          title={
            panelCollapsed
              ? 'Expand parcel list'
              : 'Drag to resize · double-click reset width'
          }
          role="separator"
          aria-orientation="vertical"
          aria-label={panelCollapsed ? 'Expand parcel list' : 'Resize parcel list'}
          onClick={
            panelCollapsed
              ? () => setPanelCollapsed(false)
              : undefined
          }
        >
          {panelCollapsed ? (
            <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          ) : (
            <Box
              sx={{
                width: 2,
                height: 28,
                borderRadius: 1,
                bgcolor: 'divider',
              }}
            />
          )}
        </Box>

        <Paper sx={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden', ml: 0 }}>
          {selectedParcelIds.length > 0 && (workspaceView === 'map' || workspaceView === 'list') && (
            <Chip
              color="warning"
              size="small"
              label={`${selectedParcelIds.length} selected`}
              sx={{ position: 'absolute', zIndex: 1100, top: 10, left: '50%', transform: 'translateX(-50%)' }}
              onDelete={() => setSelectedParcelIds([])}
            />
          )}
          {statusValueFilter && (
            <Chip
              size="small"
              color="info"
              label={`Status: ${statusValueFilter.replaceAll('_', ' ')}`}
              onDelete={() => setStatusValueFilter(null)}
              sx={{
                position: 'absolute',
                zIndex: 1100,
                top: 10,
                left: 12,
              }}
            />
          )}
          {parcelIdFilter && parcelIdFilter.length > 0 && (
            <Chip
              size="small"
              color="warning"
              label={`${parcelIdFilter.length} parcel filter`}
              onDelete={() => {
                setParcelIdFilter(null);
                if (mapFilter === 'stale_contact' || mapFilter === 'past_due_followup') {
                  setMapFilter('all');
                }
              }}
              sx={{
                position: 'absolute',
                zIndex: 1100,
                top: statusValueFilter ? 42 : 10,
                left: 12,
              }}
            />
          )}
          {workspaceView === 'overview' ? (
            <ProjectOverviewPanel
              projectId={projectId}
              onAction={handleOverviewAction}
              onOpenMap={() => setWorkspaceViewAndUrl('map')}
            />
          ) : workspaceView === 'list' ? (
            <ProjectLineList
              parcels={orderedParcels as any}
              projectId={projectId}
              projectName={project.name}
              selectedIds={selectedParcelIds}
              selectedParcelId={selectedParcelId}
              readOnly={readOnly}
              onSelectionChange={(ids) => {
                setSelectedParcelIds(ids);
                if (ids.length) listAnchorIdRef.current = ids[ids.length - 1];
              }}
              onRowFocus={(id) => {
                setSelectedParcelId(id);
                listAnchorIdRef.current = id;
              }}
              onStatusChange={(parcelId, field, value) => {
                handleStatusFieldChange(parcelId, field, value);
              }}
              onOpenEdit={(id) => router.push(`/projects/${projectId}/parcels/${id}/edit`)}
            />
          ) : (
          <ParcelMap
            parcels={orderedParcels as any}
            layers={project.layers || []}
            existingRights={(project as any).existingRights || []}
            selectedParcelId={selectedParcelId}
            multiSelectedIds={selectedParcelIds}
            onParcelClick={(id) => {
              setSelectedParcelId(id);
              listAnchorIdRef.current = id;
            }}
            onMultiSelectChange={(ids) => {
              setSelectedParcelIds(ids);
              if (ids.length) listAnchorIdRef.current = ids[ids.length - 1];
            }}
            activeStatusTab={activeStatusTab}
            projectTitle={project.name}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            hiddenStatuses={hiddenStatuses}
            onToggleStatusVisibility={(statusValue) => {
              setHiddenStatuses((prev) =>
                prev.includes(statusValue)
                  ? prev.filter((s) => s !== statusValue)
                  : [...prev, statusValue]
              );
            }}
            onShowAllStatuses={() => setHiddenStatuses([])}
            onHideAllStatuses={() => {
              const opts = statusOptions.map((s) => s.value);
              setHiddenStatuses(opts);
            }}
          />
          )}
        </Paper>

        {selectedParcel && (
          <Paper
            sx={{
              width: { xs: 300, md: 340 },
              flexShrink: 0,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 650 }} noWrap>
                Parcel
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => router.push(`/projects/${projectId}/parcels/${selectedParcel.id}/edit`)}
              >
                Full edit
              </Button>
            </Box>

            <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
              <div>{project.name}</div>
              {(project.projectCode || project.workOrderNumber) && (
                <div>
                  {project.projectCode ? `ID ${project.projectCode}` : ''}
                  {project.projectCode && project.workOrderNumber ? ' · ' : ''}
                  {project.workOrderNumber ? `WO# ${project.workOrderNumber}` : ''}
                </div>
              )}
              {project.roleAssignments?.length ? (
                <div>
                  {project.roleAssignments
                    .filter((a: any) => a.role === 'MANAGER' || a.role === 'LEAD_AGENT')
                    .map((a: any) => `${a.role === 'MANAGER' ? 'Mgr' : 'Lead'}: ${a.user?.name || a.user?.email || '—'}`)
                    .join(' · ')}
                </div>
              ) : null}
              {selectedParcel.titledOwnerName && <div>Titled: {selectedParcel.titledOwnerName}</div>}
              {selectedParcel.tenantName && <div>Tenant: {selectedParcel.tenantName}</div>}
              {selectedParcel.lastCompensationTotal != null && (
                <div>
                  Last offer: ${Number(selectedParcel.lastCompensationTotal).toLocaleString()}
                  {selectedParcel.lastCompensationOutsideRange ? ' (outside range)' : ''}
                </div>
              )}
              {(selectedParcel as any)._count && (
                <div>
                  Notes {(selectedParcel as any)._count.notes ?? 0}
                  {' · '}
                  Docs {(selectedParcel as any)._count.documents ?? 0}
                </div>
              )}
              {(selectedParcel as any).notes?.[0]?.content && (
                <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                  Latest: {String((selectedParcel as any).notes[0].content).slice(0, 80)}
                  {String((selectedParcel as any).notes[0].content).length > 80 ? '…' : ''}
                </div>
              )}
            </Box>

            <ParcelStatusPanel
              compact
              disabled={updateStatusMutation.isPending}
              values={selectedParcel}
              onChange={(field, value) => handleStatusFieldChange(selectedParcel.id, field, value)}
              identity={{
                ...selectedParcel,
                lastCompensationTotal:
                  selectedParcel.lastCompensationTotal != null
                    ? Number(selectedParcel.lastCompensationTotal)
                    : null,
              }}
              title="Track (same as edit)"
            />

            {updateStatusMutation.isError && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {(updateStatusMutation.error as Error)?.message || 'Update failed'}
              </Alert>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
}
