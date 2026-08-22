import { diffStatusFields, summaryFromChanges } from '@/lib/activity/logActivity';

describe('diffStatusFields', () => {
  it('captures status track changes', () => {
    const changes = diffStatusFields(
      { ptsStatus: 'NOT_STARTED', titleStatus: 'NOT_STARTED' },
      { ptsStatus: 'GRANTED', titleStatus: 'NOT_STARTED' }
    );
    expect(changes).toEqual([
      { field: 'ptsStatus', from: 'NOT_STARTED', to: 'GRANTED' },
    ]);
  });

  it('captures priority and bookmarked including false', () => {
    const changes = diffStatusFields(
      { priority: 'NORMAL', bookmarked: true },
      { priority: 'HIGH', bookmarked: false }
    );
    expect(changes).toEqual(
      expect.arrayContaining([
        { field: 'priority', from: 'NORMAL', to: 'HIGH' },
        { field: 'bookmarked', from: 'true', to: 'false' },
      ])
    );
    expect(summaryFromChanges(changes)).toContain('priority');
  });
});
