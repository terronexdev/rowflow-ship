'use client';

import { useParams, useRouter } from 'next/navigation';
import { getStatusColor, NOTE_CATEGORIES } from '@/lib/constants';
import ParcelStatusPanel, { type ParcelStatusKey } from '@/components/parcel/ParcelStatusPanel';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  CircularProgress,
  Alert,
  Select,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map component (client-side only)
const ParcelMap = dynamic(() => import('@/components/map/ParcelMap'), {
  ssr: false,
  loading: () => <CircularProgress />,
});

interface Note {
  id: string;
  content: string;
  category?: string | null;
  createdAt: Date;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

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
  status: string;
  titleStatus?: string;
  surveyStatus?: string;
  appraisalStatus?: string;
  acquisitionStatus?: string;
  condemnationStatus?: string;
  damagesStatus?: string;
  specialConditionsStatus?: string;
  sequence?: number | null;
  milepost?: number | null;
  geometry?: any;
  acreage?: number | null;
  notes: Note[];
  documents: Document[];
  project: {
    id: string;
    name: string;
  };
}




// Fetch parcel
const fetchParcel = async (id: string): Promise<Parcel> => {
  const res = await fetch(`/api/parcels/${id}`);
  if (!res.ok) throw new Error('Failed to fetch parcel');
  const data = await res.json();
  return data.parcel;
};

