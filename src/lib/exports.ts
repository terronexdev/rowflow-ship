import { Parser } from 'json2csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Parcel } from '@prisma/client';
import { getParcelStatusLabel } from './utils';
import { getStatusLabel, type StatusTab } from './constants/status';

const STATUS_EXPORT_FIELDS: { key: string; label: string; tab?: StatusTab }[] = [
  { key: 'status', label: 'Overall Status' },
  { key: 'parcelClass', label: 'Parcel Class', tab: 'parcel_class' },
  { key: 'existingRightsStatus', label: 'Existing Rights Status', tab: 'existing_rights' },
  { key: 'encroachmentStatus', label: 'Encroachment Status', tab: 'encroachments' },
  { key: 'ptsStatus', label: 'PTS Status', tab: 'pts' },
  { key: 'titleStatus', label: 'Title Status', tab: 'title' },
  { key: 'surveyStatus', label: 'Survey Status', tab: 'survey' },
  { key: 'appraisalStatus', label: 'Appraisal Status', tab: 'appraisal' },
  { key: 'acquisitionStatus', label: 'Acquisition Status', tab: 'acquisition' },
  { key: 'condemnationStatus', label: 'Condemnation Status', tab: 'condemnation' },
  { key: 'permitStatus', label: 'Permit Status', tab: 'permit' },
  { key: 'damagesStatus', label: 'Damages Status', tab: 'damages' },
  { key: 'specialConditionsStatus', label: 'Special Conditions Status', tab: 'special_conditions' },
];

function formatStatusForExport(parcel: Parcel, field: (typeof STATUS_EXPORT_FIELDS)[number]): string {
  const value = String((parcel as any)[field.key] || '');
  if (!value) return '';
  return field.tab ? getStatusLabel(value, field.tab) : getParcelStatusLabel(value);
}

function getExportStatuses(parcel: Parcel): Record<string, string> {
  return Object.fromEntries(
    STATUS_EXPORT_FIELDS.map((field) => [field.key, formatStatusForExport(parcel, field)])
  );
}

// ============================================
// CSV Export
// ============================================

export interface ExportParcel {
  parcelNumber: string | null;
  pin: string | null;
  owner: string | null;
  ownerAddress: string | null;
  ownerCity: string | null;
  ownerState: string | null;
  ownerZip: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  county: string | null;
  status: string;
  titleStatus: string;
  surveyStatus: string;
  appraisalStatus: string;
  acquisitionStatus: string;
  condemnationStatus: string;
  damagesStatus: string;
  specialConditionsStatus: string;
  sequence: number | null;
  milepost: number | null;
  acreage: number | null;
  legalDesc: string | null;
}

export function exportToCSV(parcels: Parcel[]): string {
  const fields = [
    { label: 'Easement #', value: 'easementNumber' },
    { label: 'PIN', value: 'pin' },
    { label: 'Parcel Number', value: 'parcelNumber' },
    { label: 'New structure #s', value: 'newStructureNumbers' },
    { label: 'Existing structure #s', value: 'existingStructureNumbers' },
    { label: 'Owner', value: 'owner' },
    { label: 'Owner Address', value: 'ownerAddress' },
    { label: 'Owner City', value: 'ownerCity' },
    { label: 'Owner State', value: 'ownerState' },
    { label: 'Owner Zip', value: 'ownerZip' },
    { label: 'Owner Phone', value: 'ownerPhone' },
    { label: 'Owner Email', value: 'ownerEmail' },
    { label: 'County', value: 'county' },
    ...STATUS_EXPORT_FIELDS.map((field) => ({ label: field.label, value: field.key })),
    { label: 'Sequence', value: 'sequence' },
    { label: 'Milepost', value: 'milepost' },
    { label: 'Acreage', value: 'acreage' },
    { label: 'Legal Description', value: 'legalDesc' },
  ];

  const data = parcels.map((parcel) => ({
    easementNumber: (parcel as any).easementNumber || '',
    pin: parcel.pin || '',
    parcelNumber: parcel.parcelNumber || '',
    newStructureNumbers: (parcel as any).newStructureNumbers || '',
    existingStructureNumbers: (parcel as any).existingStructureNumbers || '',
    owner: parcel.owner || '',
    ownerAddress: parcel.ownerAddress || '',
    ownerCity: parcel.ownerCity || '',
    ownerState: parcel.ownerState || '',
    ownerZip: parcel.ownerZip || '',
    ownerPhone: parcel.ownerPhone || '',
    ownerEmail: parcel.ownerEmail || '',
    county: parcel.county || '',
    ...getExportStatuses(parcel),
    sequence: parcel.sequence || '',
    milepost: parcel.milepost || '',
    acreage: parcel.acreage || '',
    legalDesc: parcel.legalDesc || '',
  }));

  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  return csv;
}

// ============================================
// PDF Export
// ============================================

