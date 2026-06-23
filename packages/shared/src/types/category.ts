export interface Category {
  _id: string;
  serialNo: number;
  code: string;
  name: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
