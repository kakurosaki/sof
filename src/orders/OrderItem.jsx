function OrderItem({ item, onDecrease, onIncrease }) {
  const itemTotal = Number(item.quantity) * Number(item.unit_price);

  return (
    <li className="list-group-item">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="fw-semibold">{item.name}</div>
          <div className="text-muted">${Number(item.unit_price).toFixed(2)} each</div>
        </div>
        <div className="text-end fw-semibold">${itemTotal.toFixed(2)}</div>
      </div>
      <div className="d-flex align-items-center gap-2 mt-2">
        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => onDecrease(item.product_id)}>
          -
        </button>
        <span>{item.quantity}</span>
        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => onIncrease(item.product_id)}>
          +
        </button>
      </div>
    </li>
  );
}

export default OrderItem;
