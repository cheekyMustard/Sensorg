export const NOTE_CATEGORIES = [
  { value: 'need_stuff',   label: 'Need stuff',   icon: '📦', bg: '#FEF3C7', color: '#92400E' },
  { value: 'information',  label: 'Information',  icon: 'ℹ️',  bg: '#DBEAFE', color: '#1E40AF' },
  { value: 'other',        label: 'Other',        icon: '💬', bg: '#F3F4F6', color: '#374151' },
];

export function categoryMeta(value) {
  return NOTE_CATEGORIES.find(c => c.value === value) ?? null;
}
