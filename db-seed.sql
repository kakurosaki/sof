-- Sample Data / Seed Data for Inventory Management System

-- Insert Suppliers
INSERT INTO suppliers (name, email, phone)
VALUES
  ('Acme Supplies', 'sales@acme.example', '+1-202-555-0101'),
  ('Northwind Traders', 'hello@northwind.example', '+1-202-555-0102'),
  ('Sunrise Distributors', 'contact@sunrise.example', '+1-202-555-0103')
ON CONFLICT (name) DO NOTHING;

-- Insert Products
INSERT INTO products (sku, name, category, supplier_id, unit_price, unit_cost, stock_on_hand, min_stock_level)
VALUES
  ('SKU-1001', 'Almond Body Lotion', 'Body Care', (SELECT id FROM suppliers WHERE name = 'Acme Supplies'), 12.50, 7.25, 85, 30),
  ('SKU-1002', 'Vitamin C Face Wash', 'Skin Care', (SELECT id FROM suppliers WHERE name = 'Northwind Traders'), 9.99, 5.40, 42, 20),
  ('SKU-1003', 'Herbal Shampoo', 'Hair Care', (SELECT id FROM suppliers WHERE name = 'Sunrise Distributors'), 14.20, 8.90, 18, 25),
  ('SKU-1004', 'Hand Sanitizer', 'Hygiene', (SELECT id FROM suppliers WHERE name = 'Acme Supplies'), 6.75, 3.10, 160, 40),
  ('SKU-1005', 'Paper Towels', 'Household', (SELECT id FROM suppliers WHERE name = 'Northwind Traders'), 4.99, 2.20, 22, 30)
ON CONFLICT (sku) DO NOTHING;

-- Insert Sample Purchase Orders
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

-- Insert User Accounts (with bcrypt hashed passwords)
-- Admin user: admin@example.com / password: admin123
-- Staff user: staff@example.com / password: staff123
INSERT INTO accounts (name, email, phone, password_hash, account_type)
VALUES
  (
    'Admin User',
    'admin@example.com',
    '+1-202-555-1000',
    '$2a$10$N9qo8uLOickgx2ZMRZoHyeIjZAgcg7b3XeKeUxWdeS86E36P4/cKm',
    'admin'
  ),
  (
    'Staff User',
    'staff@example.com',
    '+1-202-555-1001',
    '$2a$10$NRrKt6v3lMPwwFLlM6EHxupU5UXSHi2mR5hKAVWppPZ.3wViXkfta',
    'staff'
  )
ON CONFLICT (email) DO NOTHING;
