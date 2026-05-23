/** Map API drive row to client state (dates, counts, staff baseline for dirty check). */
export function mapCollegeDriveFromApi(d) {
  const staffRaw = d.attached_staff_user_ids ?? [];
  const staffIds = Array.isArray(staffRaw) ? staffRaw.map((id) => String(id)) : [];
  return {
    ...d,
    date: d.date ? String(d.date).slice(0, 10) : '',
    registered: Number(d.registered || 0),
    selected: Number(d.selected || 0),
    staffIds,
    staffIdsBaseline: [...staffIds],
    socialShared: Array.isArray(d.social_shared) ? d.social_shared : [],
  };
}

export function isDriveStaffDirty(drive) {
  const base = [...(drive.staffIdsBaseline || [])].sort().join(',');
  const cur = [...(drive.staffIds || [])].sort().join(',');
  return base !== cur;
}
