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
        payment_method TEXT DEFAULT 'Savings Bank',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Add payment_method column if it doesn't exist (for existing databases)
    db.run(`
      ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'Savings Bank'
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding payment_method column:', err);
      }
    });

    // Recurring transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        description TEXT,
        category_id INTEGER NOT NULL,
        payment_method TEXT DEFAULT 'Savings Bank',
        frequency TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        next_due_date DATE NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_category_parent ON categories(parent_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_category ON transactions(category_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(is_active)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_recurring_due ON recurring_transactions(next_due_date)`);

    console.log('Database tables created successfully');

      db.close();
    });
};

createTables();
