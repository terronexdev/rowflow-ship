import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccessibleProject } from '@/lib/projectAccess';
import {
  computeRates,
  countBy,
  isAcceptedDecision,
  isHighLaborVariance,
  ptsProgressCount,
  round2,
  summarizeSchedule,
} from '@/lib/analytics/statsHelpers';
import {
  actualsFromCostEntries,
  budgetLineTotal,
  buildBudgetVsActualRows,
  laborActualFromCostBuckets,
  laborBudgetFromCategories,
} from '@/lib/analytics/costBudget';
import { summarizeDomainProgress } from '@/lib/parcels/statusRollup';
import {
  CONTACT_STALE_DAYS,
  classifyOpenParcelContacts,
} from '@/lib/parcels/contactAlerts';

// GET /api/projects/[id]/stats - enriched project statistics
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessOk = await getAccessibleProject(id, session.user.id);
    if (!accessOk) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: { id },
      include: {
        budgetLines: true,
        schedulePhases: { orderBy: [{ track: 'asc' }, { sortOrder: 'asc' }] },
        roleAssignments: {
          where: { isCurrent: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const parcels = await prisma.parcel.findMany({
      where: { projectId: id },
      select: {
        id: true,
        pin: true,
        parcelNumber: true,
        easementNumber: true,
        owner: true,
        status: true,
        ptsStatus: true,
        titleStatus: true,
        surveyStatus: true,
        appraisalStatus: true,
        acquisitionStatus: true,
        condemnationStatus: true,
        damagesStatus: true,
        specialConditionsStatus: true,
        permitStatus: true,
        existingRightsStatus: true,
        parcelClass: true,
        encroachmentStatus: true,
        acreage: true,
        lastCompensationTotal: true,
        lastCompensationOutsideRange: true,
        updatedAt: true,
      },
    });

    const total = parcels.length;
    const statusBreakdown = countBy(parcels, (p) => p.status);
    const ptsBreakdown = countBy(parcels, (p) => p.ptsStatus);
    const titleBreakdown = countBy(parcels, (p) => p.titleStatus);
    const surveyBreakdown = countBy(parcels, (p) => p.surveyStatus);
    const appraisalBreakdown = countBy(parcels, (p) => p.appraisalStatus);
    const acquisitionBreakdown = countBy(parcels, (p) => p.acquisitionStatus);
    const condemnationBreakdown = countBy(parcels, (p) => p.condemnationStatus);
    const damagesBreakdown = countBy(parcels, (p) => p.damagesStatus);
    const specialConditionsBreakdown = countBy(parcels, (p) => p.specialConditionsStatus);
    const permitBreakdown = countBy(parcels, (p) => p.permitStatus || 'NOT_STARTED');
    const existingRightsBreakdown = countBy(
      parcels,
      (p) => p.existingRightsStatus || 'NOT_REVIEWED'
    );
    const parcelClassBreakdown = countBy(parcels, (p) => p.parcelClass || 'UNKNOWN');
    const encroachmentBreakdown = countBy(
      parcels,
      (p) => p.encroachmentStatus || 'NOT_REVIEWED'
    );

    const domainProgress = summarizeDomainProgress(parcels);
    // Effective acquired: overall ACQUIRED/RELOCATED OR acquisition domain ACQUIRED
    const acquired = domainProgress.acquired;
    const inProgress = domainProgress.inProgress;
    const notStarted = domainProgress.notStarted;
    const condemned = statusBreakdown.CONDEMNED || 0;
    const relocated = statusBreakdown.RELOCATED || 0;

    const totalAcreage = parcels.reduce((sum, parcel) => sum + (parcel.acreage || 0), 0);
    const completionPercentage = total > 0 ? Math.round((acquired / total) * 100) : 0;

    const costEntries = await prisma.parcelCostEntry.findMany({
      where: { parcel: { projectId: id } },
      select: {
        discipline: true,
        entryType: true,
        amount: true,
        billable: true,
        hours: true,
        role: true,
      },
    });

    const laborByRole: Record<string, { hours: number; amount: number; count: number }> = {};
    let laborTotalAmount = 0;
    let laborTotalHours = 0;
    let laborBillableAmount = 0;
    for (const e of costEntries) {
      if (e.entryType !== 'TIME') continue;
      const role = e.role || 'AGENT';
      if (!laborByRole[role]) laborByRole[role] = { hours: 0, amount: 0, count: 0 };
      const hrs = Number(e.hours) || 0;
      const amt = Number(e.amount) || 0;
      laborByRole[role].hours += hrs;
      laborByRole[role].amount += amt;
      laborByRole[role].count += 1;
      laborTotalHours += hrs;
      laborTotalAmount += amt;
      if (e.billable) laborBillableAmount += amt;
    }

    const costActuals = actualsFromCostEntries(costEntries);
    const laborActualFromCosts = laborActualFromCostBuckets(costActuals);
    const expenseActual = costActuals.EXPENSES || 0;
    const mileageActual = costActuals.MILEAGE || 0;

    const offers = await prisma.compensationOffer.findMany({
      where: { parcel: { projectId: id } },
      select: { total: true, outsideRange: true, decision: true },
    });
    const compensationTotal = offers.reduce((s, o) => s + Number(o.total || 0), 0);
    const outsideRangeCount = offers.filter((o) => o.outsideRange).length;
    const acceptedOffers = offers.filter((o) => isAcceptedDecision(o.decision));
    const acceptedOfferTotal = acceptedOffers.reduce((s, o) => s + Number(o.total || 0), 0);
    const lastOfferSum = parcels.reduce(
      (s, p) => s + (p.lastCompensationTotal != null ? Number(p.lastCompensationTotal) : 0),
      0
    );

    const budgetTotal = project.budgetLines.reduce(
      (s, l) => s + budgetLineTotal(l, parcels.length),
      0
    );
    const budgetByCategory: Record<string, number> = {};
    for (const l of project.budgetLines) {
      budgetByCategory[l.category] = (budgetByCategory[l.category] || 0) + budgetLineTotal(l, parcels.length);
    }

    const actualByCategory: Record<string, number> = {
      ...costActuals,
      LAND: (costActuals.LAND || 0) + acceptedOfferTotal,
    };
    const budgetVsActualRows = buildBudgetVsActualRows(budgetByCategory, actualByCategory);

    const noteCount = await prisma.note.count({
      where: {
        OR: [{ projectId: id }, { parcel: { projectId: id } }],
      },
    });
    const documentCount = await prisma.document.count({
      where: {
        OR: [{ projectId: id }, { parcel: { projectId: id } }],
      },
    });
    const permitCount = await prisma.permit.count({ where: { projectId: id } });

    const roles: Record<string, { id: string; name: string | null; email: string } | null> = {};
    for (const a of project.roleAssignments) {
      roles[a.role] = a.user;
    }

    const schedule = summarizeSchedule(project.schedulePhases);
    const laborBudget = laborBudgetFromCategories(budgetByCategory);
    const rates = computeRates({
      total,
      acquired,
      ptsGranted: ptsBreakdown.GRANTED || 0,
      ptsProgress: ptsProgressCount(ptsBreakdown),
      offerCount: offers.length,
      outsideRangeCount,
      acceptedOfferCount: acceptedOffers.length,
      acceptedOfferTotal,
    });

    const oorParcels = parcels
      .filter((p) => p.lastCompensationOutsideRange)
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        pin: p.pin,
        parcelNumber: p.parcelNumber,
        easementNumber: (p as any).easementNumber,
        owner: (p as any).owner,
        lastCompensationTotal:
          p.lastCompensationTotal != null ? Number(p.lastCompensationTotal) : null,
      }));

    const supplementNeededCount = existingRightsBreakdown.SUPPLEMENT_NEEDED || 0;
    const encroachNeedsRemovalCount = encroachmentBreakdown.NEEDS_REMOVAL || 0;
    const encroachIdentifiedCount = encroachmentBreakdown.IDENTIFIED || 0;

    // Contact CRM lite: open-acq parcels stale (14d) vs unsatisfied overdue follow-ups
    const openAcqParcels = parcels.filter((p) => {
      const overall = String(p.status || '').toUpperCase();
      if (overall === 'ACQUIRED' || overall === 'RELOCATED') return false;
      const acq = String(p.acquisitionStatus || '').toUpperCase();
      if (acq === 'ACQUIRED') return false;
      return (
        overall === 'IN_PROGRESS' ||
        overall === 'NOT_STARTED' ||
        (acq && acq !== 'NOT_STARTED')
      );
    });
    const openAcqIds = openAcqParcels.map((p) => p.id);
    const contactLogs = openAcqIds.length
      ? await prisma.contactLog.findMany({
          where: { parcelId: { in: openAcqIds } },
          select: { id: true, parcelId: true, contactDate: true, followUpDate: true },
        })
      : [];
    const contactAlerts = classifyOpenParcelContacts(openAcqIds, contactLogs);
    const staleContactCount = contactAlerts.staleCount;
    const pastDueFollowUpCount = contactAlerts.pastDueCount;
    const staleContactParcelIds = contactAlerts.staleParcelIds;
    const pastDueFollowUpParcelIds = contactAlerts.pastDueFollowUpParcelIds;

    const alerts = {
      outsideRangeOffers: outsideRangeCount,
      pastDuePhases: schedule.counts.late,
      missingManager: !roles.MANAGER,
      missingLead: !roles.LEAD_AGENT,
      highLaborVariance: isHighLaborVariance(laborActualFromCosts, laborBudget),
      supplementNeeded: supplementNeededCount,
      encroachNeedsRemoval: encroachNeedsRemovalCount,
      encroachIdentified: encroachIdentifiedCount,
      staleContacts: staleContactCount,
      pastDueFollowUps: pastDueFollowUpCount,
    };

    return NextResponse.json({
      stats: {
        total,
        acquired,
        inProgress,
        notStarted,
        condemned,
        relocated,
        totalAcreage: round2(totalAcreage),
        completionPercentage,
        statusBreakdown,
        domainProgress,
        ptsBreakdown,
        titleBreakdown,
        surveyBreakdown,
        appraisalBreakdown,
        acquisitionBreakdown,
        condemnationBreakdown,
        damagesBreakdown,
        specialConditionsBreakdown,
        permitBreakdown,
        existingRightsBreakdown,
        parcelClassBreakdown,
        encroachmentBreakdown,
        oorParcels,
        staleContactParcelIds,
        pastDueFollowUpParcelIds,
        contacts: {
          staleDays: CONTACT_STALE_DAYS,
          staleOpenAcq: staleContactCount,
          pastDueFollowUps: pastDueFollowUpCount,
        },
        rates,
        budget: {
          total: round2(budgetTotal),
          byCategory: Object.fromEntries(
            Object.entries(budgetByCategory).map(([k, v]) => [k, round2(v)])
          ),
        },
        budgetVsActual: {
          rows: budgetVsActualRows,
          laborBudget: round2(laborBudget),
          laborActual: round2(laborActualFromCosts),
          laborVariance: round2(laborActualFromCosts - laborBudget),
          expenseActual: round2(expenseActual),
          mileageActual: round2(mileageActual),
          acceptedCompensation: round2(acceptedOfferTotal),
        },
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
        costs: {
          byCategory: Object.fromEntries(
            Object.entries(costActuals).map(([k, v]) => [k, round2(v)])
          ),
          expenseActual: round2(expenseActual),
          mileageActual: round2(mileageActual),
          billableTotal: round2(
            Object.values(costActuals).reduce((s: number, v) => s + Number(v), 0)
          ),
        },
        compensation: {
          offerCount: offers.length,
          offerTotal: round2(compensationTotal),
          outsideRangeCount,
          acceptedOfferCount: acceptedOffers.length,
          acceptedOfferTotal: round2(acceptedOfferTotal),
          lastOfferCacheSum: round2(lastOfferSum),
        },
        scopeEstimate: (() => {
          const snap = (project as { scopeEstimateJson?: { totals?: Record<string, number>; name?: string; ingestedAt?: string } | null }).scopeEstimateJson;
          const totals = snap?.totals || {};
          const takeTarget = Number(totals.takeTarget) || 0;
          const budgetEst = Number(totals.budgetTotal) || budgetTotal;
          return {
            name: snap?.name || null,
            ingestedAt: snap?.ingestedAt || null,
            takeTarget: round2(takeTarget),
            takeLow: round2(Number(totals.takeLow) || 0),
            takeHigh: round2(Number(totals.takeHigh) || 0),
            budgetTotal: round2(budgetEst),
            acceptedVsTake: takeTarget ? round2(acceptedOfferTotal - takeTarget) : null,
            usedVsBudget: budgetTotal ? round2(acceptedOfferTotal + laborActualFromCosts - budgetTotal) : null,
          };
        })(),
        schedule,
        alerts,
        counts: {
          notes: noteCount,
          documents: documentCount,
          permits: permitCount,
        },
        roles,
        variance: {
          laborVsBudgetLabor: round2(laborActualFromCosts - laborBudget),
          budgetTotal: round2(budgetTotal),
          laborActual: round2(laborActualFromCosts),
          expenseActual: round2(expenseActual),
          mileageActual: round2(mileageActual),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json({ error: 'Failed to fetch project statistics' }, { status: 500 });
  }
}
