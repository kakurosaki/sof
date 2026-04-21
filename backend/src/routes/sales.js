import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/orders", async (req, res) => {
  const rawLimit = Number.parseInt(req.query.limit || "20", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

  try {
    const result = await pool.query(
      `
      SELECT
        so.id,
        so.subtotal,
        so.total,
        so.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', soi.product_id,
              'name', p.name,
              'quantity', soi.quantity,
              'unit_price', soi.unit_price,
              'line_total', soi.line_total
            )
            ORDER BY p.name ASC
          ) FILTER (WHERE soi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM sales_orders so
      LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
      LEFT JOIN products p ON p.id = soi.product_id
      GROUP BY so.id
      ORDER BY so.created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    res.json({ count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch completed orders" });
  }
});

router.get("/products", async (req, res) => {
  const search = req.query.search?.trim() || "";
  const category = req.query.category?.trim() || "";

  const where = ["p.is_active = true", "p.stock_on_hand > 0"];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    where.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
  }

  if (category) {
    values.push(category);
    where.push(`p.category = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.description,
        p.category,
        p.unit_price,
        p.stock_on_hand
      FROM products p
      WHERE ${where.join(" AND ")}
      ORDER BY p.name ASC
      `,
      values
    );

    res.json({ count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sales products" });
  }
});

router.post("/checkout", async (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }

  const normalizedItems = items
    .map((item) => ({
      product_id: Number.parseInt(item?.product_id, 10),
      quantity: Number.parseInt(item?.quantity, 10),
    }))
    .filter((item) => Number.isFinite(item.product_id) && Number.isFinite(item.quantity) && item.quantity > 0);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: "items must contain valid product_id and positive quantity" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const merged = new Map();
    for (const item of normalizedItems) {
      merged.set(item.product_id, (merged.get(item.product_id) || 0) + item.quantity);
    }

    const productIds = Array.from(merged.keys());

    const productsResult = await client.query(
      `
      SELECT id, name, unit_price, stock_on_hand
      FROM products
      WHERE id = ANY($1::int[])
        AND is_active = true
      FOR UPDATE
      `,
      [productIds]
    );

    const productMap = new Map(productsResult.rows.map((row) => [Number(row.id), row]));

    for (const [productId, qty] of merged.entries()) {
      const product = productMap.get(Number(productId));
      if (!product) {
        throw new Error(`Product ${productId} is no longer available`);
      }
      if (Number(product.stock_on_hand) < qty) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    let subtotal = 0;
    const lineItems = [];

    for (const [productId, qty] of merged.entries()) {
      const product = productMap.get(Number(productId));
      const unitPrice = Number(product.unit_price);
      const stockBefore = Number(product.stock_on_hand);
      const stockAfter = stockBefore - qty;
      const lineTotal = Number((unitPrice * qty).toFixed(2));
      subtotal += lineTotal;
      lineItems.push({ productId, qty, unitPrice, lineTotal, name: product.name, stockBefore, stockAfter });

      await client.query(
        `
        UPDATE products
        SET stock_on_hand = stock_on_hand - $2,
            updated_at = now()
        WHERE id = $1
        `,
        [productId, qty]
      );
    }

    subtotal = Number(subtotal.toFixed(2));

    const orderResult = await client.query(
      `
      INSERT INTO sales_orders (subtotal, total)
      VALUES ($1, $1)
      RETURNING id, subtotal, total, created_at
      `,
      [subtotal]
    );

    const order = orderResult.rows[0];

    for (const line of lineItems) {
      await client.query(
        `
        INSERT INTO inventory_movements
          (product_id, source_type, source_id, quantity_change, stock_before, stock_after)
        VALUES ($1, 'sale', $2, $3, $4, $5)
        `,
        [line.productId, order.id, -line.qty, line.stockBefore, line.stockAfter]
      );
    }

    for (const line of lineItems) {
      await client.query(
        `
        INSERT INTO sales_order_items
          (sales_order_id, product_id, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [order.id, line.productId, line.qty, line.unitPrice, line.lineTotal]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      order,
      items: lineItems.map((line) => ({
        product_id: line.productId,
        name: line.name,
        quantity: line.qty,
        unit_price: line.unitPrice,
        line_total: line.lineTotal,
        stock_before: line.stockBefore,
        stock_after: line.stockAfter,
      })),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message || "Failed to checkout" });
  } finally {
    client.release();
  }
});

export default router;
