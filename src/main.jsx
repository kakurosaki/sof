import { createRoot } from "react-dom/client";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
import Sales from "./Sales";
import PurchaseOrders from "./PurchaseOrders";
import Accounts from "./Accounts";
import Suppliers from "./Suppliers";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <div className="container-fluid">
    <div className="row">
      <BrowserRouter>
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/Inventory" element={<Inventory />} />
          <Route path="/Sales" element={<Sales />} />
          <Route path="/PurchaseOrders" element={<PurchaseOrders />} />
          <Route path="/Accounts" element={<Accounts />} />
          <Route path="/Suppliers" element={<Suppliers />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  </div>,
);
