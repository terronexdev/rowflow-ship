'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ParcelStatusPanel, { type ParcelStatusKey } from '@/components/parcel/ParcelStatusPanel';
import { ASSIGNMENT_ROLE_OPTIONS, LAND_USE_OPTIONS, NOTE_CATEGORIES, PARCEL_LABEL_OPTIONS, PARCEL_LABEL_SHORT, PARCEL_PRIORITY_OPTIONS, PERMIT_TYPE_OPTIONS, PERMIT_STATUS_OPTIONS } from '@/lib/constants';
import {
  APPRAISAL_STATUSES,
  PTS_STATUSES,
  ACQUISITION_STATUSES,
  OVERALL_STATUSES,
  CONDEMNATION_STATUSES,
  DAMAGES_STATUSES,
  SPECIAL_CONDITIONS_STATUSES,
  TITLE_STATUSES,
  PERMIT_PHASE_STATUSES,
} from '@/lib/constants/status';
import { SummaryLine, SChip, fmtStatus, dash } from '@/components/parcel/sectionSummary';
import SectionNotesDocs from '@/components/parcel/SectionNotesDocs';
import ParcelBillingPanel from '@/components/parcel/ParcelBillingPanel';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import ParcelSectionNav from '@/components/parcel/ParcelSectionNav';
import ExistingRightsPanel from '@/components/parcel/ExistingRightsPanel';
import EncroachmentsPanel from '@/components/parcel/EncroachmentsPanel';
import ParcelSummarySheet from '@/components/parcel/edit/ParcelSummarySheet';
import { PARCEL_EDIT_SECTIONS } from '@/components/parcel/edit/sectionRegistry';
import StatusSummarySection from '@/components/parcel/edit/StatusSummarySection';
import FlagsAttentionSection from '@/components/parcel/edit/FlagsAttentionSection';
import CountyDataSection from '@/components/parcel/edit/CountyDataSection';
import TitleOwnerSection from '@/components/parcel/edit/TitleOwnerSection';
import TenantSection from '@/components/parcel/edit/TenantSection';
import ContactsSection from '@/components/parcel/edit/ContactsSection';
import ConstructionSection from '@/components/parcel/edit/ConstructionSection';
import GeneralNotesSection from '@/components/parcel/edit/GeneralNotesSection';
import GeneralDocsSection from '@/components/parcel/edit/GeneralDocsSection';
import ExistingRightsSection from '@/components/parcel/edit/ExistingRightsSection';
import SurveyTakeSection from '@/components/parcel/edit/SurveyTakeSection';
import AppraisalSection from '@/components/parcel/edit/AppraisalSection';
import RowAgentSection from '@/components/parcel/edit/RowAgentSection';
import EncroachmentsSection from '@/components/parcel/edit/EncroachmentsSection';
import LegalSection from '@/components/parcel/edit/LegalSection';
import PermittingSection from '@/components/parcel/edit/PermittingSection';
import { computeOfferRange, computeCompensationTotal } from '@/lib/compensation/matrix';

interface Parcel {
  id: string;
  parcelNumber?: string | null;
  pin?: string | null;
  owner?: string | null;
  ownerAddress?: string | null;
  ownerCity?: string | null;
  ownerState?: string | null;
  ownerZip?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  legalDesc?: string | null;
  county?: string | null;
  propertyAddress?: string | null;
  state?: string | null;
  status: string;
  ptsStatus?: string;
  titleStatus: string;
  surveyStatus: string;
  appraisalStatus: string;
  acquisitionStatus: string;
  condemnationStatus: string;
  damagesStatus: string;
  specialConditionsStatus: string;
  existingRightsStatus?: string;
  parcelClass?: string;
  encroachmentStatus?: string;
  permitStatus?: string;
  bookmarked?: boolean;
  priority?: string;
  sequence?: number | null;
  milepost?: number | null;
  acreage?: number | null;
  easementAcres?: number | string | null;
  easementAcresToAcquire?: number | string | null;
  tceAcres?: number | string | null;
  matrixLandUse?: string | null;
  matrixLandUseLabel?: string | null;
  titledOwnerName?: string | null;
  titledOwnerAddress?: string | null;
  titledOwnerCity?: string | null;
  titledOwnerState?: string | null;
  titledOwnerZip?: string | null;
  titledOwnerPhone?: string | null;
  titledOwnerEmail?: string | null;
  titledOwnerTaxId?: string | null;
  titledOwnerDistrict?: string | null;
  titledLegalDescription?: string | null;
  tenantName?: string | null;
  tenantAddress?: string | null;
  tenantPhone?: string | null;
  tenantEmail?: string | null;
  tenantNotes?: string | null;
  project?: any;
  compensationOffers?: any[];
  appraisalTracking?: any[];
  condemnationTracking?: any[];
  labels?: { id?: string; code: string; note?: string | null }[];
  permits?: any[];
  notes?: Note[];
  documents?: Document[];
}

