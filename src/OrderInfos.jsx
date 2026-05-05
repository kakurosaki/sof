import { useEffect, useState } from "react";
import "./PurchaseOrders.css";
import { useToast } from "./ToastContext";

function OrderInfos() {
  const [orderLogs, setOrderLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const { notify } = useToast();

  async function loadOrderLogs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/purchase-orders/logs/all");
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Failed to load order logs");

      setOrderLogs(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrderLogs();
  }, []);

  const filteredLogs = orderLogs.filter((log) => {
    if (filterAction === "all") return true;
    return log.order_action === filterAction;
  });

  const claimedCount = orderLogs.filter(
    (l) => l.order_action === "claimed",
  ).length;
  const deniedCount = orderLogs.filter(
    (l) => l.order_action === "denied",
  ).length;
  const totalDiscrepancy = orderLogs
    .filter((l) => l.order_action === "claimed")
    .reduce((sum, l) => sum + (l.discrepancy || 0), 0);

  return (
    <div className="col-9 container-fluid purchase-orders p-0">
      <div className="">
        <nav className="navbar bg-body-tertiary">
          <div className="container-fluid">
            <a className="navbar-brand">Order Logs & Discrepancies</a>
          </div>
        </nav>
      </div>

      <div className="px-3 py-4">
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title text-muted">Claimed Orders</h6>
                <h2 className="text-success">{claimedCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title text-muted">Denied Orders</h6>
                <h2 className="text-danger">{deniedCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title text-muted">Total Discrepancy</h6>
                <h2
                  className={
                    totalDiscrepancy > 0 ? "text-warning" : "text-info"
                  }
                >
                  {totalDiscrepancy > 0 ? "+" : ""}
                  {totalDiscrepancy}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Filter by Action:</label>
          <select
            className="form-select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="claimed">Claimed Only</option>
            <option value="denied">Denied Only</option>
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Supplier</th>
                <th>Action</th>
                <th>Order Qty</th>
                <th>Received Qty</th>
                <th>Discrepancy</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleDateString()}</td>
                  <td>{log.product_name}</td>
                  <td>{log.sku}</td>
                  <td>{log.supplier_name || "N/A"}</td>
                  <td>
                    <span
                      className={`badge ${
                        log.order_action === "claimed"
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    >
                      {log.order_action.toUpperCase()}
                    </span>
                  </td>
                  <td>{log.order_quantity}</td>
                  <td>{log.received_quantity || 0}</td>
                  <td>
                    <span
                      className={`badge ${
                        log.discrepancy > 0
                          ? "bg-warning text-dark"
                          : log.discrepancy < 0
                            ? "bg-danger"
                            : "bg-secondary"
                      }`}
                    >
                      {log.discrepancy > 0 ? "+" : ""}
                      {log.discrepancy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredLogs.length === 0 && (
            <div className="text-muted text-center py-4">
              No order logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderInfos;
