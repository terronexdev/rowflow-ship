import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as toGeoJSON from '@tmcw/togeojson';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { parse as parseHTML } from 'node-html-parser';
import { splitCorridorPackage } from '@/lib/corridorPackage';

// Helper to parse KML string to GeoJSON
function parseKML(kmlString: string): any {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlString, 'text/xml');
  return toGeoJSON.kml(kmlDoc);
}

// Helper to parse HTML description field and extract key-value pairs
function parseHTMLDescription(htmlString: string): Record<string, string> {
  const data: Record<string, string> = {};

  try {
    const root = parseHTML(htmlString);

    // Try to find table rows with key-value pairs
    const rows = root.querySelectorAll('tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const key = cells[0].textContent.trim();
        const value = cells[1].textContent.trim();
        if (key && value) {
          data[key] = value;
        }
      }
    });

    // Also try to extract from div/span elements
    const divs = root.querySelectorAll('div, span');
    divs.forEach((div) => {
      const text = div.textContent;
      // Look for patterns like "Key: Value" or "Key = Value"
      const match = text.match(/^([^:=]+)[:=]\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && value && !data[key]) {
          data[key] = value;
        }
      }
    });

    console.log('Parsed HTML description data:', Object.keys(data));
  } catch (error) {
    console.error('Error parsing HTML description:', error);
  }

  return data;
}

// Helper function to find property by various name variations (case-insensitive)
function findProp(props: any, ...names: string[]): any {
  if (!props || typeof props !== 'object') return null;
  for (const name of names) {
    // Try exact match first
    if (props[name] !== undefined && props[name] !== null && props[name] !== '') {
      return props[name];
    }
    // Try case-insensitive match
    const lowerName = name.toLowerCase();
    const key = Object.keys(props).find(k => k.toLowerCase() === lowerName);
    if (key && props[key] !== undefined && props[key] !== null && props[key] !== '') {
      return props[key];
    }
  }
  return null;
}

/**
 * Flatten Tractsource (and similar) nested GeoJSON properties so field lookup works.
 * Tractsource full export shape:
 *   { _meta, _raw, _normalized: { owner_name, situs_address, parcel_id, ... } }
 * Normalized-only export may already be flat with optional _meta.
 */
function flattenFeatureProperties(rawProps: any): Record<string, any> {
  const props = rawProps && typeof rawProps === 'object' ? { ...rawProps } : {};
  const norm =
    props._normalized && typeof props._normalized === 'object' ? props._normalized : null;
  const raw = props._raw && typeof props._raw === 'object' ? props._raw : null;
  const meta = props._meta && typeof props._meta === 'object' ? props._meta : null;

  // Order: raw under, then top-level, then normalized on top (canonical wins)
  const flat: Record<string, any> = {
    ...(raw || {}),
    ...props,
    ...(norm || {}),
  };

  // Promote useful meta without clobbering real values
  if (meta) {
    if (flat.county == null && (meta.locality || meta.county)) {
      flat.county = meta.locality || meta.county;
    }
    if (flat.locality == null && meta.locality) flat.locality = meta.locality;
    if (flat.fips == null && meta.fips) flat.fips = meta.fips;
    if (flat.state == null && meta.state) flat.state = meta.state;
    if (flat.source_name == null && meta.source_name) flat.source_name = meta.source_name;
  }

  // Drop nested bags from being "the" value for unknown keys (keep copies already merged)
  delete flat._normalized;
  delete flat._raw;
  delete flat._meta;
  delete flat.mapping;

  return flat;
}

