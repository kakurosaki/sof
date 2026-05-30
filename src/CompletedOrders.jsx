import { useEffect, useState } from "react";

function CompletedOrders() {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  async function loadCompletedOrders() {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const res = await fetch("/api/sales/orders?limit=30");
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.error || "Failed to load completed orders");
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

  return (
    <div className="col-9 container-fluid p-0">
      <section className="sales-history px-3 pb-3 mt-3">
        <div className="sales-history-card card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h5 mb-0">Completed Orders</h2>
              <small className="text-muted">
                Sales audit trail for inventory double-checking
              </small>
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
            {ordersError && (
              <div className="alert alert-danger py-2 mb-2">{ordersError}</div>
            )}
            {ordersLoading && completedOrders.length === 0 && (
              <div className="text-muted">Loading completed orders...</div>
            )}
            {!ordersLoading && completedOrders.length === 0 && (
              <div className="text-muted">No completed orders yet.</div>
            )}

            <div className="sales-history-list">
              {completedOrders.map((order) => (
                <article key={order.id} className="sales-history-item">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                    <div className="fw-semibold">Order #{order.id}</div>
                    <div className="sales-history-time">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="mb-2 pe-2">
                    <div
                      className="d-flex justify-content-between mb-1"
                      style={{ fontSize: "0.9rem" }}
                    >
                      <span>Subtotal:</span>
                      <span>${Number(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {order.discount_applied && (
                      <div
                        className="d-flex justify-content-between mb-1"
                        style={{ fontSize: "0.9rem", color: "#dc3545" }}
                      >
                        <span>Discount (5%):</span>
                        <span>
                          -${Number(order.subtotal * 0.05 || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div
                      className="d-flex justify-content-between fw-semibold mb-2"
                      style={{ fontSize: "1rem", color: "#1f5b2a" }}
                    >
                      <span>Total:</span>
                      <span>${Number(order.total || 0).toFixed(2)}</span>
                    </div>
                    {order.cash_received && (
                      <div
                        className="d-flex justify-content-between"
                        style={{ fontSize: "0.9rem", color: "#0d6efd" }}
                      >
                        <span>Cash Received:</span>
                        <span>${Number(order.cash_received).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "0.85rem",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid #d8e5d2",
                    }}
                  >
                    <strong className="d-block mb-1">Items:</strong>
                    <ul className="mb-0">
                      {(order.items || []).map((item) => (
                        <li key={`${order.id}-${item.product_id}`}>
                          {item.quantity} x {item.name} @ $
                          {Number(item.unit_price || 0).toFixed(2)} = $
                          {Number(item.line_total || 0).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CompletedOrders;
