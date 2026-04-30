import { useEffect, useState } from "react";

function EditOrderModal({ show, order, onClose, onSave, saving = false }) {
  const [quantity, setQuantity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  useEffect(() => {
    if (!order) {
      setQuantity("");
      setDeliveryDate("");
      return;
    }

    setQuantity(String(order.quantity ?? ""));
    setDeliveryDate(order.expected_delivery_date?.slice(0, 10) || "");
  }, [order]);

  function handleSave() {
    if (!order) return;
    onSave?.(order.id, Number(quantity), deliveryDate);
  }

  if (!show || !order) return null;

  return (
    <>
      <div
        className={`modal fade ${show ? "show" : ""}`}
        id="editOrderModal"
        tabIndex="-1"
        aria-labelledby="editOrderModalLabel"
        aria-hidden={!show}
        style={{ display: show ? "block" : "none" }}
      >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="editOrderModalLabel">
              Edit Order
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                <strong>Product Name</strong>
              </label>
              <input
                type="text"
                className="form-control"
                value={order.product_name || ""}
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                <strong>Product ID</strong>
              </label>
              <input
                type="text"
                className="form-control"
                value={order.product_id || ""}
                disabled
              />
            </div>
            <div className="mb-3">
              <label htmlFor="editOrderQuantity" className="form-label">
                <strong>Order Quantity</strong>
              </label>
              <input
                type="number"
                className="form-control"
                id="editOrderQuantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="editOrderDate" className="form-label">
                <strong>Expected Delivery Date</strong>
              </label>
              <input
                type="date"
                className="form-control"
                id="editOrderDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !quantity || Number(quantity) <= 0 || !deliveryDate}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}

export default EditOrderModal;
