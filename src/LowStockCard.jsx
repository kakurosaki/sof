import OrderModal from "./OrderModal";

function LowStockCard() {
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: "250px",
        display: "inline-block",
      }}
    >
      <div className="card">
        <img
          src="product-image.jpg"
          className="card-img-top"
          alt="Product"
          style={{ height: "180px", objectFit: "cover" }}
        />
        <div className="card-body">
          <h5 className="card-title">Plastic Forks</h5>
          <p className="card-text">
            <strong>ID:</strong> PRD001
          </p>
          <p className="card-text">
            <strong>Stock:</strong> 150 units
          </p>
          <button
            type="button"
            className="btn btn-primary w-100"
            data-bs-toggle="modal"
            data-bs-target="#orderModal"
          >
            Order
          </button>
        </div>
      </div>

      <OrderModal
        modalId="orderModal"
        productName="Plastic Forks"
        productId="PRD001"
        stock="150 units"
      />
    </div>
  );
}

export default LowStockCard;
