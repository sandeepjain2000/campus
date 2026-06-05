'use client';

import { StandardTableIconAction } from '@/components/ui/StandardTableIconAction';

/**
 * Edit / delete controls for an interview schedule slot card.
 */
export default function InterviewSlotActions({ onEdit, onDelete, disabled }) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
      <StandardTableIconAction action="edit" showLabel={false} onClick={onEdit} disabled={disabled} />
      <StandardTableIconAction
        action="delete"
        variant="danger"
        showLabel={false}
        onClick={onDelete}
        disabled={disabled}
      />
    </div>
  );
}
