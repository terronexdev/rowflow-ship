import { classifyOpenParcelContacts } from '../contactAlerts';

function d(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

const now = d('2026-08-15');

describe('classifyOpenParcelContacts', () => {
  test('never contacted is stale, not past due', () => {
    const r = classifyOpenParcelContacts(['a'], [], { now });
    expect(r.staleCount).toBe(1);
    expect(r.staleParcelIds).toEqual(['a']);
    expect(r.pastDueCount).toBe(0);
    expect(r.pastDueFollowUpParcelIds).toEqual([]);
  });

  test('last contact older than 14d is stale', () => {
    const r = classifyOpenParcelContacts(
      ['a'],
      [{ id: '1', parcelId: 'a', contactDate: d('2026-07-20'), followUpDate: null }],
      { now }
    );
    expect(r.staleCount).toBe(1);
    expect(r.pastDueCount).toBe(0);
  });

  test('recent contact is not stale', () => {
    const r = classifyOpenParcelContacts(
      ['a'],
      [{ id: '1', parcelId: 'a', contactDate: d('2026-08-14'), followUpDate: null }],
      { now }
    );
    expect(r.staleCount).toBe(0);
    expect(r.pastDueCount).toBe(0);
  });

  test('unsatisfied overdue follow-up is past due even if contact is recent', () => {
    const r = classifyOpenParcelContacts(
      ['a'],
      [
        {
          id: '1',
          parcelId: 'a',
          contactDate: d('2026-08-10'),
          followUpDate: d('2026-08-12'),
        },
      ],
      { now }
    );
    expect(r.staleCount).toBe(0);
    expect(r.pastDueCount).toBe(1);
    expect(r.pastDueFollowUpParcelIds).toEqual(['a']);
  });

  test('contact on/after due date clears past due', () => {
    const r = classifyOpenParcelContacts(
      ['a'],
      [
        { id: '1', parcelId: 'a', contactDate: d('2026-08-10'), followUpDate: d('2026-08-12') },
        { id: '2', parcelId: 'a', contactDate: d('2026-08-12'), followUpDate: null },
      ],
      { now }
    );
    expect(r.pastDueCount).toBe(0);
  });

  test('contact before due date does not clear an overdue follow-up', () => {
    const r = classifyOpenParcelContacts(
      ['a'],
      [
        { id: '1', parcelId: 'a', contactDate: d('2026-08-08'), followUpDate: d('2026-08-12') },
        { id: '2', parcelId: 'a', contactDate: d('2026-08-11'), followUpDate: null },
      ],
      { now }
    );
    expect(r.pastDueCount).toBe(1);
  });

  test('two overdue logs on one parcel count once', () => {
    const r = classifyOpenParcelContacts(
      ['a'],
      [
        { id: '1', parcelId: 'a', contactDate: d('2026-07-01'), followUpDate: d('2026-07-10') },
        { id: '2', parcelId: 'a', contactDate: d('2026-07-20'), followUpDate: d('2026-07-25') },
      ],
      { now }
    );
    expect(r.pastDueCount).toBe(1);
    expect(r.staleCount).toBe(1);
  });

  test('future follow-up is not past due', () => {
    const r = classifyOpenParcelContacts(
      ['a'],
      [{ id: '1', parcelId: 'a', contactDate: d('2026-08-14'), followUpDate: d('2026-08-20') }],
      { now }
    );
    expect(r.pastDueCount).toBe(0);
  });

  test('closed parcels omitted when not in open list', () => {
    const r = classifyOpenParcelContacts(
      ['open'],
      [
        { id: '1', parcelId: 'closed', contactDate: d('2026-07-01'), followUpDate: d('2026-07-02') },
        { id: '2', parcelId: 'open', contactDate: d('2026-08-14'), followUpDate: null },
      ],
      { now }
    );
    expect(r.staleCount).toBe(0);
    expect(r.pastDueCount).toBe(0);
  });
});
