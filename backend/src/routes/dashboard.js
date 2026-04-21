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

// GET /api/dashboard/trends
router.get("/trends", async (req, res) => {
  const months = Math.min(Math.max(Number.parseInt(req.query.months || "6", 10), 1), 24);

  try {
    const salesResult = await pool.query(
      `
      SELECT
        to_char(date_trunc('month', so.created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(so.total), 0) AS sales_total
      FROM sales_orders so
      WHERE so.created_at >= date_trunc('month', now()) - (($1::int - 1) * interval '1 month')
      GROUP BY 1
      ORDER BY 1
      `,
      [months]
    );

    const purchaseResult = await pool.query(
      `
      SELECT
        to_char(date_trunc('month', po.created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(po.quantity), 0) AS ordered_qty
      FROM purchase_orders po
      WHERE po.created_at >= date_trunc('month', now()) - (($1::int - 1) * interval '1 month')
      GROUP BY 1
      ORDER BY 1
      `,
      [months]
    );

    const categoryResult = await pool.query(
      `
      SELECT
        COALESCE(category, 'Uncategorized') AS category,
        COALESCE(SUM(stock_on_hand), 0) AS total_stock
      FROM products
      WHERE is_active = true
      GROUP BY 1
      ORDER BY 2 DESC, 1 ASC
      LIMIT 8
      `
    );

    res.json({
      sales_by_month: salesResult.rows,
      purchases_by_month: purchaseResult.rows,
      stock_by_category: categoryResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard trends" });
  }
});

export default router;