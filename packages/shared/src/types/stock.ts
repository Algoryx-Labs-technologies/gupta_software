export interface Stock {
  _id: string;
  item: string;
  site: string;
  quantity: number;
  specification?: string;
  unit?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StockMatrixItem {
  _id: string;
  name: string;
  category?: string;
  defaultUnit?: string;
}

export interface StockMatrixSite {
  _id: string;
  name: string;
  code: string;
}

export interface StockMatrixCell {
  itemId: string;
  siteId: string;
  specification?: string;
  quantity: number;
  stockId?: string;
}

export interface StockMatrixResponse {
  items: StockMatrixItem[];
  sites: StockMatrixSite[];
  cells: StockMatrixCell[];
}
