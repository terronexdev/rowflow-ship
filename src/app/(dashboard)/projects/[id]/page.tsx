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
import { getStatusColor, OPEN_PERMIT_PHASE_STATUSES, TITLE_STATUSES, EXISTING_RIGHTS_STATUSES, ENCROACHMENT_STATUSES } from '@/lib/constants';
import { personLabel } from '@/lib/attribution';
import ParcelStatusPanel, {
  type ParcelStatusKey,
  PARCEL_STATUS_FIELDS,
} from '@/components/parcel/ParcelStatusPanel';
import { computeOfferRange, formatMoney } from '@/lib/compensation/matrix';
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
import ProjectFeaturesPanel from '@/components/map/ProjectFeaturesPanel';
import { GisDisclaimer } from '@/components/legal/GisDisclaimer';
import ViewListIcon from '@mui/icons-material/ViewList';
import LayersIcon from '@mui/icons-material/Layers';
import { type AnnType, annGroupKey } from '@/lib/map/annotations';

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
