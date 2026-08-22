/** Split a mixed Tractsource / ROWScope FeatureCollection into corridor parts. */

export type CorridorParts = {
  parcels: GeoJSON.FeatureCollection;
  centerline: GeoJSON.FeatureCollection;
  access: GeoJSON.FeatureCollection;
  corridor: GeoJSON.FeatureCollection;
  buildings: GeoJSON.FeatureCollection;
};

function fc(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features };
}

function propsOf(f: GeoJSON.Feature): Record<string, unknown> {
  return (f.properties || {}) as Record<string, unknown>;
}

function geomType(f: GeoJSON.Feature): string {
  return String(f.geometry?.type || '');
}

function blob(p: Record<string, unknown>): string {
  return [
    p.role,
    p.layer,
    p.kind,
    p.name,
    p.encroachClass,
    p.BldgType,
    p.building,
  ]
    .map((v) => String(v || '').toLowerCase())
    .join(' ');
}

export function isLine(f: GeoJSON.Feature): boolean {
  return geomType(f).endsWith('LineString');
}

export function isBuildingFeature(f: GeoJSON.Feature): boolean {
  const p = propsOf(f);
  const s = blob(p);
  if (p.encroachClass) return true;
  if (/building|structure|footprint|improv/.test(s)) return true;
  if (p.BldgType || p.FinSize || p.YrBuilt) return true;
  return false;
}

export function isAccessLine(f: GeoJSON.Feature): boolean {
  const s = blob(propsOf(f));
  return /access|spur|driveway|3rd|third/.test(s);
}

export function isCorridorPoly(f: GeoJSON.Feature): boolean {
  const s = blob(propsOf(f));
  return /corridor|pe buffer|row buffer|permanent easement/.test(s);
}

export function splitCorridorPackage(raw: unknown): CorridorParts {
  const features = Array.isArray((raw as { features?: GeoJSON.Feature[] })?.features)
    ? ((raw as { features: GeoJSON.Feature[] }).features)
    : [];

  const parcels: GeoJSON.Feature[] = [];
  const centerline: GeoJSON.Feature[] = [];
  const access: GeoJSON.Feature[] = [];
  const corridor: GeoJSON.Feature[] = [];
  const buildings: GeoJSON.Feature[] = [];

  for (const f of features) {
    if (!f?.geometry) continue;
    if (isLine(f)) {
      if (isAccessLine(f)) access.push(f);
      else centerline.push(f);
      continue;
    }
    if (isBuildingFeature(f)) {
      buildings.push(f);
      continue;
    }
    if (isCorridorPoly(f)) {
      corridor.push(f);
      continue;
    }
    if (geomType(f).includes('Polygon') || geomType(f).includes('Point')) {
      // Points without building flags stay out of parcel list
      if (geomType(f).includes('Point')) {
        buildings.push(f);
        continue;
      }
      parcels.push(f);
    }
  }

  return {
    parcels: fc(parcels),
    centerline: fc(centerline),
    access: fc(access),
    corridor: fc(corridor),
    buildings: fc(buildings),
  };
}
