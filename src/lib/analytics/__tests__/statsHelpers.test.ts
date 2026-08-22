import {
  countBy,
  computeRates,
  isAcceptedDecision,
  isActiveProjectStatus,
  isHighLaborVariance,
  laborBudgetFromCategories,
  mergeCounts,
  pct,
  ptsProgressCount,
  summarizeSchedule,
} from '@/lib/analytics/statsHelpers';

describe('analytics statsHelpers', () => {
  test('countBy and mergeCounts', () => {
    const a = countBy([{ s: 'A' }, { s: 'A' }, { s: 'B' }], (x) => x.s);
    expect(a).toEqual({ A: 2, B: 1 });
    expect(mergeCounts(a, { B: 2, C: 1 })).toEqual({ A: 2, B: 3, C: 1 });
  });

  test('pct and rates', () => {
    expect(pct(1, 4)).toBe(25);
    const rates = computeRates({
      total: 10,
      acquired: 4,
      ptsGranted: 2,
      ptsProgress: 5,
      offerCount: 4,
      outsideRangeCount: 1,
      acceptedOfferCount: 1,
      acceptedOfferTotal: 1000,
    });
    expect(rates.acquiredPct).toBe(40);
    expect(rates.ptsGrantedPct).toBe(20);
    expect(rates.ptsProgressPct).toBe(50);
    expect(rates.outsideRangeRatePct).toBe(25);
  });

  test('ptsProgressCount', () => {
    expect(
      ptsProgressCount({ REQUESTED: 1, GRANTED: 2, NOT_REQUIRED: 1, DENIED: 9 })
    ).toBe(4);
  });

  test('accepted decision', () => {
    expect(isAcceptedDecision('ACCEPTED')).toBe(true);
    expect(isAcceptedDecision('DRAFT')).toBe(false);
  });

  test('active project status', () => {
    expect(isActiveProjectStatus('Active')).toBe(true);
    expect(isActiveProjectStatus('Archived')).toBe(false);
  });

  test('labor variance', () => {
    expect(
      laborBudgetFromCategories({
        ROW_LABOR: 100,
        SURVEY_LABOR: 100,
        TITLE_LABOR: 50,
        CONSTRUCTION_LABOR: 25,
      })
    ).toBe(275);
    expect(isHighLaborVariance(300, 200)).toBe(true);
    expect(isHighLaborVariance(210, 200)).toBe(false);
    // $0 billed with a budget is under — not high variance
    expect(isHighLaborVariance(0, 10000)).toBe(false);
    // slight over still within 25%
    expect(isHighLaborVariance(240, 200)).toBe(false);
    // over by more than 25%
    expect(isHighLaborVariance(251, 200)).toBe(true);
  });

  test('schedule late when endDate past', () => {
    const now = new Date('2026-07-29T12:00:00Z');
    const { phases, counts, health } = summarizeSchedule(
      [
        {
          id: '1',
          track: 'ROW',
          phaseKey: 'ACQUISITION',
          endDate: '2026-07-01T00:00:00Z',
        },
        {
          id: '2',
          track: 'ROW',
          phaseKey: 'TITLE',
          endDate: '2026-08-15T00:00:00Z',
          startDate: '2026-07-01T00:00:00Z',
        },
      ],
      now
    );
    expect(phases[0].isPastDue).toBe(true);
    expect(phases[0].health).toBe('LATE');
    expect(phases[0].daysLate).toBeGreaterThan(0);
    expect(counts.late).toBe(1);
    expect(health).toBe('LATE');
  });

  test('schedule complete overrides past end', () => {
    const now = new Date('2026-07-29T12:00:00Z');
    const { phases, counts, health } = summarizeSchedule(
      [
        {
          id: '1',
          track: 'ROW',
          phaseKey: 'ACQUISITION',
          endDate: '2026-07-01T00:00:00Z',
          isComplete: true,
        },
      ],
      now
    );
    expect(phases[0].health).toBe('COMPLETE');
    expect(phases[0].isPastDue).toBe(false);
    expect(counts.complete).toBe(1);
    expect(counts.late).toBe(0);
    expect(health).toBe('ON_TRACK');
  });
});
