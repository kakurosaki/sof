import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/low-stock", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.stock_on_hand,
        p.min_stock_level,
        p.supplier_id,
        s.name AS supplier_name
      FROM products p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.is_active = true
        AND p.stock_on_hand <= p.min_stock_level
      ORDER BY (p.min_stock_level - p.stock_on_hand) DESC, p.name ASC
      `,
    );

    res.json({ count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
});

router.get("/incoming", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        po.id,
        po.product_id,
        po.supplier_id,
        po.quantity,
        po.expected_delivery_date,
        po.status,
        po.notes,
        po.created_at,
        p.sku,
        p.name AS product_name,
        s.name AS supplier_name
      FROM purchase_orders po
      JOIN products p ON p.id = po.product_id
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.status = 'open'
      ORDER BY po.expected_delivery_date ASC, po.id DESC
      `,
    );

    res.json({ count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch incoming orders" });
  }
});

router.post("/", async (req, res) => {
  const {
    product_id,
    supplier_id = null,
    quantity,
    expected_delivery_date,
    notes = null,
  } = req.body || {};

  const productId = Number.parseInt(product_id, 10);
  const supplierId =
    supplier_id === null ? null : Number.parseInt(supplier_id, 10);
  const qty = Number.parseInt(quantity, 10);

  if (
    !Number.isFinite(productId) ||
    !Number.isFinite(qty) ||
    qty <= 0 ||
    !expected_delivery_date
  ) {
    return res.status(400).json({
      error:
        "product_id, positive quantity, and expected_delivery_date are required",
    });
  }

  if (
    supplier_id !== null &&
    supplier_id !== undefined &&
    !Number.isFinite(supplierId)
  ) {
    return res
      .status(400)
      .json({ error: "supplier_id must be a number or null" });
  }

  try {
    let resolvedSupplierId = Number.isFinite(supplierId) ? supplierId : null;

    if (resolvedSupplierId === null) {
      const productResult = await pool.query(
        `
        SELECT id, supplier_id
        FROM products
        WHERE id = $1
          AND is_active = true
        `,
        [productId],
      );

      const product = productResult.rows[0];
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      resolvedSupplierId = product.supplier_id ?? null;
    }

    const result = await pool.query(
      `
      INSERT INTO purchase_orders
        (product_id, supplier_id, quantity, expected_delivery_date, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, product_id, supplier_id, quantity, expected_delivery_date, status, notes, created_at, updated_at
      `,
      [productId, resolvedSupplierId, qty, expected_delivery_date, notes],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create purchase order" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid id" });

  const { quantity, expected_delivery_date, notes } = req.body || {};

  const qty =
    quantity === undefined ? undefined : Number.parseInt(quantity, 10);
  if (quantity !== undefined && (!Number.isFinite(qty) || qty <= 0)) {
    return res
      .status(400)
      .json({ error: "quantity must be a positive number" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE purchase_orders
      SET
        quantity = COALESCE($2, quantity),
        expected_delivery_date = COALESCE($3, expected_delivery_date),
        notes = COALESCE($4, notes),
        updated_at = now()
      WHERE id = $1
        AND status = 'open'
      RETURNING id, product_id, supplier_id, quantity, expected_delivery_date, status, notes, created_at, updated_at
      `,
      [id, qty, expected_delivery_date, notes],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Open purchase order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update purchase order" });
  }
});

router.put("/:id/claim", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid id" });

  const { units_received } = req.body || {};
  let unitsToAdd =
    units_received !== undefined
      ? Number.parseInt(units_received, 10)
      : undefined;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `
      SELECT id, product_id, quantity, supplier_id, status
      FROM purchase_orders
      WHERE id = $1
      FOR UPDATE
      `,
      [id],
    );

    const po = poResult.rows[0];
    if (!po) throw new Error("Purchase order not found");
    if (po.status !== "open")
      throw new Error("Only open purchase orders can be claimed");

    // Use provided units_received or default to order quantity
    if (!Number.isFinite(unitsToAdd)) {
      unitsToAdd = Number(po.quantity);
    }

    if (unitsToAdd <= 0) {
      throw new Error("Units received must be greater than 0");
    }

    await client.query(
      `
      UPDATE products
      SET stock_on_hand = stock_on_hand + $2,
          updated_at = now()
      WHERE id = $1
      `,
      [po.product_id, unitsToAdd],
    );

    const productResult = await client.query(
      `
      SELECT stock_on_hand
      FROM products
      WHERE id = $1
      `,
      [po.product_id],
    );

    const stockAfter = Number(productResult.rows[0]?.stock_on_hand || 0);
    const stockBefore = stockAfter - unitsToAdd;

    await client.query(
      `
      INSERT INTO inventory_movements
        (product_id, source_type, source_id, quantity_change, stock_before, stock_after)
      VALUES ($1, 'purchase_order', $2, $3, $4, $5)
      `,
      [po.product_id, id, unitsToAdd, stockBefore, stockAfter],
    );

    // Calculate discrepancy
    const discrepancy = unitsToAdd - Number(po.quantity);

    // Log the order claim
    await client.query(
      `
      INSERT INTO order_logs
        (purchase_order_id, product_id, supplier_id, order_action, order_quantity, received_quantity, discrepancy)
      VALUES ($1, $2, $3, 'claimed', $4, $5, $6)
      `,
      [id, po.product_id, po.supplier_id, po.quantity, unitsToAdd, discrepancy],
    );

    await client.query(
      `
      UPDATE purchase_orders
      SET status = 'claimed', updated_at = now()
      WHERE id = $1
      `,
      [id],
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message || "Failed to claim order" });
  } finally {
    client.release();
  }
});

router.put("/:id/deny", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid id" });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT id, product_id, quantity, supplier_id, status
      FROM purchase_orders
      WHERE id = $1
        AND status = 'open'
      FOR UPDATE
      `,
      [id],
    );

    const po = result.rows[0];
    if (!po) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Open purchase order not found" });
    }

    // Log the order denial
    await client.query(
      `
      INSERT INTO order_logs
        (purchase_order_id, product_id, supplier_id, order_action, order_quantity, received_quantity, discrepancy)
      VALUES ($1, $2, $3, 'denied', $4, $5, $6)
      `,
      [id, po.product_id, po.supplier_id, po.quantity, 0, -po.quantity],
    );

    await client.query(
      `
      UPDATE purchase_orders
      SET status = 'denied', updated_at = now()
      WHERE id = $1
      `,
      [id],
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to deny order" });
  } finally {
    client.release();
  }
});

router.get("/logs/all", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ol.id,
        ol.purchase_order_id,
        ol.product_id,
        ol.supplier_id,
        ol.order_action,
        ol.order_quantity,
        ol.received_quantity,
        ol.discrepancy,
        ol.notes,
        ol.created_at,
        p.sku,
        p.name AS product_name,
        s.name AS supplier_name
      FROM order_logs ol
      JOIN products p ON p.id = ol.product_id
      LEFT JOIN suppliers s ON s.id = ol.supplier_id
      ORDER BY ol.created_at DESC
      `,
    );

    res.json({ count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order logs" });
  }
});

export default router;
