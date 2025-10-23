import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { listItems, importExcel, exportExcel, getApiBase } from './api';
import Toolbar from './components/Toolbar';
import Filters from './components/Filters';
import InventoryTable from './components/InventoryTable';

/**
 * PUBLIC_INTERFACE
 * App
 * A modern inventory portal UI using Ocean Professional styling.
 * - Integrates with src/api.js for data fetching
 * - Supports search, filters, sorting, and pagination
 * - Provides import/export actions for Excel
 */
function App() {
  // Query state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '' });

  // Sorting state
  const [sortField, setSortField] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce search to avoid excessive requests
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Build sort rule for API
  const sortRule = useMemo(() => {
    return sortField ? `${sortField}:${sortDir}` : undefined;
  }, [sortField, sortDir]);

  // Fetch items when dependencies change
  useEffect(() => {
    let isCancelled = false;
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const resp = await listItems({
          page,
          pageSize,
          search: debouncedSearch,
          filters,
          sort: sortRule,
        });

        // Handle flexible API shapes:
        // - { data: [...], meta: { total, page, page_size } }
        // - Array of items
        if (!isCancelled) {
          if (Array.isArray(resp)) {
            setItems(resp);
            setTotal(resp.length);
          } else if (resp && typeof resp === 'object') {
            const data = Array.isArray(resp.data) ? resp.data : [];
            setItems(data);
            const t = (resp.meta && (resp.meta.total ?? resp.meta.count)) ?? data.length ?? 0;
            setTotal(Number.isFinite(t) ? t : 0);
          } else {
            setItems([]);
            setTotal(0);
          }
        }
      } catch (e) {
        if (!isCancelled) {
          setError(e?.message || 'No se pudo cargar el inventario.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [page, pageSize, debouncedSearch, filters, sortRule]);

  // Sorting handler: toggle asc/desc on same field
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    // Reset to first page on new sort to avoid empty pages
    setPage(1);
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      setLoading(true);
      setError('');
      await importExcel(file);
      // Refresh after successful import
      setPage(1);
    } catch (e) {
      setError(e?.message || 'Error al importar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setError('');
      await exportExcel({
        search: debouncedSearch,
        filters,
        sort: sortRule,
      });
    } catch (e) {
      setError(e?.message || 'Error al exportar los datos.');
    }
  };

  const handleRefresh = () => {
    // Change state to trigger useEffect without altering user inputs
    setPage((p) => p); // no-op to force refetch in some environments
    // Safer: flip sortDir twice to retrigger, but we can also just setLoading true and rerun fetch via a key.
    // For simplicity, we can bump page then revert if > 1, else bump pageSize then revert.
    setLoading(true);
    setTimeout(() => setLoading(false), 0);
  };

  const apiBase = getApiBase();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo" aria-hidden="true">📦</div>
          <div>
            <div className="brand-title">Inventario de Dispositivos</div>
            <div className="brand-subtitle">Ocean Professional UI</div>
          </div>
        </div>
        <div className="env-badge" title="API Base">
          API: {apiBase}
        </div>
      </header>

      <main className="page">
        <section className="controls-card card">
          <Toolbar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onImport={handleImport}
            onExport={handleExport}
            onRefresh={handleRefresh}
            loading={loading}
          />
          <Filters
            filters={filters}
            onChange={(next) => { setFilters(next); setPage(1); }}
          />
        </section>

        {error && (
          <div className="alert alert-error">
            <div className="alert-title">Ocurrió un error</div>
            <div className="alert-message">{error}</div>
            <button className="btn btn-outline" onClick={() => setPage((p) => p)}>
              Reintentar
            </button>
          </div>
        )}

        <section className="table-card card">
          <InventoryTable
            items={items}
            loading={loading}
            sort={{ field: sortField, direction: sortDir }}
            onSort={handleSort}
          />

          <div className="pagination">
            <div className="pagination-left">
              <label>
                Filas por página:{' '}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <div className="muted">
                Total: {total}
              </div>
            </div>
            <div className="pagination-right">
              <button
                className="btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                ◀ Anterior
              </button>
              <span className="page-indicator">
                Página {page}
              </span>
              <button
                className="btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || (items.length < pageSize && total <= page * pageSize)}
              >
                Siguiente ▶
              </button>
            </div>
          </div>
        </section>

        <footer className="footer">
          <a
            className="learn-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </footer>
      </main>
    </div>
  );
}

export default App;
