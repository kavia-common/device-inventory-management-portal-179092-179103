/**
 * API helper module for inventory frontend.
 * Uses native fetch and an environment-configured base URL.
 * Set REACT_APP_API_BASE in .env (e.g., http://localhost:3001).
 */

// Trim trailing slashes from base to avoid double slashes when joining
const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:3001').replace(/\/+$/, '');

// Utility: join base with path safely
function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

// Utility: build query string from params object, including filters and sort rules
function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  const { page, pageSize, search, filters, sort, ...rest } = params;

  if (page != null) searchParams.set('page', String(page));
  if (pageSize != null) searchParams.set('page_size', String(pageSize));
  if (search != null && String(search).trim() !== '') searchParams.set('search', String(search));

  // Filters: accept plain object: { status: 'active', category: 'laptop' }
  if (filters && typeof filters === 'object') {
    Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null && `${v}` !== '')
      .forEach(([k, v]) => {
        // Many backends accept repeated keys or nested keys; keep it simple as key=value
        searchParams.append(`filter_${k}`, String(v));
      });
  }

  // Sort: accept string 'field:asc' or array ['field:asc', 'name:desc']
  if (Array.isArray(sort)) {
    sort.filter(Boolean).forEach((rule) => searchParams.append('sort', String(rule)));
  } else if (typeof sort === 'string' && sort.trim() !== '') {
    searchParams.set('sort', sort);
  }

  // Pass-through other keys if provided
  Object.entries(rest)
    .filter(([, v]) => v !== undefined && v !== null && `${v}` !== '')
    .forEach(([k, v]) => searchParams.set(k, String(v)));

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// Core fetch wrapper: unified error handling
async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  const resp = await fetch(url, {
    // credentials: 'include', // Uncomment if backend requires cookies
    ...options,
  });

  // Attempt to parse JSON for error and data responses
  const contentType = resp.headers.get('content-type') || '';

  if (!resp.ok) {
    let message = `Request failed with status ${resp.status}`;
    try {
      if (contentType.includes('application/json')) {
        const errData = await resp.json();
        message = errData?.message || message;
        throw Object.assign(new Error(message), { status: resp.status, data: errData });
      }
      const text = await resp.text();
      if (text) message = text;
    } catch (_) {
      // fallback to generic error if parsing fails
    }
    throw Object.assign(new Error(message), { status: resp.status });
  }

  if (contentType.includes('application/json')) {
    return resp.json();
  }
  // For other content types (e.g., blobs), return the raw response
  return resp;
}

// PUBLIC_INTERFACE
export async function listItems({ page, pageSize, search, filters, sort } = {}) {
  /**
   * List inventory items with optional pagination, search, filters, and sort.
   * Params:
   * - page: number (1-based)
   * - pageSize: number
   * - search: string
   * - filters: object, e.g., { status: 'active', category: 'laptop' }
   * - sort: string or array, e.g., 'name:asc' or ['name:asc', 'updated_at:desc']
   * Returns:
   * - Typically { data: [...], meta: { ...pagination } } but depends on backend.
   */
  const query = buildQuery({ page, pageSize, search, filters, sort });
  return apiFetch(`/items${query}`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function getItem(id) {
  /**
   * Get a single item by ID.
   * Params:
   * - id: string|number
   * Returns:
   * - The item object.
   */
  if (id == null) throw new Error('getItem: id is required');
  return apiFetch(`/items/${encodeURIComponent(id)}`, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function createItem(data) {
  /**
   * Create a new inventory item.
   * Params:
   * - data: object (JSON-serializable)
   * Returns:
   * - Created item or server response.
   */
  if (data == null || typeof data !== 'object') throw new Error('createItem: data object is required');
  return apiFetch('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// PUBLIC_INTERFACE
export async function updateItem(id, data) {
  /**
   * Update an existing inventory item by ID.
   * Params:
   * - id: string|number
   * - data: object (JSON-serializable)
   * Returns:
   * - Updated item or server response.
   */
  if (id == null) throw new Error('updateItem: id is required');
  if (data == null || typeof data !== 'object') throw new Error('updateItem: data object is required');
  return apiFetch(`/items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// PUBLIC_INTERFACE
export async function deleteItem(id) {
  /**
   * Delete an inventory item by ID.
   * Params:
   * - id: string|number
   * Returns:
   * - Deletion confirmation or server response.
   */
  if (id == null) throw new Error('deleteItem: id is required');
  return apiFetch(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// PUBLIC_INTERFACE
export async function importExcel(file) {
  /**
   * Import inventory data from an Excel file.
   * Params:
   * - file: File or Blob (Excel)
   * Returns:
   * - Server response indicating import result.
   *
   * Note: Backend is expected to receive multipart/form-data at POST /items/import
   * Adjust the endpoint if your backend uses a different path.
   */
  if (!file) throw new Error('importExcel: file is required');
  const form = new FormData();
  form.append('file', file);

  return apiFetch('/items/import', {
    method: 'POST',
    body: form,
  });
}

// Helper: parse filename from Content-Disposition header (if present)
function getFileNameFromDisposition(disposition) {
  // content-disposition: attachment; filename="export.xlsx"
  if (!disposition) return null;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(disposition);
  if (match) {
    // prefer UTF-8 encoding filename*
    return decodeURIComponent(match[1] || match[2] || '').trim();
  }
  return null;
}

// PUBLIC_INTERFACE
export async function exportExcel(params = {}) {
  /**
   * Export inventory data as Excel.
   * Params:
   * - params: optional filters/search/sort like listItems for server-side filtering
   * Behavior:
   * - Triggers a client-side download of the received file.
   *
   * Note: Backend is expected to return an Excel file from GET /items/export.
   * Adjust the endpoint if your backend uses a different path.
   */
  const query = buildQuery(params);
  // Use the raw response to handle blob
  const resp = await apiFetch(`/items/export${query}`, { method: 'GET' });

  // If apiFetch returned Response (non-JSON), it means non-JSON content
  if (!(resp instanceof Response)) {
    throw new Error('exportExcel: unexpected response type');
  }

  const blob = await resp.blob();
  const contentDisposition = resp.headers.get('content-disposition');
  const filename = getFileNameFromDisposition(contentDisposition) || 'export.xlsx';

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Ensure we revoke after the download has been triggered
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// PUBLIC_INTERFACE
export function getApiBase() {
  /**
   * Returns the resolved API base URL being used by the client.
   */
  return API_BASE;
}

// Default export (optional convenience)
const api = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  importExcel,
  exportExcel,
  getApiBase,
};

export default api;
