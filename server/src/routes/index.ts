import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController';
import {
  getCategoryTrends,
  getAllCategoriesTrends,
  getCategorySpendingSummary
} from '../controllers/trendsController';
import {
  getAllRecurringTransactions,
  getRecurringTransactionById,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactions
} from '../controllers/recurringTransactionController';

const router = Router();

// Category routes
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Transaction routes
router.get('/transactions', getAllTransactions);
router.get('/transactions/:id', getTransactionById);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

// Recurring transaction routes
router.get('/recurring-transactions', getAllRecurringTransactions);
router.get('/recurring-transactions/:id', getRecurringTransactionById);
router.post('/recurring-transactions', createRecurringTransaction);
router.put('/recurring-transactions/:id', updateRecurringTransaction);
router.delete('/recurring-transactions/:id', deleteRecurringTransaction);
router.post('/recurring-transactions/process', processRecurringTransactions);

// Trends routes
router.get('/trends/category', getCategoryTrends);
router.get('/trends/all-categories', getAllCategoriesTrends);
router.get('/trends/summary', getCategorySpendingSummary);

export default router;
