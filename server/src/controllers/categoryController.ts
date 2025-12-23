import { Request, Response } from 'express';
import { runQuery, getQuery, allQuery } from '../database/db';
import { Category, CategoryWithChildren } from '../types';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await allQuery<Category>('SELECT * FROM categories ORDER BY name');
    
    // Build hierarchical structure
    const categoryMap = new Map<number, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id === null) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(category);
        }
      }
    });

    res.json(rootCategories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await getQuery<Category>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parent_id, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await runQuery(
      'INSERT INTO categories (name, parent_id, color) VALUES (?, ?, ?)',
      [name, parent_id || null, color || '#3B82F6']
    );

    res.status(201).json({ message: 'Category created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parent_id, color } = req.body;

    await runQuery(
      'UPDATE categories SET name = ?, parent_id = ?, color = ? WHERE id = ?',
      [name, parent_id || null, color, id]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await runQuery('DELETE FROM categories WHERE id = ?', [id]);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
