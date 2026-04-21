import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

function toTrimmedString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, account_type: user.account_type, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  const cleanEmail = toTrimmedString(email);
  const cleanPassword = toTrimmedString(password);

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, name, email, password_hash, account_type, is_active
      FROM accounts
      WHERE email = $1 AND is_active = true
      `,
      [cleanEmail]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        account_type: user.account_type,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/register", async (req, res) => {
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
      RETURNING id, name, email, account_type
      `,
      [cleanName, cleanEmail, cleanPhone, passwordHash, cleanType]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        account_type: user.account_type,
      },
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      user: decoded,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
