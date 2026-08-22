import {
  actualsFromCostEntries,
  actualsFromLaborEntries,
  budgetCategoryForCost,
  budgetLineTotal,
  buildBudgetVsActualRows,
  laborActualFromCostBuckets,
  laborBudgetFromCategories,
  mergeActualBuckets,
  mergeBudgetLinesWithDefaults,
} from '@/lib/analytics/costBudget';

describe('costBudget mapping', () => {
  test('maps discipline + type to budget keys', () => {
    expect(budgetCategoryForCost({ discipline: 'ROW', entryType: 'TIME' })).toBe('ROW_LABOR');
    expect(budgetCategoryForCost({ discipline: 'TITLE', entryType: 'TIME' })).toBe('TITLE_LABOR');
    expect(budgetCategoryForCost({ discipline: 'SURVEY', entryType: 'FEE' })).toBe('SURVEY_LABOR');
    expect(budgetCategoryForCost({ discipline: 'APPRAISAL', entryType: 'FEE' })).toBe('APPRAISAL');
    expect(budgetCategoryForCost({ discipline: 'LEGAL', entryType: 'TIME' })).toBe('LEGAL');
    expect(budgetCategoryForCost({ discipline: 'CONSTRUCTION', entryType: 'TIME' })).toBe(
      'CONSTRUCTION_LABOR'
    );
    expect(budgetCategoryForCost({ discipline: 'PERMITTING', entryType: 'TIME' })).toBe('PERMITS');
    expect(budgetCategoryForCost({ discipline: 'PERMITTING', entryType: 'FEE' })).toBe('PERMITS');
    expect(budgetCategoryForCost({ discipline: 'ROW', entryType: 'EXPENSE' })).toBe('EXPENSES');
    expect(budgetCategoryForCost({ discipline: 'SURVEY', entryType: 'MILEAGE' })).toBe('MILEAGE');
  });

  test('sums billable actuals by category', () => {
    const buckets = actualsFromCostEntries([
      { discipline: 'ROW', entryType: 'TIME', amount: 100, billable: true },
      { discipline: 'TITLE', entryType: 'TIME', amount: 50, billable: true },
      { discipline: 'CONSTRUCTION', entryType: 'TIME', amount: 80, billable: true },
      { discipline: 'ROW', entryType: 'EXPENSE', amount: 20, billable: true },
      { discipline: 'LEGAL', entryType: 'MILEAGE', amount: 15, billable: true },
      { discipline: 'APPRAISAL', entryType: 'FEE', amount: 2400, billable: true },
      { discipline: 'ROW', entryType: 'TIME', amount: 999, billable: false },
    ]);
    expect(buckets.ROW_LABOR).toBe(100);
    expect(buckets.TITLE_LABOR).toBe(50);
    expect(buckets.CONSTRUCTION_LABOR).toBe(80);
    expect(buckets.EXPENSES).toBe(20);
    expect(buckets.MILEAGE).toBe(15);
    expect(buckets.APPRAISAL).toBe(2400);
  });

  test('labor budget includes all discipline labor cats', () => {
    expect(
      laborBudgetFromCategories({
        ROW_LABOR: 100,
        TITLE_LABOR: 50,
        SURVEY_LABOR: 25,
        APPRAISAL: 200,
        LEGAL: 75,
        CONSTRUCTION_LABOR: 40,
        EXPENSES: 999,
        MILEAGE: 50,
        LAND: 10000,
      })
    ).toBe(100 + 50 + 25 + 200 + 75 + 40);
  });

  test('labor actual from buckets excludes opex', () => {
    expect(
      laborActualFromCostBuckets({
        ROW_LABOR: 10,
        EXPENSES: 5,
        MILEAGE: 3,
        CONSTRUCTION_LABOR: 7,
      })
    ).toBe(17);
  });

  test('buildBudgetVsActualRows merges keys', () => {
    const rows = buildBudgetVsActualRows({ ROW_LABOR: 100 }, { ROW_LABOR: 120, MILEAGE: 10 });
    expect(rows.find((r) => r.key === 'ROW_LABOR')?.variance).toBe(20);
    expect(rows.find((r) => r.key === 'MILEAGE')?.actual).toBe(10);
  });
});

  test('legacy labor role mapping', () => {
    const a = actualsFromLaborEntries([
      { role: 'AGENT', amount: 900, billable: true },
      { role: 'SURVEY', amount: 100, billable: true },
      { role: 'AGENT', amount: 50, billable: true, linkedToCost: true },
    ]);
    expect(a.ROW_LABOR).toBe(900);
    expect(a.SURVEY_LABOR).toBe(100);
  });

  test('mergeBudgetLinesWithDefaults adds missing cats', () => {
    const merged = mergeBudgetLinesWithDefaults([
      { category: 'LAND', amount: 1 },
      { category: 'ROW_LABOR', amount: 2 },
    ]);
    expect(merged.find((l) => l.category === 'CONSTRUCTION_LABOR')).toBeTruthy();
    expect(merged.find((l) => l.category === 'TITLE_LABOR')).toBeTruthy();
    expect(merged.find((l) => l.category === 'LAND')?.amount).toBe(1);
  });

test('budgetLineTotal supports per-parcel', () => {
  expect(budgetLineTotal({ mode: 'TOTAL', amount: 4500 }, 115)).toBe(4500);
  expect(budgetLineTotal({ mode: 'PER_PARCEL', amount: 2500 }, 115)).toBe(287500);
  expect(budgetLineTotal({ mode: 'PER_PARCEL', amount: 2500, hours: 38 }, 115)).toBe(95000);
  expect(budgetLineTotal({ mode: 'HOURS_X_RATE', hours: 10, rate: 125 }, 115)).toBe(1250);
});
