export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  color: string;
  created_at: string;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  date: string;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_color: string;
}

export interface TrendData {
  date: string;
  amount: number;
}

export interface CategoryTrend {
  category_id: number;
  category_name: string;
  total_amount: number;
  trends: TrendData[];
}
