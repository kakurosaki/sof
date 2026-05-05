import "./SaleItemCard.css";

function SaleItemCard({ product, onAdd }) {
  return (
    <div className="col-5 m-0">
      <div className="card p-2">
        <img src="product-image.jpg" className="sales-card-img" alt={product.name} />
        <div className="card-body">
          <h5 className="card-title">{product.name}</h5>
          <p className="card-text mb-1">{product.description || "No description"}</p>
          <p className="card-text mb-2 text-muted">
            {product.sku} • Stock: {product.stock_on_hand}
          </p>
          <button type="button" className="btn btn-success" onClick={() => onAdd(product)}>
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaleItemCard;