interface Note {
  id: string;
  content: string;
  category: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  category: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

// Fetch parcel with notes and documents
const fetchParcel = async (id: string) => {
  const res = await fetch(`/api/parcels/${id}`);
  if (!res.ok) throw new Error('Failed to fetch parcel');
  const data = await res.json();
  return data.parcel;
};

export default function EditParcelPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const parcelId = params.parcelId as string;

  const { data: parcel, isLoading, error } = useQuery({
    queryKey: ['parcel', parcelId],
    queryFn: () => fetchParcel(parcelId),
  });

  // Form states for each section
  const [basicInfo, setBasicInfo] = useState({
    easementNumber: '',
    newStructureNumbers: '',
    parcelNumber: '',
    pin: '',
    owner: '',
    ownerAddress: '',
    ownerCity: '',
    ownerState: '',
    ownerZip: '',
    ownerPhone: '',
    ownerEmail: '',
    legalDesc: '',
    county: '',
    sequence: '',
    milepost: '',
    acreage: '',
  });
  const [existingStructureNumbers, setExistingStructureNumbers] = useState('');

  const [titleStatus, setTitleStatus] = useState('NOT_STARTED');
  const [parcelStatus, setParcelStatus] = useState('NOT_STARTED');
  const [surveyStatus, setSurveyStatus] = useState('NOT_STARTED');
  const [appraisalStatus, setAppraisalStatus] = useState('NOT_STARTED');
  const [acquisitionStatus, setAcquisitionStatus] = useState('NOT_STARTED');
  const [condemnationStatus, setCondemnationStatus] = useState('NOT_STARTED');
  const [specialConditionsStatus, setSpecialConditionsStatus] = useState('NOT_STARTED');
  const [damagesStatus, setDamagesStatus] = useState('NOT_STARTED');
  const [ptsStatus, setPtsStatus] = useState('NOT_STARTED');
  const [permitStatus, setPermitStatus] = useState('NOT_STARTED');
  const [existingRightsStatus, setExistingRightsStatus] = useState('NOT_REVIEWED');
  const [parcelClass, setParcelClass] = useState('UNKNOWN');
  const [encroachmentStatus, setEncroachmentStatus] = useState('NOT_REVIEWED');
  const [bookmarked, setBookmarked] = useState(false);
  const [priority, setPriority] = useState('NORMAL');
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [labelsBusy, setLabelsBusy] = useState(false);
  const [permitForm, setPermitForm] = useState({
    name: '',
    permitType: 'RAILROAD',
    status: 'NOT_STARTED',
    agency: '',
    referenceNumber: '',
    submittedDate: '',
    notes: '',
  });
  const [permitBusy, setPermitBusy] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [generalNoteCategory, setGeneralNoteCategory] = useState('GENERAL');
  const [documentCategory, setDocumentCategory] = useState('GENERAL');
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [titledInfo, setTitledInfo] = useState({
    titledOwnerName: '',
    titledOwnerAddress: '',
    titledOwnerCity: '',
    titledOwnerState: '',
    titledOwnerZip: '',
    titledOwnerPhone: '',
    titledOwnerEmail: '',
    titledOwnerTaxId: '',
    titledOwnerDistrict: '',
    titledLegalDescription: '',
  });
  const [tenantInfo, setTenantInfo] = useState({
    tenantName: '',
    tenantAddress: '',
    tenantPhone: '',
    tenantEmail: '',
    tenantNotes: '',
  });
  const [surveyTake, setSurveyTake] = useState({
    matrixLandUse: '',
    matrixLandUseLabel: '',
    easementAcresToAcquire: '',
    tceAcres: '',
    surveyNotes: '',
  });
  const [surveyNote, setSurveyNote] = useState('');
  const [appraisalForm, setAppraisalForm] = useState({
    appraiser: '',
    appraisalType: 'EASEMENT',
    scope: '',
    orderDate: '',
    inspectionDate: '',
    draftDate: '',
    finalDate: '',
    beforeValue: '',
    afterValue: '',
    easementValue: '',
    damageValue: '',
    totalValue: '',
    cost: '',
    workOrder: '',
    notes: '',
  });
  const [appraisalNote, setAppraisalNote] = useState('');
  const [appraisalBusy, setAppraisalBusy] = useState(false);
  const [legalForm, setLegalForm] = useState({
    caseNumber: '',
    court: '',
    courtDistrict: '',
    courtAddress: '',
    judge: '',
    counsel: '',
    counselFirm: '',
    counselPhone: '',
    counselEmail: '',
    opposingCounsel: '',
    opposingCounselFirm: '',
    opposingCounselPhone: '',
    opposingCounselEmail: '',
    opposingCounselAddress: '',
    noticeSentDate: '',
    petitionFiledDate: '',
    servedDate: '',
    hearingDate: '',
    awardAmount: '',
    awardDate: '',
    finalOfferAmount: '',
    finalOfferDate: '',
    appealFiled: false,
    trialDate: '',
    judgmentDate: '',
    possessionDate: '',
    legalCosts: '',
    notes: '',
  });
  const [legalBusy, setLegalBusy] = useState(false);
  const [compForm, setCompForm] = useState({
    negotiatedAmount: '',
    damages: '0',
    otherAmount: '0',
    outsideRangeReason: '',
    notes: '',
    decision: 'OFFERED',
  });
  const [compBusy, setCompBusy] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'summary' | 'full'>('full');

