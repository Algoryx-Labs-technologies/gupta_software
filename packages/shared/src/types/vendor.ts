export interface Vendor {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
