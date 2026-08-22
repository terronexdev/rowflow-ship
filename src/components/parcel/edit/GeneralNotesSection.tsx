'use client';

import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CollapsibleSection from '@/components/parcel/CollapsibleSection';
import { SummaryLine, SChip } from '@/components/parcel/sectionSummary';
import { NOTE_CATEGORIES } from '@/lib/constants';
import { formatAttribution } from '@/lib/attribution';

type Note = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  author?: { id?: string; name?: string | null; email?: string | null } | null;
};

export default function GeneralNotesSection({
  notes,
  newNote,
  setNewNote,
  generalNoteCategory,
  setGeneralNoteCategory,
  addNote,
  deleteNote,
}: {
  notes: Note[];
  newNote: string;
  setNewNote: (v: string) => void;
  generalNoteCategory: string;
  setGeneralNoteCategory: (v: string) => void;
  addNote: (category: string) => void;
  deleteNote: (id: string) => void;
}) {
  return (
    <CollapsibleSection
      id="general-notes"
      title="General comments"
      defaultOpen={false}
      summary={
        <SummaryLine>
          <SChip label={`${notes.length} notes`} fill />
        </SummaryLine>
      }
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        General parcel comments and phase notes are stored together here, with categories for
        filtering later.
      </Typography>

      {notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No comments yet.
        </Typography>
      ) : (
        <List dense sx={{ mb: 2 }}>
          {notes.map((note) => (
            <ListItem
              key={note.id}
              divider
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete comment"
                  onClick={() => deleteNote(note.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={note.content}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                    <Chip label={note.category.replaceAll('_', ' ')} size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {formatAttribution(note.author, note.createdAt)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Add Parcel Comment"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={generalNoteCategory}
              label="Category"
              onChange={(e) => setGeneralNoteCategory(e.target.value)}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => addNote(generalNoteCategory)}
            disabled={!newNote.trim()}
            fullWidth
          >
            Add Comment
          </Button>
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
}
