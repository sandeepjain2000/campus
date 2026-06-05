'use client';

import { useCallback, useState } from 'react';
import { validateField, validateFieldWithConfirm, FIELD_IDS } from '@/lib/inputConstraints';

/**
 * Number input with shared constraints (no negatives; zero policy per field).
 * @param {{
 *   fieldId: string,
 *   value: string | number,
 *   onChange: (value: string) => void,
 *   onValidatedChange?: (value: string) => void,
 *   context?: Record<string, unknown>,
 *   className?: string,
 *   confirmWarnings?: boolean,
 *   step?: string | number,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   id?: string,
 *   min?: never,
 *   max?: never,
 * }} props — do not pass HTML min/max; use fieldId in inputConstraints.
 */
export default function ValidatedNumberInput({
  fieldId,
  value,
  onChange,
  onValidatedChange,
  context = {},
  className = 'form-input',
  confirmWarnings = true,
  step,
  placeholder,
  disabled = false,
  id,
}) {
  const [error, setError] = useState('');

  const runValidation = useCallback(
    (raw, { confirm = false } = {}) => {
      const v = raw === '' || raw == null ? '' : String(raw);
      if (confirm && confirmWarnings) {
        const r = validateFieldWithConfirm(fieldId, v, context);
        if (!r.proceed) {
          setError(r.error || '');
          return false;
        }
        setError('');
        return true;
      }
      const r = validateField(fieldId, v, context);
      if (!r.ok) {
        setError(r.error || 'Invalid value.');
        return false;
      }
      setError('');
      return true;
    },
    [fieldId, context, confirmWarnings],
  );

  const handleChange = (e) => {
    const v = e.target.value;
    if (v !== '' && v !== '-' && Number.isFinite(Number(v)) && Number(v) < 0) {
      setError('Value cannot be negative.');
      return;
    }
    onChange(v);
    if (v === '' || v === '-') {
      setError('');
      return;
    }
    runValidation(v, { confirm: false });
  };

  const handleBlur = () => {
    const v = value === '' || value == null ? '' : String(value);
    if (v === '') {
      setError('');
      return;
    }
    if (runValidation(v, { confirm: confirmWarnings })) {
      onValidatedChange?.(v);
    }
  };

  return (
    <div>
      <input
        id={id}
        type="number"
        className={`${className}${error ? ' input-error' : ''}`}
        value={value === '' || value == null ? '' : value}
        onChange={handleChange}
        onBlur={handleBlur}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error ? (
        <p className="text-xs" style={{ color: 'var(--danger-600)', marginTop: '0.35rem' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { FIELD_IDS };
