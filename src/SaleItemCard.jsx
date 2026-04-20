import "./SaleItemCard.css";

function SaleItemCard() {
  return (
    <div className="col-5 m-0">
      <div className="card p-2">
        <img src="product-image.jpg" className="sales-card-img" alt="Product" />
        <div className="card-body">
          <h5 className="card-title">Product Name</h5>
          <p className="card-text">Product description goes here.</p>
          <a href="#" className="btn btn-success">
            +
          </a>
        </div>
      </div>
    </div>
  );
}

export default SaleItemCard;