  // Populate form when parcel loads
  useEffect(() => {
    if (parcel) {
      setBasicInfo({
        easementNumber: parcel.easementNumber || '',
        newStructureNumbers: parcel.newStructureNumbers || '',
        parcelNumber: parcel.parcelNumber || '',
        pin: parcel.pin || '',
        owner: parcel.owner || '',
        ownerAddress: parcel.ownerAddress || '',
        ownerCity: parcel.ownerCity || '',
        ownerState: parcel.ownerState || '',
        ownerZip: parcel.ownerZip || '',
        ownerPhone: parcel.ownerPhone || '',
        ownerEmail: parcel.ownerEmail || '',
        legalDesc: parcel.legalDesc || '',
        county: parcel.county || '',
        sequence: parcel.sequence?.toString() || '',
        milepost: parcel.milepost?.toString() || '',
        acreage: parcel.acreage?.toString() || '',
      });
      setExistingStructureNumbers(parcel.existingStructureNumbers || '');
      setParcelStatus(parcel.status || 'NOT_STARTED');
      setTitleStatus(parcel.titleStatus);
      setSurveyStatus(parcel.surveyStatus || 'NOT_STARTED');
      setAppraisalStatus(parcel.appraisalStatus || 'NOT_STARTED');
      setAcquisitionStatus(parcel.acquisitionStatus || 'NOT_STARTED');
      setCondemnationStatus(parcel.condemnationStatus || 'NOT_STARTED');
      setSpecialConditionsStatus(parcel.specialConditionsStatus);
      setDamagesStatus(parcel.damagesStatus);
      setPtsStatus(parcel.ptsStatus || 'NOT_STARTED');
      setPermitStatus(parcel.permitStatus || 'NOT_STARTED');
      setExistingRightsStatus(parcel.existingRightsStatus || 'NOT_REVIEWED');
      setParcelClass(parcel.parcelClass || 'UNKNOWN');
      setEncroachmentStatus(parcel.encroachmentStatus || 'NOT_REVIEWED');
      setBookmarked(Boolean(parcel.bookmarked));
      setPriority(parcel.priority || 'NORMAL');
      const labelMap: Record<string, string> = {};
      (parcel.labels || []).forEach((l: any) => {
        labelMap[l.code] = l.note || '';
      });
      setSelectedLabels(labelMap);
      setTitledInfo({
        titledOwnerName: parcel.titledOwnerName || '',
        titledOwnerAddress: parcel.titledOwnerAddress || '',
        titledOwnerCity: parcel.titledOwnerCity || '',
        titledOwnerState: parcel.titledOwnerState || '',
        titledOwnerZip: parcel.titledOwnerZip || '',
        titledOwnerPhone: parcel.titledOwnerPhone || '',
        titledOwnerEmail: parcel.titledOwnerEmail || '',
        titledOwnerTaxId: parcel.titledOwnerTaxId || '',
        titledOwnerDistrict: parcel.titledOwnerDistrict || '',
        titledLegalDescription: parcel.titledLegalDescription || '',
      });
      setTenantInfo({
        tenantName: parcel.tenantName || '',
        tenantAddress: parcel.tenantAddress || '',
        tenantPhone: parcel.tenantPhone || '',
        tenantEmail: parcel.tenantEmail || '',
        tenantNotes: parcel.tenantNotes || '',
      });
      const pe =
        parcel.easementAcresToAcquire != null
          ? String(parcel.easementAcresToAcquire)
          : parcel.easementAcres != null
            ? String(parcel.easementAcres)
            : '';
      setSurveyTake({
        matrixLandUse: parcel.matrixLandUse || '',
        matrixLandUseLabel: parcel.matrixLandUseLabel || '',
        easementAcresToAcquire: pe,
        tceAcres: parcel.tceAcres != null ? String(parcel.tceAcres) : '',
        surveyNotes: '',
      });
      const ap = (parcel.appraisalTracking && parcel.appraisalTracking[0]) || null;
      if (ap) {
        const d = (v: any) => (v ? String(v).slice(0, 10) : '');
        const n = (v: any) => (v != null && v !== '' ? String(v) : '');
        setAppraisalForm({
          appraiser: ap.appraiser || '',
          appraisalType: ap.appraisalType || 'EASEMENT',
          scope: ap.scope || '',
          orderDate: d(ap.orderDate),
          inspectionDate: d(ap.inspectionDate),
          draftDate: d(ap.draftDate),
          finalDate: d(ap.finalDate),
          beforeValue: n(ap.beforeValue),
          afterValue: n(ap.afterValue),
          easementValue: n(ap.easementValue),
          damageValue: n(ap.damageValue),
          totalValue: n(ap.totalValue),
          cost: n(ap.cost),
          workOrder: ap.workOrder || '',
          notes: ap.notes || '',
        });
      }
      const leg = (parcel.condemnationTracking && parcel.condemnationTracking[0]) || null;
      if (leg) {
        const d = (v: any) => (v ? String(v).slice(0, 10) : '');
        const n = (v: any) => (v != null && v !== '' ? String(v) : '');
        setLegalForm({
          caseNumber: leg.caseNumber || '',
          court: leg.court || '',
          courtDistrict: leg.courtDistrict || '',
          courtAddress: leg.courtAddress || '',
          judge: leg.judge || '',
          counsel: leg.counsel || '',
          counselFirm: leg.counselFirm || '',
          counselPhone: leg.counselPhone || '',
          counselEmail: leg.counselEmail || '',
          opposingCounsel: leg.opposingCounsel || '',
          opposingCounselFirm: leg.opposingCounselFirm || '',
          opposingCounselPhone: leg.opposingCounselPhone || '',
          opposingCounselEmail: leg.opposingCounselEmail || '',
          opposingCounselAddress: leg.opposingCounselAddress || '',
          noticeSentDate: d(leg.noticeSentDate),
          petitionFiledDate: d(leg.petitionFiledDate),
          servedDate: d(leg.servedDate),
          hearingDate: d(leg.hearingDate),
          awardAmount: n(leg.awardAmount),
          awardDate: d(leg.awardDate),
          finalOfferAmount: n(leg.finalOfferAmount),
          finalOfferDate: d(leg.finalOfferDate),
          appealFiled: Boolean(leg.appealFiled),
          trialDate: d(leg.trialDate),
          judgmentDate: d(leg.judgmentDate),
          possessionDate: d(leg.possessionDate),
          legalCosts: n(leg.legalCosts),
          notes: leg.notes || '',
        });
      }
    }
  }, [parcel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value });
  };

  // Save handlers for each section
  const saveBasicInfo = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const parcelData: any = {
        easementNumber: basicInfo.easementNumber.trim() || null,
        newStructureNumbers: basicInfo.newStructureNumbers.trim() || null,
      };
      if (basicInfo.parcelNumber) parcelData.parcelNumber = basicInfo.parcelNumber;
      if (basicInfo.pin) parcelData.pin = basicInfo.pin;
      if (basicInfo.owner) parcelData.owner = basicInfo.owner;
      if (basicInfo.ownerAddress) parcelData.ownerAddress = basicInfo.ownerAddress;
      if (basicInfo.ownerCity) parcelData.ownerCity = basicInfo.ownerCity;
      if (basicInfo.ownerState) parcelData.ownerState = basicInfo.ownerState;
      if (basicInfo.ownerZip) parcelData.ownerZip = basicInfo.ownerZip;
      if (basicInfo.ownerPhone) parcelData.ownerPhone = basicInfo.ownerPhone;
      if (basicInfo.ownerEmail) parcelData.ownerEmail = basicInfo.ownerEmail;
      if (basicInfo.legalDesc) parcelData.legalDesc = basicInfo.legalDesc;
      if (basicInfo.county) parcelData.county = basicInfo.county;
      if (basicInfo.sequence) parcelData.sequence = parseInt(basicInfo.sequence);
      if (basicInfo.milepost) parcelData.milepost = parseFloat(basicInfo.milepost);
      if (basicInfo.acreage) parcelData.acreage = parseFloat(basicInfo.acreage);

      const response = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcelData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update basic info');
      }

      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setSaveSuccess('Identity & county saved.');
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Add note
  const addNote = async (category: string) => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/parcels/${parcelId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          category,
        }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const saveParcelStatuses = async (payload: Record<string, string>) => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save statuses');
      }
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      setSaveSuccess('Statuses saved.');
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addNoteCategory = async (content: string, category: string) => {
    const response = await fetch(`/api/parcels/${parcelId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, category }),
    });
    if (!response.ok) throw new Error('Failed to add note');
    queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
  };

  const deleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const uploadDocument = async (
    file: File | undefined,
    type: string,
    categoryOverride?: string
  ) => {
    if (!file) return;

    setUploadingDocument(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', type);
      formData.append('category', categoryOverride || documentCategory);

      const response = await fetch(`/api/parcels/${parcelId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
    } catch (error: any) {
      setSaveError(error.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    setSaveError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document');
      }

      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
    } catch (error: any) {
      setSaveError(error.message || 'Failed to delete document');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !parcel) {
    return <Alert severity="error">Failed to load parcel</Alert>;
  }

  const allNotes = parcel.notes || [];
  const allDocuments = parcel.documents || [];
  const handleTrackChange = async (field: ParcelStatusKey, value: string) => {
    // Keep local state in sync for controlled panel
    switch (field) {
      case 'status':
        setParcelStatus(value);
        break;
      case 'ptsStatus':
        setPtsStatus(value);
        break;
      case 'titleStatus':
        setTitleStatus(value);
        break;
      case 'surveyStatus':
        setSurveyStatus(value);
        break;
      case 'appraisalStatus':
        setAppraisalStatus(value);
        break;
      case 'acquisitionStatus':
        setAcquisitionStatus(value);
        break;
      case 'condemnationStatus':
        setCondemnationStatus(value);
        break;
      case 'specialConditionsStatus':
        setSpecialConditionsStatus(value);
        break;
      case 'damagesStatus':
        setDamagesStatus(value);
        break;
      case 'permitStatus':
        setPermitStatus(value);
        break;
      case 'existingRightsStatus':
        setExistingRightsStatus(value);
        break;
      case 'parcelClass':
        setParcelClass(value);
        break;
      case 'encroachmentStatus':
        setEncroachmentStatus(value);
        break;
    }
    // Single save path — same PATCH as map rail (parcel row enums)
    try {
      setSaving(true);
      setSaveError(null);
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update status');
      }
      queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };


  const sectionProps = {
    projectId,
    parcelId,
    parcel,
    queryClient,
    router,
    setSaveSuccess,
    setSaveError,
    saving,
    setSaving,
    existingRightsStatus,
    setExistingRightsStatus,
    parcelClass,
    setParcelClass,
    existingStructureNumbers,
    setExistingStructureNumbers,
    surveyStatus,
    setSurveyStatus,
    surveyTake,
    setSurveyTake,
    appraisalStatus,
    setAppraisalStatus,
    appraisalForm,
    setAppraisalForm,
    appraisalNote,
    setAppraisalNote,
    appraisalBusy,
    setAppraisalBusy,
    acquisitionStatus,
    setAcquisitionStatus,
    ptsStatus,
    setPtsStatus,
    parcelStatus,
    setParcelStatus,
    specialConditionsStatus,
    setSpecialConditionsStatus,
    condemnationStatus,
    setCondemnationStatus,
    permitStatus,
    setPermitStatus,
    permitForm,
    setPermitForm,
    permitBusy,
    setPermitBusy,
    legalForm,
    setLegalForm,
    legalBusy,
    setLegalBusy,
    compForm,
    setCompForm,
    compBusy,
    setCompBusy,
    compensationBusy: compBusy,
    setCompensationBusy: setCompBusy,
    compensationOffers: parcel?.compensationOffers || [],
    encroachmentStatus,
    setEncroachmentStatus,
    damagesStatus,
    setDamagesStatus,
    selectedLabels,
    surveyNote,
    setSurveyNote,
    documentCategory,
    setDocumentCategory,
    addNoteCategory,
    deleteNote,
    uploadDocument,
    saveParcelStatuses,
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/projects/${projectId}`)}
        sx={{ mb: 2 }}
      >
        Back to Project
      </Button>

      <Typography variant="h4" gutterBottom>
        Edit Parcel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {[
          parcel.easementNumber ? `Easement # ${parcel.easementNumber}` : null,
          parcel.pin || parcel.parcelNumber || parcelId,
          parcel.project?.name || null,
          parcel.project?.projectCode ? `Project ID ${parcel.project.projectCode}` : null,
          parcel.project?.workOrderNumber ? `WO# ${parcel.project.workOrderNumber}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Typography>

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaveSuccess(null)}>
          {saveSuccess}
        </Alert>
      )}

      <ToggleButtonGroup
        exclusive
        size="small"
        value={editMode}
        onChange={(_e, v) => {
          if (v) setEditMode(v);
        }}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="summary">Summary</ToggleButton>
        <ToggleButton value="full">Full edit</ToggleButton>
      </ToggleButtonGroup>

      {editMode === 'summary' ? (
        <ParcelSummarySheet
          values={{
            pin: parcel.pin,
            parcelNumber: parcel.parcelNumber,
            easementNumber: parcel.easementNumber || basicInfo.easementNumber,
            newStructureNumbers: parcel.newStructureNumbers || basicInfo.newStructureNumbers,
            existingStructureNumbers:
              parcel.existingStructureNumbers || existingStructureNumbers,
            owner: basicInfo.owner || parcel.owner,
            county: basicInfo.county || parcel.county,
            status: parcelStatus,
            parcelClass,
            existingRightsStatus,
            encroachmentStatus,
            ptsStatus,
            titleStatus,
            surveyStatus,
            appraisalStatus,
            acquisitionStatus,
            permitStatus,
            lastCompensationTotal: parcel.lastCompensationTotal,
            lastCompensationOutsideRange: parcel.lastCompensationOutsideRange,
            priority,
            bookmarked,
          }}
          onEditFull={() => setEditMode('full')}
          onPrint={() => window.print()}
        />
      ) : (
        <>
      <ParcelSectionNav sections={PARCEL_EDIT_SECTIONS} />

      <StatusSummarySection
        values={{
          status: parcelStatus,
          parcelClass,
          existingRightsStatus,
          encroachmentStatus,
          ptsStatus,
          titleStatus,
          surveyStatus,
          appraisalStatus,
          acquisitionStatus,
          condemnationStatus,
          permitStatus,
          specialConditionsStatus,
          damagesStatus,
        }}
        onChange={handleTrackChange}
        disabled={saving}
      />

      <FlagsAttentionSection
        parcelId={parcelId}
        priority={priority}
        setPriority={setPriority}
        bookmarked={bookmarked}
        setBookmarked={setBookmarked}
        selectedLabels={selectedLabels}
        setSelectedLabels={setSelectedLabels}
        labelsBusy={labelsBusy}
        setLabelsBusy={setLabelsBusy}
        saving={saving}
        setSaveError={setSaveError}
        setSaveSuccess={setSaveSuccess}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] })}
      />

      <CountyDataSection
        basicInfo={basicInfo}
        handleChange={handleChange}
        saveBasicInfo={saveBasicInfo}
        saving={saving}
      />

      <TitleOwnerSection
        parcelId={parcelId}
        titleStatus={titleStatus}
        setTitleStatus={setTitleStatus}
        titledInfo={titledInfo}
        setTitledInfo={setTitledInfo}
        saving={saving}
        setSaving={setSaving}
        setSaveError={setSaveError}
        setSaveSuccess={setSaveSuccess}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] })}
        notes={parcel.notes || []}
        documents={parcel.documents || []}
        addNoteCategory={addNoteCategory}
        deleteNote={deleteNote}
        uploadDocument={uploadDocument}
      />

      <TenantSection
        parcelId={parcelId}
        tenantInfo={tenantInfo}
        setTenantInfo={setTenantInfo}
        saving={saving}
        setSaving={setSaving}
        setSaveError={setSaveError}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] })}
      />

      <ContactsSection parcelId={parcelId} />


      <ExistingRightsSection {...sectionProps} />

      <SurveyTakeSection {...sectionProps} />

      <AppraisalSection {...sectionProps} />

      <RowAgentSection {...sectionProps} />

      <EncroachmentsSection {...sectionProps} />

      <LegalSection {...sectionProps} />

      <PermittingSection {...sectionProps} />


      <ConstructionSection
        parcelId={parcelId}
        damagesStatus={damagesStatus}
        setDamagesStatus={setDamagesStatus}
        saving={saving}
        saveParcelStatuses={saveParcelStatuses}
        notes={parcel.notes || []}
        documents={parcel.documents || []}
        addNoteCategory={addNoteCategory}
        deleteNote={deleteNote}
        uploadDocument={uploadDocument}
      />

      <GeneralNotesSection
        notes={allNotes}
        newNote={newNote}
        setNewNote={setNewNote}
        generalNoteCategory={generalNoteCategory}
        setGeneralNoteCategory={setGeneralNoteCategory}
        addNote={addNote}
        deleteNote={deleteNote}
      />

      <GeneralDocsSection
        documents={allDocuments}
        documentCategory={documentCategory}
        setDocumentCategory={setDocumentCategory}
        uploadingDocument={uploadingDocument}
        uploadDocument={uploadDocument}
        deleteDocument={deleteDocument}
      />

        </>
      )}
    </Box>
  );
}
