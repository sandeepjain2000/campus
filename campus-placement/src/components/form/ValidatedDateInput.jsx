'use client';

import { useCallback, useState } from 'react';
import { validateField, validateFieldWithConfirm } from '@/lib/inputConstraints';

/**
 * Date input with shared constraints.
 */
export default function ValidatedDateInput({
  fieldId,
  value,
  onChange,
  onValidatedChange,
  context = {},
  className = 'form-input',
  confirmWarnings = true,
  disabled = false,
  id,
}) {
  const [error, setError] = useState('');

  const runValidation = useCallback(
    (raw, { confirm = false } = {}) => {
      const v = raw || '';
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
        setError(r.error || 'Invalid date.');
        return false;
      }
      setError('');
      return true;
    },
    [fieldId, context, confirmWarnings],
  );

  return (
    <div>
      <input
        id={id}
        type="date"
        className={`${className}${error ? ' input-error' : ''}`}
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value);
          setError('');
        }}
        onBlur={() => {
          if (runValidation(value, { confirm: confirmWarnings })) {
            onValidatedChange?.(value);
          }
        }}
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
