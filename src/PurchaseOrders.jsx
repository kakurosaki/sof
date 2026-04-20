import IncomingOrder from "./IncomingOrder";
import LowStockCard from "./LowStockCard";
import "./PurchaseOrders.css";

function PurchaseOrders() {
  return (
    <div className="col-9 container-fluid purchase-orders p-0">
      <div className="">
        <nav className="navbar bg-body-tertiary">
          <div className="container-fluid">
            <a className="navbar-brand">Low Stock</a>
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
      </div>

      <div
        className="horizontal-scroll"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          padding: "20px",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          <LowStockCard />
          <LowStockCard />
          <LowStockCard />
          <LowStockCard />
          <LowStockCard />
        </div>
      </div>

      <div className="">
        <nav className="navbar bg-body-tertiary">
          <div className="container-fluid">
            <span className="navbar-brand mb-0 h1">Incoming Orders</span>
          </div>
        </nav>
      </div>

      <div style={{ padding: "20px" }}>
        <IncomingOrder />
        <IncomingOrder />
        <IncomingOrder />
        <IncomingOrder />
        <IncomingOrder />
      </div>
    </div>
  );
}

export default PurchaseOrders;
