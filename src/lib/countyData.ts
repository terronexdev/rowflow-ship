export type CountyDatasetKind = 'parcel' | 'reference' | 'table';

export interface CountyDataset {
  id: string;
  county: 'bedford-va';
  name: string;
  description: string;
  kind: CountyDatasetKind;
  serviceUrl: string;
  estimatedCount: number;
  geometryType: 'polygon' | 'polyline' | 'point' | 'none';
  recommendedMode: 'parcel-import' | 'reference-layer' | 'enrichment-table';
}

export const BEDFORD_DATASETS: CountyDataset[] = [
  {
    id: 'bedford-parcels',
    county: 'bedford-va',
    name: 'Bedford County Parcels',
    description: 'County parcel polygons with PIN/RPC and parcel geometry. Best used for corridor-filtered parcel imports.',
    kind: 'parcel',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataProperty/MapServer/0',
    estimatedCount: 50696,
    geometryType: 'polygon',
    recommendedMode: 'parcel-import',
  },
  {
    id: 'bedford-county-town-parcels',
    county: 'bedford-va',
    name: 'Bedford County and Town Parcels',
    description: 'County plus town parcel polygons. Use only when town parcels are needed too.',
    kind: 'parcel',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataProperty/MapServer/6',
    estimatedCount: 55822,
    geometryType: 'polygon',
    recommendedMode: 'parcel-import',
  },
  {
    id: 'bedford-ownership-valuations',
    county: 'bedford-va',
    name: 'Real Estate Ownership and Valuations',
    description: 'Owner, mailing address, assessed value, and related real estate fields. Best joined to parcels by PIN.',
    kind: 'table',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataProperty/MapServer/9',
    estimatedCount: 52414,
    geometryType: 'none',
    recommendedMode: 'enrichment-table',
  },
  {
    id: 'bedford-land-records',
    county: 'bedford-va',
    name: 'Real Estate Land Records',
    description: 'Sales and deed/reference fields. Best joined to parcels by PIN.',
    kind: 'table',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataProperty/MapServer/8',
    estimatedCount: 52414,
    geometryType: 'none',
    recommendedMode: 'enrichment-table',
  },
  {
    id: 'bedford-road-centerlines',
    county: 'bedford-va',
    name: 'Road Centerlines',
    description: 'Road centerline reference layer for project maps.',
    kind: 'reference',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataReference/MapServer/4',
    estimatedCount: 7824,
    geometryType: 'polyline',
    recommendedMode: 'reference-layer',
  },
  {
    id: 'bedford-address-points',
    county: 'bedford-va',
    name: 'NG911 Address Points',
    description: 'Site address points for reference and owner/contact research.',
    kind: 'reference',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataReference/MapServer/1',
    estimatedCount: 43715,
    geometryType: 'point',
    recommendedMode: 'reference-layer',
  },
  {
    id: 'bedford-building-footprints',
    county: 'bedford-va',
    name: 'Building Footprints',
    description: 'Building footprint polygons for project map context.',
    kind: 'reference',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataReference/MapServer/2',
    estimatedCount: 76061,
    geometryType: 'polygon',
    recommendedMode: 'reference-layer',
  },
  {
    id: 'bedford-zoning',
    county: 'bedford-va',
    name: 'Zoning',
    description: 'Zoning district polygons for reference overlays.',
    kind: 'reference',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataProperty/MapServer/3',
    estimatedCount: 756,
    geometryType: 'polygon',
    recommendedMode: 'reference-layer',
  },
  {
    id: 'bedford-zoning-overlays',
    county: 'bedford-va',
    name: 'Zoning Overlays',
    description: 'Zoning overlay polygons for reference overlays.',
    kind: 'reference',
    serviceUrl: 'https://webgis.bedfordcountyva.gov/arcgis/rest/services/OpenData/OpenDataProperty/MapServer/2',
    estimatedCount: 68,
    geometryType: 'polygon',
    recommendedMode: 'reference-layer',
  },
];

export const COUNTY_IMPORT_CHUNK_SIZE = 100;

export function getCountyDataset(datasetId: string): CountyDataset | undefined {
  return BEDFORD_DATASETS.find((dataset) => dataset.id === datasetId);
}

export function getArcGISGeoJSONQueryUrl(serviceUrl: string, offset = 0, count = COUNTY_IMPORT_CHUNK_SIZE): string {
  const params = new URLSearchParams({
    f: 'geojson',
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    resultOffset: String(offset),
    resultRecordCount: String(count),
  });

  return `${serviceUrl}/query?${params.toString()}`;
}
