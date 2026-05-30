import { useState, useMemo } from "react";
import "./CheckoutModal.css";

export default function CheckoutModal({
  show,
  cart,
  onClose,
  onConfirm,
  processing,
}) {
  const [cashReceived, setCashReceived] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountApplied) {
      return subtotal * 0.05;
    }
    return 0;
  }, [subtotal, discountApplied]);

  const total = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  const change = useMemo(() => {
    const cash = parseFloat(cashReceived);
    if (isNaN(cash)) return 0;
    return cash - total;
  }, [cashReceived, total]);

  const handleConfirm = () => {
    const cash = parseFloat(cashReceived);
    if (isNaN(cash) || cash < total) {
      alert("Cash received must be at least the total amount due");
      return;
    }
    onConfirm({
      cash_received: cash,
      discount_applied: discountApplied,
    });
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content checkout-modal">
        <div className="modal-header">
          <h5 className="modal-title">Order Checkout</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            disabled={processing}
          ></button>
        </div>

        <div className="modal-body">
          <div className="checkout-section">
            <h6 className="mb-3">Order Summary</h6>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td className="text-end">{item.quantity}</td>
                    <td className="text-end">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="text-end">
                      ${Number(item.unit_price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr />

          <div className="checkout-section">
            <div className="row mb-3">
              <div className="col">
                <label className="form-label">Subtotal:</label>
              </div>
              <div className="col text-end fw-semibold">
                ${Number(subtotal).toFixed(2)}
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="discountCheck"
                checked={discountApplied}
                onChange={(e) => setDiscountApplied(e.target.checked)}
                disabled={processing}
              />
              <label className="form-check-label" htmlFor="discountCheck">
                Apply 5% Discount
              </label>
            </div>

            {discountApplied && (
              <div className="row mb-3">
                <div className="col">
                  <label className="form-label">Discount (5%):</label>
                </div>
                <div className="col text-end text-danger fw-semibold">
                  -${Number(discountAmount).toFixed(2)}
                </div>
              </div>
            )}

            <div className="row mb-3">
              <div className="col">
                <label className="form-label fw-bold">Total:</label>
              </div>
              <div
                className="col text-end fw-bold text-primary"
                style={{ fontSize: "1.1em" }}
              >
                ${Number(total).toFixed(2)}
              </div>
            </div>

            <hr />

            <div className="mb-3">
              <label htmlFor="cashInput" className="form-label fw-semibold">
                Cash Received:
              </label>
              <input
                type="number"
                id="cashInput"
                className="form-control form-control-lg"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="row">
              <div className="col">
                <label className="form-label">Change:</label>
              </div>
              <div
                className="col text-end fw-bold"
                style={{
                  fontSize: "1.1em",
                  color: change >= 0 ? "#28a745" : "#dc3545",
                }}
              >
                ${Number(Math.max(0, change)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={
              processing ||
              isNaN(parseFloat(cashReceived)) ||
              parseFloat(cashReceived) < total
            }
          >
            {processing ? "Processing..." : "Confirm Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
