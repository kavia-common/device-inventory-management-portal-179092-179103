import React, { useRef, useState } from 'react';
import { importExcel } from '../api';

/**
 * PUBLIC_INTERFACE
 * UploadExcel
 * A compact UI component to upload an Excel (.xlsx/.xls) file and display a summary.
 *
 * Props:
 * - onComplete: (result) => void — called after successful import
 * - onError: (message: string) => void — called if import fails
 * - disabled: boolean — disables interaction
 */
export default function UploadExcel({ onComplete, onError, disabled = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const trigger = () => {
    if (disabled || busy) return;
    inputRef.current?.click();
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0] || null;
    // reset so the same file can be chosen again later
    e.target.value = '';
    if (!file) return;

    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowed.includes(file.type) && !/\.(xlsx|xls)$/i.test(file.name)) {
      const msg = 'Seleccione un archivo Excel (.xlsx o .xls).';
      setResult({ error: msg });
      onError?.(msg);
      return;
    }

    try {
      setBusy(true);
      setResult(null);
      const resp = await importExcel(file);
      // Common shapes: { created, updated, errors: [...] } or wrapped in data
      const data = resp?.data ?? resp;
      setResult(data);
      onComplete?.(data);
    } catch (err) {
      const msg = err?.message || 'Error al importar el archivo.';
      setResult({ error: msg });
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button className="btn" onClick={trigger} disabled={disabled || busy} title="Importar Excel">
        {busy ? 'Importando…' : '⤒ Importar Excel'}
      </button>

      {result && (
        <div className={`alert ${result.error ? 'alert-error' : ''}`} style={{ marginTop: 10 }}>
          {!result.error ? (
            <div>
              <div className="alert-title">Resultado de la importación</div>
              <div className="alert-message" style={{ color: 'inherit' }}>
                {/* Safely read fields */}
                <div>Creado: {safeNum(result.created)}</div>
                <div>Actualizado: {safeNum(result.updated)}</div>
                {Array.isArray(result.errors) && result.errors.length > 0 ? (
                  <div style={{ marginTop: 6 }}>
                    <div>Errores: {result.errors.length}</div>
                    <ul style={{ marginTop: 4 }}>
                      {result.errors.slice(0, 5).map((er, i) => (
                        <li key={i} style={{ color: '#991B1B' }}>
                          {typeof er === 'string' ? er : JSON.stringify(er)}
                        </li>
                      ))}
                    </ul>
                    {result.errors.length > 5 && (
                      <div className="muted">… y {result.errors.length - 5} más</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div>
              <div className="alert-title">Ocurrió un error al importar</div>
              <div className="alert-message">{result.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
