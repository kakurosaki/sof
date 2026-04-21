import SaleItemCard from "./SaleItemCard";
import OrderItem from "./OrderItem";
import "./Sales.css";
import { useEffect, useMemo, useState } from "react";

function Sales() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return list.sort((a, b) => a.localeCompare(b));
  }, [products]);

  async function loadProducts(nextSearch = search, nextCategory = category) {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextCategory.trim()) params.set("category", nextCategory.trim());

    try {
      const res = await fetch(`/api/sales/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load sales products");
      setProducts(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts("", "");
  }, []);

  async function loadCompletedOrders() {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const res = await fetch("/api/sales/orders?limit=30");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load completed orders");
      setCompletedOrders(json.data || []);
    } catch (e) {
      setOrdersError(e.message);
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    loadCompletedOrders();
  }, []);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          unit_price: Number(product.unit_price),
          quantity: 1,
        },
      ];
    });
  }

  function changeCartQuantity(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setError("");

    try {
      const payload = {
        items: cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
      };

      const res = await fetch("/api/sales/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Checkout failed");

      setLastOrder(json);
      setCart([]);
      await loadProducts();
      await loadCompletedOrders();
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="col-9 container-fluid sales p-0">
      <nav className="navbar bg-body-tertiary">
        <div className="container-fluid">
          <div className="dropdown">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              id="salesDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {category || "All categories"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="salesDropdown">
              <li>
                <button className="dropdown-item" type="button" onClick={() => { setCategory(""); loadProducts(search, ""); }}>
                  All categories
                </button>
              </li>
              {categories.map((item) => (
                <li key={item}>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => {
                      setCategory(item);
                      loadProducts(search, item);
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <form
            className="d-flex"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              loadProducts(search, category);
            }}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-outline-success" type="submit" disabled={loading}>
              Search
            </button>
          </form>
        </div>
      </nav>

      <div className="px-3 pt-2">
        {error && <div className="alert alert-danger py-2">{error}</div>}
      </div>

      {lastOrder && (
        <div className="px-3">
          <div className="alert alert-success sales-success-alert">
            <div className="fw-semibold mb-1">Order saved successfully</div>
            <div>Order #{lastOrder.order?.id} has been recorded and inventory was updated.</div>
            <div className="mt-2">
              <div className="fw-semibold">Items</div>
              <ul className="mb-0">
                {lastOrder.items?.map((item) => (
                  <li key={`${item.product_id}-${item.name}`}>
                    {item.name}: {item.quantity} units at ${Number(item.unit_price).toFixed(2)} each
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid row">
        <div className="container-fluid col-8">
          <div className="mt-5 d-flex flex-wrap gap-3 justify-content-center">
            {loading && <div className="text-muted">Loading products...</div>}
            {!loading && products.map((product) => (
              <SaleItemCard key={product.id} product={product} onAdd={addToCart} />
            ))}
            {!loading && products.length === 0 && <div className="text-muted">No products found</div>}
          </div>
        </div>
        <div className="container-fluid col-4 m-0 p-0">
          <div className="card mt-5 position-sticky" style={{ top: "2rem", zIndex: 2 }}>
            <div className="card-header">
              <strong>Order Overview</strong>
            </div>
            <ul className="list-group list-group-flush" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {cart.map((item) => (
                <OrderItem
                  key={item.product_id}
                  item={item}
                  onDecrease={(productId) => changeCartQuantity(productId, -1)}
                  onIncrease={(productId) => changeCartQuantity(productId, 1)}
                />
              ))}
              {cart.length === 0 && <li className="list-group-item text-muted">No items yet</li>}
            </ul>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <button
                type="button"
                className="btn btn-success w-100"
                disabled={checkingOut || cart.length === 0}
                onClick={handleCheckout}
              >
                {checkingOut ? "Processing..." : "Complete Order"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="sales-history px-3 pb-3 mt-3">
        <div className="sales-history-card card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h5 mb-0">Completed Orders</h2>
              <small className="text-muted">Sales audit trail for inventory double-checking</small>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={loadCompletedOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="card-body">
            {ordersError && <div className="alert alert-danger py-2 mb-2">{ordersError}</div>}
            {ordersLoading && completedOrders.length === 0 && (
              <div className="text-muted">Loading completed orders...</div>
            )}
            {!ordersLoading && completedOrders.length === 0 && (
              <div className="text-muted">No completed orders yet.</div>
            )}

            <div className="sales-history-list">
              {completedOrders.map((order) => (
                <article key={order.id} className="sales-history-item">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="fw-semibold">Order #{order.id}</div>
                    <div className="sales-history-time">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div className="sales-history-total">Total: ${Number(order.total || 0).toFixed(2)}</div>
                  <ul className="mb-0">
                    {(order.items || []).map((item) => (
                      <li key={`${order.id}-${item.product_id}`}>
                        {item.quantity} x {item.name} (${Number(item.unit_price || 0).toFixed(2)} each)
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Sales;
