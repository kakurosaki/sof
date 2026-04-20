import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active = true) AS total_products,
        COUNT(*) FILTER (WHERE is_active = true AND stock_on_hand <= min_stock_level) AS low_stock_products,
        COALESCE(SUM(stock_on_hand) FILTER (WHERE is_active = true), 0) AS total_units_in_stock,
        COALESCE(SUM(stock_on_hand * unit_cost) FILTER (WHERE is_active = true), 0) AS total_inventory_value
      FROM products
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

export default router;