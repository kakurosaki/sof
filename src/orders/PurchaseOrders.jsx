import IncomingOrder from "./IncomingOrder";
import EditOrderModal from "./EditOrderModal";
import LowStockCard from "./LowStockCard";
import "./PurchaseOrders.css";
import { useEffect, useState } from "react";
import { useToast } from "./ToastContext";

function PurchaseOrders() {
  const [lowStock, setLowStock] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualOrder, setManualOrder] = useState({
    productId: "",
    quantity: "1",
    deliveryDate: "",
  });
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const { notify } = useToast();

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

      if (!lowStockRes.ok)
        throw new Error(lowStockJson?.error || "Failed to load low stock");
      if (!incomingRes.ok)
        throw new Error(
          incomingJson?.error || "Failed to load incoming orders",
        );
      if (!productsRes.ok)
        throw new Error(productsJson?.error || "Failed to load products");

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
      if (!res.ok)
        throw new Error(json?.error || "Failed to create purchase order");

      notify({
        title: "Purchase order created",
        message: "A new purchase order was added successfully.",
        variant: "success",
      });
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleManualOrder(e) {
    e.preventDefault();

    if (
      !manualOrder.productId ||
      !manualOrder.quantity ||
      !manualOrder.deliveryDate
    ) {
      setError("Select a product, quantity, and delivery date");
      return;
    }

    await handlePlaceOrder({
      product_id: Number(manualOrder.productId),
      quantity: Number(manualOrder.quantity),
      expected_delivery_date: manualOrder.deliveryDate,
    });

    setManualOrder({ productId: "", quantity: "1", deliveryDate: "" });
    setShowCreateOrderModal(false);
  }

  async function handleClaim(orderId) {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/claim`, {
        method: "PUT",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to claim order");
      notify({
        title: "Order claimed",
        message: `Order #${orderId} was claimed and stock was updated.`,
        variant: "success",
      });
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeny(orderId) {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/deny`, {
        method: "PUT",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to deny order");
      notify({
        title: "Order denied",
        message: `Order #${orderId} was removed from incoming orders.`,
        variant: "warning",
      });
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleEdit(order) {
    setEditingOrder(order);
    setShowEditOrderModal(true);
  }

  async function handleSaveEdit(orderId, quantity, deliveryDate) {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          expected_delivery_date: deliveryDate,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to edit order");
      notify({
        title: "Order updated",
        message: `Order #${orderId} was saved successfully.`,
        variant: "info",
      });
      await loadData();
      setShowEditOrderModal(false);
      setEditingOrder(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredLowStock = lowStock.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="col-9 container-fluid purchase-orders p-0">
      <div className="">
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
              <button
                className="btn btn-outline-success"
                type="button"
                disabled={loading}
              >
                Search
              </button>
            </form>
          </div>
        </nav>
      </div>

      <div className="px-3">
        {error && <div className="alert alert-danger py-2">{error}</div>}
      </div>

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
            <LowStockCard
              key={item.id}
              item={item}
              onPlaceOrder={handlePlaceOrder}
            />
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
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateOrderModal(true)}
            >
              Create Purchase Order
            </button>
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

      <div
        className={`modal fade ${showCreateOrderModal ? "show" : ""}`}
        id="createOrderModal"
        tabIndex="-1"
        aria-labelledby="createOrderModalLabel"
        aria-hidden={!showCreateOrderModal}
        style={{ display: showCreateOrderModal ? "block" : "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="createOrderModalLabel">
                Create Purchase Order
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateOrderModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleManualOrder}>
                <div className="mb-3">
                  <label className="form-label">Product</label>
                  <select
                    className="form-select"
                    value={manualOrder.productId}
                    onChange={(e) =>
                      setManualOrder((prev) => ({
                        ...prev,
                        productId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={manualOrder.quantity}
                    onChange={(e) =>
                      setManualOrder((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Expected Delivery</label>
                  <input
                    type="date"
                    className="form-control"
                    value={manualOrder.deliveryDate}
                    onChange={(e) =>
                      setManualOrder((prev) => ({
                        ...prev,
                        deliveryDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="text-muted small mb-3">
                  Supplier is inferred automatically from the selected product.
                </div>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  Order Product
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <EditOrderModal
        show={showEditOrderModal}
        order={editingOrder}
        saving={savingEdit}
        onClose={() => {
          setShowEditOrderModal(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveEdit}
      />

      {showCreateOrderModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default PurchaseOrders;
