import IncomingOrder from "./IncomingOrder";
import LowStockCard from "./LowStockCard";
import "./PurchaseOrders.css";
import { useEffect, useState } from "react";

function PurchaseOrders() {
  const [lowStock, setLowStock] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualOrder, setManualOrder] = useState({ productId: "", quantity: "1", deliveryDate: "" });

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [lowStockRes, incomingRes, productsRes] = await Promise.all([
        fetch("/api/purchase-orders/low-stock"),
        fetch("/api/purchase-orders/incoming"),
        fetch("/api/products?active=true&limit=100"),
      ]);

      const lowStockJson = await lowStockRes.json();
      const incomingJson = await incomingRes.json();
      const productsJson = await productsRes.json();

      if (!lowStockRes.ok) throw new Error(lowStockJson?.error || "Failed to load low stock");
      if (!incomingRes.ok) throw new Error(incomingJson?.error || "Failed to load incoming orders");
      if (!productsRes.ok) throw new Error(productsJson?.error || "Failed to load products");

      setLowStock(lowStockJson.data || []);
      setIncomingOrders(incomingJson.data || []);
      setProducts(productsJson.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handlePlaceOrder(payload) {
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create purchase order");

      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleManualOrder(e) {
    e.preventDefault();

    if (!manualOrder.productId || !manualOrder.quantity || !manualOrder.deliveryDate) {
      setError("Select a product, quantity, and delivery date");
      return;
    }

    await handlePlaceOrder({
      product_id: Number(manualOrder.productId),
      quantity: Number(manualOrder.quantity),
      expected_delivery_date: manualOrder.deliveryDate,
    });

    setManualOrder({ productId: "", quantity: "1", deliveryDate: "" });
  }

  async function handleClaim(orderId) {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/claim`, { method: "PUT" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to claim order");
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeny(orderId) {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/deny`, { method: "PUT" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to deny order");
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleEdit(orderId, quantity, deliveryDate) {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, expected_delivery_date: deliveryDate }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to edit order");
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  const filteredLowStock = lowStock.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q);
  });

  return (
    <div className="col-9 container-fluid purchase-orders p-0">
      <div className="container-fluid px-3 pt-3">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">Create Purchase Order</h5>
            <form className="row g-2 align-items-end" onSubmit={handleManualOrder}>
              <div className="col-md-5">
                <label className="form-label">Product</label>
                <select
                  className="form-select"
                  value={manualOrder.productId}
                  onChange={(e) => setManualOrder((prev) => ({ ...prev, productId: e.target.value }))}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={manualOrder.quantity}
                  onChange={(e) => setManualOrder((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Expected Delivery</label>
                <input
                  type="date"
                  className="form-control"
                  value={manualOrder.deliveryDate}
                  onChange={(e) => setManualOrder((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                />
              </div>
              <div className="col-md-2 d-grid">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  Order Product
                </button>
              </div>
            </form>
            <div className="text-muted small mt-2">
              Supplier is inferred automatically from the selected product.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <nav className="navbar bg-body-tertiary">
          <div className="container-fluid">
            <a className="navbar-brand">Low Stock</a>
            <form className="d-flex" role="search">
              <input
                className="form-control me-2"
                type="search"
                placeholder="Search"
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-outline-success" type="button" disabled={loading}>
                Search
              </button>
            </form>
          </div>
        </nav>
      </div>

      <div className="px-3">{error && <div className="alert alert-danger py-2">{error}</div>}</div>

      <div
        className="horizontal-scroll"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          padding: "20px",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          {filteredLowStock.map((item) => (
            <LowStockCard key={item.id} item={item} onPlaceOrder={handlePlaceOrder} />
          ))}
          {!loading && filteredLowStock.length === 0 && (
            <div className="text-muted px-3">No low stock items found</div>
          )}
        </div>
      </div>

      <div className="">
        <nav className="navbar bg-body-tertiary">
          <div className="container-fluid">
            <span className="navbar-brand mb-0 h1">Incoming Orders</span>
          </div>
        </nav>
      </div>

      <div style={{ padding: "20px" }}>
        {incomingOrders.map((order) => (
          <IncomingOrder
            key={order.id}
            order={order}
            onClaim={handleClaim}
            onDeny={handleDeny}
            onEdit={handleEdit}
          />
        ))}
        {!loading && incomingOrders.length === 0 && (
          <div className="text-muted">No incoming orders</div>
        )}
      </div>
    </div>
  );
}

export default PurchaseOrders;
