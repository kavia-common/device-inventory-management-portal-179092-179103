import React, { useRef } from 'react';

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
  const fileInputRef = useRef(null);

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && onImport) {
      onImport(f);
    }
    // reset value so same file re-triggers change later
    e.target.value = '';
  };

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
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button className="btn" onClick={onRefresh} disabled={loading} title="Actualizar">
        ⟳ Actualizar
      </button>
      <button className="btn" onClick={triggerImport} disabled={loading} title="Importar Excel">
        ⤒ Importar
      </button>
      <button className="btn btn-primary" onClick={onExport} disabled={loading} title="Exportar Excel">
        ⤓ Exportar
      </button>
    </div>
  );
}
