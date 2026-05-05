import { useEffect, useState } from "react";

function ClaimOrderModal({
  show,
  order,
  onClose,
  onConfirm,
  confirming = false,
}) {
  const [unitsReceived, setUnitsReceived] = useState("");

  useEffect(() => {
    if (show && order) {
      setUnitsReceived(String(order.quantity || ""));
    } else {
      setUnitsReceived("");
    }
  }, [show, order]);

  function handleConfirm() {
    if (!order || !unitsReceived) return;
    const units = Number(unitsReceived);
    if (units <= 0) return;
    onConfirm?.(order.id, units);
  }

  if (!show || !order) return null;

  const unitsNum = Number(unitsReceived) || 0;
  const isValid = unitsNum > 0;

  return (
    <>
      <div
        className={`modal fade ${show ? "show" : ""}`}
        id="claimOrderModal"
        tabIndex="-1"
        aria-labelledby="claimOrderModalLabel"
        aria-hidden={!show}
        style={{ display: show ? "block" : "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="claimOrderModalLabel">
                Confirm Order Claim
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
                disabled={confirming}
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
                  <strong>SKU</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={order.sku || ""}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <strong>Supplier</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={order.supplier_name || "N/A"}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <strong>Order Quantity</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={order.quantity || ""}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <strong>Expected Delivery Date</strong>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={order.expected_delivery_date?.slice(0, 10) || ""}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label htmlFor="unitsReceived" className="form-label">
                  <strong>Units Received</strong>
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="unitsReceived"
                  min="0"
                  value={unitsReceived}
                  onChange={(e) => setUnitsReceived(e.target.value)}
                  disabled={confirming}
                  placeholder="Enter units received"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirm}
                disabled={!isValid || confirming}
              >
                {confirming ? "Claiming..." : "Confirm Claim"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {show && <div className="modal-backdrop fade show"></div>}
    </>
  );
}

export default ClaimOrderModal;
