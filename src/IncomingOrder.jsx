import { useState } from "react";

function IncomingOrder({ order, onClaim, onDeny, onEdit }) {
  const [qty, setQty] = useState(order.quantity);
  const [date, setDate] = useState(order.expected_delivery_date?.slice(0, 10) || "");

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex gap-4 align-items-center">
          <img
            src="product-image.jpg"
            alt="Product"
            style={{
              width: "150px",
              height: "auto",
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
          <div style={{ flex: 1 }}>
            <h5 className="card-title mb-2">{order.product_name}</h5>
            <div className="d-flex gap-4">
              <div>
                <strong>ID:</strong> {order.sku}
              </div>
              <div>
                <strong>Qty:</strong> {order.quantity} units
              </div>
              <div>
                <strong>Expected Delivery:</strong> {order.expected_delivery_date?.slice(0, 10)}
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <input
                type="number"
                min="1"
                className="form-control"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{ maxWidth: "180px" }}
              />
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ maxWidth: "220px" }}
              />
            </div>
          </div>
          <div className="d-flex gap-2 flex-column">
            <button type="button" className="btn btn-success" onClick={() => onClaim(order.id)}>
              Claim
            </button>
            <button type="button" className="btn btn-warning" onClick={() => onEdit(order.id, qty, date)}>
              Edit
            </button>
            <button type="button" className="btn btn-danger" onClick={() => onDeny(order.id)}>
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomingOrder;
