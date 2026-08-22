/** Shared project list fetch — one shape for all pages using queryKey ['projects']. */
export type ProjectListItem = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  projectCode?: string | null;
  workOrderNumber?: string | null;
  createdAt?: string | Date;
  _count?: { parcels?: number };
  [key: string]: unknown;
};

export async function fetchProjectList(): Promise<ProjectListItem[]> {
  const res = await fetch('/api/projects', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error('Failed to load projects');
  }
  const data = await res.json();
  // Always return the array — never the wrapper object
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data)) return data;
  return [];
}
