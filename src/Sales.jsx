import SaleItemCard from "./SaleItemCard";
import OrderItem from "./OrderItem";
import "./Sales.css";

function Sales() {
  return (
    <div className="col-9 container-fluid sales p-0">
      <nav className="navbar bg-body-tertiary">
        <div className="container-fluid">
          <div className="dropdown">
            <button
              className="btn btn-secondary dropdown-toggle"
              type="button"
              id="salesDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Plasticware
            </button>
            <ul className="dropdown-menu" aria-labelledby="salesDropdown">
              <li>
                <a className="dropdown-item" href="#">
                  Action
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  Another action
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  Something else here
                </a>
              </li>
            </ul>
          </div>
          <form className="d-flex" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
            <button className="btn btn-outline-success" type="submit">
              Search
            </button>
          </form>
        </div>
      </nav>
      <div className="container-fluid row">
        <div className="container-fluid col-8">
          <div className="mt-5 d-flex flex-wrap gap-3 justify-content-center">
            <SaleItemCard />
            <SaleItemCard />
            <SaleItemCard />
            <SaleItemCard />
            <SaleItemCard />
            <SaleItemCard />
          </div>
        </div>
        <div className="container-fluid col-4 m-0 p-0">
          <div
            className="card mt-5 position-sticky"
            style={{ top: "2rem", zIndex: 2 }}
          >
            <div className="card-header">
              <strong>Order Overview</strong>
            </div>
            <ul
              className="list-group list-group-flush"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              <OrderItem />
              <OrderItem />
              <OrderItem />
              <OrderItem />
              <OrderItem />
            </ul>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>$23.25</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Total</span>
                <span>$23.25</span>
              </div>
              <button type="button" className="btn btn-success w-100">
                Complete Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sales;
