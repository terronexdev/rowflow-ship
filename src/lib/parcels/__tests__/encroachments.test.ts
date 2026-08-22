import { suggestEncroachmentStatusFromItems } from '../encroachments';

describe('encroachment status rollup', () => {
  it('returns NONE when no items', () => {
    expect(suggestEncroachmentStatusFromItems([])).toBe('NONE');
  });

  it('picks worst open disposition', () => {
    expect(suggestEncroachmentStatusFromItems(['CAN_REMAIN', 'REMOVED'])).toBe('CAN_REMAIN');
    expect(suggestEncroachmentStatusFromItems(['IDENTIFIED', 'CAN_REMAIN'])).toBe('IDENTIFIED');
    expect(
      suggestEncroachmentStatusFromItems(['REMOVED', 'NEEDS_REMOVAL', 'IDENTIFIED'])
    ).toBe('NEEDS_REMOVAL');
  });
});
