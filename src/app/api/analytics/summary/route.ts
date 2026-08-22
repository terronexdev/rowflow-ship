import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectAccessWhere } from '@/lib/projectAccess';
import {
  computeRates,
  countBy,
  isAcceptedDecision,
  isActiveProjectStatus,
  isHighLaborVariance,
  ptsProgressCount,
  round2,
  summarizeSchedule,
} from '@/lib/analytics/statsHelpers';
import {
  actualsFromCostEntries,
  buildBudgetVsActualRows,
  laborActualFromCostBuckets,
  laborBudgetFromCategories,
} from '@/lib/analytics/costBudget';
import { summarizeDomainProgress } from '@/lib/parcels/statusRollup';
import { ASSIGNMENT_ROLE_VALUES } from '@/lib/constants';

/**
 * GET /api/analytics/summary?projectIds=id1,id2
 * Cross-project rollup for Dashboard + Analytics.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filterRaw = req.nextUrl.searchParams.get('projectIds');
    const filterIds = filterRaw
      ? filterRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    const include = {
      budgetLines: true,
      schedulePhases: { orderBy: [{ track: 'asc' as const }, { sortOrder: 'asc' as const }] },
      roleAssignments: {
        where: { isCurrent: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { parcels: true } },
    };

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          projectAccessWhere(session.user.id),
          ...(filterIds?.length ? [{ id: { in: filterIds } }] : []),
        ],
      },
      include,
      orderBy: { updatedAt: 'desc' },
    });

    const projectIds = projects.map((p) => p.id);

    const parcels =
      projectIds.length === 0
        ? []
        : await prisma.parcel.findMany({
            where: { projectId: { in: projectIds } },
            select: {
              id: true,
              projectId: true,
              status: true,
              ptsStatus: true,
              titleStatus: true,
              surveyStatus: true,
              appraisalStatus: true,
              acquisitionStatus: true,
              condemnationStatus: true,
              damagesStatus: true,
              specialConditionsStatus: true,
              county: true,
              acreage: true,
            },
          });

        const costEntries =
      projectIds.length === 0
        ? []
        : await prisma.parcelCostEntry.findMany({
            where: { parcel: { projectId: { in: projectIds } } },
            select: {
              discipline: true,
              entryType: true,
              amount: true,
              billable: true,
              hours: true,
              role: true,
              parcel: { select: { projectId: true } },
            },
          });

    const offers =
      projectIds.length === 0
        ? []
        : await prisma.compensationOffer.findMany({
            where: { parcel: { projectId: { in: projectIds } } },
            select: {
              id: true,
              total: true,
              outsideRange: true,
              outsideRangeReason: true,
              decision: true,
              rangeLow: true,
              rangeHigh: true,
              negotiatedAmount: true,
              createdAt: true,
              parcel: {
                select: {
                  id: true,
                  parcelNumber: true,
                  owner: true,
                  projectId: true,
                  project: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
          });

    // Global histograms
    const statusBreakdown = countBy(parcels, (p) => p.status);
    const ptsBreakdown = countBy(parcels, (p) => p.ptsStatus);
    const titleBreakdown = countBy(parcels, (p) => p.titleStatus);
    const surveyBreakdown = countBy(parcels, (p) => p.surveyStatus);
    const appraisalBreakdown = countBy(parcels, (p) => p.appraisalStatus);
    const acquisitionBreakdown = countBy(parcels, (p) => p.acquisitionStatus);
    const condemnationBreakdown = countBy(parcels, (p) => p.condemnationStatus);
    const damagesBreakdown = countBy(parcels, (p) => p.damagesStatus);
    const specialConditionsBreakdown = countBy(parcels, (p) => p.specialConditionsStatus);

    const parcelCount = parcels.length;
    const domainProgressAll = summarizeDomainProgress(parcels);
    const acquired = domainProgressAll.acquired;
    const totalAcreage = parcels.reduce((s, p) => s + (p.acreage || 0), 0);

    // TIME costs → labor-by-role + by project
    const laborByProject: Record<
      string,
      { hours: number; amount: number; billable: number; byRole: Record<string, { hours: number; amount: number }> }
    > = {};
    const laborByRole: Record<string, { hours: number; amount: number; count: number }> = {};
    let laborTotalHours = 0;
    let laborTotalAmount = 0;
    let laborBillableAmount = 0;

    for (const e of costEntries) {
      if (e.entryType !== 'TIME') continue;
      const pid = e.parcel.projectId;
      const role = e.role || 'AGENT';
      if (!laborByProject[pid]) {
        laborByProject[pid] = { hours: 0, amount: 0, billable: 0, byRole: {} };
      }
      const hrs = Number(e.hours) || 0;
      const amt = Number(e.amount) || 0;
      laborByProject[pid].hours += hrs;
      laborByProject[pid].amount += amt;
      if (e.billable) laborByProject[pid].billable += amt;
      if (!laborByProject[pid].byRole[role]) {
        laborByProject[pid].byRole[role] = { hours: 0, amount: 0 };
      }
      laborByProject[pid].byRole[role].hours += hrs;
      laborByProject[pid].byRole[role].amount += amt;

      if (!laborByRole[role]) laborByRole[role] = { hours: 0, amount: 0, count: 0 };
      laborByRole[role].hours += hrs;
      laborByRole[role].amount += amt;
      laborByRole[role].count += 1;

      laborTotalHours += hrs;
      laborTotalAmount += amt;
      if (e.billable) laborBillableAmount += amt;
    }

    // Cost ledger by project (for budget actuals + health)
    const costsByProject: Record<string, typeof costEntries> = {};
    for (const e of costEntries) {
      const pid = e.parcel.projectId;
      if (!costsByProject[pid]) costsByProject[pid] = [];
      costsByProject[pid].push(e);
    }

    const offersByProject: Record<
      string,
      { count: number; total: number; outside: number; acceptedCount: number; acceptedTotal: number }
    > = {};
    let offerCount = 0;
    let offerTotal = 0;
    let outsideRangeCount = 0;
    let acceptedOfferCount = 0;
    let acceptedOfferTotal = 0;
    const outsideRangeOffers: Array<{
      id: string;
      total: number;
      rangeLow: number;
      rangeHigh: number;
      negotiatedAmount: number;
      decision: string;
      reason: string | null;
      createdAt: string;
      parcelId: string;
      parcelNumber: string | null;
      owner: string | null;
      projectId: string;
      projectName: string;
    }> = [];

    for (const o of offers) {
      const pid = o.parcel.projectId;
      if (!offersByProject[pid]) {
        offersByProject[pid] = {
          count: 0,
          total: 0,
          outside: 0,
          acceptedCount: 0,
          acceptedTotal: 0,
        };
      }
      const t = Number(o.total || 0);
      offersByProject[pid].count += 1;
      offersByProject[pid].total += t;
      offerCount += 1;
      offerTotal += t;
      if (o.outsideRange) {
        offersByProject[pid].outside += 1;
        outsideRangeCount += 1;
        if (outsideRangeOffers.length < 50) {
          outsideRangeOffers.push({
            id: o.id,
            total: round2(t),
            rangeLow: round2(Number(o.rangeLow || 0)),
            rangeHigh: round2(Number(o.rangeHigh || 0)),
            negotiatedAmount: round2(Number(o.negotiatedAmount || 0)),
            decision: o.decision,
            reason: o.outsideRangeReason,
            createdAt: o.createdAt.toISOString(),
            parcelId: o.parcel.id,
            parcelNumber: o.parcel.parcelNumber,
            owner: o.parcel.owner,
            projectId: o.parcel.project.id,
            projectName: o.parcel.project.name,
          });
        }
      }
      if (isAcceptedDecision(o.decision)) {
        offersByProject[pid].acceptedCount += 1;
        offersByProject[pid].acceptedTotal += t;
        acceptedOfferCount += 1;
        acceptedOfferTotal += t;
      }
    }

    const parcelsByProjectId: Record<string, typeof parcels> = {};
    for (const p of parcels) {
      if (!parcelsByProjectId[p.projectId]) parcelsByProjectId[p.projectId] = [];
      parcelsByProjectId[p.projectId].push(p);
    }

    let budgetTotal = 0;
    const budgetByCategory: Record<string, number> = {};
    let scheduleCounts = { complete: 0, late: 0, atRisk: 0, onTrack: 0, notStarted: 0 };
    const latePhaseSamples: Array<{
      projectId: string;
      projectName: string;
      phaseKey: string;
      label: string;
      endDate: string | null;
    }> = [];
    const schedulePhases: Array<{
      id: string;
      projectId: string;
      projectName: string;
      track: string;
      phaseKey: string;
      label: string;
      startDate: string | null;
      endDate: string | null;
      health: string;
      isPastDue: boolean;
      isComplete: boolean;
      daysToEnd: number | null;
      daysLate: number | null;
    }> = [];

    let projectsMissingManager = 0;
    let projectsMissingLead = 0;
    let highLaborVarianceProjects = 0;

    const projectCards = projects.map((proj) => {
      const pParcels = parcelsByProjectId[proj.id] || [];
      const pTotal = pParcels.length;
      const pStatus = countBy(pParcels, (p) => p.status);
      const pPts = countBy(pParcels, (p) => p.ptsStatus);
      const pDomain = summarizeDomainProgress(pParcels);
      const pAcquired = pDomain.acquired;

      const pBudgetByCat: Record<string, number> = {};
      let pBudgetTotal = 0;
      for (const l of proj.budgetLines) {
        const v = Number(l.total || 0);
        pBudgetByCat[l.category] = (pBudgetByCat[l.category] || 0) + v;
        pBudgetTotal += v;
        budgetByCategory[l.category] = (budgetByCategory[l.category] || 0) + v;
      }
      budgetTotal += pBudgetTotal;

      const labor = laborByProject[proj.id] || { hours: 0, amount: 0, billable: 0, byRole: {} };
      const comp = offersByProject[proj.id] || {
        count: 0,
        total: 0,
        outside: 0,
        acceptedCount: 0,
        acceptedTotal: 0,
      };

      const schedule = summarizeSchedule(proj.schedulePhases);
      scheduleCounts = {
        complete: scheduleCounts.complete + schedule.counts.complete,
        late: scheduleCounts.late + schedule.counts.late,
        atRisk: scheduleCounts.atRisk + schedule.counts.atRisk,
        onTrack: scheduleCounts.onTrack + schedule.counts.onTrack,
        notStarted: scheduleCounts.notStarted + schedule.counts.notStarted,
      };
      for (const ph of schedule.phases) {
        if (schedulePhases.length < 200) {
          schedulePhases.push({
            id: ph.id,
            projectId: proj.id,
            projectName: proj.name,
            track: ph.track,
            phaseKey: ph.phaseKey,
            label: ph.label,
            startDate: ph.startDate,
            endDate: ph.endDate,
            health: ph.health,
            isPastDue: ph.isPastDue,
            isComplete: ph.isComplete,
            daysToEnd: ph.daysToEnd,
            daysLate: ph.daysLate,
          });
        }
        if (ph.isPastDue && latePhaseSamples.length < 12) {
          latePhaseSamples.push({
            projectId: proj.id,
            projectName: proj.name,
            phaseKey: ph.phaseKey,
            label: ph.label,
            endDate: ph.endDate,
          });
        }
      }

      const roles: Record<string, boolean> = { MANAGER: false, LEAD_AGENT: false };
      for (const a of proj.roleAssignments) {
        roles[a.role] = true;
      }
      const missingManager = !roles.MANAGER;
      const missingLead = !roles.LEAD_AGENT;
      if (missingManager) projectsMissingManager += 1;
      if (missingLead) projectsMissingLead += 1;

      const laborBudget = laborBudgetFromCategories(pBudgetByCat);
      const pCostActuals = actualsFromCostEntries(costsByProject[proj.id] || []);
      const pLaborActual = laborActualFromCostBuckets(pCostActuals);
      const pExpense = pCostActuals.EXPENSES || 0;
      const pMileage = pCostActuals.MILEAGE || 0;
      if (isHighLaborVariance(pLaborActual, laborBudget)) highLaborVarianceProjects += 1;

      const spend =
        (comp.acceptedTotal || 0) +
        pLaborActual +
        pExpense +
        pMileage;
      const budgetUsedPct =
        pBudgetTotal > 0 ? round2((spend / pBudgetTotal) * 100) : null;

      const rates = computeRates({
        total: pTotal,
        acquired: pAcquired,
        ptsGranted: pPts.GRANTED || 0,
        ptsProgress: ptsProgressCount(pPts),
        offerCount: comp.count,
        outsideRangeCount: comp.outside,
        acceptedOfferCount: comp.acceptedCount,
        acceptedOfferTotal: comp.acceptedTotal,
      });

      return {
        id: proj.id,
        name: proj.name,
        status: proj.status,
        projectCode: proj.projectCode,
        workOrderNumber: proj.workOrderNumber,
        parcelCount: pTotal || proj._count.parcels,
        acquiredPct: rates.acquiredPct,
        acquiredCount: pAcquired,
        ptsProgressPct: rates.ptsProgressPct,
        ptsGrantedPct: rates.ptsGrantedPct,
        outsideRangeOffers: comp.outside,
        laborBillable: round2(pLaborActual),
        expenseActual: round2(pExpense),
        mileageActual: round2(pMileage),
        budgetTotal: round2(pBudgetTotal),
        budgetUsedPct,
        scheduleHealth: schedule.health,
        missingManager,
        missingLead,
        domainProgress: {
          titleActive: pDomain.titleActive,
          surveyActive: pDomain.surveyActive,
          appraisalActive: pDomain.appraisalActive,
          acquisitionComplete: pDomain.acquisitionComplete,
          ptsActive: pDomain.ptsActive,
          ptsGranted: pDomain.ptsGranted,
          permitActive: pDomain.permitActive,
          titleActivePct: pDomain.titleActivePct,
          surveyActivePct: pDomain.surveyActivePct,
          appraisalActivePct: pDomain.appraisalActivePct,
          acquisitionCompletePct: pDomain.acquisitionCompletePct,
          ptsActivePct: pDomain.ptsActivePct,
          inProgress: pDomain.inProgress,
          notStarted: pDomain.notStarted,
          overallAcquired: pDomain.overallAcquired,
        },
      };
    });

    const rates = computeRates({
      total: parcelCount,
      acquired,
      ptsGranted: ptsBreakdown.GRANTED || 0,
      ptsProgress: ptsProgressCount(ptsBreakdown),
      offerCount,
      outsideRangeCount,
      acceptedOfferCount,
      acceptedOfferTotal,
    });

    const laborBudgetAll = laborBudgetFromCategories(budgetByCategory);

    // Budget vs actual — cost ledger (billable) + accepted land offers
    const costActuals = actualsFromCostEntries(costEntries);
    const actualByCategory: Record<string, number> = {
      ...costActuals,
      LAND: (costActuals.LAND || 0) + acceptedOfferTotal,
    };
    const laborActualFromCosts = laborActualFromCostBuckets(actualByCategory);
    const expenseActual = round2(actualByCategory.EXPENSES || 0);
    const mileageActual = round2(actualByCategory.MILEAGE || 0);
    const costsBillableTotal = round2(
      Object.values(costActuals).reduce((s, v) => s + v, 0)
    );

    const budgetVsActual = {
      rows: buildBudgetVsActualRows(budgetByCategory, actualByCategory),
      laborBudget: round2(laborBudgetAll),
      laborActual: round2(laborActualFromCosts),
      laborVariance: round2(laborActualFromCosts - laborBudgetAll),
      compensationActual: round2(offerTotal),
      acceptedCompensation: round2(acceptedOfferTotal),
      expenseActual,
      mileageActual,
      costsBillableTotal,
      note:
        'Actuals: billable ParcelCostEntry by discipline (TIME/FEE/EXPENSE/MILEAGE). LAND = accepted compensation offers.',
    };

    // Labor by role chart rows + hours per acquired parcel
    const laborRoleRows = ASSIGNMENT_ROLE_VALUES.map((role) => {
      const r = laborByRole[role] || { hours: 0, amount: 0, count: 0 };
      return {
        role,
        label: role.replaceAll('_', ' '),
        hours: round2(r.hours),
        amount: round2(r.amount),
        count: r.count,
        hoursPerAcquired: acquired > 0 ? round2(r.hours / acquired) : 0,
      };
    }).filter((r) => r.hours > 0 || r.amount > 0 || r.count > 0);

    const countyCounts = countBy(
      parcels.filter((p) => p.county),
      (p) => p.county
    );
    const topCounties = Object.entries(countyCounts)
      .map(([county, count]) => ({ county, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const parcelsByProject = projectCards
      .map((p) => ({ id: p.id, name: p.name, parcels: p.parcelCount }))
      .sort((a, b) => b.parcels - a.parcels);

    const activeProjectCount = projects.filter((p) => isActiveProjectStatus(p.status)).length;

    return NextResponse.json({
      summary: {
        projectCount: projects.length,
        activeProjectCount,
        parcelCount,
        totalAcreage: round2(totalAcreage),
        rates,
        statusBreakdown,
        ptsBreakdown,
        titleBreakdown,
        surveyBreakdown,
        appraisalBreakdown,
        acquisitionBreakdown,
        domainProgress: domainProgressAll,
        condemnationBreakdown,
        damagesBreakdown,
        specialConditionsBreakdown,
        labor: {
          totalHours: round2(laborTotalHours),
          totalAmount: round2(laborTotalAmount),
          billableAmount: round2(laborBillableAmount),
          byRole: Object.fromEntries(
            Object.entries(laborByRole).map(([k, v]) => [
              k,
              { hours: round2(v.hours), amount: round2(v.amount), count: v.count },
            ])
          ),
        },
        compensation: {
          offerCount,
          offerTotal: round2(offerTotal),
          outsideRangeCount,
          acceptedOfferCount,
          acceptedOfferTotal: round2(acceptedOfferTotal),
        },
        outsideRangeOffers,
        budget: {
          total: round2(budgetTotal),
          byCategory: Object.fromEntries(
            Object.entries(budgetByCategory).map(([k, v]) => [k, round2(v)])
          ),
        },
        budgetVsActual,
        laborRoleRows,
        variance: {
          laborVsBudgetLabor: round2(laborActualFromCosts - laborBudgetAll),
          budgetTotal: round2(budgetTotal),
          laborActual: round2(laborActualFromCosts),
          expenseActual,
          mileageActual,
          costsBillableTotal,
        },
        schedule: {
          counts: scheduleCounts,
          latePhaseSamples,
          phases: schedulePhases,
        },
        alerts: {
          outsideRangeOffers: outsideRangeCount,
          pastDuePhases: scheduleCounts.late,
          projectsMissingManager,
          projectsMissingLead,
          highLaborVarianceProjects,
        },
        projects: projectCards,
        parcelsByProject,
        topCounties,
      },
    });
  } catch (error) {
    console.error('Error building analytics summary:', error);
    return NextResponse.json({ error: 'Failed to load analytics summary' }, { status: 500 });
  }
}
