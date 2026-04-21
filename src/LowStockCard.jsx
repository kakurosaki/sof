import { useState } from "react";

function LowStockCard({ item, onPlaceOrder }) {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(String(Math.max((item.min_stock_level || 1) * 2, 1)));
  const [deliveryDate, setDeliveryDate] = useState("");
  const [formError, setFormError] = useState("");

  function openModal() {
    setShowModal(true);
    setFormError("");
    if (!deliveryDate) {
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + 7);
      setDeliveryDate(suggestedDate.toISOString().slice(0, 10));
    }
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
  }

  function handleConfirmOrder() {
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("Please enter a valid order quantity.");
      return;
    }

    if (!deliveryDate) {
      setFormError("Please select an expected delivery date.");
      return;
    }

    onPlaceOrder({
      product_id: item.id,
      supplier_id: item.supplier_id,
      quantity: parsedQuantity,
      expected_delivery_date: deliveryDate,
    });

    closeModal();
  }

  return (
    <>
      <div className="low-stock-card-wrap">
        <div className="card low-stock-card h-100">
          <div className="low-stock-card-media" aria-hidden="true">
            <span>Product</span>
          </div>
          <div className="card-body d-flex flex-column">
            <h5 className="card-title low-stock-card-title">{item.name}</h5>
            <p className="card-text low-stock-card-text">
              <strong>ID:</strong> {item.sku}
            </p>
            <p className="card-text low-stock-card-text mb-4">
              <strong>Stock:</strong> {item.stock_on_hand} units
            </p>

            <button type="button" className="btn btn-primary w-100 mt-auto" onClick={openModal}>
              Order
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="custom-order-modal-backdrop" role="dialog" aria-modal="true" aria-label="Place Order">
          <div className="custom-order-modal">
            <div className="custom-order-modal-header">
              <h5 className="mb-0">Place Order</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeModal}
              ></button>
            </div>

            <div className="custom-order-modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Product Name</label>
                <input type="text" className="form-control" value={item.name} disabled />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Product ID</label>
                <input type="text" className="form-control" value={item.sku} disabled />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Available Stock</label>
                <input type="text" className="form-control" value={`${item.stock_on_hand} units`} disabled />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold">Expected Delivery Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>

              {formError && <div className="alert alert-danger py-2 mt-3 mb-0">{formError}</div>}
            </div>

            <div className="custom-order-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmOrder}>
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LowStockCard;
