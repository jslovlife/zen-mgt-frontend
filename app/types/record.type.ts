// Global RecordStatus that can be used across multiple entities
export const RecordStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
  PENDING_CREATE_APPROVAL: 2,
  PENDING_AMENDMENT_APPROVAL: 3,
  PENDING_DELETE_APPROVAL: 4,
  DELETED: 5
} as const;

export type RecordStatusType = typeof RecordStatus[keyof typeof RecordStatus];

// Status labels for display
export const RecordStatusLabels = {
  [RecordStatus.INACTIVE]: 'Inactive',
  [RecordStatus.ACTIVE]: 'Active',
  [RecordStatus.PENDING_CREATE_APPROVAL]: 'Pending Create Approval',
  [RecordStatus.PENDING_AMENDMENT_APPROVAL]: 'Pending Amendment Approval',
  [RecordStatus.PENDING_DELETE_APPROVAL]: 'Pending Delete Approval',
  [RecordStatus.DELETED]: 'Deleted'
} as const;

// Helper function to get status label
export const getRecordStatusLabel = (status: number): string => {
  return RecordStatusLabels[status as RecordStatusType] || 'Unknown';
};

// Filter options for dropdowns
export const RecordStatusFilterOptions = [
  { label: 'Active', value: RecordStatus.ACTIVE },
  { label: 'Inactive', value: RecordStatus.INACTIVE },
  { label: 'Pending Create Approval', value: RecordStatus.PENDING_CREATE_APPROVAL },
  { label: 'Pending Amendment Approval', value: RecordStatus.PENDING_AMENDMENT_APPROVAL },
  { label: 'Pending Delete Approval', value: RecordStatus.PENDING_DELETE_APPROVAL },
  { label: 'Deleted', value: RecordStatus.DELETED }
]; 