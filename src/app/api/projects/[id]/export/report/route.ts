import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccessibleProject } from '@/lib/projectAccess';

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
}

// GET /api/projects/[id]/export/report?type=costs|compensation|budget
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const project = await getAccessibleProject(id, session.user.id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const type = (req.nextUrl.searchParams.get('type') || 'costs').toLowerCase();
    const safeName = (project.name || 'project').replace(/[^a-zA-Z0-9._-]+/g, '-');

    if (type === 'costs' || type === 'labor') {
      const entries = await prisma.parcelCostEntry.findMany({
        where: { parcel: { projectId: id } },
        orderBy: { workDate: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          parcel: { select: { parcelNumber: true, pin: true, propertyAddress: true } },
        },
      });
      const rows = entries.map((e) => ({
        workDate: e.workDate.toISOString().slice(0, 10),
        discipline: e.discipline,
        entryType: e.entryType,
        pin: e.parcel.pin || '',
        parcelNumber: e.parcel.parcelNumber || '',
        address: e.parcel.propertyAddress || '',
        role: e.role || '',
        user: e.user.name || e.user.email,
        hours: e.hours != null ? Number(e.hours) : '',
        hourlyRate: e.hourlyRate != null ? Number(e.hourlyRate) : '',
        miles: e.miles != null ? Number(e.miles) : '',
        feeCode: e.feeCode || '',
        expenseCategory: e.expenseCategory || '',
        amount: Number(e.amount),
        billable: e.billable,
        description: e.description || '',
        receipt: e.receiptUrl || '',
      }));
      const csv = toCsv(rows);
      return new NextResponse(
        csv ||
          'workDate,discipline,entryType,pin,parcelNumber,address,role,user,hours,hourlyRate,miles,feeCode,expenseCategory,amount,billable,description,receipt\n',
        {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${safeName}-costs.csv"`,
          },
        }
      );
    }

    if (type === 'compensation') {
      const offers = await prisma.compensationOffer.findMany({
        where: { parcel: { projectId: id } },
        include: {
          parcel: { select: { pin: true, parcelNumber: true, propertyAddress: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const rows = offers.map((o) => ({
        createdAt: o.createdAt.toISOString(),
        pin: o.parcel.pin || '',
        parcelNumber: o.parcel.parcelNumber || '',
        address: o.parcel.propertyAddress || '',
        landUse: o.landUseLabel || o.landUse,
        easementAcres: Number(o.easementAcres),
        rangeLow: Number(o.rangeLow),
        rangeHigh: Number(o.rangeHigh),
        negotiated: Number(o.negotiatedAmount),
        damages: Number(o.damages),
        other: Number(o.otherAmount),
        total: Number(o.total),
        outsideRange: o.outsideRange,
        decision: o.decision,
        reason: o.outsideRangeReason || '',
      }));
      const csv = toCsv(rows);
      return new NextResponse(
        csv ||
          'createdAt,pin,parcelNumber,address,landUse,easementAcres,rangeLow,rangeHigh,negotiated,damages,other,total,outsideRange,decision,reason\n',
        {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${safeName}-compensation.csv"`,
          },
        }
      );
    }

    if (type === 'budget') {
      const lines = await prisma.budgetLine.findMany({
        where: { projectId: id },
        orderBy: { sortOrder: 'asc' },
      });
      const rows = lines.map((l) => ({
        category: l.category,
        label: l.label || '',
        mode: l.mode,
        amount: l.amount != null ? Number(l.amount) : '',
        hours: l.hours != null ? Number(l.hours) : '',
        rate: l.rate != null ? Number(l.rate) : '',
        total: Number(l.total),
      }));
      const csv = toCsv(rows);
      return new NextResponse(csv || 'category,label,mode,amount,hours,rate,total\n', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${safeName}-budget.csv"`,
        },
      });
    }

    if (type === 'schedule') {
      const { summarizeSchedule } = await import('@/lib/analytics/statsHelpers');
      const phases = await prisma.projectSchedulePhase.findMany({
        where: { projectId: id },
        orderBy: [{ track: 'asc' }, { sortOrder: 'asc' }],
      });
      const { phases: evaluated, health } = summarizeSchedule(phases);
      const rows = evaluated.map((ph) => ({
        project: project.name,
        track: ph.track,
        phaseKey: ph.phaseKey,
        label: ph.label,
        startDate: ph.startDate ? ph.startDate.slice(0, 10) : '',
        endDate: ph.endDate ? ph.endDate.slice(0, 10) : '',
        isComplete: ph.isComplete,
        health: ph.health,
        daysToEnd: ph.daysToEnd ?? '',
        daysLate: ph.daysLate ?? '',
        isPastDue: ph.isPastDue,
        projectHealth: health,
      }));
      const csv = toCsv(rows);
      return new NextResponse(
        csv ||
          'project,track,phaseKey,label,startDate,endDate,isComplete,health,daysToEnd,daysLate,isPastDue,projectHealth\n',
        {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${safeName}-schedule.csv"`,
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Unknown type. Use costs | compensation | budget | schedule' },
      { status: 400 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
