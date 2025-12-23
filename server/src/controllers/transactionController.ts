import { Request, Response } from 'express';
import { runQuery, getQuery, allQuery } from '../database/db';
import { Transaction, TransactionWithCategory } from '../types';

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, category_id } = req.query;
    
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color
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

    if (category_id) {
      query += ' AND t.category_id = ?';
      params.push(category_id);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const transactions = await allQuery<TransactionWithCategory>(query, params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await getQuery<TransactionWithCategory>(
      `
        SELECT t.*, c.name as category_name, c.color as category_color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `,
      [id]
    );
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, description, category_id, date } = req.body;
    
    if (!amount || !category_id || !date) {
      return res.status(400).json({ error: 'Amount, category_id, and date are required' });
    }

    await runQuery(
      'INSERT INTO transactions (amount, description, category_id, date) VALUES (?, ?, ?, ?)',
      [amount, description || '', category_id, date]
    );

    res.status(201).json({ message: 'Transaction created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, description, category_id, date } = req.body;

    await runQuery(
      'UPDATE transactions SET amount = ?, description = ?, category_id = ?, date = ? WHERE id = ?',
      [amount, description, category_id, date, id]
    );

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await runQuery('DELETE FROM transactions WHERE id = ?', [id]);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};
