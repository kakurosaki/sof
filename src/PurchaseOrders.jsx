import IncomingOrder from "./IncomingOrder";
import EditOrderModal from "./EditOrderModal";
import ClaimOrderModal from "./ClaimOrderModal";
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
  const [showClaimOrderModal, setShowClaimOrderModal] = useState(false);
  const [claimingOrder, setClaimingOrder] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
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
    const order = incomingOrders.find((o) => o.id === orderId);
    if (order) {
      setClaimingOrder(order);
      setShowClaimOrderModal(true);
    }
  }

  async function handleConfirmClaim(orderId, unitsReceived) {
    setClaiming(true);
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/claim`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units_received: unitsReceived }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to claim order");
      notify({
        title: "Order claimed",
        message: `Order #${orderId} was claimed and stock was updated with ${unitsReceived} units.`,
        variant: "success",
      });
      await loadData();
      setShowClaimOrderModal(false);
      setClaimingOrder(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setClaiming(false);
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredLowStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLowStock = filteredLowStock.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

      <div style={{ padding: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Min Stock Level</th>
                <th>Shortage</th>
                <th>Supplier</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLowStock.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.stock_on_hand}</td>
                  <td>{item.min_stock_level}</td>
                  <td>
                    <span className="badge bg-danger">
                      {item.min_stock_level - item.stock_on_hand}
                    </span>
                  </td>
                  <td>{item.supplier_name || "N/A"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setManualOrder({
                          productId: String(item.id),
                          quantity: String(
                            item.min_stock_level - item.stock_on_hand,
                          ),
                          deliveryDate: "",
                        });
                        setShowCreateOrderModal(true);
                      }}
                    >
                      Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && paginatedLowStock.length === 0 && (
            <div className="text-muted text-center py-4">
              No low stock items found
            </div>
          )}
        </div>

        {filteredLowStock.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredLowStock.length)} of{" "}
              {filteredLowStock.length} items
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="btn btn-outline-secondary disabled">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
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

      <ClaimOrderModal
        show={showClaimOrderModal}
        order={claimingOrder}
        confirming={claiming}
        onClose={() => {
          setShowClaimOrderModal(false);
          setClaimingOrder(null);
        }}
        onConfirm={handleConfirmClaim}
      />

      {showCreateOrderModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default PurchaseOrders;
