import React from 'react';

/**
 * PUBLIC_INTERFACE
 * InventoryTable
 * Props:
 * - items: Array<Record<string, any>>
 * - loading: boolean
 * - sort: { field: string, direction: 'asc' | 'desc' }
 * - onSort: (field: string) => void
 */
export default function InventoryTable({ items = [], loading = false, sort, onSort }) {
  const columns = [
    { key: 'name', label: 'Dispositivo' },
    { key: 'category', label: 'Categoría' },
    { key: 'status', label: 'Estado' },
    { key: 'assigned_to', label: 'Asignado a' },
    { key: 'updated_at', label: 'Actualizado' },
  ];

  const renderSort = (key) => {
    if (!sort || sort.field !== key) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator">{sort.direction === 'asc' ? '↑' : '↓'}</span>;
    // purely visual; actual sorting handled by parent via onSort
  };

  return (
    <div className="table-wrapper">
      <table className="table" role="grid" aria-busy={loading}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="th-sortable"
                onClick={() => onSort?.(c.key)}
                scope="col"
              >
                {c.label} {renderSort(c.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="state" colSpan={columns.length}>Cargando inventario…</td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td className="state" colSpan={columns.length}>No hay elementos para mostrar.</td>
            </tr>
          ) : (
            items.map((it, idx) => (
              <tr key={it.id ?? idx}>
                <td>{fallback(it.name)}</td>
                <td>{fallback(it.category)}</td>
                <td>{formatStatus(it.status)}</td>
                <td>{fallback(it.assigned_to)}</td>
                <td>{formatDate(it.updated_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Small helpers (module-local) */
function fallback(v, alt = '—') {
  if (v === null || v === undefined || String(v).trim() === '') return alt;
  return String(v);
}

function formatStatus(s) {
  const map = {
    active: 'Activo',
    in_repair: 'En reparación',
    retired: 'Retirado',
  };
  return map[s] || fallback(s);
}

function formatDate(v) {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}
