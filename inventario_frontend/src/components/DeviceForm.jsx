import React, { useEffect, useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * DeviceForm
 * A lightweight modal form for creating or editing a device.
 * Props:
 * - open: boolean - show/hide modal
 * - initialData: object | null - item to edit, or null for create
 * - onClose: () => void - close modal
 * - onSave: (payload) => Promise<any> | void - called with form data
 * - onDelete: (id) => Promise<any> | void - called when deleting existing item
 */
export default function DeviceForm({ open = false, initialData = null, onClose, onSave, onDelete }) {
  const [values, setValues] = useState(getInitial(initialData));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isEdit = useMemo(() => !!(initialData && initialData.id != null), [initialData]);

  useEffect(() => {
    setValues(getInitial(initialData));
    setErrors({});
    setSubmitting(false);
  }, [initialData, open]);

  if (!open) return null;

  const update = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
  };

  // Basic validation: asset_tag required
  const validate = () => {
    const next = {};
    if (!values.asset_tag || String(values.asset_tag).trim() === '') {
      next.asset_tag = 'El código (asset_tag) es obligatorio.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await onSave?.(normalize(values));
      onClose?.();
    } catch (err) {
      // surface error
      setErrors((prev) => ({ ...prev, form: err?.message || 'No se pudo guardar el dispositivo.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    try {
      setSubmitting(true);
      await onDelete?.(initialData.id);
      onClose?.();
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err?.message || 'No se pudo eliminar el dispositivo.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="device-form-title">
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title" id="device-form-title">
              {isEdit ? 'Editar dispositivo' : 'Nuevo dispositivo'}
            </div>
            <div className="modal-subtitle">Complete los campos del equipo</div>
          </div>
          <button className="btn" onClick={onClose} aria-label="Cerrar" disabled={submitting}>✕</button>
        </div>

        {errors.form && (
          <div className="alert alert-error" role="alert">
            <div className="alert-title">Ocurrió un error</div>
            <div className="alert-message">{errors.form}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field label="Asset Tag" required error={errors.asset_tag}>
              <input
                className="input"
                value={values.asset_tag}
                onChange={(e) => update('asset_tag', e.target.value)}
                placeholder="E.g., LT-12345"
              />
            </Field>

            <Field label="Tipo">
              <input
                className="input"
                value={values.type}
                onChange={(e) => update('type', e.target.value)}
                placeholder="Laptop / Pantalla / Docking / Ratón"
              />
            </Field>

            <Field label="Marca">
              <input
                className="input"
                value={values.brand}
                onChange={(e) => update('brand', e.target.value)}
                placeholder="Marca"
              />
            </Field>

            <Field label="Modelo">
              <input
                className="input"
                value={values.model}
                onChange={(e) => update('model', e.target.value)}
                placeholder="Modelo"
              />
            </Field>

            <Field label="Número de serie">
              <input
                className="input"
                value={values.serial_number}
                onChange={(e) => update('serial_number', e.target.value)}
                placeholder="Serial"
              />
            </Field>

            <Field label="Estado">
              <select
                className="select"
                value={values.status}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                <option value="active">Activo</option>
                <option value="in_repair">En reparación</option>
                <option value="retired">Retirado</option>
              </select>
            </Field>

            <Field label="Asignado a">
              <input
                className="input"
                value={values.assigned_to}
                onChange={(e) => update('assigned_to', e.target.value)}
                placeholder="Nombre persona"
              />
            </Field>

            <Field label="Ubicación">
              <input
                className="input"
                value={values.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Sede / Oficina"
              />
            </Field>

            <Field label="Fecha de compra">
              <input
                type="date"
                className="input"
                value={values.purchase_date}
                onChange={(e) => update('purchase_date', e.target.value)}
              />
            </Field>

            <Field label="Vencimiento de garantía">
              <input
                type="date"
                className="input"
                value={values.warranty_expiry}
                onChange={(e) => update('warranty_expiry', e.target.value)}
              />
            </Field>

            <Field label="Notas" full>
              <textarea
                className="input"
                rows={3}
                value={values.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Notas adicionales"
              />
            </Field>
          </div>

          <div className="modal-footer">
            <div className="spacer" />
            {isEdit && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleDelete}
                disabled={submitting}
                aria-label="Eliminar dispositivo"
              >
                🗑 Eliminar
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required = false, error, children, full = false }) {
  return (
    <div className={`form-field ${full ? 'full' : ''}`}>
      <label className="form-label">
        {label} {required ? <span className="req">*</span> : null}
      </label>
      {children}
      {error ? <div className="form-error">{error}</div> : null}
    </div>
  );
}

function getInitial(data) {
  return {
    asset_tag: data?.asset_tag ?? '',
    type: data?.type ?? '',
    brand: data?.brand ?? '',
    model: data?.model ?? '',
    serial_number: data?.serial_number ?? '',
    status: data?.status ?? '',
    assigned_to: data?.assigned_to ?? '',
    location: data?.location ?? '',
    purchase_date: toDateInputValue(data?.purchase_date) ?? '',
    warranty_expiry: toDateInputValue(data?.warranty_expiry) ?? '',
    notes: data?.notes ?? '',
  };
}

function toDateInputValue(v) {
  if (!v) return '';
  try {
    // accept ISO string or Date-compatible
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

function normalize(v) {
  // normalize empty strings to null for optional fields
  const n = { ...v };
  Object.keys(n).forEach((k) => {
    if (n[k] === '') n[k] = null;
  });
  return n;
}
