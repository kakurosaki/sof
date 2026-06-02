function IncomingOrder({ order, onClaim, onDeny, onEdit }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex gap-4 align-items-center">
          <div
            style={{
              width: "150px",
              height: "150px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {order.image_url ? (
              <img
                src={order.image_url}
                alt={order.product_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#e9ecef",
                  color: "#6c757d",
                  fontWeight: "500",
                  borderRadius: "4px",
                }}
              >
                No Image
              </div>
            )}
          </div>
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
                <strong>Expected Delivery:</strong>{" "}
                {order.expected_delivery_date?.slice(0, 10)}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 flex-column">
            <button
              type="button"
              className="btn btn-success"
              onClick={() => onClaim(order.id)}
            >
              Claim
            </button>
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => onEdit(order)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDeny(order.id)}
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomingOrder;
