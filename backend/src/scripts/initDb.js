import { pool } from "../db.js";
import bcrypt from "bcryptjs";

const schemaSql = `
DROP TABLE IF EXISTS accounts CASCADE;

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  stock_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
  min_stock_level INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products (supplier_id);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'staff' CHECK (account_type IN ('staff', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts (account_type);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('sale', 'purchase_order')),
  source_id INTEGER,
  quantity_change INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_source ON inventory_movements (source_type, source_id);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expected_delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'denied')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_product ON purchase_orders (product_id);

CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id SERIAL PRIMARY KEY,
  sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items (sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product ON sales_order_items (product_id);
`;

const migrationSql = `
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id INTEGER,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_on_hand INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock_level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_id INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS sales_order_id INTEGER,
  ADD COLUMN IF NOT EXISTS product_id INTEGER,
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS product_id INTEGER,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_id INTEGER,
  ADD COLUMN IF NOT EXISTS quantity_change INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_before INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_after INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
`;

const seedSql = `
INSERT INTO suppliers (name, email, phone)
VALUES
  ('Acme Supplies', 'sales@acme.example', '+1-202-555-0101'),
  ('Northwind Traders', 'hello@northwind.example', '+1-202-555-0102'),
  ('Sunrise Distributors', 'contact@sunrise.example', '+1-202-555-0103')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (sku, name, category, supplier_id, unit_price, unit_cost, stock_on_hand, min_stock_level)
VALUES
  ('SKU-1001', 'Almond Body Lotion', 'Body Care', (SELECT id FROM suppliers WHERE name = 'Acme Supplies'), 12.50, 7.25, 85, 30),
  ('SKU-1002', 'Vitamin C Face Wash', 'Skin Care', (SELECT id FROM suppliers WHERE name = 'Northwind Traders'), 9.99, 5.40, 42, 20),
  ('SKU-1003', 'Herbal Shampoo', 'Hair Care', (SELECT id FROM suppliers WHERE name = 'Sunrise Distributors'), 14.20, 8.90, 18, 25),
  ('SKU-1004', 'Hand Sanitizer', 'Hygiene', (SELECT id FROM suppliers WHERE name = 'Acme Supplies'), 6.75, 3.10, 160, 40),
  ('SKU-1005', 'Paper Towels', 'Household', (SELECT id FROM suppliers WHERE name = 'Northwind Traders'), 4.99, 2.20, 22, 30)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO purchase_orders (product_id, supplier_id, quantity, expected_delivery_date, status, notes)
SELECT p.id, p.supplier_id, 200, CURRENT_DATE + INTERVAL '7 day', 'open', 'Auto-seeded replenishment order'
FROM products p
WHERE p.sku = 'SKU-1003'
  AND NOT EXISTS (
    SELECT 1 FROM purchase_orders po
    WHERE po.product_id = p.id
      AND po.status = 'open'
  );

INSERT INTO purchase_orders (product_id, supplier_id, quantity, expected_delivery_date, status, notes)
SELECT p.id, p.supplier_id, 300, CURRENT_DATE + INTERVAL '10 day', 'open', 'Auto-seeded replenishment order'
FROM products p
WHERE p.sku = 'SKU-1005'
  AND NOT EXISTS (
    SELECT 1 FROM purchase_orders po
    WHERE po.product_id = p.id
      AND po.status = 'open'
  );
`;

async function seedAccounts(client) {
  const adminHash = await bcrypt.hash("admin123", 10);
  const staffHash = await bcrypt.hash("staff123", 10);
  
  await client.query(
    `
    INSERT INTO accounts (name, email, phone, password_hash, account_type)
    VALUES
      ('Admin User', 'admin@example.com', '+1-202-555-0200', $1, 'admin'),
      ('Staff User', 'staff@example.com', '+1-202-555-0201', $2, 'staff')
    ON CONFLICT (email) DO NOTHING
    `,
    [adminHash, staffHash]
  );
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query(migrationSql);
    await client.query(seedSql);
    await seedAccounts(client);
    await client.query("COMMIT");
    console.log("Database initialized and seeded successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to initialize database:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
