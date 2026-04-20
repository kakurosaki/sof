import "./Sidebar.css";
import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="col-3 side-bar g-0">
      <div className="d-flex flex-column sticky-top vh-100 p-4">
        <div>
          <h1 className="display-6 text-center">Relly's System</h1>
        </div>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto text-center lead">
          <li className="nav-item">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/Inventory"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Inventory
            </NavLink>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Sales
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Purchase Orders
            </a>
          </li>
        </ul>
        <div>
          <h1 className="display-6 text-center">test</h1>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
