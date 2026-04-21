import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

function toTrimmedString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

router.get("/", async (_req, res) => {
  const search = _req.query.search?.trim() || "";

  try {
    const values = [];
    const where = ["is_active = true"];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR phone ILIKE $${values.length})`);
    }

    const result = await pool.query(
      `
      SELECT id, name, email, phone, account_type, is_active, created_at, updated_at
      FROM accounts
      WHERE ${where.join(" AND ")}
      ORDER BY name ASC
      `
      , values
    );

    res.json({ count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

router.post("/", async (req, res) => {
  const { name, email, phone = null, password, account_type = "staff" } = req.body || {};

  const cleanName = toTrimmedString(name);
  const cleanEmail = toTrimmedString(email);
  const cleanPhone = toTrimmedString(phone);
  const cleanPassword = toTrimmedString(password);
  const cleanType = toTrimmedString(account_type)?.toLowerCase();

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  if (!["staff", "admin"].includes(cleanType)) {
    return res.status(400).json({ error: "account_type must be staff or admin" });
  }

  try {
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const result = await pool.query(
      `
      INSERT INTO accounts (name, email, phone, password_hash, account_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, account_type, is_active, created_at, updated_at
      `,
      [cleanName, cleanEmail, cleanPhone, passwordHash, cleanType]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const { name, email, phone, password, account_type, is_active } = req.body || {};

  const cleanName = name === undefined ? undefined : toTrimmedString(name);
  const cleanEmail = email === undefined ? undefined : toTrimmedString(email);
  const cleanPhone = phone === undefined ? undefined : toTrimmedString(phone);
  const cleanType = account_type === undefined ? undefined : toTrimmedString(account_type)?.toLowerCase();

  if (name !== undefined && !cleanName) return res.status(400).json({ error: "name cannot be empty" });
  if (email !== undefined && !cleanEmail) return res.status(400).json({ error: "email cannot be empty" });
  if (account_type !== undefined && !["staff", "admin"].includes(cleanType)) {
    return res.status(400).json({ error: "account_type must be staff or admin" });
  }
  if (is_active !== undefined && typeof is_active !== "boolean") {
    return res.status(400).json({ error: "is_active must be boolean" });
  }

  try {
    let passwordHash = undefined;
    if (password !== undefined) {
      const cleanPassword = toTrimmedString(password);
      if (!cleanPassword) return res.status(400).json({ error: "password cannot be empty" });
      passwordHash = await bcrypt.hash(cleanPassword, 10);
    }

    const query = `
      UPDATE accounts
      SET
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        password_hash = COALESCE($5, password_hash),
        account_type = COALESCE($6, account_type),
        is_active = COALESCE($7, is_active),
        updated_at = now()
      WHERE id = $1
      RETURNING id, name, email, phone, account_type, is_active, created_at, updated_at
      `;

    const result = await pool.query(query, [
      id,
      cleanName,
      cleanEmail,
      cleanPhone,
      passwordHash,
      cleanType,
      is_active,
    ]);

    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update account" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await pool.query(
      `
      UPDATE accounts
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
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
