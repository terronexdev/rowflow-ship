export const ANN_COLORS = [
  { id: 'blue', hex: '#3b82f6' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'red', hex: '#ef4444' },
  { id: 'green', hex: '#10b981' },
  { id: 'white', hex: '#e4e4e7' },
] as const;

export const MARKER_STYLES = ['pin', 'well', 'square', 'triangle'] as const;

export const ANN_GROUP_SUGGESTIONS = [
  'RR',
  'DOT',
  'Crossing',
  'Well',
  'Septic',
  'Hydrant',
  'Valve',
  'Tree',
  'Encroach',
  'Other',
];

export type MarkerStyle = (typeof MARKER_STYLES)[number];
export type AnnColorId = (typeof ANN_COLORS)[number]['id'];
/** Free-form group name (Well, Hydrant, …). */
export type AnnType = string;

export type AnnotationStyle = {
  id: string;
  label: string;
  color: string;
  markerStyle: MarkerStyle;
  hatch: boolean;
  annType: AnnType;
  permitId?: string | null;
  neededPermit?: boolean;
};

export const DEFAULT_ANN: AnnotationStyle = {
  id: '',
  label: '',
  color: '#f59e0b',
  markerStyle: 'pin',
  hatch: false,
  annType: 'Other',
};

export const ANN_LAYER_KIND = 'annotations';
export const ANN_LAYER_NAME = 'Map notes';

export function colorIdFromHex(hex: string): AnnColorId {
  const found = ANN_COLORS.find((c) => c.hex.toLowerCase() === String(hex || '').toLowerCase());
  return found?.id || 'amber';
}

export function hatchPatternId(hex: string): string {
  return `rf-ann-hatch-${colorIdFromHex(hex)}`;
}

export function normalizeAnnType(v?: string | null): AnnType {
  const t = String(v || '').trim().replace(/\s+/g, ' ');
  return t || 'Other';
}

export function annGroupKey(v?: string | null): string {
  return normalizeAnnType(v).toLowerCase();
}

export function newAnnId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultGroupForGeometry(geometry: 'point' | 'area' | 'line'): AnnType {
  if (geometry === 'point') return 'Well';
  if (geometry === 'area') return 'Septic';
  return 'Other';
}

export function isCrossingPermitGroup(group?: string | null): boolean {
  const k = annGroupKey(group);
  if (!k || k === 'other') return false;
  return (
    k === 'rr' ||
    k === 'dot' ||
    k === 'crossing' ||
    k.includes('rail') ||
    k.includes('highway')
  );
}

export function permitTypeFromGroup(group?: string | null): 'RAILROAD' | 'HIGHWAY' | 'OTHER' {
  const k = annGroupKey(group);
  if (k === 'rr' || k.includes('rail')) return 'RAILROAD';
  if (k === 'dot' || k.includes('highway')) return 'HIGHWAY';
  return 'OTHER';
}

export function defaultMarkerForGroup(group: string): MarkerStyle {
  const k = annGroupKey(group);
  if (k.includes('well')) return 'well';
  if (k.includes('valve') || k.includes('hydrant')) return 'square';
  if (k.includes('tree')) return 'triangle';
  return 'pin';
}

export function normalizeAnnotationStyle(input?: Partial<AnnotationStyle> | null): AnnotationStyle {
  const color =
    ANN_COLORS.some((c) => c.hex === input?.color) ? (input?.color as string) : DEFAULT_ANN.color;
  const markerStyle = MARKER_STYLES.includes(input?.markerStyle as MarkerStyle)
    ? (input?.markerStyle as MarkerStyle)
    : DEFAULT_ANN.markerStyle;
  return {
    id: String(input?.id || '').trim(),
    label: String(input?.label || '').trim(),
    color,
    markerStyle,
    hatch: Boolean(input?.hatch),
    annType: normalizeAnnType(input?.annType),
    permitId: input?.permitId ? String(input.permitId) : null,
    neededPermit: Boolean(input?.neededPermit),
  };
}

export function annotationProperties(style: AnnotationStyle) {
  const s = normalizeAnnotationStyle(style);
  return {
    kind: 'annotation',
    id: s.id || newAnnId(),
    label: s.label,
    color: s.color,
    markerStyle: s.markerStyle,
    hatch: s.hatch,
    annType: s.annType,
    ...(s.permitId ? { permitId: s.permitId } : {}),
  };
}

export type MapFeatureRow = {
  id: string;
  annType: AnnType;
  label: string;
  color: string;
  geometryType: string;
  latlng: [number, number] | null;
  permitId?: string | null;
};

function coordCenter(geom: any): [number, number] | null {
  if (!geom) return null;
  if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
    return [geom.coordinates[1], geom.coordinates[0]];
  }
  const ring =
    geom.type === 'Polygon'
      ? geom.coordinates?.[0]
      : geom.type === 'LineString'
        ? geom.coordinates
        : geom.type === 'MultiPolygon'
          ? geom.coordinates?.[0]?.[0]
          : geom.type === 'MultiLineString'
            ? geom.coordinates?.[0]
            : null;
  if (!Array.isArray(ring) || !ring.length) return null;
  let x = 0;
  let y = 0;
  let n = 0;
  for (const c of ring) {
    if (!Array.isArray(c) || c.length < 2) continue;
    x += Number(c[0]);
    y += Number(c[1]);
    n += 1;
  }
  if (!n) return null;
  return [y / n, x / n];
}

export function featuresFromLayerData(data: any): MapFeatureRow[] {
  const feats = Array.isArray(data?.features) ? data.features : [];
  return feats.map((feat: any, i: number) => {
    const props = feat?.properties || {};
    const style = normalizeAnnotationStyle(props);
    return {
      id: style.id || `feat-${i}`,
      annType: style.annType,
      label: style.label || '(unlabeled)',
      color: style.color,
      geometryType: String(feat?.geometry?.type || 'Unknown'),
      latlng: coordCenter(feat?.geometry),
      permitId: style.permitId || props.permitId || null,
    };
  });
}

export function uniqueGroups(rows: MapFeatureRow[]): string[] {
  const seen = new Map<string, string>();
  for (const r of rows) {
    const k = annGroupKey(r.annType);
    if (!seen.has(k)) seen.set(k, r.annType);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function annTypeLabel(id: AnnType): string {
  return normalizeAnnType(id);
}
