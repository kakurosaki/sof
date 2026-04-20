import EditOrderModal from "./EditOrderModal";

function IncomingOrder() {
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
            <h5 className="card-title mb-2">Paper Cups</h5>
            <div className="d-flex gap-4">
              <div>
                <strong>ID:</strong> PRD002
              </div>
              <div>
                <strong>Qty:</strong> 1000 units
              </div>
              <div>
                <strong>Expected Delivery:</strong> 2026-05-02
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 flex-column">
            <button type="button" className="btn btn-success">
              Claim
            </button>
            <button
              type="button"
              className="btn btn-warning"
              data-bs-toggle="modal"
              data-bs-target="#editOrderModal"
            >
              Edit
            </button>
            <button type="button" className="btn btn-danger">
              Deny
            </button>
          </div>
        </div>
      </div>

      <EditOrderModal
        modalId="editOrderModal"
        productName="Paper Cups"
        productId="PRD002"
        quantity="1000"
        deliveryDate="2026-05-02"
      />
    </div>
  );
}

export default IncomingOrder;
