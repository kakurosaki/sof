import { createRoot } from "react-dom/client";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Inventory from "./Inventory";
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  </div>,
);
