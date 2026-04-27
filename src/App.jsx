import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./Login";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
import Sales from "./Sales";
import CompletedOrders from "./CompletedOrders";
import PurchaseOrders from "./PurchaseOrders";
import Accounts from "./Accounts";
import Suppliers from "./Suppliers";

function ProtectedRoute({ element, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-5">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.account_type)) {
    return <Navigate to="/" />;
  }

  return element;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-5">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  // Staff can only see Dashboard and Sales
  // Admin can see everything
  const isAdmin = user.account_type === "admin";
  const isStaff = user.account_type === "staff";

  return (
    <BrowserRouter>
      <div className="container-fluid">
        <div className="row">
          <Sidebar />
          <Routes>
            <Route path="/login" element={<Navigate to="/" />} />
            
            {/* Dashboard accessible to all */}
            <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
            
            {/* Sales accessible to all (Staff and Admin) */}
            <Route path="/Sales" element={<ProtectedRoute element={<Sales />} />} />

            {/* Completed Orders: Admin only */}
            <Route
              path="/CompletedOrders"
              element={<ProtectedRoute element={<CompletedOrders />} allowedRoles={["admin"]} />}
            />
            
            {/* Inventory: Admin full access, Staff read-only */}
            <Route path="/Inventory" element={<ProtectedRoute element={<Inventory />} />} />
            
            {/* Purchase Orders: Admin only */}
            <Route
              path="/PurchaseOrders"
              element={<ProtectedRoute element={<PurchaseOrders />} allowedRoles={["admin"]} />}
            />
            
            {/* Accounts: Admin only */}
            <Route
              path="/Accounts"
              element={<ProtectedRoute element={<Accounts />} allowedRoles={["admin"]} />}
            />
            
            {/* Suppliers: Admin full access, Staff read-only */}
            <Route path="/Suppliers" element={<ProtectedRoute element={<Suppliers />} />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
