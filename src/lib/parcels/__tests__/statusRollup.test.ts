import {
  applyStatusRollup,
  hasDomainProgress,
  isAcquisitionComplete,
  isDomainActive,
  isEffectivelyAcquired,
  mergeOverallStatus,
  suggestOverallStatus,
  summarizeDomainProgress,
} from '@/lib/parcels/statusRollup';

describe('parcel status rollup', () => {
  test('domain active', () => {
    expect(isDomainActive('NOT_STARTED')).toBe(false);
    expect(isDomainActive('IN_PROGRESS')).toBe(true);
    expect(isDomainActive('DRAFTING')).toBe(true);
  });

  test('effectively acquired from acquisitionStatus', () => {
    expect(
      isEffectivelyAcquired({ status: 'NOT_STARTED', acquisitionStatus: 'ACQUIRED' })
    ).toBe(true);
    expect(isEffectivelyAcquired({ status: 'NOT_STARTED', acquisitionStatus: 'NEGOTIATING' })).toBe(
      false
    );
    expect(isEffectivelyAcquired({ status: 'NOT_STARTED', hasAcceptedOffer: true })).toBe(true);
    expect(isEffectivelyAcquired({ status: 'ACQUIRED' })).toBe(true);
  });

  test('suggest overall from domains', () => {
    expect(suggestOverallStatus({ status: 'NOT_STARTED' })).toBe('NOT_STARTED');
    expect(
      suggestOverallStatus({ status: 'NOT_STARTED', titleStatus: 'IN_PROGRESS' })
    ).toBe('IN_PROGRESS');
    expect(
      suggestOverallStatus({
        status: 'NOT_STARTED',
        acquisitionStatus: 'ACQUIRED',
        titleStatus: 'IN_PROGRESS',
      })
    ).toBe('ACQUIRED');
  });

  test('merge never downgrades', () => {
    expect(mergeOverallStatus('ACQUIRED', 'NOT_STARTED')).toBe('ACQUIRED');
    expect(mergeOverallStatus('IN_PROGRESS', 'NOT_STARTED')).toBe('IN_PROGRESS');
    expect(mergeOverallStatus('NOT_STARTED', 'IN_PROGRESS')).toBe('IN_PROGRESS');
    expect(mergeOverallStatus('CONDEMNED', 'ACQUIRED')).toBe('CONDEMNED');
  });

  test('applyStatusRollup upgrades NOT_STARTED when domains move', () => {
    const { status } = applyStatusRollup(
      { status: 'NOT_STARTED', titleStatus: 'NOT_STARTED', acquisitionStatus: 'NOT_STARTED' },
      { titleStatus: 'IN_PROGRESS' }
    );
    expect(status).toBe('IN_PROGRESS');
  });

  test('applyStatusRollup to ACQUIRED when acquisition complete', () => {
    const { status } = applyStatusRollup(
      {
        status: 'IN_PROGRESS',
        titleStatus: 'IN_PROGRESS',
        acquisitionStatus: 'NEGOTIATING',
      },
      { acquisitionStatus: 'ACQUIRED' }
    );
    expect(status).toBe('ACQUIRED');
  });

  test('user explicit CONDEMNED kept', () => {
    const { status } = applyStatusRollup(
      { status: 'IN_PROGRESS' },
      { status: 'CONDEMNED', titleStatus: 'IN_PROGRESS' }
    );
    expect(status).toBe('CONDEMNED');
  });

  test('summarizeDomainProgress counts effective acquired', () => {
    const s = summarizeDomainProgress([
      { status: 'NOT_STARTED', acquisitionStatus: 'ACQUIRED', titleStatus: 'IN_PROGRESS' },
      { status: 'NOT_STARTED' },
      { status: 'IN_PROGRESS', surveyStatus: 'DRAFTING' },
    ]);
    expect(s.total).toBe(3);
    expect(s.acquired).toBe(1);
    expect(s.inProgress).toBe(1);
    expect(s.notStarted).toBe(1);
    expect(s.titleActive).toBe(1);
    expect(s.surveyActive).toBe(1);
    expect(s.acquisitionComplete).toBe(1);
    expect(s.overallAcquired).toBe(0);
    expect(isAcquisitionComplete('ACQUIRED')).toBe(true);
    expect(hasDomainProgress({ titleStatus: 'IN_PROGRESS' })).toBe(true);
  });
});
