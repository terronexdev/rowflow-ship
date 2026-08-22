import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exportToCSV, exportToPDF, exportDetailedPDF, exportToGeoJSON } from '@/lib/exports';
import { getAccessibleProject } from '@/lib/projectAccess';

// GET /api/projects/[id]/export - Export project parcels
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getAccessibleProject(id, session.user.id);
    if (!access) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = access;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const detailed = searchParams.get('detailed') === 'true';
    const sortBy = searchParams.get('sortBy') || 'sequence';
    const filterStatus = searchParams.get('status');
    const filterCounty = searchParams.get('county');

    const where: any = { projectId: id };

    if (filterStatus) {
      where.status = filterStatus;
    }

    if (filterCounty) {
      where.county = filterCounty;
    }

    const parcels = await prisma.parcel.findMany({
      where,
      include: detailed
        ? {
            notes: {
              orderBy: { createdAt: 'desc' },
            },
          }
        : undefined,
      orderBy: {
        [sortBy]: 'asc',
      },
    });

    if (parcels.length === 0) {
      return NextResponse.json({ error: 'No parcels found to export' }, { status: 404 });
    }

    if (format === 'csv') {
      const csv = exportToCSV(parcels as any);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${project.name}-parcels.csv"`,
        },
      });
    }

    if (format === 'geojson') {
      const geojson = exportToGeoJSON(parcels as any);

      return new NextResponse(geojson, {
        headers: {
          'Content-Type': 'application/geo+json',
          'Content-Disposition': `attachment; filename="${project.name}-parcels.geojson"`,
        },
      });
    }

    if (format === 'pdf') {
      const pdf = detailed
        ? exportDetailedPDF(parcels as any, project.name)
        : exportToPDF(parcels as any, project.name);

      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${project.name}-parcels.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting parcels:', error);
    return NextResponse.json({ error: 'Failed to export parcels' }, { status: 500 });
  }
}
