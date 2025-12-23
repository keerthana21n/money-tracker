import { Request, Response } from 'express';
import { allQuery } from '../database/db';
import { TrendData, CategoryTrend } from '../types';

export const getCategoryTrends = async (req: Request, res: Response) => {
  try {
    const { category_id, period = 'month', start_date, end_date } = req.query;
    
    let dateFormat = '%Y-%m'; // Monthly by default
    if (period === 'day') {
      dateFormat = '%Y-%m-%d';
    } else if (period === 'year') {
      dateFormat = '%Y';
    }

    let query = `
      SELECT 
        strftime('${dateFormat}', date) as date,
        SUM(amount) as amount
      FROM transactions
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }

    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }

    query += ` GROUP BY strftime('${dateFormat}', date) ORDER BY date`;

    const trends = await allQuery<TrendData>(query, params);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
};

export const getAllCategoriesTrends = async (req: Request, res: Response) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;
    
    let dateFormat = '%Y-%m';
    if (period === 'day') {
      dateFormat = '%Y-%m-%d';
    } else if (period === 'year') {
      dateFormat = '%Y';
    }

    let query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        strftime('${dateFormat}', t.date) as date,
        SUM(t.amount) as amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND t.date <= ?';
      params.push(end_date);
    }

    query += ` GROUP BY c.id, c.name, strftime('${dateFormat}', t.date) ORDER BY c.name, date`;

    const results = await allQuery<any>(query, params);
    
    // Group by category
    const categoryMap = new Map<number, CategoryTrend>();
    
    results.forEach(row => {
      if (!categoryMap.has(row.category_id)) {
        categoryMap.set(row.category_id, {
          category_id: row.category_id,
          category_name: row.category_name,
          total_amount: 0,
          trends: []
        });
      }
      
      const categoryTrend = categoryMap.get(row.category_id)!;
      categoryTrend.total_amount += row.amount;
      categoryTrend.trends.push({
        date: row.date,
        amount: row.amount
      });
    });

    res.json(Array.from(categoryMap.values()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category trends' });
  }
};

export const getCategorySpendingSummary = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    // First, get all categories to build hierarchy
    const allCategories = await allQuery<any>('SELECT id, name, color, parent_id FROM categories');

    // Build a map to find top-level parents
    const categoryMap = new Map<number, any>();
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, cat);
    });

    // Function to find the top-level parent of a category
    const findTopLevelParent = (categoryId: number): any => {
      const category = categoryMap.get(categoryId);
      if (!category) return null;

      if (category.parent_id === null) {
        return category; // This is a top-level category
      }

      // Recursively find the top-level parent
      return findTopLevelParent(category.parent_id);
    };

    // Get all transactions with their categories
    let query = `
      SELECT
        t.amount,
        t.category_id
      FROM transactions t
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND t.date <= ?';
      params.push(end_date);
    }

    const transactions = await allQuery<any>(query, params);

    // Aggregate transactions by top-level category
    const topLevelSummary = new Map<number, any>();

    transactions.forEach(transaction => {
      const topLevelCategory = findTopLevelParent(transaction.category_id);

      if (topLevelCategory) {
        if (!topLevelSummary.has(topLevelCategory.id)) {
          topLevelSummary.set(topLevelCategory.id, {
            id: topLevelCategory.id,
            name: topLevelCategory.name,
            color: topLevelCategory.color,
            total_amount: 0,
            transaction_count: 0
          });
        }

        const summary = topLevelSummary.get(topLevelCategory.id);
        summary.total_amount += transaction.amount;
        summary.transaction_count += 1;
      }
    });

    // Add top-level categories with no transactions
    allCategories.forEach(cat => {
      if (cat.parent_id === null && !topLevelSummary.has(cat.id)) {
        topLevelSummary.set(cat.id, {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          total_amount: 0,
          transaction_count: 0
        });
      }
    });

    const summary = Array.from(topLevelSummary.values())
      .sort((a, b) => b.total_amount - a.total_amount);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching spending summary:', error);
    res.status(500).json({ error: 'Failed to fetch spending summary' });
  }
};
