function EditOrderModal({ modalId, productName, productId, quantity, deliveryDate }) {
  return (
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Edit Order
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                <strong>Product Name</strong>
              </label>
              <input
                type="text"
                className="form-control"
                value={productName}
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                <strong>Product ID</strong>
              </label>
              <input
                type="text"
                className="form-control"
                value={productId}
                disabled
              />
            </div>
            <div className="mb-3">
              <label htmlFor={`${modalId}Quantity`} className="form-label">
                <strong>Order Quantity</strong>
              </label>
              <input
                type="number"
                className="form-control"
                id={`${modalId}Quantity`}
                defaultValue={quantity}
              />
            </div>
            <div className="mb-3">
              <label htmlFor={`${modalId}Date`} className="form-label">
                <strong>Expected Delivery Date</strong>
              </label>
              <input
                type="date"
                className="form-control"
                id={`${modalId}Date`}
                defaultValue={deliveryDate}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button type="button" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditOrderModal;
