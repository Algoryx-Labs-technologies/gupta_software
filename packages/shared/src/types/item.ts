export interface Item {
  _id: string;
  name: string;
  category?: string;
  specification?: string;
  defaultUnit?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