export default function ParcelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const parcelId = params.parcelId as string;
  const projectId = params.id as string;
  const [tabValue, setTabValue] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('GENERAL');
  const [documentCategory, setDocumentCategory] = useState('GENERAL');
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const { data: parcel, isLoading, error } = useQuery<Parcel>({
    queryKey: ['parcel', parcelId],
    queryFn: () => fetchParcel(parcelId),
  });

  const refreshParcel = () => queryClient.invalidateQueries({ queryKey: ['parcel', parcelId] });
  const [savingStatus, setSavingStatus] = useState(false);

  const handleTrackChange = async (field: ParcelStatusKey, value: string) => {
    setSavingStatus(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      await refreshParcel();
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };


  const addNote = async () => {
    if (!newNote.trim()) return;

    setSavingNote(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/parcels/${parcelId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          category: noteCategory,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add note');
      }

      setNewNote('');
      await refreshParcel();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    setActionError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note');
      }
      await refreshParcel();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete note');
    }
  };

  const uploadDocument = async (file: File | undefined, type: 'Photo' | 'Document') => {
    if (!file) return;

    setUploadingDocument(true);
    setActionError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', type);
      formData.append('category', documentCategory);

      const response = await fetch(`/api/parcels/${parcelId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      await refreshParcel();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    setActionError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document');
      }
      await refreshParcel();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete document');
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/projects/${projectId}`)}
            sx={{ mb: 1 }}
          >
            Back to {parcel.project.name}
          </Button>
          <Typography variant="h4">
            {parcel.parcelNumber || `Parcel ${parcel.sequence || 'N/A'}`}
          </Typography>
          <Chip
            label={parcel.status.replace('_', ' ')}
            sx={{
              bgcolor: getStatusColor(parcel.status),
              color: 'white',
              fontWeight: 'bold',
              mt: 1,
            }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/projects/${projectId}/parcels/${parcelId}/edit`)}
        >
          Edit Parcel
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parcel Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <DetailField label="Parcel Number" value={parcel.parcelNumber} />
              <DetailField label="PIN" value={parcel.pin} />
              <DetailField label="Sequence" value={parcel.sequence} />
              <DetailField label="Milepost" value={parcel.milepost} />
              <DetailField label="County" value={parcel.county} />
              <DetailField label="Acreage" value={parcel.acreage ? `${parcel.acreage} acres` : null} />
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Owner Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <DetailField label="Owner Name" value={parcel.owner} />
              <DetailField label="Email" value={parcel.ownerEmail} />
              <DetailField label="Phone" value={parcel.ownerPhone} />
              <DetailField label="Address" value={parcel.ownerAddress} fullWidth />
              <DetailField
                label="City, State ZIP"
                value={
                  parcel.ownerCity || parcel.ownerState || parcel.ownerZip
                    ? `${parcel.ownerCity || ''} ${parcel.ownerState || ''} ${parcel.ownerZip || ''}`.trim()
                    : null
                }
                fullWidth
              />
            </Grid>

            {parcel.legalDesc && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Legal Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">{parcel.legalDesc}</Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Map and Tabs */}
        <Grid item xs={12} md={6}>
          {/* Map */}
          {parcel.geometry && (
            <Paper sx={{ p: 2, mb: 3, height: 400 }}>
              <ParcelMap parcels={[parcel]} selectedParcelId={parcel.id} />
            </Paper>
          )}

          <Paper sx={{ p: 2, mb: 3 }}>
            <ParcelStatusPanel
              values={parcel}
              onChange={handleTrackChange}
              disabled={savingStatus}
              title="Track (parcel enums — source of truth)"
            />
          </Paper>

          {/* Tabs for Notes and Documents */}
          <Paper sx={{ p: 2 }}>
            {actionError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                {actionError}
              </Alert>
            )}

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label={`Notes (${parcel.notes.length})`} />
              <Tab label={`Documents (${parcel.documents.length})`} />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {tabValue === 0 && (
                <Box>
                  {parcel.notes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No notes yet
                    </Typography>
                  ) : (
                    <List>
                      {parcel.notes.map((note) => (
                        <ListItem
                          key={note.id}
                          divider
                          secondaryAction={
                            <IconButton edge="end" aria-label="delete note" onClick={() => deleteNote(note.id)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={note.content}
                            secondary={
                              <>
                                {note.category && <Chip label={note.category} size="small" sx={{ mr: 1 }} />}
                                {new Date(note.createdAt).toLocaleDateString()}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Add Comment"
                      value={newNote}
                      onChange={(event) => setNewNote(event.target.value)}
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={noteCategory}
                        label="Category"
                        onChange={(event) => setNoteCategory(event.target.value)}
                      >
                        {NOTE_CATEGORIES.map((category) => (
                          <MenuItem key={category.value} value={category.value}>
                            {category.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      onClick={addNote}
                      disabled={savingNote || !newNote.trim()}
                      fullWidth
                    >
                      {savingNote ? 'Saving...' : 'Add Comment'}
                    </Button>
                  </Box>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  {parcel.documents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No documents yet
                    </Typography>
                  ) : (
                    <List>
                      {parcel.documents.map((doc) => (
                        <ListItem
                          key={doc.id}
                          divider
                          secondaryAction={
                            <IconButton edge="end" aria-label="delete document" onClick={() => deleteDocument(doc.id)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={
                              <Button
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ justifyContent: 'flex-start', p: 0, textTransform: 'none' }}
                              >
                                {doc.name}
                              </Button>
                            }
                            secondary={
                              <>
                                {doc.type} • {(doc.size / 1024).toFixed(2)} KB •{' '}
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={documentCategory}
                        label="Category"
                        onChange={(event) => setDocumentCategory(event.target.value)}
                      >
                        {NOTE_CATEGORIES.map((category) => (
                          <MenuItem key={category.value} value={category.value}>
                            {category.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<PhotoCameraIcon />}
                        disabled={uploadingDocument}
                        sx={{ flex: '1 1 160px' }}
                      >
                        Take Photo
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(event) => uploadDocument(event.target.files?.[0], 'Photo')}
                        />
                      </Button>

                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        disabled={uploadingDocument}
                        sx={{ flex: '1 1 160px' }}
                      >
                        Scan Document
                        <input
                          hidden
                          type="file"
                          accept="image/*,.pdf"
                          capture="environment"
                          onChange={(event) => uploadDocument(event.target.files?.[0], 'Document')}
                        />
                      </Button>

                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        disabled={uploadingDocument}
                        fullWidth
                      >
                        Upload File
                        <input
                          hidden
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                          onChange={(event) => uploadDocument(event.target.files?.[0], 'Document')}
                        />
                      </Button>
                    </Box>

                    {uploadingDocument && (
                      <Typography variant="body2" color="text.secondary">
                        Uploading...
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Helper component for detail fields
function DetailField({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
}) {
  if (!value) return null;

  return (
    <Grid item xs={fullWidth ? 12 : 6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Grid>
  );
}


