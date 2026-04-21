import { useState } from "react";

function LowStockCard({ item, onPlaceOrder }) {
  const [quantity, setQuantity] = useState(Math.max((item.min_stock_level || 1) * 2, 1));
  const [deliveryDate, setDeliveryDate] = useState("");

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
          alt={item.name}
          style={{ height: "180px", objectFit: "cover" }}
        />
        <div className="card-body">
          <h5 className="card-title">{item.name}</h5>
          <p className="card-text">
            <strong>ID:</strong> {item.sku}
          </p>
          <p className="card-text">
            <strong>Stock:</strong> {item.stock_on_hand} units
          </p>
          <div className="mb-2">
            <input
              type="number"
              min="1"
              className="form-control form-control-sm"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Order quantity"
            />
          </div>
          <div className="mb-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={() =>
              onPlaceOrder({
                product_id: item.id,
                supplier_id: item.supplier_id,
                quantity,
                expected_delivery_date: deliveryDate,
              })
            }
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default LowStockCard;
