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
    
    let query = `
      SELECT 
        c.id,
        c.name,
        c.color,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ' AND (t.date >= ? OR t.date IS NULL)';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND (t.date <= ? OR t.date IS NULL)';
      params.push(end_date);
    }

    query += ' GROUP BY c.id, c.name, c.color ORDER BY total_amount DESC';

    const summary = await allQuery<any>(query, params);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch spending summary' });
  }
};