// Helper to extract parcel data from GeoJSON feature
function extractParcelData(feature: any, projectId: string, sequence: number): any {
  let props = flattenFeatureProperties(feature.properties || {});
  const geometry = feature.geometry;

  // If there's a description field with HTML, parse it and merge with existing props
  const description = props.description || props.Description || props.DESCRIPTION;
  if (description && typeof description === 'string' && (description.includes('<') || description.includes('table'))) {
    const parsedData = parseHTMLDescription(description);
    // Merge parsed data under existing (don't overwrite already-mapped fields)
    props = { ...parsedData, ...props };
  }

  // STREAMLINED EXTRACTION - essential ROW fields + Tractsource aliases
  console.log(`\n=== Feature ${sequence} ===`);
  console.log('Available fields:', Object.keys(props).slice(0, 30).join(', '));

  // 1. PARCEL ID
  const pin = findProp(
    props,
    'pin', 'PIN', 'rpc', 'RPC', 'gpin', 'GPIN',
    'parcel_id', 'parcelId', 'PARCELID', 'Parcel_ID', 'PARCEL_ID',
    'parcel_id_norm', 'MapLink', 'LINK', 'PTM_ID', 'APN', 'apn'
  );
  console.log('PIN/RPC:', pin);

  // 2. OWNER NAME (Tractsource normalized + common GIS)
  const owner = findProp(
    props,
    'owner_name', 'ownerName', 'owner',
    'owner1', 'OWNER1', 'Owner1', 'OWNER', 'OWNERNAME', 'OwnerName', 'OWN1'
  );
  console.log('Owner:', owner);

  // 3. MAILING ADDRESS
  const mailAddr = findProp(
    props,
    'mail_address', 'mailAddress', 'ownerAddress',
    'mailaddr', 'MAILADDR', 'MailAddr', 'MAIL_ADDRESS', 'MAILADD'
  );
  const mailCity = findProp(
    props,
    'ownerCity', 'mail_city', 'mailcity', 'MAILCITY', 'MailCity', 'MailCity', 'city'
  );
  const mailState = findProp(
    props,
    'ownerState', 'mail_state', 'mailstat', 'MAILSTAT', 'MailStat', 'mailstate', 'MAILSTATE', 'state'
  );
  const mailZip = findProp(
    props,
    'ownerZip', 'mail_zip', 'mailzip', 'MAILZIP', 'MailZip', 'zip', 'ZIP'
  );
  console.log('Mailing Address:', mailAddr);

  // 4. ACREAGE
  const acreage = findProp(
    props,
    'acreage', 'ACREAGE', 'acres', 'ACRES',
    'legalac', 'LEGALAC', 'LegalAc', 'Shape_Acres', 'GIS_ACRES', 'DEED_ACRES'
  );
  console.log('Acreage:', acreage);

  // 5. PROPERTY / SITUS LOCATION
  const propLocation = findProp(
    props,
    'situs_address', 'situsAddress', 'propertyAddress', 'property_address',
    'locaddr', 'LOCADDR', 'LocAddr', 'SITEADD', 'SITE_ADDR', 'SITUS',
    'ADDRESS', 'location', 'LOCATION', 'situs'
  );
  console.log('Property Location:', propLocation);

  // 6. ZONING / PROPERTY CLASS
  const zoning = findProp(
    props,
    'pcdesc', 'PCDESC', 'PCDesc', 'propclass', 'PROPCLASS',
    'zoning', 'ZONING', 'class', 'CLASS'
  );

  // 7. COUNTY / LOCALITY (do not hardcode Bedford)
  let county = findProp(
    props,
    'county', 'COUNTY', 'locality', 'LOCALITY', 'Locality', 'LocCity'
  );
  if (county && typeof county === 'string') {
    // Normalize "Bedford County" / "Lynchburg City" for display
    county = String(county).trim();
  }

  const legalDescParts: string[] = [];
  if (propLocation) legalDescParts.push(`Location: ${propLocation}`);
  if (zoning) legalDescParts.push(`Zoning: ${zoning}`);
  const owner2 = findProp(props, 'owner_name_2', 'owner2', 'OWNER2', 'Owner2');
  if (owner2) legalDescParts.push(`Owner2: ${owner2}`);
  const legalFromSource = findProp(props, 'legal_desc', 'Legal1', 'LEGAL1', 'legalDesc');
  if (legalFromSource) legalDescParts.push(String(legalFromSource));
  const legalDesc = legalDescParts.length > 0 ? legalDescParts.join(' | ') : null;

  const parcelData = {
    projectId,
    parcelNumber: pin ? String(pin).trim() : null,
    pin: pin ? String(pin).trim() : null,
    owner: owner ? String(owner).trim() : null,
    ownerAddress: mailAddr ? String(mailAddr).trim() : null,
    ownerCity: mailCity ? String(mailCity).trim() : null,
    ownerState: mailState ? String(mailState).trim() : null,
    ownerZip: mailZip ? String(mailZip).trim() : null,
    propertyAddress: propLocation ? String(propLocation).trim() : null,
    legalDesc,
    county: county ? String(county).trim() : null,
    state: mailState ? String(mailState).trim() : (findProp(props, 'state') ? String(findProp(props, 'state')).trim() : null),
    acreage: acreage != null && acreage !== '' ? parseFloat(String(acreage).replace(/,/g, '')) : null,
    sequence,
    geometry,
    status: 'NOT_STARTED',
    dataSource: findProp(props, 'source_name') ? String(findProp(props, 'source_name')) : 'IMPORT',
  };

  console.log('FINAL EXTRACTED DATA:', JSON.stringify({
    pin: parcelData.pin,
    owner: parcelData.owner,
    propertyAddress: parcelData.propertyAddress,
    ownerAddress: parcelData.ownerAddress,
    ownerCity: parcelData.ownerCity,
    county: parcelData.county,
    acreage: parcelData.acreage,
  }, null, 2));

  return parcelData;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Stale JWT after DB move
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            'Your login session is from before the database move. Sign out and sign in again.',
          code: 'STALE_SESSION',
        },
        { status: 401 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let file: File | null = null;
    let projectId: string;
    let geoJSON: any;
    let fileName = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      projectId = body.projectId;
      fileName = body.fileName || 'client-parsed.geojson';
      geoJSON = {
        type: 'FeatureCollection',
        features: Array.isArray(body.features) ? body.features : [],
      };
    } else {
      // Parse form data. Vercel has a strict body-size limit, so the browser uses
      // the JSON path above for very large GIS files.
      const formData = await req.formData();
      file = formData.get('file') as File;
      projectId = formData.get('projectId') as string;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      fileName = file.name.toLowerCase();
    }

    if (!projectId) {
      return NextResponse.json({ error: 'No project ID provided' }, { status: 400 });
    }

    // Owner or team member with access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: dbUser.id },
          { members: { some: { userId: dbUser.id } } },
          { roleAssignments: { some: { userId: dbUser.id, isCurrent: true } } },
        ],
      },
      include: {
        parcels: { select: { id: true, sequence: true } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check subscription limits (auto-create FREE if missing)
    let subscription = await prisma.subscription.findUnique({
      where: { userId: dbUser.id },
    });
    if (!subscription) {
      const { freeLimitFields } = await import('@/lib/constants/subscription');
      subscription = await prisma.subscription.create({
        data: {
          userId: dbUser.id,
          stripeCustomerId: null,
          ...freeLimitFields(),
        },
      });
    }

    if (file) {
      const buffer = await file.arrayBuffer();

      try {
        if (fileName.endsWith('.kml')) {
        // Parse KML
        console.log('Parsing KML file:', fileName);
        const kmlString = new TextDecoder().decode(buffer);
        console.log('KML string length:', kmlString.length);
        geoJSON = parseKML(kmlString);
        console.log('Parsed GeoJSON features:', geoJSON?.features?.length || 0);
        } else if (fileName.endsWith('.kmz')) {
        // Parse KMZ (compressed KML)
        console.log('Parsing KMZ file:', fileName);
        const zip = await JSZip.loadAsync(buffer);
        const kmlFile = Object.keys(zip.files).find((name) =>
          name.toLowerCase().endsWith('.kml')
        );

        if (!kmlFile) {
          return NextResponse.json(
            { error: 'No KML file found in KMZ archive' },
            { status: 400 }
          );
        }

        console.log('Found KML file in archive:', kmlFile);
        const kmlString = await zip.files[kmlFile].async('text');
        console.log('KML string length:', kmlString.length);
        geoJSON = parseKML(kmlString);
        console.log('Parsed GeoJSON features:', geoJSON?.features?.length || 0);
        } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        // Parse GeoJSON
        console.log('Parsing GeoJSON file:', fileName);
        const jsonString = new TextDecoder().decode(buffer);
        geoJSON = JSON.parse(jsonString);
        console.log('GeoJSON features:', geoJSON?.features?.length || 0);
        } else {
          return NextResponse.json(
            { error: 'Unsupported file format. Please use KML, KMZ, or GeoJSON' },
            { status: 400 }
          );
        }
      } catch (parseError) {
        console.error('File parsing error:', parseError);
        console.error('Error details:', {
          message: parseError instanceof Error ? parseError.message : 'Unknown error',
          stack: parseError instanceof Error ? parseError.stack : undefined,
        });
        return NextResponse.json(
          {
            error: 'Failed to parse file. Please ensure it is a valid format',
            details: parseError instanceof Error ? parseError.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    // Corridor package: polygons = parcels; lines/buildings become map layers
    const parts = splitCorridorPackage(geoJSON);
    const features = parts.parcels.features || [];
    if (features.length === 0 && !parts.centerline.features.length && !parts.buildings.features.length) {
      return NextResponse.json(
        { error: 'No features found in the file' },
        { status: 400 }
      );
    }

    // Get current parcel count for sequence numbering
    const currentMaxSequence =
      project.parcels.length > 0
        ? Math.max(...project.parcels.map((p) => p.sequence || 0))
        : 0;

    // Prepare parcels for creation
    const parcelsToCreate: any[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    features.forEach((feature: any, index: number) => {
      try {
        // Only process features with geometry
        if (!feature.geometry) {
          warnings.push(`Feature ${index + 1}: No geometry found, skipped`);
          return;
        }

        const parcelData = extractParcelData(
          feature,
          projectId,
          currentMaxSequence + index + 1
        );

        // Check parcel limit
        if (
          subscription.parcelLimitPerProject !== -1 &&
          project.parcels.length + parcelsToCreate.length >=
            subscription.parcelLimitPerProject
        ) {
          errors.push(
            `Parcel limit reached. Your ${subscription.tier} plan allows ${subscription.parcelLimitPerProject} parcels per project.`
          );
          return;
        }

        parcelsToCreate.push(parcelData);
      } catch (err) {
        console.error(`Error processing feature ${index + 1}:`, err);
        errors.push(`Feature ${index + 1}: Failed to process`);
      }
    });

    if (parcelsToCreate.length === 0 && !parts.centerline.features.length && !parts.buildings.features.length) {
      return NextResponse.json(
        {
          success: false,
          parcelsCreated: 0,
          errors: errors.length > 0 ? errors : ['No valid parcels found in file'],
          warnings,
        },
        { status: 400 }
      );
    }

    // Create parcels in database
    let createdCount = 0;
    for (const parcelData of parcelsToCreate) {
      try {
        await prisma.parcel.create({
          data: parcelData,
        });
        createdCount++;
      } catch (err) {
        console.error('Error creating parcel:', err);
        errors.push(
          `Failed to create parcel at sequence ${parcelData.sequence}${
            err instanceof Error ? `: ${err.message}` : ''
          }`
        );
      }
    }

    console.log(`Successfully imported ${createdCount} parcels into project ${projectId}`);

    async function upsertLayer(
      kind: string,
      name: string,
      data: GeoJSON.FeatureCollection,
      geometryType: string
    ) {
      if (!data.features.length) return 0;
      const existing = await prisma.projectLayer.findFirst({ where: { projectId, kind } });
      const payload = {
        name,
        kind,
        geometryType,
        featureCount: data.features.length,
        data: data as object,
        visible: true,
      };
      if (existing) {
        await prisma.projectLayer.update({ where: { id: existing.id }, data: payload });
      } else {
        await prisma.projectLayer.create({ data: { projectId, ...payload } });
      }
      return 1;
    }

    let layersCreated = 0;
    layersCreated += await upsertLayer('centerline', 'Centerline', parts.centerline, 'polyline');
    layersCreated += await upsertLayer('access', 'Access spurs', parts.access, 'polyline');
    layersCreated += await upsertLayer('corridor', 'PE corridor', parts.corridor, 'polygon');
    layersCreated += await upsertLayer('buildings', 'Buildings / encroach', parts.buildings, 'polygon');

    if (parts.centerline.features.length || parts.corridor.features.length) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          ...(parts.centerline.features.length ? { centerlineData: parts.centerline as object } : {}),
          ...(parts.corridor.features.length ? { rowExtents: parts.corridor as object } : {}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      parcelsCreated: createdCount,
      layersCreated,
      errors,
      warnings: [
        ...warnings,
        parts.centerline.features.length ? `Centerline: ${parts.centerline.features.length}` : '',
        parts.access.features.length ? `Access: ${parts.access.features.length}` : '',
        parts.buildings.features.length ? `Buildings: ${parts.buildings.features.length}` : '',
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import parcels' },
      { status: 500 }
    );
  }
}
