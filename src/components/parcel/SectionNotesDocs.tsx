'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { formatAttribution } from '@/lib/attribution';

type Person = { id?: string; name?: string | null; email?: string | null } | null;

type Note = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  author?: Person;
};

type Doc = {
  id: string;
  name: string;
  url: string;
  category: string;
  createdAt: string;
  uploadedBy?: Person;
};

interface Props {
  title?: string;
  categories: string[];
  notes: Note[];
  documents: Doc[];
  onAddNote: (content: string, category: string) => Promise<void>;
  onDeleteNote: (id: string) => void;
  onUpload: (file: File, category: string) => void;
  defaultCategory: string;
  uploadLabel?: string;
}

/** Filtered notes + file list for a discipline section. */
export default function SectionNotesDocs({
  title = 'Notes & files',
  categories,
  notes,
  documents,
  onAddNote,
  onDeleteNote,
  onUpload,
  defaultCategory,
  uploadLabel = 'Upload file',
}: Props) {
  const [text, setText] = useState('');
  const [cat, setCat] = useState(defaultCategory);
  const catSet = new Set(categories);
  const filteredNotes = notes.filter((n) => catSet.has(n.category));
  const filteredDocs = documents.filter((d) => catSet.has(d.category));

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      {categories.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <Button
              key={c}
              size="small"
              variant={cat === c ? 'contained' : 'outlined'}
              onClick={() => setCat(c)}
            >
              {c.replaceAll('_', ' ')}
            </Button>
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <TextField
          size="small"
          fullWidth
          sx={{ flex: 1, minWidth: 200 }}
          placeholder="Add note…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          variant="outlined"
          disabled={!text.trim()}
          onClick={async () => {
            if (!text.trim()) return;
            await onAddNote(text.trim(), cat);
            setText('');
          }}
        >
          Add note
        </Button>
        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} size="small">
          {uploadLabel}
          <input
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              onUpload(f, cat);
              e.target.value = '';
            }}
          />
        </Button>
      </Box>
      <List dense>
        {filteredNotes.map((n) => (
          <ListItem
            key={n.id}
            secondaryAction={
              <IconButton edge="end" size="small" onClick={() => onDeleteNote(n.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText
              primary={n.content}
              secondary={`${n.category.replaceAll('_', ' ')} · ${formatAttribution(
                n.author,
                n.createdAt
              )}`}
            />
          </ListItem>
        ))}
        {filteredNotes.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            No notes yet.
          </Typography>
        )}
      </List>
      <List dense>
        {filteredDocs.map((d) => (
          <ListItem key={d.id}>
            <ListItemText
              primary={
                <a href={d.url} target="_blank" rel="noreferrer">
                  {d.name}
                </a>
              }
              secondary={`${d.category.replaceAll('_', ' ')} · ${formatAttribution(
                d.uploadedBy,
                d.createdAt
              )}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
