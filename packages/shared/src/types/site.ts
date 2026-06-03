export interface Site {
  _id: string;
  name: string;
  code: string;
  location?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
