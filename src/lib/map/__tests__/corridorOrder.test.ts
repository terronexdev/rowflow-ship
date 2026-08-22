import {
  sortParcelsAlongCorridor,
  findNextUnworked,
  extractCenterlineCoords,
} from '../corridorOrder';

describe('corridorOrder', () => {
  const lineLayer = {
    name: 'centerline',
    type: 'line',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [10, 0],
            ],
          },
        },
      ],
    },
  };

  it('extracts centerline coords', () => {
    expect(extractCenterlineCoords([lineLayer])).toEqual([
      [0, 0],
      [10, 0],
    ]);
  });

  it('sorts parcels along line by centroid', () => {
    const parcels = [
      {
        id: 'b',
        geometry: { type: 'Point', coordinates: [8, 0.1] },
      },
      {
        id: 'a',
        geometry: { type: 'Point', coordinates: [1, 0] },
      },
    ];
    const ordered = sortParcelsAlongCorridor(parcels as any, [lineLayer]);
    expect(ordered.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('finds next unworked along corridor', () => {
    const parcels = [
      {
        id: '1',
        status: 'ACQUIRED',
        geometry: { type: 'Point', coordinates: [1, 0] },
      },
      {
        id: '2',
        status: 'NOT_STARTED',
        geometry: { type: 'Point', coordinates: [5, 0] },
      },
    ];
    const next = findNextUnworked(parcels as any, [lineLayer], 'status');
    expect(next?.id).toBe('2');
  });
});
