import React from 'react';
import UploadExcel from './UploadExcel';

/**
 * PUBLIC_INTERFACE
 * Toolbar
 * Props:
 * - search: string
 * - onSearchChange: (value: string) => void
 * - onImport: (file: File) => Promise<void> | void
 * - onExport: () => Promise<void> | void
 * - onRefresh: () => void
 * - loading: boolean
 */
export default function Toolbar({
  search,
  onSearchChange,
  onImport,
  onExport,
  onRefresh,
  loading = false,
}) {
  return (
    <div className="toolbar">
      <input
        type="text"
        className="input search"
        placeholder="Buscar dispositivos..."
        value={search}
        onChange={(e) => onSearchChange?.(e.target.value)}
        aria-label="Buscar"
      />
      <div className="spacer" />
      <button className="btn" onClick={onRefresh} disabled={loading} title="Actualizar">
        ⟳ Actualizar
      </button>
      {/* Dedicated UploadExcel component to handle .xlsx uploads and show summary */}
      <UploadExcel
        disabled={loading}
        onComplete={() => {
          // After successful import, let parent fetch fresh data.
          // We also bubble file to parent if needed for additional handling.
        }}
        onError={() => {
          // Errors are surfaced inside component; parent can also show a banner if needed.
        }}
      />
      <button className="btn btn-primary" onClick={onExport} disabled={loading} title="Exportar Excel">
        ⤓ Exportar
      </button>
    </div>
  );
}
