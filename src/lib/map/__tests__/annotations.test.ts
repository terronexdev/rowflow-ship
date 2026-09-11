import {
  DEFAULT_ANN,
  colorIdFromHex,
  hatchPatternId,
  normalizeAnnotationStyle,
  annotationProperties,
  featuresFromLayerData,
  normalizeAnnType,
  annGroupKey,
  uniqueGroups,
  isCrossingPermitGroup,
  permitTypeFromGroup,
} from '../annotations';

describe('map annotations', () => {
  it('defaults to amber pin without hatch', () => {
    const n = normalizeAnnotationStyle(null);
    expect(n.color).toBe(DEFAULT_ANN.color);
    expect(n.markerStyle).toBe('pin');
    expect(n.hatch).toBe(false);
    expect(n.annType).toBe('Other');
    expect(normalizeAnnotationStyle({ color: '#00ff00', markerStyle: 'hex' as any }).color).toBe(
      DEFAULT_ANN.color
    );
  });

  it('maps hex to hatch pattern id', () => {
    expect(colorIdFromHex('#3b82f6')).toBe('blue');
    expect(hatchPatternId('#ef4444')).toBe('rf-ann-hatch-red');
  });

  it('stores label, type, and id on properties', () => {
    const props = annotationProperties({
      id: 'abc',
      label: '  Water well  ',
      color: '#3b82f6',
      markerStyle: 'well',
      hatch: false,
      annType: 'well',
    });
    expect(props).toMatchObject({
      kind: 'annotation',
      id: 'abc',
      label: 'Water well',
      color: '#3b82f6',
      markerStyle: 'well',
      hatch: false,
      annType: 'well',
    });
  });

  it('keeps custom group names', () => {
    expect(normalizeAnnType('  Hydrant  ')).toBe('Hydrant');
    expect(normalizeAnnType('')).toBe('Other');
    expect(annGroupKey('Well')).toBe('well');
    expect(annGroupKey('WELL')).toBe('well');
  });

  it('lists features and unique groups', () => {
    const rows = featuresFromLayerData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: '1', label: 'Well A', annType: 'Well', color: '#3b82f6' },
          geometry: { type: 'Point', coordinates: [-79.4, 37.3] },
        },
        {
          type: 'Feature',
          properties: { id: '2', label: 'H1', annType: 'Hydrant', color: '#ef4444' },
          geometry: { type: 'Point', coordinates: [-79.41, 37.31] },
        },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: '1',
      annType: 'Well',
      label: 'Well A',
      latlng: [37.3, -79.4],
    });
    expect(uniqueGroups(rows)).toEqual(['Hydrant', 'Well']);
  });

  it('maps RR/DOT/Crossing groups to job permit types', () => {
    expect(isCrossingPermitGroup('RR')).toBe(true);
    expect(isCrossingPermitGroup('Railroad')).toBe(true);
    expect(isCrossingPermitGroup('DOT')).toBe(true);
    expect(isCrossingPermitGroup('Crossing')).toBe(true);
    expect(isCrossingPermitGroup('Well')).toBe(false);
    expect(isCrossingPermitGroup('Other')).toBe(false);
    expect(permitTypeFromGroup('RR')).toBe('RAILROAD');
    expect(permitTypeFromGroup('DOT')).toBe('HIGHWAY');
    expect(permitTypeFromGroup('Crossing')).toBe('OTHER');
  });
});
