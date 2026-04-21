# Database Schema Reference

## Tables Overview

### 1. **suppliers**

Storage for product suppliers.

- `id` (SERIAL, Primary Key)
- `name` (TEXT, NOT NULL, UNIQUE)
- `email` (TEXT)
- `phone` (TEXT)
- `is_active` (BOOLEAN, default: true)
- `created_at` (TIMESTAMPTZ, default: now())
- `updated_at` (TIMESTAMPTZ, default: now())

### 2. **products**

Inventory product catalog.

- `id` (SERIAL, Primary Key)
- `sku` (TEXT, NOT NULL, UNIQUE) - Stock Keeping Unit
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `category` (TEXT)
- `supplier_id` (INTEGER, FK → suppliers) - Can be NULL
- `unit_price` (NUMERIC(12,2), default: 0) - Selling price
- `unit_cost` (NUMERIC(12,2), default: 0) - Cost price
- `stock_on_hand` (INTEGER, default: 0, ≥ 0)
- `min_stock_level` (INTEGER, default: 0, ≥ 0) - Reorder threshold
- `is_active` (BOOLEAN, default: true)
- `created_at` (TIMESTAMPTZ, default: now())
- `updated_at` (TIMESTAMPTZ, default: now())

**Indexes:**

- `idx_products_active` on (is_active)
- `idx_products_category` on (category)
- `idx_products_supplier` on (supplier_id)

### 3. **accounts**

User accounts with authentication.

- `id` (SERIAL, Primary Key)
- `name` (TEXT, NOT NULL, UNIQUE)
- `email` (TEXT, UNIQUE, NOT NULL)
- `phone` (TEXT)
- `password_hash` (TEXT, NOT NULL) - bcrypt hashed password
- `account_type` (TEXT, NOT NULL, default: 'staff') - Allowed: 'staff', 'admin'
- `is_active` (BOOLEAN, default: true)
- `created_at` (TIMESTAMPTZ, default: now())
- `updated_at` (TIMESTAMPTZ, default: now())

**Indexes:**

- `idx_accounts_type` on (account_type)

**Account Types:**

- `admin` - Full system access
- `staff` - Limited access (read-only on inventory/suppliers, no access to purchase orders/accounts)

### 4. **inventory_movements**

Audit trail of all inventory changes.

- `id` (SERIAL, Primary Key)
- `product_id` (INTEGER, NOT NULL, FK → products) - Cascades on delete
- `source_type` (TEXT, NOT NULL) - Allowed: 'sale', 'purchase_order'
- `source_id` (INTEGER) - Reference to sales_order_id or purchase_order_id
- `quantity_change` (INTEGER, NOT NULL) - Positive or negative
- `stock_before` (INTEGER, NOT NULL) - Stock level before change
- `stock_after` (INTEGER, NOT NULL) - Stock level after change
- `created_at` (TIMESTAMPTZ, default: now())

**Indexes:**

- `idx_inventory_movements_product` on (product_id)
- `idx_inventory_movements_source` on (source_type, source_id)

### 5. **purchase_orders**

Orders placed with suppliers for restocking.

- `id` (SERIAL, Primary Key)
- `product_id` (INTEGER, NOT NULL, FK → products) - Cascades on delete
- `supplier_id` (INTEGER, FK → suppliers) - Can be NULL
- `quantity` (INTEGER, NOT NULL, > 0)
- `expected_delivery_date` (DATE, NOT NULL)
- `status` (TEXT, NOT NULL, default: 'open') - Allowed: 'open', 'claimed', 'denied'
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, default: now())
- `updated_at` (TIMESTAMPTZ, default: now())

**Indexes:**

- `idx_purchase_orders_status` on (status)
- `idx_purchase_orders_product` on (product_id)

**Purchase Order Statuses:**

- `open` - Awaiting action
- `claimed` - Acknowledged/in progress
- `denied` - Rejected

### 6. **sales_orders**

Customer sales transactions (checkout orders).

- `id` (SERIAL, Primary Key)
- `subtotal` (NUMERIC(12,2), default: 0)
- `total` (NUMERIC(12,2), default: 0)
- `created_at` (TIMESTAMPTZ, default: now())

### 7. **sales_order_items**

Individual line items in a sales order.

- `id` (SERIAL, Primary Key)
- `sales_order_id` (INTEGER, NOT NULL, FK → sales_orders) - Cascades on delete
- `product_id` (INTEGER, NOT NULL, FK → products) - Restricts delete if items exist
- `quantity` (INTEGER, NOT NULL, > 0)
- `unit_price` (NUMERIC(12,2), NOT NULL, ≥ 0) - Price at time of sale
- `line_total` (NUMERIC(12,2), NOT NULL, ≥ 0) - quantity × unit_price

**Indexes:**

- `idx_sales_order_items_order` on (sales_order_id)
- `idx_sales_order_items_product` on (product_id)

---

## Key Constraints

| Constraint  | Table                            | Details                                                               |
| ----------- | -------------------------------- | --------------------------------------------------------------------- |
| CHECK       | products                         | unit_price ≥ 0, unit_cost ≥ 0, stock_on_hand ≥ 0, min_stock_level ≥ 0 |
| CHECK       | purchase_orders                  | quantity > 0, status IN ('open', 'claimed', 'denied')                 |
| CHECK       | sales_order_items                | quantity > 0, unit_price ≥ 0, line_total ≥ 0                          |
| CHECK       | inventory_movements              | source_type IN ('sale', 'purchase_order')                             |
| CHECK       | accounts                         | account_type IN ('staff', 'admin')                                    |
| UNIQUE      | suppliers                        | name                                                                  |
| UNIQUE      | products                         | sku                                                                   |
| UNIQUE      | accounts                         | name, email                                                           |
| FK CASCADE  | products → suppliers             | ON DELETE SET NULL                                                    |
| FK CASCADE  | inventory_movements → products   | ON DELETE CASCADE                                                     |
| FK CASCADE  | purchase_orders → products       | ON DELETE CASCADE                                                     |
| FK CASCADE  | sales_order_items → sales_orders | ON DELETE CASCADE                                                     |
| FK RESTRICT | sales_order_items → products     | ON DELETE RESTRICT                                                    |

---

## Default Test Users

### Admin Account

- **Email:** admin@example.com
- **Password:** admin123
- **Role:** Admin (full access)

### Staff Account

- **Email:** staff@example.com
- **Password:** staff123
- **Role:** Staff (limited access)

_Note: Passwords are hashed with bcryptjs (10 rounds) in production._

---

## Usage Notes

1. **Inventory Updates:** Always log changes in `inventory_movements` table for audit trail
2. **Stock Management:** `min_stock_level` triggers alerts for reordering
3. **Purchase Orders:** Manual orders can be created with status='open'
4. **Sales Orders:** Generated when checkout completes; automatically updates inventory
5. **Role-Based Access:** Routes check account_type to enforce permissions

---

Generated: April 2026
Database Type: PostgreSQL
