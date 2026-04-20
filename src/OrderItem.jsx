function OrderItem() {
  return (
    <li className="list-group-item">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="fw-semibold">Plastic Forks</div>
          <div className="text-muted">$2.50 each</div>
        </div>
        <div className="text-end fw-semibold">$5.00</div>
      </div>
      <div className="d-flex align-items-center gap-2 mt-2">
        <button className="btn btn-sm btn-outline-secondary" type="button">
          -
        </button>
        <span>2</span>
        <button className="btn btn-sm btn-outline-secondary" type="button">
          +
        </button>
      </div>
    </li>
  );
}

export default OrderItem;
