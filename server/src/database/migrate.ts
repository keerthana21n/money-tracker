import { db } from './db';

const createTables = () => {
  db.serialize(() => {
    // Categories table with hierarchical structure
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        color TEXT DEFAULT '#3B82F6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        description TEXT,
        category_id INTEGER NOT NULL,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_category_parent ON categories(parent_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_category ON transactions(category_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date)`);

    console.log('Database tables created successfully');
    
    // Insert some default categories
    db.run(`
      INSERT OR IGNORE INTO categories (id, name, color) 
      SELECT 1, 'Food & Dining', '#EF4444'
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 1)
    `);
    
    db.run(`
      INSERT OR IGNORE INTO categories (id, name, parent_id, color) 
      SELECT 2, 'Restaurants', 1, '#DC2626'
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 2)
    `);
    
    db.run(`
      INSERT OR IGNORE INTO categories (id, name, parent_id, color) 
      SELECT 3, 'Groceries', 1, '#F87171'
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 3)
    `);
    
    db.run(`
      INSERT OR IGNORE INTO categories (id, name, color) 
      SELECT 4, 'Transportation', '#10B981'
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 4)
    `);
    
    db.run(`
      INSERT OR IGNORE INTO categories (id, name, color) 
      SELECT 5, 'Entertainment', '#8B5CF6'
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 5)
    `, () => {
      console.log('Default categories created');
      db.close();
    });
  });
};

createTables();
