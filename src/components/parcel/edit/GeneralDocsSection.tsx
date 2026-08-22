'use client';

import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import { SummaryLine, SChip } from '@/components/parcel/sectionSummary';
import { NOTE_CATEGORIES } from '@/lib/constants';
import { formatAttribution } from '@/lib/attribution';

type Document = {
  id: string;
  name: string;
  url: string;
  type?: string | null;
  category: string;
  size: number;
  createdAt: string;
  uploadedBy?: { id?: string; name?: string | null; email?: string | null } | null;
};

export default function GeneralDocsSection({
  documents,
  documentCategory,
  setDocumentCategory,
  uploadingDocument,
  uploadDocument,
  deleteDocument,
}: {
  documents: Document[];
  documentCategory: string;
  setDocumentCategory: (v: string) => void;
  uploadingDocument: boolean;
  uploadDocument: (file: File | undefined, type: string, category?: string) => void | Promise<void>;
  deleteDocument: (id: string) => void;
}) {
  return (
    <CollapsibleSection
      id="general-docs"
      title="Documents & photos"
      defaultOpen={false}
      summary={
        <SummaryLine>
          <SChip label={`${documents.length} files`} fill />
        </SummaryLine>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload parcel photos, scanned documents, PDFs, spreadsheets, and correspondence.
      </Typography>

      {documents.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No documents or photos uploaded yet.
        </Typography>
      ) : (
        <List dense sx={{ mb: 2 }}>
          {documents.map((doc) => (
            <ListItem
              key={doc.id}
              divider
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete document"
                  onClick={() => deleteDocument(doc.id)}
                >
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
                secondary={`${doc.type || 'Document'} • ${doc.category.replaceAll('_', ' ')} • ${(
                  doc.size / 1024
                ).toFixed(2)} KB • ${formatAttribution(doc.uploadedBy, doc.createdAt)}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={documentCategory}
              label="Category"
              onChange={(e) => setDocumentCategory(e.target.value)}
            >
              {NOTE_CATEGORIES.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              component="label"
              variant="contained"
              startIcon={<PhotoCameraIcon />}
              disabled={uploadingDocument}
              sx={{ flex: '1 1 150px' }}
            >
              Take Photo
              <input
                hidden
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => uploadDocument(e.target.files?.[0], 'Photo', documentCategory)}
              />
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={uploadingDocument}
              sx={{ flex: '1 1 150px' }}
            >
              Scan Document
              <input
                hidden
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                onChange={(e) => uploadDocument(e.target.files?.[0], 'Document', documentCategory)}
              />
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={uploadingDocument}
              sx={{ flex: '1 1 150px' }}
            >
              Upload File
              <input
                hidden
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={(e) => uploadDocument(e.target.files?.[0], 'Document', documentCategory)}
              />
            </Button>
          </Box>
          {uploadingDocument && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Uploading...
            </Typography>
          )}
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
}
