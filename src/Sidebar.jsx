import "./Sidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.account_type === "admin";
  const isStaff = user?.account_type === "staff";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="col-3 side-bar g-0">
      <div className="d-flex flex-column sticky-top vh-100 p-4">
        <div>
          <h1 className="display-6 text-center">Relly's System</h1>
          {user && (
            <div className="text-center mt-2">
              <small className="text-muted">{user.name}</small>
              <br />
              <small className="badge bg-info">{user.account_type}</small>
            </div>
          )}
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
              Inventory {isStaff && <small>(Read-only)</small>}
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/Sales"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Sales
            </NavLink>
          </li>
          {isAdmin && (
            <li className="nav-item">
              <NavLink
                to="/PurchaseOrders"
                end
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Purchase Orders
              </NavLink>
            </li>
          )}
          {isAdmin && (
            <li className="nav-item">
              <NavLink
                to="/Accounts"
                end
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Accounts
              </NavLink>
            </li>
          )}
          <li className="nav-item">
            <NavLink
              to="/Suppliers"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Suppliers {isStaff && <small>(Read-only)</small>}
            </NavLink>
          </li>
        </ul>
        <div>
          <button
            type="button"
            className="btn btn-danger w-100"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
