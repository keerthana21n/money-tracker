import { Request, Response } from 'express';
import { runQuery, getQuery, allQuery } from '../database/db';
import { RecurringTransaction, RecurringTransactionWithCategory } from '../types';

export const getAllRecurringTransactions = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT rt.*, c.name as category_name, c.color as category_color
      FROM recurring_transactions rt
      JOIN categories c ON rt.category_id = c.id
      ORDER BY rt.next_due_date ASC
    `;
    
    const recurringTransactions = await allQuery<RecurringTransactionWithCategory>(query, []);
    res.json(recurringTransactions);
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
};

export const getRecurringTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recurringTransaction = await getQuery<RecurringTransactionWithCategory>(
      `
        SELECT rt.*, c.name as category_name, c.color as category_color
        FROM recurring_transactions rt
        JOIN categories c ON rt.category_id = c.id
        WHERE rt.id = ?
      `,
      [id]
    );
    
    if (!recurringTransaction) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    res.json(recurringTransaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recurring transaction' });
  }
};

export const createRecurringTransaction = async (req: Request, res: Response) => {
  try {
    const { 
      amount, 
      description, 
      category_id, 
      payment_method, 
      frequency, 
      start_date,
      end_date 
    } = req.body;
    
    if (!amount || !category_id || !frequency || !start_date) {
      return res.status(400).json({ 
        error: 'Amount, category_id, frequency, and start_date are required' 
      });
    }

    const next_due_date = start_date;

    await runQuery(
      `INSERT INTO recurring_transactions 
       (amount, description, category_id, payment_method, frequency, start_date, end_date, next_due_date, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [amount, description || '', category_id, payment_method || 'Savings Bank', frequency, start_date, end_date || null, next_due_date]
    );

    res.status(201).json({ message: 'Recurring transaction created successfully' });
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
};

export const updateRecurringTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      description, 
      category_id, 
      payment_method, 
      frequency, 
      start_date,
      end_date,
      is_active
    } = req.body;

    await runQuery(
      `UPDATE recurring_transactions 
       SET amount = ?, description = ?, category_id = ?, payment_method = ?, 
           frequency = ?, start_date = ?, end_date = ?, is_active = ?
       WHERE id = ?`,
      [amount, description, category_id, payment_method, frequency, start_date, end_date || null, is_active ? 1 : 0, id]
    );

    res.json({ message: 'Recurring transaction updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
};

export const deleteRecurringTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await runQuery('DELETE FROM recurring_transactions WHERE id = ?', [id]);
    
    res.json({ message: 'Recurring transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
};

export const processRecurringTransactions = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all active recurring transactions that are due
    const dueTransactions = await allQuery<RecurringTransaction>(
      `SELECT * FROM recurring_transactions 
       WHERE is_active = 1 
       AND next_due_date <= ?
       AND (end_date IS NULL OR end_date >= ?)`,
      [today, today]
    );

    let processedCount = 0;

    for (const rt of dueTransactions) {
      // Create the transaction
      await runQuery(
        'INSERT INTO transactions (amount, description, category_id, date, payment_method) VALUES (?, ?, ?, ?, ?)',
        [rt.amount, rt.description, rt.category_id, rt.next_due_date, rt.payment_method]
      );

      // Calculate next due date
      const nextDate = new Date(rt.next_due_date);
      
      switch (rt.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      const newNextDueDate = nextDate.toISOString().split('T')[0];

      // Update next due date or deactivate if past end date
      if (rt.end_date && newNextDueDate > rt.end_date) {
        await runQuery(
          'UPDATE recurring_transactions SET is_active = 0 WHERE id = ?',
          [rt.id]
        );
      } else {
        await runQuery(
          'UPDATE recurring_transactions SET next_due_date = ? WHERE id = ?',
          [newNextDueDate, rt.id]
        );
      }

      processedCount++;
    }

    res.json({ 
      message: `Processed ${processedCount} recurring transactions`,
      count: processedCount 
    });
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    res.status(500).json({ error: 'Failed to process recurring transactions' });
  }
};
