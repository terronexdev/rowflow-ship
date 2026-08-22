/**
 * Sort parcels roughly along corridor by projecting centroid onto first polyline layer,
 * or fall back to parcel number / pin order.
 */
export type SortableParcel = {
  id: string;
  pin?: string | null;
  parcelNumber?: string | null;
  status?: string | null;
  ptsStatus?: string | null;
  acquisitionStatus?: string | null;
  geometry?: any;
};

function centroidOfGeom(geom: any): [number, number] | null {
  try {
    if (!geom) return null;
    if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
      return [geom.coordinates[0], geom.coordinates[1]];
    }
    const coords: number[][] = [];
    const walk = (c: any) => {
      if (!Array.isArray(c)) return;
      if (typeof c[0] === 'number' && typeof c[1] === 'number') {
        coords.push([c[0], c[1]]);
      } else c.forEach(walk);
    };
    walk(geom.coordinates);
    if (!coords.length) return null;
    const sx = coords.reduce((a, p) => a + p[0], 0) / coords.length;
    const sy = coords.reduce((a, p) => a + p[1], 0) / coords.length;
    return [sx, sy];
  } catch {
    return null;
  }
}

/** Flatten first LineString from project design/centerline layers */
export function extractCenterlineCoords(layers: { type?: string; name?: string; data?: any }[]): [number, number][] {
  for (const layer of layers || []) {
    const name = (layer.name || '').toLowerCase();
    const type = (layer.type || '').toLowerCase();
    const prefer =
      name.includes('center') ||
      name.includes('route') ||
      name.includes('alignment') ||
      type.includes('line');
    if (!prefer && layers.length > 1) continue;
    const data = layer.data;
    if (!data) continue;
    const feats = data.type === 'FeatureCollection' ? data.features : data.type === 'Feature' ? [data] : [];
    for (const f of feats) {
      const g = f.geometry || f;
      if (!g) continue;
      if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
        return g.coordinates.map((c: number[]) => [c[0], c[1]] as [number, number]);
      }
      if (g.type === 'MultiLineString' && Array.isArray(g.coordinates?.[0])) {
        return g.coordinates[0].map((c: number[]) => [c[0], c[1]] as [number, number]);
      }
    }
  }
  // second pass: any linestring
  for (const layer of layers || []) {
    const data = layer.data;
    if (!data) continue;
    const feats = data.type === 'FeatureCollection' ? data.features : [];
    for (const f of feats || []) {
      const g = f.geometry;
      if (g?.type === 'LineString') {
        return g.coordinates.map((c: number[]) => [c[0], c[1]] as [number, number]);
      }
    }
  }
  return [];
}

function projectOntoPolyline(pt: [number, number], line: [number, number][]): number {
  if (line.length < 2) return 0;
  let best = 0;
  let bestDist = Infinity;
  let acc = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy || 1e-12;
    let t = ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a[0] + t * dx;
    const py = a[1] + t * dy;
    const d = (pt[0] - px) ** 2 + (pt[1] - py) ** 2;
    const along = acc + t * Math.sqrt(len2);
    if (d < bestDist) {
      bestDist = d;
      best = along;
    }
    acc += Math.sqrt(len2);
  }
  return best;
}

export function sortParcelsAlongCorridor(
  parcels: SortableParcel[],
  layers: { type?: string; name?: string; data?: any }[] = []
): SortableParcel[] {
  const line = extractCenterlineCoords(layers);
  if (line.length >= 2) {
    return [...parcels].sort((a, b) => {
      const ca = centroidOfGeom(a.geometry);
      const cb = centroidOfGeom(b.geometry);
      if (!ca && !cb) return 0;
      if (!ca) return 1;
      if (!cb) return -1;
      return projectOntoPolyline(ca, line) - projectOntoPolyline(cb, line);
    });
  }
  return [...parcels].sort((a, b) =>
    String(a.pin || a.parcelNumber || a.id).localeCompare(
      String(b.pin || b.parcelNumber || b.id),
      undefined,
      { numeric: true }
    )
  );
}

/** First parcel that is not ACQUIRED / COMPLETE for the active work mode */
export function findNextUnworked(
  parcels: SortableParcel[],
  layers: { type?: string; name?: string; data?: any }[] = [],
  mode: 'status' | 'pts' | 'acquisition' = 'status'
): SortableParcel | null {
  const ordered = sortParcelsAlongCorridor(parcels, layers);
  for (const p of ordered) {
    if (mode === 'pts') {
      const v = p.ptsStatus || 'NOT_STARTED';
      if (v !== 'GRANTED' && v !== 'COMPLETE' && v !== 'NOT_REQUIRED') return p;
    } else if (mode === 'acquisition') {
      const v = p.acquisitionStatus || 'NOT_STARTED';
      if (v !== 'ACQUIRED' && v !== 'COMPLETE' && v !== 'CLOSED') return p;
    } else {
      const v = p.status || 'NOT_STARTED';
      if (v !== 'ACQUIRED' && v !== 'CONDEMNED' && v !== 'COMPLETE') return p;
    }
  }
  return null;
}
