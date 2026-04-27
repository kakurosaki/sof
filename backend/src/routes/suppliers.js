import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

function toTrimmedString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, email, phone, is_active
      FROM suppliers
      WHERE is_active = true
      ORDER BY name ASC
      `,
    );

    res.json({ count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

router.post("/", async (req, res) => {
  const { name, email = null, phone = null } = req.body || {};

  const cleanName = toTrimmedString(name);
  const cleanEmail = toTrimmedString(email);
  const cleanPhone = toTrimmedString(phone);

  if (!cleanName) return res.status(400).json({ error: "name is required" });

  try {
    const result = await pool.query(
      `
      INSERT INTO suppliers (name, email, phone)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, phone, is_active
      `,
      [cleanName, cleanEmail, cleanPhone],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Supplier name already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid id" });

  const { name, email, phone, is_active } = req.body || {};

  const cleanName = name === undefined ? undefined : toTrimmedString(name);
  const cleanEmail = email === undefined ? undefined : toTrimmedString(email);
  const cleanPhone = phone === undefined ? undefined : toTrimmedString(phone);

  if (name !== undefined && !cleanName) {
    return res
      .status(400)
      .json({ error: "name cannot be empty when provided" });
  }

  if (is_active !== undefined && typeof is_active !== "boolean") {
    return res.status(400).json({ error: "is_active must be boolean" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE suppliers
      SET
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        is_active = COALESCE($5, is_active)
      WHERE id = $1
      RETURNING id, name, email, phone, is_active
      `,
      [id, cleanName, cleanEmail, cleanPhone, is_active],
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Supplier name already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await pool.query(
      `
      UPDATE suppliers
      SET is_active = false
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

export default router;
