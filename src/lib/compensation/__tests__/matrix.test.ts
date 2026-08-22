import {
  unitBase,
  computeOfferRange,
  computeCompensationTotal,
  computeLaborAmount,
  scheduleAmount,
  unitOfferWindow,
  rowFromAmount,
} from '../matrix';

describe('compensation matrix', () => {
  it('PER_ACRE unit base from single amount (min=max)', () => {
    const b = unitBase({ minAmount: 1000, maxAmount: 1000, unit: 'PER_ACRE' }, 2);
    expect(b.min).toBe(2000);
    expect(b.max).toBe(2000);
  });

  it('PER_ACRE legacy min/max still midpoints for base span', () => {
    const b = unitBase({ minAmount: 1000, maxAmount: 2000, unit: 'PER_ACRE' }, 2);
    expect(b.min).toBe(2000);
    expect(b.max).toBe(4000);
  });

  it('FLAT ignores acres', () => {
    const b = unitBase({ minAmount: 500, maxAmount: 500, unit: 'FLAT' }, 10);
    expect(b.min).toBe(500);
    expect(b.max).toBe(500);
  });

  it('scheduleAmount prefers equal min/max', () => {
    expect(scheduleAmount({ minAmount: 5000, maxAmount: 5000, unit: 'PER_ACRE' })).toBe(5000);
    expect(scheduleAmount({ minAmount: 1000, maxAmount: 2000, unit: 'PER_ACRE' })).toBe(1500);
    expect(scheduleAmount({ minAmount: 0, maxAmount: 0, unit: 'PER_ACRE', amount: 4200 })).toBe(
      4200
    );
  });

  it('rowFromAmount writes min=max', () => {
    expect(rowFromAmount(2500, 'PER_ACRE')).toEqual({
      minAmount: 2500,
      maxAmount: 2500,
      unit: 'PER_ACRE',
      amount: 2500,
    });
  });

  it('single amount 80-150 band', () => {
    const r = computeOfferRange({
      row: { minAmount: 1500, maxAmount: 1500, unit: 'PER_ACRE' },
      acres: 1,
    });
    expect(r.matrixValue).toBe(1500);
    expect(r.rangeLow).toBe(1200);
    expect(r.rangeHigh).toBe(2250);
    expect(r.bandApplies).toBe(true);
    expect(r.outsideRange(1100)).toBe(true);
    expect(r.outsideRange(1500)).toBe(false);
    expect(r.outsideRange(2300)).toBe(true);
  });

  it('FLAT has no band — range equals amount', () => {
    const r = computeOfferRange({
      row: { minAmount: 10000, maxAmount: 10000, unit: 'FLAT' },
      acres: 5,
      lowPct: 0.8,
      highPct: 1.5,
    });
    expect(r.matrixValue).toBe(10000);
    expect(r.rangeLow).toBe(10000);
    expect(r.rangeHigh).toBe(10000);
    expect(r.bandApplies).toBe(false);
    expect(r.outsideRange(10000)).toBe(false);
    expect(r.outsideRange(9999)).toBe(true);
  });

  it('unitOfferWindow derives low/high for per-acre', () => {
    const w = unitOfferWindow({ minAmount: 5000, maxAmount: 5000, unit: 'PER_ACRE' }, 0.8, 1.5);
    expect(w.amount).toBe(5000);
    expect(w.low).toBe(4000);
    expect(w.high).toBe(7500);
    expect(w.bandApplies).toBe(true);
  });

  it('unitOfferWindow flat has no band', () => {
    const w = unitOfferWindow({ minAmount: 12000, maxAmount: 12000, unit: 'FLAT' }, 0.8, 1.5);
    expect(w.low).toBe(12000);
    expect(w.high).toBe(12000);
    expect(w.bandApplies).toBe(false);
  });

  it('legacy midpoint 80-150 band still works', () => {
    const r = computeOfferRange({
      row: { minAmount: 1000, maxAmount: 2000, unit: 'PER_ACRE' },
      acres: 1,
    });
    expect(r.matrixValue).toBe(1500);
    expect(r.rangeLow).toBe(1200);
    expect(r.rangeHigh).toBe(2250);
  });

  it('totals', () => {
    expect(computeCompensationTotal(1000, 100, 50)).toBe(1150);
    expect(computeLaborAmount(2.5, 40)).toBe(100);
  });
});
