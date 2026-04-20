import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const search = req.query.search?.trim() || "";
  const category = req.query.category?.trim() || "";
  const active = req.query.active === "false" ? false : true;

  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
  const offset = (page - 1) * limit;

  const where = [];
  const values = [];

  // is_active
  values.push(active);
  where.push(`p.is_active = $${values.length}`);

  if (search) {
    values.push(`%${search}%`);
    where.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
  }

  if (category) {
    values.push(category);
    where.push(`p.category = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `
      SELECT
        p.id, p.sku, p.name, p.description, p.category,
        p.unit_price, p.unit_cost,
        p.stock_on_hand, p.min_stock_level,
        p.is_active, p.created_at, p.updated_at,
        s.id AS supplier_id, s.name AS supplier_name
      FROM products p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      values
    );

    res.json({
      page,
      limit,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await pool.query(
      `
      SELECT
        p.*,
        s.name AS supplier_name
      FROM products p
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.id = $1
      `,
      [id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  const {
    sku,
    name,
    description = null,
    category = null,
    supplier_id = null,
    unit_price = 0,
    unit_cost = 0,
    stock_on_hand = 0,
    min_stock_level = 0,
  } = req.body || {};

  if (!sku || !name) return res.status(400).json({ error: "sku and name are required" });

  try {
    const result = await pool.query(
      `
      INSERT INTO products
        (sku, name, description, category, supplier_id, unit_price, unit_cost, stock_on_hand, min_stock_level)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [sku, name, description, category, supplier_id, unit_price, unit_cost, stock_on_hand, min_stock_level]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "SKU already exists" });
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT /api/products/:id
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const {
    sku,
    name,
    description,
    category,
    supplier_id,
    unit_price,
    unit_cost,
    stock_on_hand,
    min_stock_level,
    is_active,
  } = req.body || {};

  try {
    const result = await pool.query(
      `
      UPDATE products
      SET
        sku = COALESCE($2, sku),
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        category = COALESCE($5, category),
        supplier_id = COALESCE($6, supplier_id),
        unit_price = COALESCE($7, unit_price),
        unit_cost = COALESCE($8, unit_cost),
        stock_on_hand = COALESCE($9, stock_on_hand),
        min_stock_level = COALESCE($10, min_stock_level),
        is_active = COALESCE($11, is_active),
        updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, sku, name, description, category, supplier_id, unit_price, unit_cost, stock_on_hand, min_stock_level, is_active]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "SKU already exists" });
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await pool.query(
      `
      UPDATE products
      SET is_active = false, updated_at = now()
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;