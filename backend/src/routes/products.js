import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

function toTrimmedString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNonNegativeNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function toNonNegativeInteger(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseActiveQueryParam(raw) {
  if (raw === undefined) return true;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "all") return null;
  return "invalid";
}

router.get("/", async (req, res) => {
  const search = req.query.search?.trim() || "";
  const category = req.query.category?.trim() || "";
  const supplierIdParam = req.query.supplier_id;
  const supplierId =
    supplierIdParam === undefined || supplierIdParam === null || supplierIdParam === ""
      ? null
      : Number.parseInt(supplierIdParam, 10);
  const active = parseActiveQueryParam(req.query.active);
  if (active === "invalid") {
    return res.status(400).json({ error: 'active must be "true", "false", or "all"' });
  }

  if (supplierId !== null && (!Number.isFinite(supplierId) || supplierId < 0)) {
    return res.status(400).json({ error: "supplier_id must be a non-negative integer" });
  }

  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
  const offset = (page - 1) * limit;

  const where = [];
  const values = [];

  if (active !== null) {
    values.push(active);
    where.push(`p.is_active = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    where.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
  }

  if (category) {
    values.push(category);
    where.push(`p.category = $${values.length}`);
  }

  if (supplierId !== null) {
    values.push(supplierId);
    where.push(`p.supplier_id = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    values.push(limit);
    const limitParam = `$${values.length}`;
    values.push(offset);
    const offsetParam = `$${values.length}`;

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
      LIMIT ${limitParam} OFFSET ${offsetParam}
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

  const cleanSku = toTrimmedString(sku);
  const cleanName = toTrimmedString(name);
  const cleanDescription = toTrimmedString(description);
  const cleanCategory = toTrimmedString(category);
  const parsedSupplierId = supplier_id === null ? null : toNonNegativeInteger(supplier_id, null);
  const parsedUnitPrice = toNonNegativeNumber(unit_price, 0);
  const parsedUnitCost = toNonNegativeNumber(unit_cost, 0);
  const parsedStock = toNonNegativeInteger(stock_on_hand, 0);
  const parsedMinStock = toNonNegativeInteger(min_stock_level, 0);

  if (!cleanSku || !cleanName) {
    return res.status(400).json({ error: "sku and name are required" });
  }

  if (
    parsedUnitPrice === null ||
    parsedUnitCost === null ||
    parsedStock === null ||
    parsedMinStock === null ||
    (supplier_id !== null && supplier_id !== undefined && parsedSupplierId === null)
  ) {
    return res.status(400).json({
      error: "unit_price, unit_cost, stock_on_hand, min_stock_level must be non-negative; supplier_id must be a non-negative integer or null",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO products
        (sku, name, description, category, supplier_id, unit_price, unit_cost, stock_on_hand, min_stock_level)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        cleanSku,
        cleanName,
        cleanDescription,
        cleanCategory,
        parsedSupplierId,
        parsedUnitPrice,
        parsedUnitCost,
        parsedStock,
        parsedMinStock,
      ]
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

  const cleanSku = sku === undefined ? undefined : toTrimmedString(sku);
  const cleanName = name === undefined ? undefined : toTrimmedString(name);
  const cleanDescription = description === undefined ? undefined : toTrimmedString(description);
  const cleanCategory = category === undefined ? undefined : toTrimmedString(category);

  const parsedSupplierId =
    supplier_id === undefined
      ? undefined
      : supplier_id === null
        ? null
        : toNonNegativeInteger(supplier_id, null);

  const parsedUnitPrice =
    unit_price === undefined ? undefined : toNonNegativeNumber(unit_price, null);
  const parsedUnitCost =
    unit_cost === undefined ? undefined : toNonNegativeNumber(unit_cost, null);
  const parsedStock =
    stock_on_hand === undefined ? undefined : toNonNegativeInteger(stock_on_hand, null);
  const parsedMinStock =
    min_stock_level === undefined ? undefined : toNonNegativeInteger(min_stock_level, null);

  if ((sku !== undefined && !cleanSku) || (name !== undefined && !cleanName)) {
    return res.status(400).json({ error: "sku and name cannot be empty when provided" });
  }

  if (
    (supplier_id !== undefined && parsedSupplierId === null && supplier_id !== null) ||
    (unit_price !== undefined && parsedUnitPrice === null) ||
    (unit_cost !== undefined && parsedUnitCost === null) ||
    (stock_on_hand !== undefined && parsedStock === null) ||
    (min_stock_level !== undefined && parsedMinStock === null)
  ) {
    return res.status(400).json({
      error: "Invalid update payload: numeric fields must be non-negative and supplier_id must be a non-negative integer or null",
    });
  }

  if (is_active !== undefined && typeof is_active !== "boolean") {
    return res.status(400).json({ error: "is_active must be boolean" });
  }

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
      [
        id,
        cleanSku,
        cleanName,
        cleanDescription,
        cleanCategory,
        parsedSupplierId,
        parsedUnitPrice,
        parsedUnitCost,
        parsedStock,
        parsedMinStock,
        is_active,
      ]
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