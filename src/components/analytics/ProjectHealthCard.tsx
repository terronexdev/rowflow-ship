'use client';

import { Box, Button, Card, CardContent, Chip, Stack, Typography, LinearProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type ProjectHealth = {
  id: string;
  name: string;
  status: string;
  projectCode: string | null;
  workOrderNumber: string | null;
  parcelCount: number;
  acquiredPct: number;
  acquiredCount?: number;
  ptsProgressPct: number;
  ptsGrantedPct: number;
  outsideRangeOffers: number;
  laborBillable: number;
  budgetTotal: number;
  budgetUsedPct: number | null;
  scheduleHealth: 'LATE' | 'AT_RISK' | 'ON_TRACK' | 'UNKNOWN';
  missingManager: boolean;
  missingLead: boolean;
  domainProgress?: {
    titleActive: number;
    surveyActive: number;
    appraisalActive: number;
    acquisitionComplete: number;
    ptsActive: number;
    ptsGranted: number;
    permitActive: number;
    titleActivePct: number;
    surveyActivePct: number;
    appraisalActivePct: number;
    acquisitionCompletePct: number;
    ptsActivePct: number;
    inProgress: number;
    notStarted: number;
    overallAcquired: number;
  };
};

const healthColor: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  ON_TRACK: 'success',
  AT_RISK: 'warning',
  LATE: 'error',
  UNKNOWN: 'default',
};

export default function ProjectHealthCard({ project }: { project: ProjectHealth }) {
  const router = useRouter();
  const d = project.domainProgress;
  const n = project.parcelCount || 0;
  const acquiredCount =
    project.acquiredCount != null
      ? project.acquiredCount
      : Math.round((project.acquiredPct / 100) * n);

  return (
    <Card
      sx={{ height: '100%', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography fontWeight={700} noWrap>
            {project.name}
          </Typography>
          <Chip size="small" label={project.status || 'Active'} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {project.projectCode ? `ID ${project.projectCode}` : 'No Project ID'}
          {project.workOrderNumber ? ` · WO# ${project.workOrderNumber}` : ''}
          {' · '}
          {project.parcelCount} parcels
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Acquired {project.acquiredPct}%
          {n > 0 ? ` (${acquiredCount}/${n})` : ''}
          {d && d.overallAcquired !== acquiredCount
            ? ` · overall field ${d.overallAcquired}`
            : ''}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, project.acquiredPct)}
          sx={{ mb: 1, height: 6, borderRadius: 1 }}
          color="success"
        />

        {d && n > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.25 }}>
            <Chip
              size="small"
              variant="outlined"
              label={`Title ${d.titleActive}/${n}`}
              color={d.titleActive ? 'info' : 'default'}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Survey ${d.surveyActive}/${n}`}
              color={d.surveyActive ? 'info' : 'default'}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Appraisal ${d.appraisalActive}/${n}`}
              color={d.appraisalActive ? 'info' : 'default'}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Acq done ${d.acquisitionComplete}/${n}`}
              color={d.acquisitionComplete ? 'success' : 'default'}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`PTS ${d.ptsGranted}/${n} granted`}
              color={d.ptsGranted ? 'success' : 'default'}
            />
            {d.permitActive > 0 && (
              <Chip size="small" variant="outlined" label={`Permit ${d.permitActive}/${n}`} />
            )}
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary">
          PTS progress {project.ptsProgressPct}% (granted {project.ptsGrantedPct}%)
        </Typography>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, project.ptsProgressPct)}
          sx={{ mb: 1.5, height: 6, borderRadius: 1 }}
        />

        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
          <Chip
            size="small"
            label={`Schedule ${project.scheduleHealth.replaceAll('_', ' ')}`}
            color={healthColor[project.scheduleHealth]}
            variant="outlined"
          />
          {project.budgetUsedPct != null && (
            <Chip size="small" label={`Budget used ${project.budgetUsedPct}%`} variant="outlined" />
          )}
          {project.outsideRangeOffers > 0 && (
            <Chip size="small" color="warning" label={`${project.outsideRangeOffers} OOR offers`} />
          )}
          {project.missingManager && <Chip size="small" color="warning" label="No Manager" />}
          {project.missingLead && <Chip size="small" color="warning" label="No Lead" />}
        </Stack>

        <Button
          size="small"
          component={Link}
          href={`/projects/${project.id}/edit`}
          onClick={(e) => e.stopPropagation()}
        >
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}
