import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productsRouter from "./routes/products.js";
import dashboardRouter from "./routes/dashboard.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/products", productsRouter);
app.use("/api/dashboard", dashboardRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
