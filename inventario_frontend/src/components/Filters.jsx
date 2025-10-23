import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Filters
 * Props:
 * - filters: { status?: string, category?: string }
 * - onChange: (nextFilters: Record<string, string>) => void
 */
export default function Filters({ filters = {}, onChange }) {
  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'active', label: 'Activo' },
    { value: 'in_repair', label: 'En reparación' },
    { value: 'retired', label: 'Retirado' },
  ];

  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    { value: 'laptop', label: 'Laptop' },
    { value: 'monitor', label: 'Pantalla' },
    { value: 'docking', label: 'Docking' },
    { value: 'mouse', label: 'Ratón' },
  ];

  const setFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    onChange?.(next);
  };

  return (
    <div className="filters">
      <select
        className="select"
        value={filters.status ?? ''}
        onChange={(e) => setFilter('status', e.target.value)}
        aria-label="Filtro estado"
      >
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        className="select"
        value={filters.category ?? ''}
        onChange={(e) => setFilter('category', e.target.value)}
        aria-label="Filtro categoría"
      >
        {categoryOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
