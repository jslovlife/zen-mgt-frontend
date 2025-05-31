export interface Site {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  merchantId: string;
  description: string;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
} 