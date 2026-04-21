import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productsRouter from "./routes/products.js";
import dashboardRouter from "./routes/dashboard.js";
import suppliersRouter from "./routes/suppliers.js";
import accountsRouter from "./routes/accounts.js";
import authRouter from "./routes/auth.js";
import salesRouter from "./routes/sales.js";
import purchaseOrdersRouter from "./routes/purchaseOrders.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