export function exportToPDF(
  parcels: Parcel[],
  projectName: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`ROW Line List Report`, 14, 15);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, 22);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Total Parcels: ${parcels.length}`, 14, 34);

  // Prepare table data — compact landscape line list
  const tableData = parcels.map((parcel) => [
    parcel.sequence || '-',
    parcel.parcelNumber || parcel.pin || '-',
    parcel.owner || '-',
    getParcelStatusLabel(parcel.status),
    getStatusLabel(String((parcel as any).parcelClass || 'UNKNOWN'), 'parcel_class'),
    getStatusLabel(String((parcel as any).existingRightsStatus || 'NOT_REVIEWED'), 'existing_rights'),
    getStatusLabel(String((parcel as any).encroachmentStatus || 'NOT_REVIEWED'), 'encroachments'),
    getStatusLabel(String((parcel as any).ptsStatus || 'NOT_STARTED'), 'pts'),
    getStatusLabel(parcel.titleStatus, 'title'),
    getStatusLabel(parcel.surveyStatus, 'survey'),
    getStatusLabel(parcel.acquisitionStatus, 'acquisition'),
    parcel.acreage?.toFixed(2) || '-',
  ]);

  // Add table
  autoTable(doc, {
    head: [
      [
        'Seq',
        'Parcel',
        'Owner',
        'Overall',
        'Class',
        'Exist rights',
        'Encroach',
        'PTS',
        'Title',
        'Survey',
        'Acq',
        'Acres',
      ],
    ],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 6,
      cellPadding: 1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [76, 175, 80], // Green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 22 },
      2: { cellWidth: 32 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 22 },
      6: { cellWidth: 20 },
      7: { cellWidth: 18 },
      8: { cellWidth: 18 },
      9: { cellWidth: 18 },
      10: { cellWidth: 20 },
      11: { cellWidth: 14 },
    },
  });

  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

// ============================================
// Detailed PDF Export (with notes)
// ============================================

export function exportDetailedPDF(
  parcels: (Parcel & { notes: { content: string; createdAt: Date }[] })[],
  projectName: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Detailed ROW Report: ${projectName}`, 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

  let yPosition = 30;

  parcels.forEach((parcel, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Parcel header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${parcel.parcelNumber || 'N/A'}`, 14, yPosition);
    yPosition += 7;

    // Parcel details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const details = [
      `Owner: ${parcel.owner || 'N/A'}`,
      `County: ${parcel.county || 'N/A'}`,
      `Overall Status: ${getParcelStatusLabel(parcel.status)}`,
      `Title Status: ${getStatusLabel(parcel.titleStatus, 'title')}`,
      `Survey Status: ${getStatusLabel(parcel.surveyStatus, 'survey')}`,
      `Appraisal Status: ${getStatusLabel(parcel.appraisalStatus, 'appraisal')}`,
      `Acquisition Status: ${getStatusLabel(parcel.acquisitionStatus, 'acquisition')}`,
      `Condemnation Status: ${getStatusLabel(parcel.condemnationStatus, 'condemnation')}`,
      `Damages Status: ${getStatusLabel(parcel.damagesStatus, 'damages')}`,
      `Special Conditions Status: ${getStatusLabel(parcel.specialConditionsStatus, 'special_conditions')}`,
      `Sequence: ${parcel.sequence || 'N/A'}`,
      `Milepost: ${parcel.milepost?.toFixed(2) || 'N/A'}`,
      `Acreage: ${parcel.acreage?.toFixed(2) || 'N/A'}`,
    ];

    details.forEach((detail) => {
      doc.text(detail, 20, yPosition);
      yPosition += 5;
    });

    // Legal description
    if (parcel.legalDesc) {
      doc.text('Legal Description:', 20, yPosition);
      yPosition += 5;
      const splitDesc = doc.splitTextToSize(parcel.legalDesc, 170);
      doc.text(splitDesc, 25, yPosition);
      yPosition += splitDesc.length * 5;
    }

    // Notes
    if (parcel.notes && parcel.notes.length > 0) {
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      parcel.notes.forEach((note) => {
        const noteText = `• ${new Date(note.createdAt).toLocaleDateString()}: ${note.content}`;
        const splitNote = doc.splitTextToSize(noteText, 165);
        doc.text(splitNote, 25, yPosition);
        yPosition += splitNote.length * 5 + 2;
      });
    }

    yPosition += 5; // Space between parcels
  });

  return doc;
}

// ============================================
// GeoJSON Export
// ============================================

export function exportToGeoJSON(parcels: Parcel[]): string {
  const features = parcels
    .filter((parcel) => parcel.geometry)
    .map((parcel) => ({
      type: 'Feature',
      properties: {
        id: parcel.id,
        parcelNumber: parcel.parcelNumber,
        owner: parcel.owner,
        county: parcel.county,
        status: parcel.status,
        statusLabel: getParcelStatusLabel(parcel.status),
        titleStatus: parcel.titleStatus,
        titleStatusLabel: getStatusLabel(parcel.titleStatus, 'title'),
        surveyStatus: parcel.surveyStatus,
        surveyStatusLabel: getStatusLabel(parcel.surveyStatus, 'survey'),
        appraisalStatus: parcel.appraisalStatus,
        appraisalStatusLabel: getStatusLabel(parcel.appraisalStatus, 'appraisal'),
        acquisitionStatus: parcel.acquisitionStatus,
        acquisitionStatusLabel: getStatusLabel(parcel.acquisitionStatus, 'acquisition'),
        condemnationStatus: parcel.condemnationStatus,
        condemnationStatusLabel: getStatusLabel(parcel.condemnationStatus, 'condemnation'),
        damagesStatus: parcel.damagesStatus,
        damagesStatusLabel: getStatusLabel(parcel.damagesStatus, 'damages'),
        specialConditionsStatus: parcel.specialConditionsStatus,
        specialConditionsStatusLabel: getStatusLabel(parcel.specialConditionsStatus, 'special_conditions'),
        sequence: parcel.sequence,
        milepost: parcel.milepost,
        acreage: parcel.acreage,
      },
      geometry: parcel.geometry,
    }));

  const geoJSON = {
    type: 'FeatureCollection',
    features,
  };

  return JSON.stringify(geoJSON, null, 2);
}

